"use server";

import { createHash } from "crypto";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireScopedUser } from "@/app/actions/auth";


type TransactionClient = Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$use" | "$extends">;

const subscriptionSchema = z.object({
  seatNumber: z.coerce.number().int().min(1),
  memberName: z.string().trim().min(2),
  phoneNumber: z.string().trim().min(7).max(32),
  endDate: z.coerce.date(),
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

export async function reserveSeat(formData: FormData): Promise<ActionResult> {
  const user = await requireScopedUser();
  const parsed = subscriptionSchema.safeParse({
    seatNumber: formData.get("seatNumber"),
    memberName: formData.get("memberName"),
    phoneNumber: formData.get("phoneNumber"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { success: false, error: "اطلاعات رزرو صندلی کامل یا معتبر نیست." };
  }

  const now = new Date();
  if (parsed.data.endDate <= now) {
    return { success: false, error: "تاریخ پایان باید بعد از امروز باشد." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const seat = await tx.seat.findFirst({
        where: { studyhallId: user.studyhallId, seatNumber: parsed.data.seatNumber },
        select: { id: true },
      });

      if (!seat) {
        throw new Error("این صندلی در سالن شما وجود ندارد.");
      }

      const activeSubscription = await tx.subscription.findFirst({
        where: { studyhallId: user.studyhallId, seatId: seat.id, status: "active" },
        select: { id: true },
      });

      if (activeSubscription) {
        throw new Error("برای این صندلی هنوز اشتراک فعال ثبت شده است.");
      }

      const memberActiveSubscription = await tx.subscription.findFirst({
        where: {
          studyhallId: user.studyhallId,
          status: "active",
          user: { phoneNumber: parsed.data.phoneNumber },
        },
        select: { id: true },
      });

      if (memberActiveSubscription) {
        throw new Error("دانش آموزی با این شماره تلفن در حال حاضر یک اشتراک فعال در این سالن دارد.");
      }

      const member = await tx.user.upsert({
        where: {
          studyhallId_phoneNumber: {
            studyhallId: user.studyhallId,
            phoneNumber: parsed.data.phoneNumber,
          },
        },
        update: { name: parsed.data.memberName, role: "member" },
        create: {
          id: crypto.randomUUID(),
          name: parsed.data.memberName,
          email: localMemberEmail(parsed.data.phoneNumber, user.studyhallId),
          phoneNumber: parsed.data.phoneNumber,
          role: "member",
          studyhallId: user.studyhallId,
          emailVerified: false,
        },
        select: { id: true, name: true, phoneNumber: true },
      });

      const createdSubscription = await tx.subscription.create({
        data: {
          userId: member.id,
          seatId: seat.id,
          studyhallId: user.studyhallId,
          startDate: now,
          endDate: parsed.data.endDate,
          status: "active",
        },
        include: { seat: { select: { seatNumber: true } } },
      });

      await tx.auditLog.create({
        data: {
          studyhallId: user.studyhallId,
          userId: user.id,
          action: "RESERVE_SEAT",
          details: {
            operatorName: user.name,
            memberName: member.name,
            phoneNumber: member.phoneNumber,
            seatNumber: createdSubscription.seat.seatNumber,
            endDate: parsed.data.endDate.toISOString(),
            message: `${user.name} صندلی ${createdSubscription.seat.seatNumber} را برای ${member.name} رزرو کرد.`,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "رزرو صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "رزرو صندلی با موفقیت ثبت شد." };
}

export async function releaseSeat(subscriptionId: string): Promise<ActionResult> {
  const user = await requireScopedUser();
  const parsed = releaseSeatSchema.safeParse({ subscriptionId });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "شناسه اشتراک معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const current = await tx.subscription.findFirst({
        where: { id: parsed.data.subscriptionId, studyhallId: user.studyhallId, status: "active" },
        select: { id: true, user: { select: { name: true } }, seat: { select: { seatNumber: true } } },
      });

      if (!current) {
        throw new Error("اشتراک فعالی برای تخلیه پیدا نشد.");
      }

      await tx.subscription.update({ where: { id: current.id }, data: { status: "cancelled" } });
      await tx.auditLog.create({
        data: {
          studyhallId: user.studyhallId,
          userId: user.id,
          action: "RELEASE_SEAT",
          details: {
            operatorName: user.name,
            memberName: current.user.name,
            seatNumber: current.seat.seatNumber,
            message: `${user.name} صندلی ${current.seat.seatNumber} را از ${current.user.name} تخلیه کرد.`,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "تخلیه صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "صندلی با موفقیت تخلیه شد." };
}

export async function swapSeat(subscriptionId: string, newSeatNumber: number): Promise<ActionResult> {
  const user = await requireScopedUser();
  const parsed = swapSeatSchema.safeParse({ subscriptionId, newSeatNumber });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "اطلاعات جابه‌جایی صندلی معتبر نیست." };
  }

  try {
    await prisma.$transaction(async (tx: TransactionClient) => {
      const targetSeat = await tx.seat.findFirst({
        where: { studyhallId: user.studyhallId, seatNumber: parsed.data.newSeatNumber },
        select: { id: true },
      });

      if (!targetSeat) {
        throw new Error(`صندلی شماره ${parsed.data.newSeatNumber} در این سالن مطالعه تعریف نشده است.`);
      }

      const activeSubOnTarget = await tx.subscription.findFirst({
        where: { studyhallId: user.studyhallId, seatId: targetSeat.id, status: "active" },
        select: { id: true },
      });

      if (activeSubOnTarget) {
        throw new Error(`صندلی شماره ${parsed.data.newSeatNumber} در حال حاضر توسط دانش‌آموز دیگری رزرو شده است.`);
      }

      const currentSubscription = await tx.subscription.findFirst({
        where: { id: parsed.data.subscriptionId, studyhallId: user.studyhallId, status: "active" },
        select: { id: true, seatId: true, user: { select: { name: true } }, seat: { select: { seatNumber: true } } },
      });

      if (!currentSubscription) {
        throw new Error("اشتراک فعال معتبری برای این جابه‌جایی پیدا نشد.");
      }

      if (currentSubscription.seatId === targetSeat.id) {
        throw new Error("دانش‌آموز در حال حاضر روی همین صندلی مستقر است.");
      }

      await tx.subscription.update({ where: { id: currentSubscription.id }, data: { seatId: targetSeat.id } });
      await tx.auditLog.create({
        data: {
          studyhallId: user.studyhallId,
          userId: user.id,
          action: "SWAP_SEAT",
          details: {
            operatorName: user.name,
            memberName: currentSubscription.user.name,
            fromSeatNumber: currentSubscription.seat.seatNumber,
            toSeatNumber: parsed.data.newSeatNumber,
            message: `${user.name} ${currentSubscription.user.name} را از صندلی ${currentSubscription.seat.seatNumber} به صندلی ${parsed.data.newSeatNumber} منتقل کرد.`,
          },
        },
      });
    });
  } catch (error) {
    return actionError(error, "جابجایی صندلی ناموفق بود.");
  }

  revalidateOperationalPaths();
  return { success: true, message: "دانش‌آموز با موفقیت به صندلی جدید منتقل شد." };
}
