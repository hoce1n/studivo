"use server";

import { z } from "zod";

import { requireScopedUser } from "@/app/actions/auth";
import { actionError, type ActionResult } from "@/app/actions/audit";
import { prisma } from "@/lib/db";

const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((value) => !Number.isNaN(value.startDate.getTime()) && !Number.isNaN(value.endDate.getTime()), {
    message: "بازه تاریخ گزارش معتبر نیست.",
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "تاریخ شروع گزارش باید قبل از تاریخ پایان باشد.",
    path: ["startDate"],
  });

export type RevenueTransaction = {
  id: string;
  amount: number;
  paymentDate: Date | null;
  fallbackDate: Date;
  user: { name: string; phoneNumber: string | null };
  seat: { seatNumber: number };
};

export type RevenueReport = {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  transactions: RevenueTransaction[];
};

export type OverduePayment = {
  id: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  user: { name: string; phoneNumber: string | null };
  seat: { seatNumber: number };
};

export type OverduePaymentsReport = {
  totalOverdueAmount: number;
  overdueSubscriptions: OverduePayment[];
};

export type OccupancyRevenueStats = {
  totalSeats: number;
  activeSubscriptions: number;
  paidActiveSubscriptions: number;
  unpaidActiveSubscriptions: number;
  occupancyRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeRevenue: number;
  potentialMonthlyRevenue: number;
};

type SubscriptionMoneyRow = {
  id: string;
  monthlyFeeAtSubscription: number | null;
  paymentDate: Date | null;
  updatedAt: Date;
  user: { name: string; phoneNumber: string | null };
  seat: { seatNumber: number };
  studyhall: { monthlyFee: number };
};

type OverdueSubscriptionRow = {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyFeeAtSubscription: number | null;
  user: { name: string; phoneNumber: string | null };
  seat: { seatNumber: number };
  studyhall: { monthlyFee: number };
};

function amountFor(row: { monthlyFeeAtSubscription: number | null; studyhall: { monthlyFee: number } }) {
  return row.monthlyFeeAtSubscription ?? row.studyhall.monthlyFee ?? 0;
}

function inclusiveEndOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export async function fetchRevenueReport(startDate: Date, endDate: Date): Promise<ActionResult<RevenueReport>> {
  const user = await requireScopedUser();
  const parsed = dateRangeSchema.safeParse({ startDate, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بازه گزارش درآمد معتبر نیست." };
  }

  const rangeStart = parsed.data.startDate;
  const rangeEnd = inclusiveEndOfDay(parsed.data.endDate);

  try {
    const rows = (await prisma.subscription.findMany({
      where: {
        studyhallId: user.studyhallId,
        paymentStatus: "paid",
        OR: [
          { paymentDate: { gte: rangeStart, lte: rangeEnd } },
          { paymentDate: null, updatedAt: { gte: rangeStart, lte: rangeEnd } },
        ],
      },
      select: {
        id: true,
        monthlyFeeAtSubscription: true,
        paymentDate: true,
        updatedAt: true,
        user: { select: { name: true, phoneNumber: true } },
        seat: { select: { seatNumber: true } },
        studyhall: { select: { monthlyFee: true } },
      },
      orderBy: [{ paymentDate: "desc" }, { updatedAt: "desc" }],
    })) as SubscriptionMoneyRow[];

    const transactions = rows.map((row) => ({
      id: row.id,
      amount: amountFor(row),
      paymentDate: row.paymentDate,
      fallbackDate: row.updatedAt,
      user: row.user,
      seat: row.seat,
    }));

    return {
      success: true,
      data: {
        startDate: rangeStart,
        endDate: rangeEnd,
        totalRevenue: transactions.reduce((sum, item) => sum + item.amount, 0),
        transactions,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت گزارش درآمد.");
  }
}

export async function fetchOverduePayments(): Promise<ActionResult<OverduePaymentsReport>> {
  const user = await requireScopedUser();

  try {
    const rows = (await prisma.subscription.findMany({
      where: {
        studyhallId: user.studyhallId,
        paymentStatus: "unpaid",
        status: "active",
        endDate: { lt: new Date() },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        monthlyFeeAtSubscription: true,
        user: { select: { name: true, phoneNumber: true } },
        seat: { select: { seatNumber: true } },
        studyhall: { select: { monthlyFee: true } },
      },
      orderBy: { endDate: "asc" },
    })) as OverdueSubscriptionRow[];

    const overdueSubscriptions = rows.map((row) => ({
      id: row.id,
      startDate: row.startDate,
      endDate: row.endDate,
      amount: amountFor(row),
      user: row.user,
      seat: row.seat,
    }));

    return {
      success: true,
      data: {
        totalOverdueAmount: overdueSubscriptions.reduce((sum, item) => sum + item.amount, 0),
        overdueSubscriptions,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت پرداخت‌های معوقه.");
  }
}

export async function fetchOccupancyRevenueStats(): Promise<ActionResult<OccupancyRevenueStats>> {
  const user = await requireScopedUser();

  try {
    const studyHall = await prisma.studyHall.findFirst({
      where: { id: user.studyhallId },
      select: { totalSeats: true, monthlyFee: true },
    });

    if (!studyHall) {
      return { success: false, error: "سالن مطالعه یافت نشد." };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [activeSubscriptions, paidActiveSubscriptions, paidRows, monthlyPaidRows, activePaidRows] = await Promise.all([
      prisma.subscription.count({
        where: { studyhallId: user.studyhallId, status: "active", endDate: { gte: now } },
      }),
      prisma.subscription.count({
        where: { studyhallId: user.studyhallId, status: "active", paymentStatus: "paid", endDate: { gte: now } },
      }),
      prisma.subscription.findMany({
        where: { studyhallId: user.studyhallId, paymentStatus: "paid" },
        select: { monthlyFeeAtSubscription: true, studyhall: { select: { monthlyFee: true } } },
      }),
      prisma.subscription.findMany({
        where: {
          studyhallId: user.studyhallId,
          paymentStatus: "paid",
          OR: [
            { paymentDate: { gte: monthStart, lte: now } },
            { paymentDate: null, updatedAt: { gte: monthStart, lte: now } },
          ],
        },
        select: { monthlyFeeAtSubscription: true, studyhall: { select: { monthlyFee: true } } },
      }),
      prisma.subscription.findMany({
        where: { studyhallId: user.studyhallId, status: "active", paymentStatus: "paid", endDate: { gte: now } },
        select: { monthlyFeeAtSubscription: true, studyhall: { select: { monthlyFee: true } } },
      }),
    ]);

    const totalSeats = studyHall.totalSeats;
    const occupancyRate = totalSeats ? Math.round((activeSubscriptions / totalSeats) * 100) : 0;

    return {
      success: true,
      data: {
        totalSeats,
        activeSubscriptions,
        paidActiveSubscriptions,
        unpaidActiveSubscriptions: activeSubscriptions - paidActiveSubscriptions,
        occupancyRate,
        totalRevenue: (paidRows as Array<{ monthlyFeeAtSubscription: number | null; studyhall: { monthlyFee: number } }>).reduce((sum, row) => sum + amountFor(row), 0),
        monthlyRevenue: (monthlyPaidRows as Array<{ monthlyFeeAtSubscription: number | null; studyhall: { monthlyFee: number } }>).reduce((sum, row) => sum + amountFor(row), 0),
        activeRevenue: (activePaidRows as Array<{ monthlyFeeAtSubscription: number | null; studyhall: { monthlyFee: number } }>).reduce((sum, row) => sum + amountFor(row), 0),
        potentialMonthlyRevenue: totalSeats * studyHall.monthlyFee,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت آمار اشغال و درآمد.");
  }
}
