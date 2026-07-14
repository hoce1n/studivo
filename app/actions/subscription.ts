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

/** Normalizes Persian (۰–۹) and Arabic-Indic (٠–٩) digits to ASCII. */
function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function calculateDaysDifference(newEndDate: Date, currentEndDate: Date) {
  return Math.ceil((newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Renews a membership (legacy subscriptionId used as membershipId).
 * Migrated to Schema v2 Membership model.
 */
export async function renewSubscription(
  subscriptionId: string,
  endDate: string,
): Promise<ActionResult<{ isRealRenewal: boolean; daysDifference: number }>> {
  const user = await requireTenantContext();
  const parsed = renewSchema.safeParse({ subscriptionId, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات تمدید اشتراک معتبر نیست." };
  }

  const newEndDate = parsed.data.endDate;
  const now = new Date();

  let renewalResult: { isRealRenewal: boolean; daysDifference: number } | null = null;

  try {
    renewalResult = await prisma.$transaction(async (tx: TransactionClient) => {
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

      // For correction mode: new end date must be after startsAt.
      // For extension mode: any date after startsAt is allowed (including past
      // dates to backfill a correction). We do NOT enforce future-only here
      // because operators legitimately correct end dates that are already past.
      if (newEndDate <= current.startsAt) {
        throw new Error("تاریخ پایان باید بعد از تاریخ شروع اشتراک باشد.");
      }

      const daysDifference = calculateDaysDifference(newEndDate, current.endsAt);
      const isRealRenewal = daysDifference > 7;

      if (isRealRenewal) {
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

        await tx.membership.update({ where: { id: current.id }, data: { status: "EXPIRED" } });

        if (current.seatAssignments[0]) {
          await tx.seatAssignment.updateMany({
            where: { membershipId: current.id, endsAt: null },
            data: { endsAt: now },
          });
        }

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

        if (currentSeatId) {
          await tx.seatAssignment.create({
            data: {
              membershipId: newMembership.id,
              seatId: currentSeatId,
              startsAt: now,
            },
          });
        }
      } else {
        await tx.membership.update({ where: { id: current.id }, data: { endsAt: newEndDate } });

        await tx.seatAssignment.updateMany({
          where: { membershipId: current.id, endsAt: { not: null } },
          data: { endsAt: newEndDate },
        });
      }

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

// ---------------------------------------------------------------------------
// registerPayment
// Replaces the legacy "paid/unpaid toggle" (updatePaymentStatus) with a proper
// payment workflow. Each call creates an immutable Payment record.
// To cancel a payment, use voidPayment instead of toggling status.
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = ["CASH", "POS", "CARD_TO_CARD", "ONLINE"] as const;

export const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  CASH: "نقدی",
  POS: "کارت‌خوان",
  CARD_TO_CARD: "کارت به کارت",
  ONLINE: "آنلاین",
};

const registerPaymentSchema = z.object({
  membershipId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  amount: z.coerce
    .number()
    .min(1, "مبلغ پرداخت باید بیشتر از صفر باشد."),
  method: z.enum(PAYMENT_METHODS, {
    error: "روش پرداخت را انتخاب کنید.",
  }),
  note: z.string().trim().max(300, "یادداشت نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد.").optional(),
});

export async function registerPayment(formData: FormData): Promise<ActionResult<{ paymentId: string }>> {
  const user = await requireTenantContext();

  const rawAmount = formData.get("amount");
  const parsed = registerPaymentSchema.safeParse({
    membershipId: formData.get("membershipId"),
    amount: rawAmount ? normalizeDigits(String(rawAmount).replace(/,/g, "")) : rawAmount,
    method: formData.get("method"),
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات پرداخت معتبر نیست." };
  }

  try {
    const membership = await prisma.membership.findFirst({
      where: { id: parsed.data.membershipId, studyHallId: user.studyHallId },
      select: { id: true, status: true },
    });

    if (!membership) {
      return { success: false, error: "اشتراک مورد نظر پیدا نشد." };
    }

    const payment = await prisma.$transaction(async (tx: TransactionClient) => {
      const created = await tx.payment.create({
        data: {
          membershipId: membership.id,
          amount: parsed.data.amount,
          method: parsed.data.method,
          status: "COMPLETED",
          paidAt: new Date(),
          note: parsed.data.note ?? null,
          createdById: user.id,
        },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          studyHallId: user.studyHallId,
          actorId: user.id,
          action: "CREATE",
          entityType: "PAYMENT",
          entityId: created.id,
          metadata: {
            membershipId: membership.id,
            amount: parsed.data.amount,
            method: parsed.data.method,
          },
        },
      });

      return created;
    });

    revalidateOperationalPaths();

    return {
      success: true,
      message: "پرداخت با موفقیت ثبت شد.",
      data: { paymentId: payment.id },
    };
  } catch (error) {
    return actionError(error, "ثبت پرداخت ناموفق بود.");
  }
}

// ---------------------------------------------------------------------------
// voidPayment
// Voids an existing COMPLETED payment (immutable audit trail preserved).
// ---------------------------------------------------------------------------

const voidPaymentSchema = z.object({
  paymentId: z.string().min(1, "شناسه پرداخت معتبر نیست."),
  reason: z.string().trim().max(300, "دلیل ابطال نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد.").optional(),
});

export async function voidPayment(formData: FormData): Promise<ActionResult> {
  const user = await requireTenantContext();

  const parsed = voidPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات ابطال پرداخت معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const payment = await tx.payment.findFirst({
        where: {
          id: parsed.data.paymentId,
          membership: { studyHallId: user.studyHallId },
          status: "COMPLETED",
        },
        select: { id: true, membershipId: true },
      });

      if (!payment) {
        throw new Error("پرداخت مورد نظر پیدا نشد یا قبلاً باطل شده است.");
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "VOIDED",
          voidedAt: new Date(),
          voidedById: user.id,
          voidReason: parsed.data.reason ?? "باطل شده توسط مدیر",
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId: user.studyHallId,
          actorId: user.id,
          action: "VOID",
          entityType: "PAYMENT",
          entityId: payment.id,
          metadata: { reason: parsed.data.reason ?? null },
        },
      });
    });

    revalidateOperationalPaths();
    return { success: true, message: "پرداخت با موفقیت باطل شد." };
  } catch (error) {
    return actionError(error, "ابطال پرداخت ناموفق بود.");
  }
}

// ---------------------------------------------------------------------------
// fetchMembershipPayments
// Returns the payment history for a single membership (for the payment panel).
// ---------------------------------------------------------------------------

export type MembershipPayment = {
  id: string;
  amount: number;
  method: string;
  status: "COMPLETED" | "VOIDED";
  paidAt: Date | null;
  note: string | null;
  createdBy: { name: string };
};

export async function fetchMembershipPayments(membershipId: string): Promise<ActionResult<MembershipPayment[]>> {
  const user = await requireTenantContext();

  try {
    const payments = await prisma.payment.findMany({
      where: {
        membershipId,
        membership: { studyHallId: user.studyHallId },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        paidAt: true,
        note: true,
        createdBy: { select: { name: true } },
      },
    });

    return {
      success: true,
      data: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status as "COMPLETED" | "VOIDED",
        paidAt: p.paidAt,
        note: p.note,
        createdBy: { name: p.createdBy.name },
      })),
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت سابقه پرداخت‌ها.");
  }
}
