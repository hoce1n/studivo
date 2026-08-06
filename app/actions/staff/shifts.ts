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

const shiftSchema = z.object({
  staffAssignmentId: z.string().cuid("شناسه تخصیص همکار معتبر نیست."),
  date: z.string().min(1, "تاریخ الزامی است."),
  startTime: z.string().min(1, "ساعت شروع الزامی است."),
  endTime: z.string().min(1, "ساعت پایان الزامی است."),
  note: z.string().optional(),
});

const updateShiftSchema = z.object({
  shiftId: z.string().cuid("شناسه شیفت معتبر نیست."),
  date: z.string().min(1, "تاریخ الزامی است."),
  startTime: z.string().min(1, "ساعت شروع الزامی است."),
  endTime: z.string().min(1, "ساعت پایان الزامی است."),
  note: z.string().optional(),
});

function buildShiftTimes(date: string, startTime: string, endTime: string) {
  const normalizedDate = date.includes("T") ? date.split("T")[0] : date;
  const startsAt = new Date(`${normalizedDate}T${startTime}:00+03:30`);
  const endsAt = new Date(`${normalizedDate}T${endTime}:00+03:30`);

  // Overnight shift (e.g. 22:00 → 02:00)
  if (endsAt <= startsAt) {
    endsAt.setTime(endsAt.getTime() + 24 * 60 * 60 * 1000);
  }

  return { startsAt, endsAt };
}

function revalidateStaffPaths() {
  revalidateOperationalPaths();
  revalidatePath("/dashboard/staff");
}

/**
 * Records a new shift for a staff member.
 */
export async function createShift(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  const parsed = shiftSchema.safeParse({
    staffAssignmentId: formData.get("staffAssignmentId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    note: formData.get("note")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات ورودی معتبر نیست.",
    };
  }

  const { staffAssignmentId, date, startTime, endTime, note } = parsed.data;
  const { startsAt, endsAt } = buildShiftTimes(date, startTime, endTime);

  // Prevent far past shifts (e.g., more than 30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (startsAt < thirtyDaysAgo && user.role !== "OWNER") {
    return {
      success: false,
      error: "ثبت شیفت برای بیش از ۳۰ روز گذشته مجاز نیست.",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const assignment = await tx.staffAssignment.findFirst({
        where: { id: staffAssignmentId, studyHallId },
        include: { user: { select: { id: true, name: true } } },
      });

      if (!assignment) {
        throw new Error("تخصیص همکار یافت نشد.");
      }

      // Authorization: STAFF can only log their own shifts
      if (user.role === "STAFF" && assignment.userId !== user.id) {
        throw new Error("شما مجاز به ثبت شیفت برای همکاران دیگر نیستید.");
      }

      const shift = await tx.shift.create({
        data: {
          staffAssignmentId,
          startsAt,
          endsAt,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "CREATE",
          entityType: "SHIFT",
          entityId: shift.id,
          metadata: {
            actionType: "CREATE_SHIFT",
            operatorName: user.name,
            targetUserName: assignment.user.name,
            durationMinutes: Math.round(
              (endsAt.getTime() - startsAt.getTime()) / 60000,
            ),
          },
        },
      });

      revalidateStaffPaths();
      return { success: true, message: "شیفت با موفقیت ثبت شد." };
    });
  } catch (error) {
    return actionError(error, "ثبت شیفت ناموفق بود.");
  }
}

/**
 * Updates an existing shift (date / hours / note).
 * STAFF may only edit their own shifts; OWNER may edit any hall shift.
 */
export async function updateShift(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  const parsed = updateShiftSchema.safeParse({
    shiftId: formData.get("shiftId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    note: formData.get("note")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات ورودی معتبر نیست.",
    };
  }

  const { shiftId, date, startTime, endTime, note } = parsed.data;
  const { startsAt, endsAt } = buildShiftTimes(date, startTime, endTime);

  try {
    return await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findFirst({
        where: { id: shiftId, staffAssignment: { studyHallId } },
        include: {
          staffAssignment: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });

      if (!shift) {
        throw new Error("شیفت مورد نظر یافت نشد.");
      }

      if (user.role === "STAFF" && shift.staffAssignment.userId !== user.id) {
        throw new Error("شما مجاز به ویرایش شیفت همکاران دیگر نیستید.");
      }

      await tx.shift.update({
        where: { id: shiftId },
        data: {
          startsAt,
          endsAt,
          note: note ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "SHIFT",
          entityId: shiftId,
          metadata: {
            actionType: "UPDATE_SHIFT",
            operatorName: user.name,
            targetUserName: shift.staffAssignment.user.name,
            previousStartsAt: shift.startsAt,
            previousEndsAt: shift.endsAt,
            startsAt,
            endsAt,
            note: note ?? null,
          },
        },
      });

      revalidateStaffPaths();
      return { success: true, message: "شیفت با موفقیت بروزرسانی شد." };
    });
  } catch (error) {
    return actionError(error, "بروزرسانی شیفت ناموفق بود.");
  }
}

/**
 * Deletes a shift.
 */
export async function deleteShift(shiftId: string): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  // Only OWNER can delete shifts
  if (user.role !== "OWNER") {
    return {
      success: false,
      error: "تنها مدیر سالن می‌تواند شیفت‌ها را حذف کند.",
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findFirst({
        where: { id: shiftId, staffAssignment: { studyHallId } },
        include: {
          staffAssignment: { include: { user: { select: { name: true } } } },
        },
      });

      if (!shift) {
        throw new Error("شیفت مورد نظر یافت نشد.");
      }

      await tx.shift.delete({
        where: { id: shiftId },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "DELETE",
          entityType: "SHIFT",
          entityId: shiftId,
          metadata: {
            actionType: "DELETE_SHIFT",
            operatorName: user.name,
            targetUserName: shift.staffAssignment.user.name,
            shiftDate: shift.startsAt,
          },
        },
      });

      revalidateStaffPaths();
      return { success: true, message: "شیفت با موفقیت حذف شد." };
    });
  } catch (error) {
    return actionError(error, "حذف شیفت ناموفق بود.");
  }
}
