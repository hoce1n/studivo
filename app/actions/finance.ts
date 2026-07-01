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
  .refine((value) => value.startDate <= value.endDate, {
    message: "تاریخ شروع گزارش باید قبل از تاریخ پایان باشد.",
    path: ["startDate"],
  });

type RevenueTransaction = {
  id: string;
  monthlyFeeAtSubscription: number | null;
  paymentDate: Date | null;
  user: { name: string; phoneNumber: string | null };
  seat: { seatNumber: number };
};

type RevenueReport = {
  totalRevenue: number;
  transactions: RevenueTransaction[];
};

type OverduePayment = {
  id: string;
  startDate: Date;
  endDate: Date;
  monthlyFeeAtSubscription: number | null;
  user: { name: string; phoneNumber: string | null };
  seat: { seatNumber: number };
};

type OverduePaymentsReport = {
  totalOverdueAmount: number;
  overdueSubscriptions: OverduePayment[];
};

type OccupancyRevenueStats = {
  totalSeats: number;
  activeSubscriptions: number;
  paidActiveSubscriptions: number;
  unpaidActiveSubscriptions: number;
  occupancyRate: number;
  potentialMonthlyRevenue: number;
  currentMonthlyRevenue: number;
};

export async function fetchRevenueReport(startDate: Date, endDate: Date): Promise<ActionResult<RevenueReport>> {
  const user = await requireScopedUser();
  const parsed = dateRangeSchema.safeParse({ startDate, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بازه گزارش درآمد معتبر نیست." };
  }

  try {
    const transactions = await prisma.subscription.findMany({
      where: {
        studyhallId: user.studyhallId,
        paymentStatus: "paid",
        paymentDate: {
          gte: parsed.data.startDate,
          lte: parsed.data.endDate,
        },
      },
      select: {
        id: true,
        monthlyFeeAtSubscription: true,
        paymentDate: true,
        user: { select: { name: true, phoneNumber: true } },
        seat: { select: { seatNumber: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    return {
      success: true,
      data: {
        totalRevenue: transactions.reduce((sum: number, item: RevenueTransaction) => sum + (item.monthlyFeeAtSubscription ?? 0), 0),
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
    const overdueSubscriptions = await prisma.subscription.findMany({
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
      },
      orderBy: { endDate: "asc" },
    });

    return {
      success: true,
      data: {
        totalOverdueAmount: overdueSubscriptions.reduce((sum: number, item: OverduePayment) => sum + (item.monthlyFeeAtSubscription ?? 0), 0),
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
    const [activeSubscriptions, paidActiveSubscriptions] = await Promise.all([
      prisma.subscription.count({
        where: { studyhallId: user.studyhallId, status: "active", endDate: { gte: now } },
      }),
      prisma.subscription.count({
        where: { studyhallId: user.studyhallId, status: "active", paymentStatus: "paid", endDate: { gte: now } },
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
        potentialMonthlyRevenue: totalSeats * studyHall.monthlyFee,
        currentMonthlyRevenue: paidActiveSubscriptions * studyHall.monthlyFee,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت آمار اشغال و درآمد.");
  }
}
