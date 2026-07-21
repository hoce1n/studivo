"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireScopedUser } from "@/app/actions/auth/verify-role";

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
    startsAt: z.coerce.date({ invalid_type_error: "تاریخ شروع معتبر نیست." }),
    endsAt: z.coerce.date({ invalid_type_error: "تاریخ پایان معتبر نیست." }),
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
    oldestAllowedStartDate.setDate(oldestAllowedStartDate.getDate() - START_DATE_MAX_PAST_DAYS);

    if (startOfDay(data.startsAt) < oldestAllowedStartDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: `تاریخ شروع نمی‌تواند بیشتر از ${START_DATE_MAX_PAST_DAYS} روز در گذشته باشد.`,
      });
    }
  });

/**
 * Reserves a seat for a user by creating a User (if not exists), Membership, and SeatAssignment.
 */
export async function reserveSeat(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  const parsed = reservationSchema.safeParse({
    seatId: formData.get("seatId"),
    membershipPlanId: formData.get("membershipPlanId"),
    memberName: formData.get("memberName"),
    phoneNumber: formData.get("phoneNumber"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات رزرو صندلی معتبر نیست.",
    };
  }

  const { seatId, membershipPlanId, memberName, phoneNumber, startsAt, endsAt } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Validate seat belongs to user's study hall
      const seat = await tx.seat.findFirst({
        where: {
          id: seatId,
          section: { studyHallId },
        },
        select: { id: true, number: true },
      });

      if (!seat) {
        throw new Error("صندلی مورد نظر در این سالن مطالعه یافت نشد.");
      }

      // 2. Check active seat assignment overlap
      const activeAssignment = await tx.seatAssignment.findFirst({
        where: {
          seatId: seat.id,
          endsAt: null,
        },
      });

      if (activeAssignment) {
        throw new Error("این صندلی در حال حاضر دارای رزرو فعال است.");
      }

      // 3. Validate Plan
      const plan = await tx.membershipPlan.findFirst({
        where: { id: membershipPlanId, studyHallId },
        select: { id: true, name: true, durationDays: true, price: true },
      });

      if (!plan) {
        throw new Error("طرح عضویت انتخاب‌شده معتبر نیست.");
      }

      // 4. Upsert User by Unique Phone Number
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

      // 5. Create Membership
      const membership = await tx.membership.create({
        data: {
          userId: member.id,
          studyHallId,
          membershipPlanId: plan.id,
          status: "ACTIVE",
          startsAt,
          endsAt,
          planName: plan.name,
          planDurationDays: plan.durationDays,
          planPrice: plan.price,
          hasFixedSeat: true,
        },
      });

      // 6. Assign Seat
      await tx.seatAssignment.create({
        data: {
          membershipId: membership.id,
          seatId: seat.id,
          startsAt,
        },
      });

      // 7. Audit Log
      await tx.auditLog.create({
        data: {
          studyHallId,
          actorId: user.id,
          action: "CREATE",
          entityType: "SEAT_ASSIGNMENT",
          entityId: seat.id,
          metadata: {
            operatorName: user.name,
            memberName: member.name,
            phoneNumber,
            seatNumber: seat.number,
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