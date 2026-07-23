"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { isOccupyingAssignment } from "@/app/dashboard/_lib/dashboard-utils";

const releaseSeatSchema = z.object({
  seatAssignmentId: z.string().cuid("شناسه تخصیص صندلی معتبر نیست."),
});

const swapSeatSchema = z.object({
  seatAssignmentId: z.string().cuid("شناسه تخصیص فعلی معتبر نیست."),
  targetSeatId: z.union([
    z.string().cuid("شناسه صندلی جدید معتبر نیست."),
    z.number().int().positive(),
  ]),
});

/**
 * Releases a seat assignment by setting endsAt timestamp and cancelling membership.
 */
export async function releaseSeat(seatAssignmentId: string): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;
  const parsed = releaseSeatSchema.safeParse({ seatAssignmentId });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "داده‌های ورودی معتبر نیست.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const assignment = await tx.seatAssignment.findFirst({
        where: {
          id: parsed.data.seatAssignmentId,
          membership: {
            studyHallId,
            status: { not: "CANCELLED" },
          },
        },
        select: {
          id: true,
          endsAt: true,
          membershipId: true,
          seat: { select: { number: true } },
          membership: {
            select: {
              id: true,
              status: true,
              endsAt: true,
              user: { select: { name: true } },
            },
          },
        },
      });

      if (!assignment || !isOccupyingAssignment(assignment)) {
        throw new Error("تخصیص صندلی فعال برای تخلیه یافت نشد.");
      }

      const now = new Date();

      await tx.seatAssignment.update({
        where: { id: assignment.id },
        data: { endsAt: now },
      });

      if (
        assignment.membership.status === "ACTIVE" ||
        assignment.membership.status === "PENDING"
      ) {
        await tx.membership.update({
          where: { id: assignment.membershipId },
          data: { status: "CANCELLED" },
        });
      }

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
            membershipId: assignment.membershipId,
            membershipStatus: "CANCELLED",
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
  targetSeatId: string | number
): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;
  const parsed = swapSeatSchema.safeParse({ seatAssignmentId, targetSeatId });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات جابه‌جایی معتبر نیست.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      let targetSeat: { id: string; number: string } | null = null;

      if (typeof parsed.data.targetSeatId === "string") {
        targetSeat = await tx.seat.findFirst({
          where: {
            id: parsed.data.targetSeatId,
            section: { studyHallId },
          },
          select: { id: true, number: true },
        });
      } else {
        const matches = await tx.seat.findMany({
          where: {
            number: String(parsed.data.targetSeatId),
            section: { studyHallId },
          },
          select: { id: true, number: true },
          take: 2,
        });

        if (matches.length > 1) {
          throw new Error(
            "چند صندلی با این شماره در بخش‌های مختلف وجود دارد. لطفاً صندلی را دقیق‌تر مشخص کنید."
          );
        }

        targetSeat = matches[0] ?? null;
      }

      if (!targetSeat) {
        throw new Error("صندلی مقصد در این سالن یافت نشد.");
      }

      const targetAssignments = await tx.seatAssignment.findMany({
        where: {
          seatId: targetSeat.id,
          membership: { status: { not: "CANCELLED" } },
        },
        select: {
          id: true,
          endsAt: true,
          membership: { select: { status: true, endsAt: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      if (targetAssignments.some(isOccupyingAssignment)) {
        throw new Error(`صندلی شماره ${targetSeat.number} در حال حاضر اشغال است.`);
      }

      const current = await tx.seatAssignment.findFirst({
        where: {
          id: parsed.data.seatAssignmentId,
          membership: {
            studyHallId,
            status: { not: "CANCELLED" },
          },
        },
        select: {
          id: true,
          endsAt: true,
          membershipId: true,
          seatId: true,
          seat: { select: { number: true } },
          membership: {
            select: {
              status: true,
              endsAt: true,
              user: { select: { name: true } },
            },
          },
        },
      });

      if (!current || !isOccupyingAssignment(current)) {
        throw new Error("تخصیص فعالی برای این صندلی پیدا نشد.");
      }

      if (current.seatId === targetSeat.id) {
        throw new Error("دانش‌آموز هم‌اکنون روی همین صندلی است.");
      }

      const now = new Date();

      await tx.seatAssignment.update({
        where: { id: current.id },
        data: { endsAt: now },
      });

      await tx.seatAssignment.create({
        data: {
          membershipId: current.membershipId,
          seatId: targetSeat.id,
          startsAt: now,
        },
      });

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
