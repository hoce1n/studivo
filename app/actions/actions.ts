"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import { auth } from "@/lib/auth";
import { createHash } from "crypto";

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
          totalSeats: true,
          monthlyFee: true,
          gender: true,
          address: true,
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

const studyHallSettingsSchema = z.object({
  name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.").max(100),
  totalSeats: z.coerce.number().int("تعداد صندلی باید عدد صحیح باشد.").min(1, "تعداد صندلی باید حداقل ۱ باشد.").max(500, "تعداد صندلی نمی‌تواند بیشتر از ۵۰۰ باشد."),
  monthlyFee: z.coerce.number().min(0, "شهریه ماهانه نمی‌تواند منفی باشد."),
  gender: z.enum(["male", "female", "mix"], {
    error: "نوع سالن را انتخاب کنید.",
  }),
  address: z.string().trim().max(300, "آدرس نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد.").default(""),
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

export async function updateStudyHallSettings(formData: FormData) {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    throw new Error("فقط مدیر سالن اجازه تغییر تنظیمات سالن را دارد.");
  }

  const parsed = studyHallSettingsSchema.safeParse({
    name: formData.get("name"),
    totalSeats: formData.get("totalSeats"),
    monthlyFee: formData.get("monthlyFee"),
    gender: formData.get("gender"),
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "اطلاعات تنظیمات سالن معتبر نیست.");
  }

  await prisma.studyHall.update({
    where: { id: user.studyhallId },
    data: parsed.data,
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
  const input = `${studyhallId}-${phoneNumber}`;
  const shortHash = createHash("sha1").update(input).digest("hex").slice(0, 8);
  return `${shortHash}@studivo.ir`
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
      throw new Error("دانش آموزی با این شماره تلفن در حال حاضر یک اشتراک فعال در این سالن دارد.");
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

const swapSeatSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  newSeatNumber: z.coerce.number().int().min(1, "شماره صندلی باید یک عدد مثبت باشد."),
});

export async function swapSeat(subscriptionId: string, newSeatNumber: number) {
  const user = await requireScopedUser();

  const parsed = swapSeatSchema.safeParse({ subscriptionId, newSeatNumber });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "اطلاعات جابه‌جایی صندلی معتبر نیست.");
  }

  await prisma.$transaction(async (tx) => {
    const targetSeat = await tx.seat.findFirst({
      where: {
        studyhallId: user.studyhallId,
        seatNumber: parsed.data.newSeatNumber,
      },
      select: { id: true },
    });

    if (!targetSeat) {
      throw new Error(`صندلی شماره ${parsed.data.newSeatNumber} در این سالن مطالعه تعریف نشده است.`);
    }

    const activeSubOnTarget = await tx.subscription.findFirst({
      where: {
        studyhallId: user.studyhallId,
        seatId: targetSeat.id,
        status: "active",
      },
      select: { id: true },
    });

    if (activeSubOnTarget) {
      throw new Error(`صندلی شماره ${parsed.data.newSeatNumber} در حال حاضر توسط دانش‌آموز دیگری رزرو شده است.`);
    }

    const currentSubscription = await tx.subscription.findFirst({
      where: {
        id: parsed.data.subscriptionId,
        studyhallId: user.studyhallId,
        status: "active",
      },
      select: { id: true, seatId: true },
    });

    if (!currentSubscription) {
      throw new Error("اشتراک فعال معتبری برای این جابه‌جایی پیدا نشد.");
    }

    if (currentSubscription.seatId === targetSeat.id) {
      throw new Error("دانش‌آموز در حال حاضر روی همین صندلی مستقر است.");
    }

    await tx.subscription.update({
      where: { id: currentSubscription.id },
      data: { seatId: targetSeat.id },
    });
  });

  revalidatePath("/dashboard");
}