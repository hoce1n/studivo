"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";

const renewMembershipSchema = z.object({
  membershipId: z.string().cuid("شناسه عضویت معتبر نیست."),
  endsAt: z.coerce.date({ invalid_type_error: "تاریخ پایان جدید معتبر نیست." }),
});

function calculateDaysDifference(newEndsAt: Date, currentEndsAt: Date) {
  return Math.ceil((newEndsAt.getTime() - currentEndsAt.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Renews an existing membership or extends its duration based on endsAt threshold.
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
    return { success: false, error: "تاریخ پایان عضویت باید بعد از زمان جاری باشد." };
  }

  let result: { isRealRenewal: boolean; daysDifference: number } | null = null;

  try {
    result = await prisma.$transaction(async (tx) => {
      // 1. Fetch active membership
      const current = await tx.membership.findFirst({
        where: {
          id: parsed.data.membershipId,
          studyHallId,
        },
        select: {
          id: true,
          userId: true,
          membershipPlanId: true,
          endsAt: true,
          planName: true,
          planDurationDays: true,
          planPrice: true,
          hasFixedSeat: true,
          user: { select: { name: true } },
          seatAssignments: {
            where: { endsAt: null },
            select: { seatId: true, seat: { select: { number: true } } },
            take: 1,
          },
        },
      });

      if (!current) {
        throw new Error("عضویت مورد نظر برای تمدید یافت نشد.");
      }

      const daysDifference = calculateDaysDifference(newEndsAt, current.endsAt);
      const isRealRenewal = daysDifference > 7;

      if (isRealRenewal) {
        // Mark old membership EXPIRED and create a new Membership record
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

        // Re-assign active seat to the new membership if applicable
        const activeSeat = current.seatAssignments[0];
        if (activeSeat) {
          // Close old assignment
          await tx.seatAssignment.updateMany({
            where: { membershipId: current.id, endsAt: null },
            data: { endsAt: now },
          });

          // Create assignment for new membership
          await tx.seatAssignment.create({
            data: {
              membershipId: newMembership.id,
              seatId: activeSeat.seatId,
              startsAt: now,
            },
          });
        }
      } else {
        // Minor date correction: update existing endsAt
        await tx.membership.update({
          where: { id: current.id },
          data: { endsAt: newEndsAt },
        });
      }

      const seatNum = current.seatAssignments[0]?.seat.number ?? "بدون صندلی";

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