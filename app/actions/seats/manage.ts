"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";

const releaseSeatSchema = z.object({
  seatAssignmentId: z.string().cuid("شناسه تخصیص صندلی معتبر نیست."),
});

const swapSeatSchema = z.object({
  seatAssignmentId: z.string().cuid("شناسه تخصیص فعلی معتبر نیست."),
  targetSeatId: z.string().cuid("شناسه صندلی جدید معتبر نیست."),
});

/**
 * Releases a seat assignment by setting endsAt timestamp.
 */
export async function releaseSeat(seatAssignmentId: string): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;
  const parsed = releaseSeatSchema.safeParse({ seatAssignmentId });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "داده‌های ورودی معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.seatAssignment.findFirst({
        where: {
          id: parsed.data.seatAssignmentId,
          membership: { studyHallId },
          endsAt: null,
        },
        select: {
          id: true,
          seat: { select: { number: true } },
          membership: { select: { user: { select: { name: true } } } },
        },
      });

      if (!assignment) {
        throw new Error("تخصیص صندلی فعال برای تخلیه یافت نشد.");
      }

      await tx.seatAssignment.update({
        where: { id: assignment.id },
        data: { endsAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "SEAT_ASSIGNMENT",
          entityId: assignment.id,
          metadata: {
            actionType: "RELEASE_SEAT",
            operatorName: user.name,
            memberName: assignment.membership.user.name,
            seatNumber: assignment.seat.number,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "تخلیه صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "صندلی با موفقیت تخلیه شد." };
}

/**
 * Swaps student from current seat assignment to a new target seat.
 */
export async function swapSeat(
  seatAssignmentId: string,
  targetSeatId: string
): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;
  const parsed = swapSeatSchema.safeParse({ seatAssignmentId, targetSeatId });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات جابه‌جایی معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Verify target seat
      const targetSeat = await tx.seat.findFirst({
        where: {
          id: parsed.data.targetSeatId,
          section: { studyHallId },
        },
        select: { id: true, number: true },
      });

      if (!targetSeat) {
        throw new Error("صندلی مقصد در این سالن یافت نشد.");
      }

      // 2. Check target seat availability
      const activeOnTarget = await tx.seatAssignment.findFirst({
        where: { seatId: targetSeat.id, endsAt: null },
      });

      if (activeOnTarget) {
        throw new Error(`صندلی شماره ${targetSeat.number} در حال حاضر اشغال است.`);
      }

      // 3. Find current active assignment
      const current = await tx.seatAssignment.findFirst({
        where: {
          id: parsed.data.seatAssignmentId,
          membership: { studyHallId },
          endsAt: null,
        },
        select: {
          id: true,
          membershipId: true,
          seatId: true,
          seat: { select: { number: true } },
          membership: { select: { user: { select: { name: true } } } },
        },
      });

      if (!current) {
        throw new Error("تخصیص فعالی برای این صندلی پیدا نشد.");
      }

      if (current.seatId === targetSeat.id) {
        throw new Error("دانش‌آموز هم‌اکنون روی همین صندلی است.");
      }

      const now = new Date();

      // Close current assignment
      await tx.seatAssignment.update({
        where: { id: current.id },
        data: { endsAt: now },
      });

      // Create new assignment
      await tx.seatAssignment.create({
        data: {
          membershipId: current.membershipId,
          seatId: targetSeat.id,
          startsAt: now,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "SEAT_ASSIGNMENT",
          entityId: current.id,
          metadata: {
            actionType: "SWAP_SEAT",
            operatorName: user.name,
            memberName: current.membership.user.name,
            fromSeatNumber: current.seat.number,
            toSeatNumber: targetSeat.number,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "جابه‌جایی صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "دانش‌آموز با موفقیت به صندلی جدید منتقل شد." };
}