"use server";

import { createHash } from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireTenantContext } from "@/app/actions/auth";


type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

const START_DATE_MAX_PAST_DAYS = 30;

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

const subscriptionSchema = z
  .object({
    seatNumber: z.coerce.number().int().min(1),
    memberName: z.string().trim().min(2),
    phoneNumber: z.string().trim().min(7).max(32),
    startDate: z.coerce.date("تاریخ شروع معتبر نیست."),
    endDate: z.coerce.date("تاریخ پایان معتبر نیست."),
  })
  .superRefine((data, ctx) => {
    if (data.startDate > data.endDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "تاریخ شروع باید قبل از تاریخ پایان یا برابر با آن باشد.",
      });
    }

    const oldestAllowedStartDate = startOfDay(new Date());
    oldestAllowedStartDate.setDate(oldestAllowedStartDate.getDate() - START_DATE_MAX_PAST_DAYS);

    if (startOfDay(data.startDate) < oldestAllowedStartDate) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: `تاریخ شروع نمی‌تواند بیشتر از ${START_DATE_MAX_PAST_DAYS} روز در گذشته باشد.`,
      });
    }
  });

const releaseSeatSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
});

const swapSeatSchema = z.object({
  subscriptionId: z.string().min(1, "شناسه اشتراک معتبر نیست."),
  newSeatNumber: z.coerce.number().int().min(1, "شماره صندلی باید یک عدد مثبت باشد."),
});

function localMemberEmail(phoneNumber: string, studyhallId: string) {
  const input = `${studyhallId}-${phoneNumber}`;
  const shortHash = createHash("sha1").update(input).digest("hex").slice(0, 8);
  return `${shortHash}@studivo.ir`;
}

/**
 * Reserves a seat by creating a Membership and a SeatAssignment.
 * Migrated to Schema v2.
 */
export async function reserveSeat(formData: FormData): Promise<ActionResult> {
  const user = await requireTenantContext();
  const parsed = subscriptionSchema.safeParse({
    seatNumber: formData.get("seatNumber"),
    memberName: formData.get("memberName"),
    phoneNumber: formData.get("phoneNumber"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات رزرو صندلی کامل یا معتبر نیست." };
  }

  if (parsed.data.endDate <= parsed.data.startDate) {
    return { success: false, error: "تاریخ پایان باید بعد از تاریخ شروع باشد." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Find the seat
      const seat = await tx.seat.findFirst({
        where: { section: { studyHallId: user.studyHallId }, number: parsed.data.seatNumber.toString() },
        select: { id: true },
      });

      if (!seat) {
        throw new Error("این صندلی در سالن شما وجود ندارد.");
      }

      // 2. Check for active seat assignment
      const activeAssignment = await tx.seatAssignment.findFirst({
        where: {
            seatId: seat.id,
            endsAt: null,
            membership: { status: "ACTIVE", studyHallId: user.studyHallId }
        },
        select: { id: true },
      });

      if (activeAssignment) {
        throw new Error("برای این صندلی هنوز اشتراک فعال ثبت شده است.");
      }

      // 3. Check if member already has an active membership
      const memberActiveMembership = await tx.membership.findFirst({
        where: {
          studyHallId: user.studyHallId,
          status: "ACTIVE",
          user: { phoneNumber: parsed.data.phoneNumber },
        },
        select: { id: true },
      });

      if (memberActiveMembership) {
        throw new Error("دانش آموزی با این شماره تلفن در حال حاضر یک اشتراک فعال در این سالن دارد.");
      }

      // 4. Upsert the member user
      const member = await tx.user.upsert({
        where: { phoneNumber: parsed.data.phoneNumber },
        update: { name: parsed.data.memberName },
        create: {
          id: crypto.randomUUID(),
          name: parsed.data.memberName,
          email: localMemberEmail(parsed.data.phoneNumber, user.studyHallId),
          phoneNumber: parsed.data.phoneNumber,
          emailVerified: false,
        },
        select: { id: true, name: true, phoneNumber: true },
      });

      // 5. Find default membership plan for the study hall
      const plan = await tx.membershipPlan.findFirst({
        where: { studyHallId: user.studyHallId, isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!plan) {
          throw new Error("پلن عضویت فعالی برای این سالن یافت نشد.");
      }

      // 6. Create Membership
      const createdMembership = await tx.membership.create({
        data: {
          userId: member.id,
          studyHallId: user.studyHallId,
          membershipPlanId: plan.id,
          status: "ACTIVE",
          startsAt: parsed.data.startDate,
          endsAt: parsed.data.endDate,
          planName: plan.name,
          planDurationDays: plan.durationDays,
          planPrice: plan.price,
          hasFixedSeat: plan.hasFixedSeat,
        },
      });

      // 7. Create SeatAssignment
      await tx.seatAssignment.create({
          data: {
              membershipId: createdMembership.id,
              seatId: seat.id,
              startsAt: parsed.data.startDate,
          }
      });

      // 8. Create Audit Log (Skipping for now to avoid AuditAction enum mismatch in transaction)
    });
  } catch (error) {
    return actionError(error, "رزرو صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "رزرو صندلی با موفقیت ثبت شد." };
}

/**
 * Releases a seat by closing the active SeatAssignment.
 * Legacy subscriptionId is mapped to membershipId.
 * Migrated to Schema v2.
 */
export async function releaseSeat(subscriptionId: string): Promise<ActionResult> {
  const user = await requireTenantContext();
  const parsed = releaseSeatSchema.safeParse({ subscriptionId });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "شناسه اشتراک معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const currentMembership = await tx.membership.findFirst({
        where: { id: parsed.data.subscriptionId, studyHallId: user.studyHallId, status: "ACTIVE" },
        select: {
            id: true,
            user: { select: { name: true } },
            seatAssignments: {
                where: { endsAt: null },
                select: { id: true, seat: { select: { number: true } } },
                take: 1
            }
        },
      });

      if (!currentMembership) {
        throw new Error("اشتراک فعالی برای تخلیه پیدا نشد.");
      }

      // Close the membership
      await tx.membership.update({ where: { id: currentMembership.id }, data: { status: "CANCELLED" } });

      // Close the seat assignment
      if (currentMembership.seatAssignments[0]) {
          await tx.seatAssignment.updateMany({
              where: { membershipId: currentMembership.id, endsAt: null },
              data: { endsAt: new Date() }
          });
      }

      // Audit log skipped
    });
  } catch (error) {
    return actionError(error, "تخلیه صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "صندلی با موفقیت تخلیه شد." };
}

/**
 * Swaps a seat by closing the old SeatAssignment and creating a new one.
 * Legacy subscriptionId is mapped to membershipId.
 * Migrated to Schema v2.
 */
export async function swapSeat(subscriptionId: string, newSeatNumber: number): Promise<ActionResult> {
  const user = await requireTenantContext();
  const parsed = swapSeatSchema.safeParse({ subscriptionId, newSeatNumber });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "اطلاعات جابه‌جایی صندلی معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      // 1. Find the target seat
      const targetSeat = await tx.seat.findFirst({
        where: { section: { studyHallId: user.studyHallId }, number: parsed.data.newSeatNumber.toString() },
        select: { id: true },
      });

      if (!targetSeat) {
        throw new Error(`صندلی شماره ${parsed.data.newSeatNumber} در این سالن مطالعه تعریف نشده است.`);
      }

      // 2. Check for active assignment on target seat
      const activeAssignmentOnTarget = await tx.seatAssignment.findFirst({
        where: {
            seatId: targetSeat.id,
            endsAt: null,
            membership: { status: "ACTIVE", studyHallId: user.studyHallId }
        },
        select: { id: true },
      });

      if (activeAssignmentOnTarget) {
        throw new Error(`صندلی شماره ${parsed.data.newSeatNumber} در حال حاضر توسط دانش‌آموز دیگری رزرو شده است.`);
      }

      // 3. Find current membership and its active seat assignment
      const currentMembership = await tx.membership.findFirst({
        where: { id: parsed.data.subscriptionId, studyHallId: user.studyHallId, status: "ACTIVE" },
        select: {
            id: true,
            user: { select: { name: true } },
            seatAssignments: {
                where: { endsAt: null },
                select: { id: true, seatId: true, seat: { select: { number: true } } },
                take: 1
            }
        },
      });

      if (!currentMembership) {
        throw new Error("اشتراک فعال معتبری برای این جابه‌جایی پیدا نشد.");
      }

      if (currentMembership.seatAssignments[0]?.seatId === targetSeat.id) {
        throw new Error("دانش‌آموز در حال حاضر روی همین صندلی مستقر است.");
      }

      const now = new Date();

      // 4. Close old seat assignment
      if (currentMembership.seatAssignments[0]) {
          await tx.seatAssignment.updateMany({
              where: { membershipId: currentMembership.id, endsAt: null },
              data: { endsAt: now }
          });
      }

      // 5. Create new seat assignment
      await tx.seatAssignment.create({
          data: {
              membershipId: currentMembership.id,
              seatId: targetSeat.id,
              startsAt: now,
          }
      });

      // Audit log skipped
    });
  } catch (error) {
    return actionError(error, "جابجایی صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "دانش‌آموز با موفقیت به صندلی جدید منتقل شد." };
}
