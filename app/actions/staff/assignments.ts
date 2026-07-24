"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  actionError,
  revalidateOperationalPaths,
} from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { revalidatePath } from "next/cache";

const staffAssignmentSchema = z.object({
  identifier: z.string().min(1, "ایمیل یا شماره موبایل الزامی است."),
  role: z.enum(["OWNER", "STAFF"]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  note: z.string().optional(),
  // New user fields
  createNewUser: z.coerce.boolean().optional(),
  name: z.string().optional(),
  password: z.string().optional(),
});

const updateStaffAssignmentSchema = z.object({
  assignmentId: z.string().cuid("شناسه تخصیص معتبر نیست."),
  role: z.enum(["OWNER", "STAFF"]).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  note: z.string().optional(),
});

function revalidateStaffPaths() {
  revalidateOperationalPaths();
  revalidatePath("/dashboard/staff");
  revalidatePath("/dashboard/settings");
}

/**
 * Assigns an existing user to the study hall as staff/owner.
 */
export async function assignStaff(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  if (user.role !== "OWNER") {
    return { success: false, error: "تنها مدیر سالن می‌تواند همکار جدید اضافه کند." };
  }

  const parsed = staffAssignmentSchema.safeParse({
    identifier: formData.get("identifier"),
    role: formData.get("role"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    note: formData.get("note")?.toString() || undefined,
    createNewUser: formData.get("createNewUser") === "true",
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات ورودی معتبر نیست.",
    };
  }

  const { identifier, role, startDate, endDate, note, createNewUser, name, password } = parsed.data;

  if (endDate && endDate < startDate) {
    return { success: false, error: "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let targetUser = await tx.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phoneNumber: identifier },
          ],
        },
        select: { id: true, name: true, email: true, phoneNumber: true },
      });

      if (!targetUser) {
        if (createNewUser) {
          if (!name || !password) {
            throw new Error("برای ساخت حساب جدید، نام و رمز عبور الزامی است.");
          }

          // Use better-auth to create user
          const { auth } = await import("@/lib/auth");
          const newUser = await auth.api.signUpEmail({
            body: {
              email: identifier.includes("@") ? identifier : `${identifier}@studivo.ir`,
              password,
              name,
            },
          });

          targetUser = await tx.user.update({
            where: { id: newUser.user.id },
            data: { 
              phoneNumber: !identifier.includes("@") ? identifier : null,
            },
            select: { id: true, name: true, email: true, phoneNumber: true },
          });
        } else {
          throw new Error("کاربری با این مشخصات یافت نشد. ابتدا حساب کاربری او را بسازید یا گزینه ساخت حساب جدید را انتخاب کنید.");
        }
      }

      const existingAssignment = await tx.staffAssignment.findFirst({
        where: {
          userId: targetUser.id,
          studyHallId,
          isActive: true,
        },
      });

      if (existingAssignment) {
        throw new Error("این کاربر در حال حاضر در این سالن فعال است.");
      }

      const assignment = await tx.staffAssignment.create({
        data: {
          userId: targetUser.id,
          studyHallId,
          role,
          startDate,
          endDate,
          isActive: true,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "CREATE",
          entityType: "STAFF_ASSIGNMENT",
          entityId: assignment.id,
          metadata: {
            actionType: "ASSIGN_STAFF",
            operatorName: user.name,
            targetUserName: targetUser.name,
            role,
            isNewUser: !!createNewUser,
          },
        },
      });

      return { 
        success: true, 
        message: createNewUser ? "حساب کاربری ساخته و همکار به سالن اضافه شد." : "همکار با موفقیت به سالن اضافه شد.",
        data: createNewUser ? { email: targetUser.email, password } : undefined
      };
    });

    revalidateStaffPaths();
    return result;
  } catch (error) {
    return actionError(error, "افزودن همکار ناموفق بود.");
  }
}

/**
 * Updates an existing staff assignment.
 */
export async function updateStaffAssignment(
  assignmentId: string,
  data: z.infer<typeof updateStaffAssignmentSchema>
): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  if (user.role !== "OWNER") {
    return { success: false, error: "تنها مدیر سالن می‌تواند اطلاعات همکاران را تغییر دهد." };
  }

  const parsed = updateStaffAssignmentSchema.safeParse({ ...data, assignmentId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات ورودی معتبر نیست.",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.staffAssignment.findFirst({
        where: { id: assignmentId, studyHallId },
        include: { user: { select: { name: true } } },
      });

      if (!assignment) {
        throw new Error("تخصیص مورد نظر یافت نشد.");
      }

      const updated = await tx.staffAssignment.update({
        where: { id: assignmentId },
        data: {
          role: parsed.data.role,
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          isActive: parsed.data.isActive,
          note: parsed.data.note,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "STAFF_ASSIGNMENT",
          entityId: assignmentId,
          metadata: {
            actionType: "UPDATE_STAFF_ASSIGNMENT",
            operatorName: user.name,
            targetUserName: assignment.user.name,
            changes: parsed.data,
          },
        },
      });

      revalidateStaffPaths();
      return { success: true, message: "اطلاعات همکار با موفقیت بروزرسانی شد." };
    });
  } catch (error) {
    return actionError(error, "بروزرسانی اطلاعات همکار ناموفق بود.");
  }
}

/**
 * Deactivates a staff member.
 */
export async function deactivateStaff(assignmentId: string): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  if (user.role !== "OWNER") {
    return { success: false, error: "تنها مدیر سالن می‌تواند همکاران را غیرفعال کند." };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.staffAssignment.findFirst({
        where: { id: assignmentId, studyHallId, isActive: true },
        include: { user: { select: { name: true } } },
      });

      if (!assignment) {
        throw new Error("همکار فعال یافت نشد.");
      }

      // Prevent owner from deactivating themselves if they are the only owner
      if (assignment.userId === user.id) {
        const ownerCount = await tx.staffAssignment.count({
          where: { studyHallId, role: "OWNER", isActive: true },
        });
        if (ownerCount <= 1) {
          throw new Error("شما تنها مدیر فعال سالن هستید و نمی‌توانید خود را غیرفعال کنید.");
        }
      }

      await tx.staffAssignment.update({
        where: { id: assignmentId },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "STAFF_ASSIGNMENT",
          entityId: assignmentId,
          metadata: {
            actionType: "DEACTIVATE_STAFF",
            operatorName: user.name,
            targetUserName: assignment.user.name,
          },
        },
      });

      revalidateStaffPaths();
      return { success: true, message: "همکار با موفقیت غیرفعال شد." };
    });
  } catch (error) {
    return actionError(error, "غیرفعال‌سازی همکار ناموفق بود.");
  }
}
