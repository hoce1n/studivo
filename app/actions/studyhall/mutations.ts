"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, requireScopedUser } from "../auth/verify-role";
import type { ActionResult } from "@/app/actions/audit/helpers";

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد."),
  totalSeats: z.coerce.number().int().min(1).max(500),
  gender: z.enum(["MALE", "FEMALE"], { error: "نوع سالن را انتخاب کنید." }),
  address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300),
});

const publicPageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "آدرس عمومی باید حداقل ۳ کاراکتر باشد.")
    .max(60)
    .regex(/^[a-z0-9-]+$/, "آدرس عمومی فقط شامل حروف کوچک، اعداد و خط تیره است."),
  publicPageEnabled: z.coerce.boolean(),
  heroImage: z.string().url().nullable().optional(),
  galleryImages: z.string().array().max(8).optional(),
});

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  if (user.staffAssignments.length > 0) {
    redirect("/dashboard");
  }

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    totalSeats: formData.get("totalSeats"),
    gender: formData.get("gender"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات نامعتبر است." };
  }

  await prisma.$transaction(async (tx) => {
    // 1. Create the new studyhall record
    const studyhall = await tx.studyHall.create({
      data: {
        name: parsed.data.name,
        gender: parsed.data.gender,
        address: parsed.data.address,
        isActive: true,
      },
    });

    // 2. Assign OWNER role to the current user
    await tx.staffAssignment.create({
      data: {
        userId: user.id,
        studyHallId: studyhall.id,
        role: "OWNER",
        startDate: new Date(),
        isActive: true,
      },
    });

    // 3. Create default Section according to v2 architecture
    const defaultSection = await tx.section.create({
      data: {
        studyHallId: studyhall.id,
        name: "سالن اصلی",
        isActive: true,
      },
    });

    // 4. Create one default physical table, then batch create seats under it.
    const defaultTable = await tx.physicalTable.create({
      data: { studyHallId: studyhall.id, label: "میز ۱", sortOrder: 1 },
      select: { id: true },
    });

    const seatData = Array.from({ length: parsed.data.totalSeats }, (_, index) => ({
      tableId: defaultTable.id,
      sectionId: defaultSection.id,
      number: `T1-S${index + 1}`,
      isActive: true,
    }));

    await tx.seat.createMany({ data: seatData });
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updatePublicPageSettings(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { role, studyHallId } = user;

  if (role !== "OWNER") {
    return { success: false, error: "فقط مدیر سالن اجازه ویرایش صفحه عمومی را دارد." };
  }

  let galleryImages: string[] = [];
  try {
    const raw = formData.get("galleryImages");
    if (raw) galleryImages = JSON.parse(raw.toString());
  } catch {
    // ignore malformed data
  }

  const parsed = publicPageSchema.safeParse({
    slug: formData.get("slug"),
    publicPageEnabled: formData.get("publicPageEnabled") === "on",
    heroImage: formData.get("heroImage") || null,
    galleryImages,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات معتبر نیست." };
  }

  if (parsed.data.slug) {
    const existing = await prisma.studyHall.findFirst({
      where: { slug: parsed.data.slug, id: { not: studyHallId } },
    });
    if (existing) {
      return { success: false, error: "این آدرس عمومی قبلاً توسط سالن دیگری انتخاب شده است." };
    }
  }

  await prisma.studyHall.update({
    where: { id: studyHallId },
    data: {
      slug: parsed.data.slug,
      publicPageEnabled: parsed.data.publicPageEnabled,
      heroImage: parsed.data.heroImage ?? null,
      galleryImages: parsed.data.galleryImages ?? [],
    },
  });

  revalidatePath("/dashboard/settings");
  if (parsed.data.slug) revalidatePath(`/${parsed.data.slug}`);
  return { success: true, message: "تنظیمات صفحه عمومی با موفقیت ذخیره شد." };
}