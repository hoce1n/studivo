"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { isOccupyingAssignment } from "@/app/dashboard/_lib/dashboard-utils";

const renewMembershipSchema = z.object({
  membershipId: z.string().cuid("شناسه عضویت معتبر نیست."),
  endsAt: z.coerce.date("تاریخ پایان جدید معتبر نیست."),
});

function calculateDaysDifference(newEndsAt: Date, currentEndsAt: Date) {
  return Math.ceil(
    (newEndsAt.getTime() - currentEndsAt.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Renews an existing membership or extends its duration based on endsAt threshold.
 * Keeps SeatAssignment in sync for fixed-seat memberships so the map stays correct.
 */
export async function renewMembership(
  membershipId: string,
  endsAt: string | Date
): Promise<ActionResult<{ isRealRenewal: boolean; daysDifference: number }>> {
  const user = await requireScopedUser();
  const { studyHallId } = user;
  const parsed = renewMembershipSchema.safeParse({ membershipId, endsAt });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات تمدید عضویت معتبر نیست.",
    };
  }

  const newEndsAt = parsed.data.endsAt;
  const now = new Date();

  if (newEndsAt <= now) {
    return {
      success: false,
      error: "تاریخ پایان عضویت باید بعد از زمان جاری باشد.",
    };
  }

  let result: { isRealRenewal: boolean; daysDifference: number } | null = null;

  try {
    result = await prisma.$transaction(async (tx) => {
      const current = await tx.membership.findFirst({
        where: {
          id: parsed.data.membershipId,
          studyHallId,
          status: { in: ["ACTIVE", "EXPIRED", "PENDING"] },
        },
        select: {
          id: true,
          userId: true,
          membershipPlanId: true,
          status: true,
          endsAt: true,
          planName: true,
          planDurationDays: true,
          planPrice: true,
          hasFixedSeat: true,
          user: { select: { name: true } },
          seatAssignments: {
            select: {
              id: true,
              seatId: true,
              endsAt: true,
              seat: { select: { number: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      if (!current) {
        throw new Error("عضویت مورد نظر برای تمدید یافت نشد.");
      }

      const occupyingSeat = current.seatAssignments.find((assignment) =>
        isOccupyingAssignment({
          endsAt: assignment.endsAt,
          membership: {
            status: current.status,
            endsAt: current.endsAt,
          },
        })
      );
      // Fallback: fixed-seat memberships should keep the latest known seat
      const seatToKeep =
        occupyingSeat ??
        (current.hasFixedSeat ? current.seatAssignments[0] : undefined);

      const daysDifference = calculateDaysDifference(newEndsAt, current.endsAt);
      const isRealRenewal = daysDifference > 7;

      if (isRealRenewal) {
        await tx.membership.update({
          where: { id: current.id },
          data: { status: "EXPIRED" },
        });

        const newMembership = await tx.membership.create({
          data: {
            userId: current.userId,
            studyHallId,
            membershipPlanId: current.membershipPlanId,
            status: "ACTIVE",
            startsAt: now,
            endsAt: newEndsAt,
            planName: current.planName,
            planDurationDays: current.planDurationDays,
            planPrice: current.planPrice,
            hasFixedSeat: current.hasFixedSeat,
          },
        });

        if (current.hasFixedSeat && seatToKeep) {
          // Check if user has ANY OTHER active assignment (safety check)
          const otherActive = await tx.seatAssignment.findFirst({
            where: {
              id: { not: seatToKeep.id },
              membership: {
                userId: current.userId,
                studyHallId,
              },
              OR: [{ endsAt: null }, { endsAt: { gt: now } }],
            },
          });

          if (otherActive) {
            throw new Error("این کاربر دارای تخصیص صندلی فعال دیگری است.");
          }

          // Close previous assignment (works for null or legacy endsAt)
          await tx.seatAssignment.update({
            where: { id: seatToKeep.id },
            data: { endsAt: now },
          });

          // Canonical open assignment for the new membership
          await tx.seatAssignment.create({
            data: {
              membershipId: newMembership.id,
              seatId: seatToKeep.seatId,
              startsAt: now,
              endsAt: null,
            },
          });
        }
      } else {
        await tx.membership.update({
          where: { id: current.id },
          data: { endsAt: newEndsAt, status: "ACTIVE" },
        });

        // Align seat occupancy with the extended membership.
        // Legacy rows had endsAt = old membership end; leaving that stale
        // makes isOccupyingAssignment treat the seat as released.
        if (current.hasFixedSeat && seatToKeep) {
          await tx.seatAssignment.update({
            where: { id: seatToKeep.id },
            data: { endsAt: null },
          });
        }
      }

      const seatNum = seatToKeep?.seat.number ?? "بدون صندلی";

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "UPDATE",
          entityType: "MEMBERSHIP",
          entityId: current.id,
          metadata: {
            actionType: "RENEW_MEMBERSHIP",
            operatorName: user.name,
            memberName: current.user.name,
            seatNumber: seatNum,
            hasFixedSeat: current.hasFixedSeat,
            oldEndsAt: current.endsAt.toISOString(),
            newEndsAt: newEndsAt.toISOString(),
            daysDifference,
            isRealRenewal,
          },
        },
      });

      return { isRealRenewal, daysDifference };
    });
  } catch (error) {
    return actionError(error, "تمدید عضویت ناموفق بود.");
  }

  revalidateOperationalPaths();

  return {
    success: true,
    message: result?.isRealRenewal
      ? "تمدید جدید با موفقیت ایجاد گردید و سابقه قبلی حفظ شد."
      : "تاریخ پایان عضویت اصلاح شد.",
    data: result ?? undefined,
  };
}
