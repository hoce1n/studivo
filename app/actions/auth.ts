"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import type { ActionResult } from "@/app/actions/audit";
import {
  getTenantContext,
  isTenantOwner,
  type TenantContext,
  type TenantPrincipal,
} from "@/lib/tenant-context";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

export async function requireUser(): Promise<TenantPrincipal> {
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
      platformRole: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const tenantContext = await getTenantContext(user.id);

  return tenantContext ? { ...user, ...tenantContext } : { ...user, role: "member" };
}

export async function requireScopedUser() {
  const user = await requireUser();

  // In Schema v2, studyhallId is provided by the TenantContext resolved via StaffAssignment.
  if (!user.studyhallId) {
    redirect("/onboarding");
  }

  return user as TenantPrincipal & TenantContext;
}

export async function requireTenantContext() {
  const user = await requireScopedUser();
  return user as TenantPrincipal & TenantContext;
}

export async function requireOwnerUser() {
  const user = await requireTenantContext();

  if (!isTenantOwner(user)) {
    redirect("/dashboard");
  }

  return user;
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
  phoneNumber: z
    .string()
    .trim()
    .regex(/^0\d{9,10}$/, "شماره تلفن سالن معتبر نیست.")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500, "توضیحات نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد.").optional(),
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

export async function updateNotificationPreferences(_formData: FormData): Promise<ActionResult> {
  // Schema v2: StudyHall no longer has notification preference columns
  // (renewalRemindersEnabled, expiryRemindersEnabled, reminderDaysBefore).
  // This function is kept exported to avoid breaking any import sites while
  // the UI replaces this form with a coming-soon banner.
  return { success: false, error: "این قابلیت هنوز پشتیبانی نمی‌شود." };
}

export async function updateStudyHallSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireTenantContext();

  if (!isTenantOwner(user)) {
    return { success: false, error: "فقط مدیر سالن اجازه تغییر تنظیمات سالن را دارد." };
  }

  const parsed = studyHallSettingsSchema.safeParse({
    name: formData.get("name"),
    totalSeats: formData.get("totalSeats"),
    monthlyFee: formData.get("monthlyFee"),
    gender: formData.get("gender"),
    address: formData.get("address") ?? "",
    phoneNumber: formData.get("phoneNumber") ?? "",
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات تنظیمات سالن معتبر نیست." };
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    // 1. Update StudyHall basic info
    const studyHall = await tx.studyHall.update({
      where: { id: user.studyHallId },
      data: {
        name: parsed.data.name,
        gender: parsed.data.gender === "male" ? "MALE" : "FEMALE",
        address: parsed.data.address,
        phoneNumber: parsed.data.phoneNumber || null,
        description: parsed.data.description || null,
      },
    });

    // 2. Sync MembershipPlan price
    await tx.membershipPlan.updateMany({
      where: { studyHallId: user.studyHallId, isActive: true },
      data: { price: parsed.data.monthlyFee },
    });

    // 3. Sync Seats (Simple additive/subtractive logic)
    const currentSeatsCount = await tx.seat.count({
      where: { section: { studyHallId: user.studyHallId } },
    });

    if (parsed.data.totalSeats > currentSeatsCount) {
      // Add missing seats
      const section = await tx.section.findFirst({
        where: { studyHallId: user.studyHallId, isActive: true },
        select: { id: true },
      });

      if (section) {
        await tx.seat.createMany({
          data: Array.from({ length: parsed.data.totalSeats - currentSeatsCount }, (_, i) => ({
            number: (currentSeatsCount + i + 1).toString(),
            sectionId: section.id,
            isActive: true,
          })),
        });
      }
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true, message: "تنظیمات سالن با موفقیت به‌روزرسانی شد." };
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  // In Schema v2, onboarding status is checked by the presence of a StaffAssignment.
  const context = await getTenantContext(user.id);
  if (context) {
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

  // Sanitize slug: lowercase, spaces to hyphens, strip non-ASCII-alphanumeric, trim hyphens
  const rawSlug = parsed.data.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const slug = rawSlug || "hall";

  // Check uniqueness — show a collision error instead of appending a random suffix
  const slugTaken = await prisma.studyHall.findFirst({
    where: { slug },
    select: { id: true },
  });
  if (slugTaken) {
    return {
      success: false,
      error: "آدرس عمومی سالن تکراری است. لطفاً نام دیگری برای سالن انتخاب کنید.",
    };
  }

  await prisma.$transaction(async (tx: TransactionClient) => {
    // 1. Create the StudyHall
    const studyhall = await tx.studyHall.create({
      data: {
        name: parsed.data.name,
        slug,
        gender: parsed.data.gender === "male" ? "MALE" : "FEMALE",
        address: parsed.data.address,
      },
      select: { id: true },
    });

    // 2. Create the StaffAssignment (New Schema v2 way)
    // This replaces updating legacy User.role and User.studyhallId
    await tx.staffAssignment.create({
      data: {
        userId: user.id,
        studyHallId: studyhall.id,
        role: "OWNER",
        startDate: new Date(),
        isActive: true,
      },
    });

    // 3. Create a default Section (Required by Schema v2)
    const section = await tx.section.create({
      data: {
        studyHallId: studyhall.id,
        name: "بخش اصلی",
        isActive: true,
      },
      select: { id: true },
    });

    // 4. Create the seats
    await tx.seat.createMany({
      data: Array.from({ length: parsed.data.totalSeats }, (_, index) => ({
        number: (index + 1).toString(),
        sectionId: section.id,
        isActive: true,
      })),
    });

    // 5. Create a default MembershipPlan (Required for legacy compatibility)
    await tx.membershipPlan.create({
      data: {
        studyHallId: studyhall.id,
        name: "پلن ماهانه",
        durationDays: 30,
        price: parsed.data.monthlyFee,
        hasFixedSeat: true,
        isActive: true,
      },
    });
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// Schema v2: publicPageEnabled, heroImage, galleryImages have no backing columns.
// Only slug is persisted.
const publicPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "آدرس عمومی باید حداقل ۳ کاراکتر باشد.")
    .max(60, "آدرس عمومی نمی‌تواند بیشتر از ۶۰ کاراکتر باشد.")
    .regex(
      /^[a-z0-9-]+$/,
      "آدرس عمومی فقط می‌تواند شامل حروف انگلیسی کوچک، اعداد و خط تیره باشد."
    ),
});

export async function updatePublicPageSettings(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireTenantContext();

  if (!isTenantOwner(user)) {
    return { success: false, error: "فقط مدیر سالن اجازه ویرایش صفحه عمومی را دارد." };
  }

  const parsed = publicPageSchema.safeParse({
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "آدرس عمومی معتبر نیست.",
    };
  }

  // Check slug uniqueness excluding the current hall
  const existing = await prisma.studyHall.findFirst({
    where: { slug: parsed.data.slug, id: { not: user.studyHallId } },
    select: { id: true },
  });
  if (existing) {
    return { success: false, error: "این آدرس عمومی قبلاً توسط سالن دیگری انتخاب شده است. لطفاً آدرس دیگری انتخاب کنید." };
  }

  await prisma.studyHall.update({
    where: { id: user.studyHallId },
    data: { slug: parsed.data.slug },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath(`/${parsed.data.slug}`);
  return { success: true, message: "آدرس عمومی سالن با موفقیت ذخیره شد." };
}

export async function createStaff(formData: FormData): Promise<ActionResult> {
  const user = await requireTenantContext();

  if (!isTenantOwner(user)) {
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
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });

    if (!signUpResult.user) {
        throw new Error("Failed to create user account.");
    }

    // Update the identity fields on the user record
    await tx.user.update({
      where: { id: signUpResult.user.id },
      data: { phoneNumber: parsed.data.phoneNumber },
    });

    // Create the StaffAssignment (New Schema v2 way)
    await tx.staffAssignment.create({
      data: {
        userId: signUpResult.user.id,
        studyHallId: user.studyHallId,
        role: "STAFF",
        startDate: new Date(),
        isActive: true,
      },
    });
  });

  revalidatePath("/dashboard");
  return { success: true, message: "همکار جدید با موفقیت ثبت شد." };
}
