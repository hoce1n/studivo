"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { prisma } from "@/lib/db";

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null))
  .pipe(z.string().url("نشانی تصویر معتبر نیست.").nullable());

const generalSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.")
    .max(100),
  gender: z.enum(["MALE", "FEMALE"], { error: "نوع سالن را انتخاب کنید." }),
  phoneNumber: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  description: z.string().trim().max(700).optional(),
  publicPageEnabled: z.boolean(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => (value.length ? value : null))
    .pipe(
      z
        .string()
        .min(3, "اسلاگ باید حداقل ۳ کاراکتر باشد.")
        .max(60)
        .regex(
          /^[a-z0-9-]+$/,
          "اسلاگ فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد",
        )
        .nullable(),
    ),
  heroImage: optionalUrl,
  galleryImages: z
    .array(z.string().url("نشانی تصویر گالری معتبر نیست."))
    .max(8, "حداکثر ۸ تصویر در گالری مجاز است."),
});

const sectionSchema = z.object({
  sectionId: z.string().cuid().optional(),
  name: z.string().trim().min(2, "نام بخش باید حداقل ۲ کاراکتر باشد.").max(80),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean(),
});

const addSeatsSchema = z.object({
  sectionId: z.string().cuid("بخش معتبر نیست."),
  mode: z.enum(["single", "bulk"]),
  number: z.string().trim().max(20).optional(),
  prefix: z.string().trim().max(12).optional(),
  start: z.coerce.number().int().min(1).optional(),
  count: z.coerce.number().int().min(1).max(200).optional(),
});

const seatStatusSchema = z.object({
  seatId: z.string().cuid("صندلی معتبر نیست."),
  isActive: z.boolean(),
});

const assignSeatsSchema = z.object({
  sectionId: z.string().cuid("بخش معتبر نیست."),
  seatIds: z
    .array(z.string().cuid("صندلی معتبر نیست."))
    .min(1, "حداقل یک صندلی را انتخاب کنید.")
    .max(300, "حداکثر ۳۰۰ صندلی در هر عملیات قابل انتقال است."),
});

const moveSeatSchema = z.object({
  seatId: z.string().cuid("صندلی معتبر نیست."),
  sectionId: z.string().cuid("بخش معتبر نیست."),
});

const planSchema = z.object({
  planId: z.string().cuid().optional(),
  name: z.string().trim().min(2, "نام پلن باید حداقل ۲ کاراکتر باشد.").max(80),
  durationDays: z.coerce
    .number()
    .int()
    .min(1, "مدت پلن باید حداقل یک روز باشد.")
    .max(730),
  price: z.coerce.number().min(0, "قیمت نمی‌تواند منفی باشد."),
  hasFixedSeat: z.boolean(),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean(),
});

const disablePlanSchema = z.object({
  planId: z.string().cuid("پلن معتبر نیست."),
});

const staffSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "شماره موبایل یا ایمیل همکار را وارد کنید."),
  role: z.enum(["OWNER", "STAFF"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  note: z.string().trim().max(250).optional(),
});

async function requireOwner() {
  const user = await requireScopedUser();
  if (user.role !== "OWNER") {
    throw new Error("فقط مدیر سالن (OWNER) اجازه تغییر تنظیمات سالن را دارد.");
  }
  return user;
}

function revalidateSettings(slug?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  if (slug) revalidatePath(`/${slug}`);
}

export async function updateStudyHallSettings(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  let galleryImages: string[] = [];
  try {
    galleryImages = JSON.parse(
      formData.get("galleryImages")?.toString() || "[]",
    );
  } catch (error) {
    return actionError(error, "تصاویر گالری معتبر نیستند.");
  }

  const parsed = generalSettingsSchema.safeParse({
    name: formData.get("name"),
    gender: formData.get("gender"),
    phoneNumber: formData.get("phoneNumber")?.toString() || undefined,
    address: formData.get("address")?.toString() || undefined,
    description: formData.get("description")?.toString() || undefined,
    publicPageEnabled: formData.get("publicPageEnabled") === "on",
    slug: formData.get("slug")?.toString() ?? "",
    heroImage: formData.get("heroImage")?.toString() ?? "",
    galleryImages,
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات سالن معتبر نیست.",
    };

  try {
    const existingSlug = parsed.data.slug
      ? await prisma.studyHall.findFirst({
          where: { slug: parsed.data.slug, id: { not: user.studyHallId } },
          select: { id: true },
        })
      : null;
    if (existingSlug)
      return {
        success: false,
        error: "این آدرس عمومی قبلاً توسط سالن دیگری انتخاب شده است.",
      };

    await prisma.studyHall.update({
      where: { id: user.studyHallId },
      data: {
        name: parsed.data.name,
        gender: parsed.data.gender,
        phoneNumber: parsed.data.phoneNumber || null,
        address: parsed.data.address || null,
        description: parsed.data.description || null,
        publicPageEnabled: parsed.data.publicPageEnabled,
        slug: parsed.data.slug,
        heroImage: parsed.data.heroImage,
        galleryImages: parsed.data.galleryImages,
      },
    });
    revalidateSettings(parsed.data.slug);
    return { success: true, message: "تنظیمات عمومی سالن ذخیره شد." };
  } catch (error) {
    return actionError(error, "خطا در به‌روزرسانی تنظیمات سالن.");
  }
}

export async function upsertSection(formData: FormData): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = sectionSchema.safeParse({
    sectionId: formData.get("sectionId") || undefined,
    name: formData.get("name"),
    description: formData.get("description")?.toString() || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات بخش معتبر نیست.",
    };
  try {
    if (parsed.data.sectionId) {
      const section = await prisma.section.findFirst({
        where: { id: parsed.data.sectionId, studyHallId: user.studyHallId },
        select: { id: true },
      });
      if (!section)
        return { success: false, error: "بخش در این سالن یافت نشد." };
      await prisma.section.update({
        where: { id: section.id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description || null,
          isActive: parsed.data.isActive,
        },
      });
    } else {
      await prisma.section.create({
        data: {
          studyHallId: user.studyHallId,
          name: parsed.data.name,
          description: parsed.data.description || null,
          isActive: parsed.data.isActive,
        },
      });
    }
    revalidateSettings();
    return { success: true, message: "بخش با موفقیت ذخیره شد." };
  } catch (error) {
    return actionError(error, "ذخیره بخش ناموفق بود.");
  }
}

export async function addSeatsToSection(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = addSeatsSchema.safeParse({
    sectionId: formData.get("sectionId") || undefined,
    mode: formData.get("mode"),
    number: formData.get("number")?.toString(),
    prefix: formData.get("prefix")?.toString(),
    start: formData.get("start") || undefined,
    count: formData.get("count") || undefined,
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات صندلی معتبر نیست.",
    };
  try {
    const section = await prisma.section.findFirst({
      where: { id: parsed.data.sectionId, studyHallId: user.studyHallId },
      select: { id: true },
    });
    if (!section) return { success: false, error: "بخش در این سالن یافت نشد." };
    const numbers =
      parsed.data.mode === "single"
        ? ([parsed.data.number?.trim()].filter(Boolean) as string[])
        : Array.from(
            { length: parsed.data.count ?? 0 },
            (_, index) =>
              `${parsed.data.prefix ?? ""}${(parsed.data.start ?? 1) + index}`,
          );
    if (!numbers.length)
      return { success: false, error: "شماره صندلی را وارد کنید." };
    await prisma.seat.createMany({
      data: numbers.map((number) => ({
        sectionId: parsed.data.sectionId,
        number,
        isActive: true,
      })),
      skipDuplicates: true,
    });
    revalidateSettings();
    return { success: true, message: "صندلی‌ها به بخش اضافه شدند." };
  } catch (error) {
    return actionError(error, "افزودن صندلی ناموفق بود.");
  }
}

export async function toggleSeatActive(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = seatStatusSchema.safeParse({
    seatId: formData.get("seatId"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات صندلی معتبر نیست.",
    };
  try {
    const seat = await prisma.seat.findFirst({
      where: {
        id: parsed.data.seatId,
        section: { studyHallId: user.studyHallId },
      },
      select: { id: true },
    });
    if (!seat) return { success: false, error: "صندلی در این سالن یافت نشد." };
    await prisma.seat.update({
      where: { id: seat.id },
      data: { isActive: parsed.data.isActive },
    });
    revalidateSettings();
    return { success: true, message: "وضعیت صندلی ذخیره شد." };
  } catch (error) {
    return actionError(error, "به‌روزرسانی وضعیت صندلی ناموفق بود.");
  }
}

export async function assignSeatsToSection(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  const rawSeatIds = formData
    .getAll("seatIds")
    .map((value) => value.toString())
    .filter(Boolean);
  const parsed = assignSeatsSchema.safeParse({
    sectionId: formData.get("sectionId")?.toString() || null,
    seatIds: rawSeatIds,
  });
  if (!parsed.success)
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "اطلاعات تخصیص صندلی معتبر نیست.",
    };
  try {
    const section = await prisma.section.findFirst({
      where: { id: parsed.data.sectionId, studyHallId: user.studyHallId },
      select: { id: true },
    });
    if (!section) return { success: false, error: "بخش در این سالن یافت نشد." };
    const result = await prisma.seat.updateMany({
      where: {
        id: { in: parsed.data.seatIds },
        section: { studyHallId: user.studyHallId },
      },
      data: { sectionId: parsed.data.sectionId },
    });
    if (result.count !== parsed.data.seatIds.length)
      return { success: false, error: "برخی صندلی‌ها در این سالن یافت نشدند." };
    revalidateSettings();
    return {
      success: true,
      message: "صندلی‌های انتخاب‌شده به بخش منتقل شدند.",
    };
  } catch (error) {
    return actionError(error, "تخصیص صندلی‌ها ناموفق بود.");
  }
}

export async function moveSeatToSection(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = moveSeatSchema.safeParse({
    seatId: formData.get("seatId"),
    sectionId: formData.get("sectionId")?.toString() || null,
  });
  if (!parsed.success)
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "اطلاعات انتقال صندلی معتبر نیست.",
    };
  try {
    const section = await prisma.section.findFirst({
      where: { id: parsed.data.sectionId, studyHallId: user.studyHallId },
      select: { id: true },
    });
    if (!section)
      return { success: false, error: "بخش مقصد در این سالن یافت نشد." };
    const result = await prisma.seat.updateMany({
      where: {
        id: parsed.data.seatId,
        section: { studyHallId: user.studyHallId },
      },
      data: { sectionId: parsed.data.sectionId },
    });
    if (result.count !== 1)
      return { success: false, error: "صندلی در این سالن یافت نشد." };
    revalidateSettings();
    return { success: true, message: "جابه‌جایی صندلی ذخیره شد." };
  } catch (error) {
    return actionError(error, "جابه‌جایی صندلی ناموفق بود.");
  }
}

export async function upsertMembershipPlan(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = planSchema.safeParse({
    planId: formData.get("planId") || undefined,
    name: formData.get("name"),
    durationDays: formData.get("durationDays"),
    price: formData.get("price"),
    hasFixedSeat: formData.get("hasFixedSeat") === "on",
    description: formData.get("description")?.toString() || undefined,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات پلن معتبر نیست.",
    };
  try {
    if (parsed.data.planId) {
      const plan = await prisma.membershipPlan.findFirst({
        where: { id: parsed.data.planId, studyHallId: user.studyHallId },
        select: { id: true },
      });
      if (!plan) return { success: false, error: "پلن در این سالن یافت نشد." };
      const data = {
        name: parsed.data.name,
        durationDays: parsed.data.durationDays,
        price: parsed.data.price,
        hasFixedSeat: parsed.data.hasFixedSeat,
        description: parsed.data.description || null,
        isActive: parsed.data.isActive,
      };
      await prisma.membershipPlan.update({ where: { id: plan.id }, data });
    } else {
      const data = {
        name: parsed.data.name,
        durationDays: parsed.data.durationDays,
        price: parsed.data.price,
        hasFixedSeat: parsed.data.hasFixedSeat,
        description: parsed.data.description || null,
        isActive: parsed.data.isActive,
      };
      await prisma.membershipPlan.create({
        data: { studyHallId: user.studyHallId, ...data },
      });
    }
    revalidateSettings();
    return { success: true, message: "پلن عضویت ذخیره شد." };
  } catch (error) {
    return actionError(error, "ذخیره پلن ناموفق بود.");
  }
}

export async function disableMembershipPlan(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireOwner();
  const parsed = disablePlanSchema.safeParse({
    planId: formData.get("planId"),
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "پلن معتبر نیست.",
    };
  try {
    const plan = await prisma.membershipPlan.findFirst({
      where: { id: parsed.data.planId, studyHallId: user.studyHallId },
      select: { id: true },
    });
    if (!plan) return { success: false, error: "پلن در این سالن یافت نشد." };
    await prisma.membershipPlan.update({
      where: { id: plan.id },
      data: { isActive: false },
    });
    revalidateSettings();
    return { success: true, message: "پلن غیرفعال شد." };
  } catch (error) {
    return actionError(error, "غیرفعال‌سازی پلن ناموفق بود.");
  }
}

export async function assignStaffToStudyHall(
  formData: FormData,
): Promise<ActionResult> {
  const owner = await requireOwner();
  const parsed = staffSchema.safeParse({
    identifier: formData.get("identifier"),
    role: formData.get("role"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    note: formData.get("note")?.toString() || undefined,
  });
  if (!parsed.success)
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات همکار معتبر نیست.",
    };
  if (parsed.data.endDate && parsed.data.endDate < parsed.data.startDate)
    return {
      success: false,
      error: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
    };
  try {
    const lookup = parsed.data.identifier.includes("@")
      ? { email: parsed.data.identifier }
      : { phoneNumber: parsed.data.identifier };
    const staffUser = await prisma.user.findFirst({
      where: lookup,
      select: { id: true },
    });
    if (!staffUser)
      return {
        success: false,
        error:
          "کاربری با این ایمیل یا موبایل یافت نشد. ابتدا حساب کاربری او را بسازید.",
      };
    await prisma.staffAssignment.create({
      data: {
        userId: staffUser.id,
        studyHallId: owner.studyHallId,
        role: parsed.data.role,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        isActive: true,
        note: parsed.data.note || null,
      },
    });
    revalidateSettings();
    return { success: true, message: "همکار به سالن اضافه شد." };
  } catch (error) {
    return actionError(error, "افزودن همکار ناموفق بود.");
  }
}

export async function updatePublicPageSettings(
  formData: FormData,
): Promise<ActionResult> {
  return updateStudyHallSettings(formData);
}
