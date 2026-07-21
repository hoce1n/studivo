"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import type { PaymentMethod } from "@/lib/generated/prisma/client";

const recordPaymentSchema = z.object({
  membershipId: z.string().cuid("شناسه عضویت معتبر نیست."),
  amount: z.coerce.number().positive("مبلغ پرداخت باید بزرگتر از صفر باشد."),
  method: z.enum(["CASH", "POS", "CARD_TO_CARD", "ONLINE"]),
  note: z.string().trim().max(250).optional(),
});

/**
 * Records a completed payment transaction for a student membership.
 */
export async function recordPayment(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();

  const parsed = recordPaymentSchema.safeParse({
    membershipId: formData.get("membershipId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    note: formData.get("note") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات پرداخت معتبر نیست.",
    };
  }

  const { membershipId, amount, method, note } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findFirst({
        where: { id: membershipId, studyHallId: user.studyhallId },
        select: {
          id: true,
          user: { select: { name: true } },
        },
      });

      if (!membership) {
        throw new Error("عضویت مورد نظر در این سالن یافت نشد.");
      }

      const payment = await tx.payment.create({
        data: {
          membershipId: membership.id,
          amount,
          method: method as PaymentMethod,
          status: "COMPLETED",
          paidAt: new Date(),
          createdById: user.id,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId: user.studyhallId,
          actorId: user.id,
          action: "CREATE",
          entityType: "PAYMENT",
          entityId: payment.id,
          metadata: {
            memberName: membership.user.name,
            amount,
            method,
            operatorName: user.name,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "ثبت پرداخت با شکست مواجه شد.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "پرداخت با موفقیت ثبت شد." };
}

const voidPaymentSchema = z.object({
  paymentId: z.string().cuid("شناسه پرداخت معتبر نیست."),
  voidReason: z.string().trim().min(3, "علت ابطال باید حداقل ۳ حرف باشد."),
});

/**
 * Voids an existing payment transaction for audit compliance.
 */
export async function voidPayment(
  paymentId: string,
  voidReason: string
): Promise<ActionResult> {
  const user = await requireScopedUser();

  const parsed = voidPaymentSchema.safeParse({ paymentId, voidReason });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات ابطال معتبر نیست.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: {
          id: parsed.data.paymentId,
          membership: { studyHallId: user.studyhallId },
          status: "COMPLETED",
        },
      });

      if (!payment) {
        throw new Error("پرداخت فعال قابل ابطال یافت نشد.");
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "VOIDED",
          voidedAt: new Date(),
          voidedById: user.id,
          voidReason: parsed.data.voidReason,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId: user.studyhallId,
          actorId: user.id,
          action: "VOID",
          entityType: "PAYMENT",
          entityId: payment.id,
          metadata: {
            amount: Number(payment.amount),
            voidReason: parsed.data.voidReason,
            operatorName: user.name,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "ابطال پرداخت با خطا مواجه شد.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "پرداخت با موفقیت باطل شد." };
}