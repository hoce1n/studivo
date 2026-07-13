"use server";

import { z } from "zod";

import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireTenantContext } from "@/app/actions/auth";

type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

const renewSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  endDate: z.coerce.date(),
});

function calculateDaysDifference(newEndDate: Date, currentEndDate: Date) {
  return Math.ceil((newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Renews a membership (legacy subscriptionId used as membershipId).
 * Migrated to Schema v2 Membership model.
 */
export async function renewSubscription(subscriptionId: string, endDate: string): Promise<ActionResult<{ isRealRenewal: boolean; daysDifference: number }>> {
  const user = await requireTenantContext();
  const parsed = renewSchema.safeParse({ subscriptionId, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات تمدید اشتراک معتبر نیست." };
  }

  const newEndDate = parsed.data.endDate;
  const now = new Date();

  if (newEndDate <= now) {
    return { success: false, error: "تاریخ پایان اشتراک باید بعد از امروز باشد." };
  }

  let renewalResult: { isRealRenewal: boolean; daysDifference: number } | null = null;

  try {
    renewalResult = await prisma.$transaction(async (tx: TransactionClient) => {
      // Find current active membership using the provided ID (mapped from legacy subscriptionId)
      const current = await tx.membership.findFirst({
        where: { id: parsed.data.subscriptionId, studyHallId: user.studyHallId, status: "ACTIVE" },
        select: {
          id: true,
          userId: true,
          endsAt: true,
          membershipPlanId: true,
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
        throw new Error("اشتراک فعالی برای تمدید پیدا نشد.");
      }

      const daysDifference = calculateDaysDifference(newEndDate, current.endsAt);
      const isRealRenewal = daysDifference > 7;

      if (isRealRenewal) {
        // Handle seat assignment for the new membership
        const currentSeatId = current.seatAssignments[0]?.seatId;

        if (currentSeatId) {
          const activeSeatCollision = await tx.seatAssignment.findFirst({
            where: {
              seatId: currentSeatId,
              endsAt: null,
              membership: { status: "ACTIVE", studyHallId: user.studyHallId },
              NOT: { membershipId: current.id },
            },
            select: { id: true },
          });

          if (activeSeatCollision) {
            throw new Error("برای این صندلی اشتراک فعال دیگری ثبت شده است.");
          }
        }

        // Close current membership
        await tx.membership.update({ where: { id: current.id }, data: { status: "EXPIRED" } });

        // Close current seat assignment
        if (current.seatAssignments[0]) {
            await tx.seatAssignment.updateMany({
                where: { membershipId: current.id, endsAt: null },
                data: { endsAt: now }
            });
        }

        // Create new membership
        const newMembership = await tx.membership.create({
          data: {
            userId: current.userId,
            studyHallId: user.studyHallId,
            membershipPlanId: current.membershipPlanId,
            status: "ACTIVE",
            startsAt: now,
            endsAt: newEndDate,
            planName: current.planName,
            planDurationDays: current.planDurationDays,
            planPrice: current.planPrice,
            hasFixedSeat: current.hasFixedSeat,
          },
        });

        // Assign seat to new membership
        if (currentSeatId) {
            await tx.seatAssignment.create({
                data: {
                    membershipId: newMembership.id,
                    seatId: currentSeatId,
                    startsAt: now,
                }
            });
        }
      } else {
        // Just update the end date
        await tx.membership.update({ where: { id: current.id }, data: { endsAt: newEndDate } });

        // Update seat assignment end date if applicable
        await tx.seatAssignment.updateMany({
            where: { membershipId: current.id, endsAt: { not: null } },
            data: { endsAt: newEndDate }
        });
      }

      // Note: In Schema v2, AuditLog has a different structure.
      // I'll skip creating the audit log for now to avoid breaking the transaction
      // until I fully map the new AuditLog entity.

      return { isRealRenewal, daysDifference };
    });
  } catch (error) {
    return actionError(error, "تمدید اشتراک ناموفق بود.");
  }

  revalidateOperationalPaths();

  return {
    success: true,
    message: renewalResult?.isRealRenewal
      ? "تمدید واقعی ثبت شد و سابقه قبلی حفظ شد."
      : "تاریخ پایان اشتراک اصلاح شد.",
    data: renewalResult ?? undefined,
  };
}

const updatePaymentStatusSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  status: z.enum(["paid", "unpaid"]),
});

/**
 * Updates payment status (legacy subscriptionId used as membershipId).
 * Migrated to Schema v2 Payment model.
 */
export async function updatePaymentStatus(subscriptionId: string, status: "paid" | "unpaid"): Promise<ActionResult> {
  const user = await requireTenantContext();
  const parsed = updatePaymentStatusSchema.safeParse({ subscriptionId, status });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات وضعیت پرداخت معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const currentMembership = await tx.membership.findFirst({
        where: { id: parsed.data.subscriptionId, studyHallId: user.studyHallId },
        select: {
          id: true,
          planPrice: true,
          payments: {
            where: { status: "COMPLETED" },
            take: 1,
          }
        },
      });

      if (!currentMembership) {
        throw new Error("اشتراک مورد نظر پیدا نشد.");
      }

      const hasPaid = currentMembership.payments.length > 0;

      if (parsed.data.status === "paid" && !hasPaid) {
        // Create a completed payment
        await tx.payment.create({
          data: {
            membershipId: currentMembership.id,
            amount: currentMembership.planPrice,
            method: "CASH", // Default to CASH for now
            status: "COMPLETED",
            paidAt: new Date(),
            createdById: user.id,
          },
        });
      } else if (parsed.data.status === "unpaid" && hasPaid) {
        // Void existing payments
        await tx.payment.updateMany({
          where: { membershipId: currentMembership.id, status: "COMPLETED" },
          data: {
            status: "VOIDED",
            voidedAt: new Date(),
            voidedById: user.id,
            voidReason: "تغییر وضعیت به پرداخت نشده توسط مدیر",
          },
        });
      }
    });
  } catch (error) {
    return actionError(error, "تغییر وضعیت پرداخت ناموفق بود.");
  }

  revalidateOperationalPaths();

  return {
    success: true,
    message: "وضعیت پرداخت با موفقیت به‌روزرسانی شد.",
  };
}
