"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import { auth } from "@/lib/auth";

export async function requireUser() {
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
      phoneNumber: true,
      role: true,
      image: true,
      studyhallId: true,
      studyhall: {
        select: {
          name: true,
        },
      },
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

const profileSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد.").max(80),
});

export async function updateProfileDetails(formData: FormData) {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    throw new Error("نام و نام خانوادگی را به‌درستی وارد کنید.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
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
  password: z.string().min(8)
});

export async function createStaff(formData: FormData) {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    throw new Error("فقط مدیر سالن اجازه تعریف همکار جدید را دارد.");
  }

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error("نام و ایمیل همکار را درست وارد کنید.");
  }

  await prisma.$transaction(async (tx) => {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      }
    });
    await tx.user.update({
      where: {
        email: parsed.data.email,
      },
      data: {
        role: "staff",
        studyhallId: user.studyhallId,
      },
    });
  })

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

    const memberActiveSubscription = await tx.subscription.findFirst({
      where: {
        studyhallId: user.studyhallId,
        status: "active",
        user: {
          phoneNumber: parsed.data.phoneNumber,
        },
      },
      select: { id: true },
    });

    if (memberActiveSubscription) {
      throw new Error("این دانش‌آموز در حال حاضر یک اشتراک فعال در این سالن دارد.");
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

const renewSchema = z.object({
  subscriptionId: z.string().min(1),
  endDate: z.coerce.date(),
});

export async function renewSubscription(subscriptionId: string, endDate: string) {
  const user = await requireScopedUser();

  const parsed = renewSchema.safeParse({ subscriptionId, endDate });

  if (!parsed.success) {
    throw new Error("اطلاعات تمدید اشتراک معتبر نیست.");
  }

  const now = new Date();
  if (parsed.data.endDate <= now) {
    throw new Error("تاریخ پایان جدید باید بعد از امروز باشد.");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findFirst({
      where: {
        id: parsed.data.subscriptionId,
        studyhallId: user.studyhallId,
        status: "active",
      },
      select: { id: true, userId: true, seatId: true },
    });

    if (!current) {
      throw new Error("اشتراک فعالی برای تمدید پیدا نشد.");
    }

    // Gracefully close the expiring contract while preserving its history.
    await tx.subscription.update({
      where: { id: current.id },
      data: { status: "expired" },
    });

    // Create a fresh subscription for the same member and seat.
    await tx.subscription.create({
      data: {
        userId: current.userId,
        seatId: current.seatId,
        studyhallId: user.studyhallId,
        startDate: now,
        endDate: parsed.data.endDate,
        status: "active",
      },
    });
  });

  revalidatePath("/dashboard");
}

const swapSchema = z.object({
  subscriptionId: z.string().min(1),
  newSeatNumber: z.coerce.number().int().min(1),
});

export async function swapSeat(subscriptionId: string, newSeatNumber: number) {
  const user = await requireScopedUser();

  const parsed = swapSchema.safeParse({ subscriptionId, newSeatNumber });

  if (!parsed.success) {
    throw new Error("اطلاعات جابجایی صندلی معتبر نیست.");
  }

  await prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findFirst({
      where: {
        id: parsed.data.subscriptionId,
        studyhallId: user.studyhallId,
        status: "active",
      },
      select: { id: true, seat: { select: { seatNumber: true } } },
    });

    if (!current) {
      throw new Error("اشتراک فعالی برای جابجایی پیدا نشد.");
    }

    if (current.seat.seatNumber === parsed.data.newSeatNumber) {
      throw new Error("این دانش‌آموز هم‌اکنون روی همین صندلی نشسته است.");
    }

    const targetSeat = await tx.seat.findFirst({
      where: {
        studyhallId: user.studyhallId,
        seatNumber: parsed.data.newSeatNumber,
      },
      select: { id: true },
    });

    if (!targetSeat) {
      throw new Error("این صندلی در سالن شما وجود ندارد.");
    }

    const occupied = await tx.subscription.findFirst({
      where: {
        studyhallId: user.studyhallId,
        seatId: targetSeat.id,
        status: "active",
      },
      select: { id: true },
    });

    if (occupied) {
      throw new Error("صندلی مقصد در حال حاضر اشتراک فعال دارد.");
    }

    await tx.subscription.update({
      where: { id: current.id },
      data: { seatId: targetSeat.id },
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
