"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";

async function requireUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      studyhallId: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function requireScopedUser() {
  const user = await requireUser();

  if (!user.studyhallId) {
    redirect("/onboarding");
  }

  return { ...user, studyhallId: user.studyhallId };
}

const onboardingSchema = z.object({
  name: z.string().trim().min(2),
  totalSeats: z.coerce.number().int().min(1).max(500),
  monthlyFee: z.coerce.number().min(0).default(0),
});

export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();

  if (user.studyhallId) {
    redirect("/dashboard");
  }

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    totalSeats: formData.get("totalSeats"),
    monthlyFee: formData.get("monthlyFee") ?? 0,
  });

  if (!parsed.success) {
    throw new Error("اطلاعات سالن مطالعه معتبر نیست.");
  }

  await prisma.$transaction(async (tx) => {
    const studyhall = await tx.studyHall.create({
      data: {
        name: parsed.data.name,
        totalSeats: parsed.data.totalSeats,
        monthlyFee: parsed.data.monthlyFee,
      },
      select: { id: true },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        role: "admin",
        studyhallId: studyhall.id,
      },
    });

    await tx.seat.createMany({
      data: Array.from({ length: parsed.data.totalSeats }, (_, index) => ({
        seatNumber: index + 1,
        studyhallId: studyhall.id,
      })),
    });
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

const staffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
});

export async function createStaff(formData: FormData) {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    throw new Error("فقط مدیر سالن اجازه تعریف همکار جدید را دارد.");
  }

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    throw new Error("نام و ایمیل همکار را درست وارد کنید.");
  }

  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email,
      role: "staff",
      studyhallId: user.studyhallId,
      emailVerified: false,
    },
  });

  revalidatePath("/dashboard");
}

const subscriptionSchema = z.object({
  seatNumber: z.coerce.number().int().min(1),
  memberName: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(7).max(32),
  endDate: z.coerce.date(),
});

function localMemberEmail(phoneNumber: string, studyhallId: string) {
  const normalizedPhone = phoneNumber.replace(/[^0-9+]/g, "").replace(/^\+/, "plus");
  return `member-${studyhallId}-${normalizedPhone}@local.studyhall`;
}

export async function reserveSeat(formData: FormData) {
  const user = await requireScopedUser();
  const parsed = subscriptionSchema.safeParse({
    seatNumber: formData.get("seatNumber"),
    memberName: formData.get("memberName"),
    phoneNumber: formData.get("phoneNumber"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    throw new Error("اطلاعات رزرو صندلی کامل یا معتبر نیست.");
  }

  const now = new Date();
  if (parsed.data.endDate <= now) {
    throw new Error("تاریخ پایان باید بعد از امروز باشد.");
  }

  await prisma.$transaction(async (tx) => {
    const seat = await tx.seat.findFirst({
      where: {
        studyhallId: user.studyhallId,
        seatNumber: parsed.data.seatNumber,
      },
      select: { id: true },
    });

    if (!seat) {
      throw new Error("این صندلی در سالن شما وجود ندارد.");
    }

    const activeSubscription = await tx.subscription.findFirst({
      where: {
        studyhallId: user.studyhallId,
        seatId: seat.id,
        status: "active",
      },
      select: { id: true },
    });

    if (activeSubscription) {
      throw new Error("برای این صندلی هنوز اشتراک فعال ثبت شده است.");
    }

    const member = await tx.user.upsert({
      where: {
        studyhallId_phoneNumber: {
          studyhallId: user.studyhallId,
          phoneNumber: parsed.data.phoneNumber,
        },
      },
      update: {
        name: parsed.data.memberName,
        role: "member",
      },
      create: {
        id: crypto.randomUUID(),
        name: parsed.data.memberName,
        email: localMemberEmail(parsed.data.phoneNumber, user.studyhallId),
        phoneNumber: parsed.data.phoneNumber,
        role: "member",
        studyhallId: user.studyhallId,
        emailVerified: false,
      },
      select: { id: true },
    });

    await tx.subscription.create({
      data: {
        userId: member.id,
        seatId: seat.id,
        studyhallId: user.studyhallId,
        startDate: now,
        endDate: parsed.data.endDate,
        status: "active",
      },
    });
  });

  revalidatePath("/dashboard");
}

export async function releaseSeat(subscriptionId: string) {
  const user = await requireScopedUser();

  await prisma.subscription.updateMany({
    where: {
      id: subscriptionId,
      studyhallId: user.studyhallId,
      status: "active",
    },
    data: { status: "cancelled" },
  });

  revalidatePath("/dashboard");
}
