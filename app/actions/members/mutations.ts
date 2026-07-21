"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireUser, requireScopedUser } from "../auth/verify-role";
import type { ActionResult } from "@/app/actions/audit";

const profileSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد.").max(80),
});

const staffSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد"),
  email: z.string().trim().email("ایمیل معتبر وارد کنید"),
  phoneNumber: z.string().trim().regex(/^09\d{9}$/, "فرمت شماره موبایل نامعتبر است").length(11),
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

export async function createStaff(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { role, studyHallId } = user;

  if (role !== "OWNER") {
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

  await prisma.$transaction(async (tx) => {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
      },
    });

    const staffUser = await tx.user.update({
      where: { email: parsed.data.email },
      data: { phoneNumber: parsed.data.phoneNumber },
    });

    await tx.staffAssignment.create({
      data: {
        userId: staffUser.id,
        studyHallId,
        role: "STAFF",
        startDate: new Date(),
        isActive: true,
      },
    });
  });

  revalidatePath("/dashboard");
  return { success: true, message: "همکار جدید با موفقیت ثبت شد." };
}