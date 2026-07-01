"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError, revalidateOperationalPaths } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireScopedUser } from "@/app/actions/auth";

// ---------------------------------------------------------------------------
// Schema for date range validation
// ---------------------------------------------------------------------------
const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// ---------------------------------------------------------------------------
// fetchRevenueReport
// Fetches revenue data for a given date range.
// ---------------------------------------------------------------------------
export async function fetchRevenueReport(startDate: Date, endDate: Date): Promise<ActionResult<any>> {
  const user = await requireScopedUser();
  const parsed = dateRangeSchema.safeParse({ startDate, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "تاریخ‌های گزارش معتبر نیستند." };
  }

  try {
    const revenueData = await prisma.subscription.findMany({
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
        user: { select: { name: true } },
        seat: { select: { seatNumber: true } },
      },
      orderBy: { paymentDate: "asc" },
    });

    const totalRevenue = revenueData.reduce((sum, sub) => sum + (sub.monthlyFeeAtSubscription || 0), 0);

    return {
      success: true,
      data: {
        totalRevenue,
        transactions: revenueData,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت گزارش درآمد.");
  }
}

// ---------------------------------------------------------------------------
// fetchOverduePayments
// Fetches subscriptions with unpaid status that are past their end date.
// ---------------------------------------------------------------------------
export async function fetchOverduePayments(): Promise<ActionResult<any>> {
  const user = await requireScopedUser();

  try {
    const overdueSubscriptions = await prisma.subscription.findMany({
      where: {
        studyhallId: user.studyhallId,
        paymentStatus: "unpaid",
        endDate: { lt: new Date() }, // Subscriptions that have ended and are unpaid
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

    const totalOverdueAmount = overdueSubscriptions.reduce((sum, sub) => sum + (sub.monthlyFeeAtSubscription || 0), 0);

    return {
      success: true,
      data: {
        totalOverdueAmount,
        overdueSubscriptions,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت لیست پرداخت‌های معوقه.");
  }
}

// ---------------------------------------------------------------------------
// fetchOccupancyRevenueStats
// Fetches current occupancy and potential revenue stats.
// ---------------------------------------------------------------------------
export async function fetchOccupancyRevenueStats(): Promise<ActionResult<any>> {
  const user = await requireScopedUser();

  try {
    const studyHall = await prisma.studyHall.findUnique({
      where: { id: user.studyhallId },
      select: { totalSeats: true, monthlyFee: true },
    });

    if (!studyHall) {
      return { success: false, error: "سالن مطالعه یافت نشد." };
    }

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        studyhallId: user.studyhallId,
        status: "active",
        endDate: { gte: new Date() },
      },
    });

    const paidActiveSubscriptions = await prisma.subscription.count({
      where: {
        studyhallId: user.studyhallId,
        status: "active",
        paymentStatus: "paid",
        endDate: { gte: new Date() },
      },
    });

    const unpaidActiveSubscriptions = activeSubscriptions - paidActiveSubscriptions;

    const occupancyRate = (activeSubscriptions / studyHall.totalSeats) * 100;
    const potentialMonthlyRevenue = studyHall.totalSeats * studyHall.monthlyFee;
    const currentMonthlyRevenue = paidActiveSubscriptions * studyHall.monthlyFee;

    return {
      success: true,
      data: {
        totalSeats: studyHall.totalSeats,
        activeSubscriptions,
        paidActiveSubscriptions,
        unpaidActiveSubscriptions,
        occupancyRate: parseFloat(occupancyRate.toFixed(2)),
        potentialMonthlyRevenue,
        currentMonthlyRevenue,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت آمار اشغال و درآمد.");
  }
}
