"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import { Gender } from "@/lib/generated/prisma/client";
import z from "zod";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const publicPageSchema = z.object({
  slug: z
    .string()
    .min(3, "اسلاگ باید حداقل ۳ کاراکتر باشد")
    .regex(/^[a-z0-9-]+$/, "اسلاگ فقط می‌تواند شامل حروف کوچک انگلیسی، اعداد و خط تیره باشد")
    .nullable()
    .optional(),
  publicPageEnabled: z.boolean(),
  heroImage: z.string().nullable().optional(),
  galleryImages: z.array(z.string()).optional(),
});

async function requireOwnerUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      staffAssignments: {
        where: { isActive: true },
        select: {
          role: true,
          studyHallId: true,
        },
        take: 1,
      },
    },
  });

  const assignment = user?.staffAssignments[0];
  if (!assignment || assignment.role !== "OWNER") {
    return null;
  }

  return {
    userId: user.id,
    studyHallId: assignment.studyHallId,
  };
}

export async function updateStudyHallSettings(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireOwnerUser();

  if (!auth) {
    return {
      success: false,
      error: "فقط مدیر سالن (OWNER) اجازه تغییر تنظیمات سالن را دارد.",
    };
  }

  const name = formData.get("name") as string;
  const gender = formData.get("gender") as Gender;
  const phoneNumber = formData.get("phoneNumber") as string;
  const address = formData.get("address") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim().length === 0) {
    return { success: false, error: "نام سالن مطالعه الزامی است." };
  }

  try {
    await prisma.studyHall.update({
      where: { id: auth.studyHallId },
      data: {
        name,
        gender,
        phoneNumber,
        address,
        description,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, message: "تنظیمات سالن با موفقیت به‌روزرسانی شد." };
  } catch {
    return { success: false, error: "خطا در به‌روزرسانی تنظیمات سالن." };
  }
}

export async function updatePublicPageSettings(
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireOwnerUser();

  if (!auth) {
    return {
      success: false,
      error: "فقط مدیر سالن (OWNER) اجازه ویرایش صفحه عمومی را دارد.",
    };
  }

  let galleryImages: string[] = [];
  try {
    const raw = formData.get("galleryImages");
    if (raw) galleryImages = JSON.parse(raw.toString());
  } catch {
    // در صورت وجود خطا در JSON، آرایه خالی در نظر گرفته می‌شود
  }

  const rawSlug = formData.get("slug")?.toString().trim();

  const parsed = publicPageSchema.safeParse({
    slug: rawSlug ? rawSlug : null,
    publicPageEnabled: formData.get("publicPageEnabled") === "on",
    heroImage: formData.get("heroImage") || null,
    galleryImages,
  });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "اطلاعات صفحه عمومی معتبر نیست.",
    };
  }

  try {
    // بررسی تکراری نبودن slug در بقیه سالن‌ها
    if (parsed.data.slug) {
      const existing = await prisma.studyHall.findFirst({
        where: {
          slug: parsed.data.slug,
          id: { not: auth.studyHallId },
        },
        select: { id: true },
      });

      if (existing) {
        return {
          success: false,
          error: "این آدرس عمومی قبلاً توسط سالن دیگری انتخاب شده است.",
        };
      }
    }

    await prisma.studyHall.update({
      where: { id: auth.studyHallId },
      data: {
        slug: parsed.data.slug,
        publicPageEnabled: parsed.data.publicPageEnabled,
        heroImage: parsed.data.heroImage ?? null,
        galleryImages: parsed.data.galleryImages ?? [],
      },
    });

    revalidatePath("/dashboard/settings");
    if (parsed.data.slug) revalidatePath(`/${parsed.data.slug}`);

    return {
      success: true,
      message: "تنظیمات صفحه عمومی با موفقیت ذخیره شد.",
    };
  } catch {
    return {
      success: false,
      error: "خطایی هنگام به روزرسانی تنظیمات صفحه عمومی رخ داد.",
    };
  }
}