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
          reminderDaysBefore: true,
          renewalRemindersEnabled: true,
          expiryRemindersEnabled: true,
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
  gender: z.enum(["male", "female"], {
    error: "نوع سالن را انتخاب کنید.",
  }),
  address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300, "آدرس نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد."),
});

const notificationPreferencesSchema = z.object({
  renewalRemindersEnabled: z.coerce.boolean(),
  expiryRemindersEnabled: z.coerce.boolean(),
  reminderDaysBefore: z.coerce
    .number()
    .int("بازه یادآوری باید عدد صحیح باشد.")
    .min(1, "یادآوری باید حداقل ۱ روز قبل ارسال شود.")
    .max(14, "یادآوری نمی‌تواند بیشتر از ۱۴ روز قبل ارسال شود."),
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

export async function updateNotificationPreferences(formData: FormData) {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    return {
      success: false,
      error: "فقط مدیر سالن اجازه تغییر تنظیمات اعلان‌ها را دارد.",
    };
  }

  const parsed = notificationPreferencesSchema.safeParse({
    renewalRemindersEnabled: formData.get("renewalRemindersEnabled") === "on",
    expiryRemindersEnabled: formData.get("expiryRemindersEnabled") === "on",
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "تنظیمات اعلان‌ها معتبر نیست.",
    };
  }

  await prisma.studyHall.update({
    where: { id: user.studyhallId },
    data: parsed.data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { success: true, message: "تنظیمات اعلان‌ها با موفقیت ذخیره شد." };
}

export async function updateStudyHallSettings(formData: FormData) {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    return {
      success: false,
      error: "فقط مدیر سالن اجازه تغییر تنظیمات سالن را دارد.",
    };
  }

  const parsed = studyHallSettingsSchema.safeParse({
    name: formData.get("name"),
    totalSeats: formData.get("totalSeats"),
    monthlyFee: formData.get("monthlyFee"),
    gender: formData.get("gender"),
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات تنظیمات سالن معتبر نیست.",
    };
  }

  await prisma.studyHall.update({
    where: { id: user.studyhallId },
    data: parsed.data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return { success: true, message: "تنظیمات سالن با موفقیت به‌روزرسانی شد." };
}

const onboardingSchema = z.object({
  name: z.string().trim().min(2),
  totalSeats: z.coerce.number().int().min(1).max(500),
  monthlyFee: z.coerce.number().min(0).default(0),
  gender: z.enum(["male", "female"], {
    error: "نوع سالن را انتخاب کنید.",
  }),
  address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300),
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
    gender: formData.get("gender"),
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "اطلاعات سالن مطالعه معتبر نیست.");
  }

  await prisma.$transaction(async (tx) => {
    const studyhall = await tx.studyHall.create({
      data: {
        name: parsed.data.name,
        totalSeats: parsed.data.totalSeats,
        monthlyFee: parsed.data.monthlyFee,
        gender: parsed.data.gender,
        address: parsed.data.address,
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
  name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد"),
  email: z.string().trim().email("ایمیل معتبر وارد کنید"),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل باید به فرمت ۰۹xxxxxxxxx باشد")
    .length(11, "شماره موبایل باید ۱۱ رقم باشد"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد"),
});

export async function createStaff(formData: FormData) {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    throw new Error("فقط مدیر سالن اجازه تعریف همکار جدید را دارد.");
  }

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error(
      "اطلاعات وارد شده صحیح نیست."
    );
  }

  await prisma.$transaction(async (tx) => {
    // Create user via Better Auth
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });

    // Update user with role, studyhall, and phoneNumber
    await tx.user.update({
      where: {
        email: parsed.data.email,
      },
      data: {
        role: "staff",
        studyhallId: user.studyhallId,
        phoneNumber: parsed.data.phoneNumber,
      },
    });
  });

  revalidatePath("/dashboard");
}

const subscriptionSchema = z.object({
  seatNumber: z.coerce.number().int().min(1),
  memberName: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(7).max(32),
  endDate: z.coerce.date(),
});

type ActionResult = { success: boolean; error?: string; message?: string };

function actionError(error: unknown, fallback: string): ActionResult {
  if (error instanceof Error && error.message.trim()) {
    return { success: false, error: error.message };
  }

  return { success: false, error: fallback };
}

function localMemberEmail(phoneNumber: string, studyhallId: string) {
  const input = `${studyhallId}-${phoneNumber}`;
  const shortHash = createHash("sha1").update(input).digest("hex").slice(0, 8);
  return `${shortHash}@studivo.ir`
}

export async function reserveSeat(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const parsed = subscriptionSchema.safeParse({
    seatNumber: formData.get("seatNumber"),
    memberName: formData.get("memberName"),
    phoneNumber: formData.get("phoneNumber"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { success: false, error: "اطلاعات رزرو صندلی کامل یا معتبر نیست." };
  }

  const now = new Date();
  if (parsed.data.endDate <= now) {
    return { success: false, error: "تاریخ پایان باید بعد از امروز باشد." };
  }

  try {
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
      select: { id: true, name: true, phoneNumber: true },
    });

    const createdSubscription = await tx.subscription.create({
      data: {
        userId: member.id,
        seatId: seat.id,
        studyhallId: user.studyhallId,
        startDate: now,
        endDate: parsed.data.endDate,
        status: "active",
      },
      include: { seat: { select: { seatNumber: true } } },
    });

    await tx.auditLog.create({
      data: {
        studyhallId: user.studyhallId,
        userId: user.id,
        action: "RESERVE_SEAT",
        details: {
          operatorName: user.name,
          memberName: member.name,
          phoneNumber: member.phoneNumber,
          seatNumber: createdSubscription.seat.seatNumber,
          endDate: parsed.data.endDate.toISOString(),
          message: `${user.name} صندلی ${createdSubscription.seat.seatNumber} را برای ${member.name} رزرو کرد.`,
        },
      },
    });
    });
  } catch (error) {
    return actionError(error, "رزرو صندلی ناموفق بود.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/logs");
  return { success: true, message: "رزرو صندلی با موفقیت ثبت شد." };
}

const renewSchema = z.object({
  subscriptionId: z.string().min(1),
  endDate: z.coerce.date(),
});

export async function renewSubscription(subscriptionId: string, endDate: string): Promise<ActionResult> {
  const user = await requireScopedUser();

  const parsed = renewSchema.safeParse({ subscriptionId, endDate });

  if (!parsed.success) {
    return { success: false, error: "اطلاعات تمدید اشتراک معتبر نیست." };
  }

  const now = new Date();
  if (parsed.data.endDate <= now) {
    return { success: false, error: "تاریخ پایان جدید باید بعد از امروز باشد." };
  }

  try {
    await prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findFirst({
      where: {
        id: parsed.data.subscriptionId,
        studyhallId: user.studyhallId,
        status: "active",
      },
      select: { id: true, userId: true, seatId: true, user: { select: { name: true } }, seat: { select: { seatNumber: true } } },
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

    await tx.auditLog.create({ data: { studyhallId: user.studyhallId, userId: user.id, action: "RENEW_SUBSCRIPTION", details: { operatorName: user.name, memberName: current.user.name, seatNumber: current.seat.seatNumber, endDate: parsed.data.endDate.toISOString(), message: `${user.name} اشتراک صندلی ${current.seat.seatNumber} را برای ${current.user.name} تمدید کرد.` } } });
    });
  } catch (error) {
    return actionError(error, "تمدید اشتراک ناموفق بود.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/logs");
  return { success: true, message: "تمدید اشتراک با موفقیت ثبت شد." };
}

export async function releaseSeat(subscriptionId: string): Promise<ActionResult> {
  const user = await requireScopedUser();

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.subscription.findFirst({ where: { id: subscriptionId, studyhallId: user.studyhallId, status: "active" }, select: { id: true, user: { select: { name: true } }, seat: { select: { seatNumber: true } } } });
      if (!current) throw new Error("اشتراک فعالی برای تخلیه پیدا نشد.");
      await tx.subscription.update({ where: { id: current.id }, data: { status: "cancelled" } });
      await tx.auditLog.create({ data: { studyhallId: user.studyhallId, userId: user.id, action: "RELEASE_SEAT", details: { operatorName: user.name, memberName: current.user.name, seatNumber: current.seat.seatNumber, message: `${user.name} صندلی ${current.seat.seatNumber} را از ${current.user.name} تخلیه کرد.` } } });
    });
  } catch (error) {
    return actionError(error, "تخلیه صندلی ناموفق بود.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/members");
  revalidatePath("/dashboard/logs");
  return { success: true, message: "صندلی با موفقیت تخلیه شد." };
}

const swapSeatSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  newSeatNumber: z.coerce.number().int().min(1, "شماره صندلی باید یک عدد مثبت باشد."),
});

export async function swapSeat(subscriptionId: string, newSeatNumber: number): Promise<ActionResult> {
  const user = await requireScopedUser();

  const parsed = swapSeatSchema.safeParse({ subscriptionId, newSeatNumber });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "اطلاعات جابه‌جایی صندلی معتبر نیست." };
  }

  try {
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
      select: { id: true, seatId: true, user: { select: { name: true } }, seat: { select: { seatNumber: true } } },
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

    await tx.auditLog.create({ data: { studyhallId: user.studyhallId, userId: user.id, action: "SWAP_SEAT", details: { operatorName: user.name, memberName: currentSubscription.user.name, fromSeatNumber: currentSubscription.seat.seatNumber, toSeatNumber: parsed.data.newSeatNumber, message: `${user.name} ${currentSubscription.user.name} را از صندلی ${currentSubscription.seat.seatNumber} به صندلی ${parsed.data.newSeatNumber} منتقل کرد.` } } });
    });
  } catch (error) {
    return actionError(error, "جابجایی صندلی ناموفق بود.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/logs");
  return { success: true, message: "دانش‌آموز با موفقیت به صندلی جدید منتقل شد." };
}