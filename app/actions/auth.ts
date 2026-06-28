"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import type { ActionResult } from "@/app/actions/audit";


type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

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

export async function requireScopedUser() {
  const user = await requireUser();

  if (!user.studyhallId) {
    redirect("/onboarding");
  }

  return { ...user, studyhallId: user.studyhallId };
}

// Asserts that the current session belongs to a platform user (SALES or
// SUPER_ADMIN). Used by the (platform) route group layout to gate every page
// under /platform. Mirrors the requireScopedUser pattern but checks
// platformRole instead of studyhallId. See ADR-010 and ADR-015.
export async function requirePlatformUser() {
  const user = await requireUser();

  if (!user.platformRole) {
    redirect("/dashboard");
  }

  return { ...user, platformRole: user.platformRole };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد.").max(80),
});

const studyHallSettingsSchema = z.object({
  name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.").max(100),
  totalSeats: z.coerce
    .number()
    .int("تعداد صندلی باید عدد صحیح باشد.")
    .min(1, "تعداد صندلی باید حداقل ۱ باشد.")
    .max(500, "تعداد صندلی نمی‌تواند بیشتر از ۵۰۰ باشد."),
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

const onboardingSchema = z.object({
  name: z.string().trim().min(2),
  totalSeats: z.coerce.number().int().min(1).max(500),
  monthlyFee: z.coerce.number().min(0).default(0),
  gender: z.enum(["male", "female"], {
    error: "نوع سالن را انتخاب کنید.",
  }),
  address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300),
});

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

export async function updateProfileDetails(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({ name: formData.get("name") });

  if (!parsed.success) {
    return { success: false, error: "نام و نام خانوادگی را به‌درستی وارد کنید." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true, message: "پروفایل با موفقیت به‌روزرسانی شد." };
}

export async function updateNotificationPreferences(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    return { success: false, error: "فقط مدیر سالن اجازه تغییر تنظیمات اعلان‌ها را دارد." };
  }

  const parsed = notificationPreferencesSchema.safeParse({
    renewalRemindersEnabled: formData.get("renewalRemindersEnabled") === "on",
    expiryRemindersEnabled: formData.get("expiryRemindersEnabled") === "on",
    reminderDaysBefore: formData.get("reminderDaysBefore"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "تنظیمات اعلان‌ها معتبر نیست." };
  }

  await prisma.studyHall.update({ where: { id: user.studyhallId }, data: parsed.data });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true, message: "تنظیمات اعلان‌ها با موفقیت ذخیره شد." };
}

export async function updateStudyHallSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    return { success: false, error: "فقط مدیر سالن اجازه تغییر تنظیمات سالن را دارد." };
  }

  const parsed = studyHallSettingsSchema.safeParse({
    name: formData.get("name"),
    totalSeats: formData.get("totalSeats"),
    monthlyFee: formData.get("monthlyFee"),
    gender: formData.get("gender"),
    address: formData.get("address") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات تنظیمات سالن معتبر نیست." };
  }

  await prisma.studyHall.update({ where: { id: user.studyhallId }, data: parsed.data });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true, message: "تنظیمات سالن با موفقیت به‌روزرسانی شد." };
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
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
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات سالن مطالعه معتبر نیست." };
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    const studyhall = await tx.studyHall.create({
      data: parsed.data,
      select: { id: true },
    });

    await tx.user.update({ where: { id: user.id }, data: { role: "admin", studyhallId: studyhall.id } });
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

export async function createStaff(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();

  if (user.role !== "admin") {
    return { success: false, error: "فقط مدیر سالن اجازه تعریف همکار جدید را دارد." };
  }

  const parsed = staffSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده صحیح نیست." };
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });

    await tx.user.update({
      where: { email: parsed.data.email },
      data: { role: "staff", studyhallId: user.studyhallId, phoneNumber: parsed.data.phoneNumber },
    });
  });

  revalidatePath("/dashboard");
  return { success: true, message: "همکار جدید با موفقیت ثبت شد." };
}
