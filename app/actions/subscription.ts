"use server";

import { z } from "zod";

import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireScopedUser } from "@/app/actions/auth";


type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

const renewSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  endDate: z.coerce.date(),
});

function calculateDaysDifference(newEndDate: Date, currentEndDate: Date) {
  return Math.ceil((newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24));
}

export async function renewSubscription(subscriptionId: string, endDate: string): Promise<ActionResult<{ isRealRenewal: boolean; daysDifference: number }>> {
  const user = await requireScopedUser();
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
      const current = await tx.subscription.findFirst({
        where: { id: parsed.data.subscriptionId, studyhallId: user.studyhallId, status: "active" },
        select: {
          id: true,
          userId: true,
          seatId: true,
          endDate: true,
          paymentStatus: true,
          user: { select: { name: true } },
          seat: { select: { seatNumber: true } },
        },
      });

      if (!current) {
        throw new Error("اشتراک فعالی برای تمدید پیدا نشد.");
      }

      const daysDifference = calculateDaysDifference(newEndDate, current.endDate);
      const isRealRenewal = daysDifference > 7;

      if (isRealRenewal) {
        const activeSeatCollision = await tx.subscription.findFirst({
          where: {
            studyhallId: user.studyhallId,
            seatId: current.seatId,
            status: "active",
            NOT: { id: current.id },
          },
          select: { id: true },
        });

        if (activeSeatCollision) {
          throw new Error("برای این صندلی اشتراک فعال دیگری ثبت شده است.");
        }

        await tx.subscription.update({ where: { id: current.id }, data: { status: "expired" } });
        await tx.subscription.create({
          data: {
            userId: current.userId,
            seatId: current.seatId,
            studyhallId: user.studyhallId,
            startDate: now,
            endDate: newEndDate,
            paymentStatus: current.paymentStatus,
            status: "active",
          },
        });
      } else {
        await tx.subscription.update({ where: { id: current.id }, data: { endDate: newEndDate } });
      }

      await tx.auditLog.create({
        data: {
          studyhallId: user.studyhallId,
          userId: user.id,
          action: "RENEW_SUBSCRIPTION",
          details: {
            operatorName: user.name,
            memberName: current.user.name,
            seatNumber: current.seat.seatNumber,
            oldEndDate: current.endDate.toISOString(),
            newEndDate: newEndDate.toISOString(),
            daysDifference,
            isRealRenewal,
            message: isRealRenewal
              ? `${user.name} اشتراک صندلی ${current.seat.seatNumber} را برای ${current.user.name} تمدید واقعی کرد و تاریخ پایان را ${daysDifference} روز جلو برد.`
              : `${user.name} تاریخ پایان اشتراک صندلی ${current.seat.seatNumber} را برای ${current.user.name} اصلاح کرد (${daysDifference > 0 ? "+" : ""}${daysDifference} روز).`,
          },
        },
      });

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
