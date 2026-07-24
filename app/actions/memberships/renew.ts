"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { isOccupyingAssignment } from "@/app/dashboard/_lib/dashboard-utils";

const renewMembershipSchema = z.object({
  membershipId: z.string().cuid("شناسه عضویت معتبر نیست."),
  startsAt: z.coerce.date("تاریخ شروع معتبر نیست.").optional(),
  endsAt: z.coerce.date("تاریخ پایان جدید معتبر نیست."),
  membershipPlanId: z.string().cuid("شناسه طرح عضویت معتبر نیست.").optional(),
  isAdjustment: z.boolean().optional().default(false),
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
  data: {
    endsAt: string | Date;
    startsAt?: string | Date;
    membershipPlanId?: string;
    isAdjustment?: boolean;
  },
): Promise<ActionResult<{ isRealRenewal: boolean; daysDifference: number }>> {
  const user = await requireScopedUser();
  const { studyHallId } = user;
  const parsed = renewMembershipSchema.safeParse({ membershipId, ...data });

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "اطلاعات تمدید عضویت معتبر نیست.",
    };
  }

  const {
    endsAt: newEndsAt,
    startsAt: newStartsAt,
    membershipPlanId,
    isAdjustment,
  } = parsed.data;
  const now = new Date();

  if (newEndsAt <= now && !isAdjustment) {
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
          startsAt: true,
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
        }),
      );
      // Fallback: fixed-seat memberships should keep the latest known seat
      const seatToKeep =
        occupyingSeat ??
        (current.hasFixedSeat ? current.seatAssignments[0] : undefined);

      const daysDifference = calculateDaysDifference(newEndsAt, current.endsAt);

      if (isAdjustment) {
        // Just update current record
        await tx.membership.update({
          where: { id: current.id },
          data: {
            startsAt: newStartsAt ?? current.startsAt,
            endsAt: newEndsAt,
          },
        });

        // If seat assignment was closed, maybe re-open it if we extended the date?
        // For now, let's keep it simple and just adjust membership.
      } else {
        // Real renewal: Create new record, expire old one
        await tx.membership.update({
          where: { id: current.id },
          data: { status: "EXPIRED" },
        });

        let plan = {
          id: current.membershipPlanId,
          name: current.planName,
          durationDays: current.planDurationDays,
          price: current.planPrice,
          hasFixedSeat: current.hasFixedSeat,
        };

        if (membershipPlanId && membershipPlanId !== current.membershipPlanId) {
          const newPlan = await tx.membershipPlan.findFirst({
            where: { id: membershipPlanId, studyHallId, isActive: true },
          });
          if (newPlan) {
            plan = {
              id: newPlan.id,
              name: newPlan.name,
              durationDays: newPlan.durationDays,
              price: newPlan.price,
              hasFixedSeat: newPlan.hasFixedSeat,
            };
          }
        }

        const newMembership = await tx.membership.create({
          data: {
            userId: current.userId,
            studyHallId,
            membershipPlanId: plan.id,
            status: "ACTIVE",
            startsAt: newStartsAt ?? now,
            endsAt: newEndsAt,
            planName: plan.name,
            planDurationDays: plan.durationDays,
            planPrice: plan.price,
            hasFixedSeat: plan.hasFixedSeat,
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

          // Close previous assignment
          await tx.seatAssignment.update({
            where: { id: seatToKeep.id },
            data: { endsAt: newStartsAt ?? now },
          });

          // Canonical open assignment for the new membership
          await tx.seatAssignment.create({
            data: {
              membershipId: newMembership.id,
              seatId: seatToKeep.seatId,
              startsAt: newStartsAt ?? now,
              endsAt: null,
            },
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
            actionType: isAdjustment ? "ADJUST_DATES" : "RENEW_MEMBERSHIP",
            operatorName: user.name,
            memberName: current.user.name,
            seatNumber: seatNum,
            oldEndsAt: current.endsAt.toISOString(),
            newEndsAt: newEndsAt.toISOString(),
            isAdjustment,
            newPlanId: membershipPlanId,
          },
        },
      });

      return { isRealRenewal: !isAdjustment, daysDifference };
    });
  } catch (error) {
    return actionError(error, isAdjustment ? "اصلاح تاریخ ناموفق بود." : "تمدید عضویت ناموفق بود.");
  }

  revalidateOperationalPaths();

  return {
    success: true,
    message: isAdjustment
      ? "تاریخ عضویت با موفقیت اصلاح شد."
      : "تمدید جدید با موفقیت ثبت شد.",
    data: result ?? undefined,
  };
}
