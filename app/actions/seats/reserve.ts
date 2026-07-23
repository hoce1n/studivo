"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { isOccupyingAssignment } from "@/app/dashboard/_lib/dashboard-utils";
import type { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/client";

const START_DATE_MAX_PAST_DAYS = 30;

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

const reservationSchema = z
  .object({
    seatId: z.string().cuid({ message: "شناسه صندلی معتبر نیست." }),
    membershipPlanId: z.string().cuid({ message: "شناسه طرح عضویت معتبر نیست." }),
    memberName: z.string().trim().min(2, "نام دانش‌آموز باید حداقل ۲ حرف باشد."),
    phoneNumber: z.string().trim().min(10, "شماره تلفن معتبر نیست."),
    startsAt: z.coerce.date("تاریخ شروع معتبر نیست."),
    endsAt: z.coerce.date("تاریخ پایان معتبر نیست."),
    paymentMethod: z.enum(["CASH", "POS", "CARD_TO_CARD", "ONLINE"]),
    paymentStatus: z.enum(["COMPLETED", "PENDING"]),
    amount: z.coerce.number().positive("مبلغ باید بزرگتر از صفر باشد.").optional(),
    note: z.string().trim().max(250).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startsAt >= data.endsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "تاریخ شروع باید قبل از تاریخ پایان باشد.",
      });
    }

    const oldestAllowedStartDate = startOfDay(new Date());
    oldestAllowedStartDate.setDate(
      oldestAllowedStartDate.getDate() - START_DATE_MAX_PAST_DAYS
    );

    if (startOfDay(data.startsAt) < oldestAllowedStartDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: `تاریخ شروع نمی‌تواند بیشتر از ${START_DATE_MAX_PAST_DAYS} روز در گذشته باشد.`,
      });
    }
  });

/**
 * Creates Membership (+ optional SeatAssignment + Payment) for a study-hall member.
 * Plan fields are snapshotted onto Membership; Payment.createdById comes from session.
 */
export async function reserveSeat(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  const noteRaw = formData.get("note");
  const parsed = reservationSchema.safeParse({
    seatId: formData.get("seatId"),
    membershipPlanId: formData.get("membershipPlanId"),
    memberName: formData.get("memberName"),
    phoneNumber: formData.get("phoneNumber"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    paymentMethod: formData.get("paymentMethod") || "CASH",
    paymentStatus: formData.get("paymentStatus") || "COMPLETED",
    amount: formData.get("amount") || undefined,
    note:
      typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات رزرو صندلی معتبر نیست.",
    };
  }

  const {
    seatId,
    membershipPlanId,
    memberName,
    phoneNumber,
    startsAt,
    endsAt,
    paymentMethod,
    paymentStatus,
    amount,
    note,
  } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const seat = await tx.seat.findFirst({
        where: {
          id: seatId,
          section: { studyHallId },
        },
        select: {
          id: true,
          number: true,
          section: { select: { id: true, name: true } },
        },
      });

      if (!seat) {
        throw new Error("صندلی مورد نظر در این سالن مطالعه یافت نشد.");
      }

      const existingAssignments = await tx.seatAssignment.findMany({
        where: {
          seatId: seat.id,
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

      if (existingAssignments.some(isOccupyingAssignment)) {
        throw new Error("این صندلی در حال حاضر دارای رزرو فعال است.");
      }

      const plan = await tx.membershipPlan.findFirst({
        where: { id: membershipPlanId, studyHallId, isActive: true },
        select: {
          id: true,
          name: true,
          durationDays: true,
          price: true,
          hasFixedSeat: true,
        },
      });

      if (!plan) {
        throw new Error("طرح عضویت انتخاب‌شده معتبر نیست.");
      }

      const member = await tx.user.upsert({
        where: { phoneNumber },
        update: { name: memberName },
        create: {
          id: crypto.randomUUID(),
          name: memberName,
          email: `${phoneNumber}@studivo.local`,
          phoneNumber,
        },
        select: { id: true, name: true },
      });

      const existingActive = await tx.membership.findFirst({
        where: {
          studyHallId,
          userId: member.id,
          status: { in: ["ACTIVE", "PENDING"] },
        },
        select: {
          id: true,
          seatAssignments: {
            where: { endsAt: null },
            select: { seat: { select: { number: true } } },
            take: 1,
          },
        },
      });

      if (existingActive) {
        const occupiedSeat = existingActive.seatAssignments[0]?.seat.number;
        throw new Error(
          occupiedSeat
            ? `این شماره تلفن هم‌اکنون صندلی ${occupiedSeat} را در این سالن دارد.`
            : "این شماره تلفن هم‌اکنون یک اشتراک فعال در این سالن دارد."
        );
      }

      const membershipStatus =
        paymentStatus === "COMPLETED" ? "ACTIVE" : "PENDING";
      const paymentAmount = amount ?? Number(plan.price);

      const membership = await tx.membership.create({
        data: {
          userId: member.id,
          studyHallId,
          membershipPlanId: plan.id,
          status: membershipStatus,
          startsAt,
          endsAt,
          planName: plan.name,
          planDurationDays: plan.durationDays,
          planPrice: plan.price,
          hasFixedSeat: plan.hasFixedSeat,
          note,
        },
      });

      // Map flow always selects a seat; create open assignment (endsAt null).
      await tx.seatAssignment.create({
        data: {
          membershipId: membership.id,
          seatId: seat.id,
          startsAt,
          endsAt: null,
        },
      });

      const payment = await tx.payment.create({
        data: {
          membershipId: membership.id,
          amount: paymentAmount,
          method: paymentMethod as PaymentMethod,
          status: paymentStatus as PaymentStatus,
          paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
          createdById: user.id,
          note,
        },
      });

      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "CREATE",
          entityType: "MEMBERSHIP",
          entityId: membership.id,
          metadata: {
            operatorName: user.name,
            memberName: member.name,
            phoneNumber,
            sectionName: seat.section?.name ?? "بدون بخش",
            seatNumber: seat.number,
            planName: plan.name,
            planDurationDays: plan.durationDays,
            planPrice: Number(plan.price),
            hasFixedSeat: plan.hasFixedSeat,
            membershipStatus,
            paymentId: payment.id,
            paymentMethod,
            paymentStatus,
            paymentAmount,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "رزرو صندلی با شکست مواجه شد.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "رزرو صندلی با موفقیت انجام شد." };
}
