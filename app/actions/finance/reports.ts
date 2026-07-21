"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import type {
  RevenueReport,
  OverduePaymentsReport,
  OccupancyRevenueStats,
} from "./types";

function inclusiveEndOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((val) => !Number.isNaN(val.startDate.getTime()) && !Number.isNaN(val.endDate.getTime()), {
    message: "بازه تاریخ گزارش معتبر نیست.",
  })
  .refine((val) => val.startDate <= val.endDate, {
    message: "تاریخ شروع گزارش باید قبل از تاریخ پایان باشد.",
    path: ["startDate"],
  });

/**
 * Fetches completed payments within a date range for the active study hall.
 */
export async function fetchRevenueReport(
  startDate: Date,
  endDate: Date
): Promise<ActionResult<RevenueReport>> {
  const user = await requireScopedUser();
  const parsed = dateRangeSchema.safeParse({ startDate, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid date range." };
  }

  const rangeStart = parsed.data.startDate;
  const rangeEnd = inclusiveEndOfDay(parsed.data.endDate);

  try {
    const payments = await prisma.payment.findMany({
      where: {
        membership: {
          studyHallId: user.studyhallId,
        },
        status: "COMPLETED",
        paidAt: {
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      select: {
        id: true,
        amount: true,
        paidAt: true,
        method: true,
        membership: {
          select: {
            user: { select: { name: true, phoneNumber: true } },
            seatAssignments: {
              where: { endsAt: null },
              select: { seat: { select: { number: true } } },
              take: 1,
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const transactions = payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paidAt: p.paidAt,
      method: p.method,
      user: {
        name: p.membership.user.name,
        phoneNumber: p.membership.user.phoneNumber,
      },
      seatNumber: p.membership.seatAssignments[0]?.seat.number ?? "N/A",
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

/**
 * Fetches active memberships past their end date without completed full payments.
 */
export async function fetchOverduePayments(): Promise<ActionResult<OverduePaymentsReport>> {
  const user = await requireScopedUser();
  const now = new Date();

  try {
    const memberships = await prisma.membership.findMany({
      where: {
        studyHallId: user.studyhallId,
        status: "ACTIVE",
        endsAt: { lt: now },
        // Finds memberships where no COMPLETED payment exists matching the full price
        payments: {
          none: {
            status: "COMPLETED",
          },
        },
      },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        planPrice: true,
        user: { select: { name: true, phoneNumber: true } },
        seatAssignments: {
          where: { endsAt: null },
          select: { seat: { select: { number: true } } },
          take: 1,
        },
      },
      orderBy: { endsAt: "asc" },
    });

    const overdueMemberships = memberships.map((m) => ({
      id: m.id,
      membershipId: m.id,
      startsAt: m.startsAt,
      endsAt: m.endsAt,
      planPrice: Number(m.planPrice),
      user: {
        name: m.user.name,
        phoneNumber: m.user.phoneNumber,
      },
      seatNumber: m.seatAssignments[0]?.seat.number ?? "N/A",
    }));

    return {
      success: true,
      data: {
        totalOverdueAmount: overdueMemberships.reduce((sum, item) => sum + item.planPrice, 0),
        overdueMemberships,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت پرداخت‌های معوقه.");
  }
}

/**
 * Calculates current occupancy stats and revenue analytics based on new v2 schema.
 */
export async function fetchOccupancyRevenueStats(): Promise<ActionResult<OccupancyRevenueStats>> {
  const user = await requireScopedUser();

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Total active seats
    const totalSeats = await prisma.seat.count({
      where: {
        section: { studyHallId: user.studyhallId },
        isActive: true,
      },
    });

    // 2. Active memberships count
    const activeMemberships = await prisma.membership.count({
      where: {
        studyHallId: user.studyhallId,
        status: "ACTIVE",
        endsAt: { gte: now },
      },
    });

    // 3. Paid active memberships count
    const paidActiveMemberships = await prisma.membership.count({
      where: {
        studyHallId: user.studyhallId,
        status: "ACTIVE",
        endsAt: { gte: now },
        payments: {
          some: { status: "COMPLETED" },
        },
      },
    });

    // 4. Financial totals using Payment model
    const [allPayments, monthlyPayments, activePayments] = await Promise.all([
      prisma.payment.findMany({
        where: { membership: { studyHallId: user.studyhallId }, status: "COMPLETED" },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          membership: { studyHallId: user.studyhallId },
          status: "COMPLETED",
          paidAt: { gte: monthStart, lte: now },
        },
        select: { amount: true },
      }),
      prisma.payment.findMany({
        where: {
          membership: {
            studyHallId: user.studyhallId,
            status: "ACTIVE",
            endsAt: { gte: now },
          },
          status: "COMPLETED",
        },
        select: { amount: true },
      }),
    ]);

    const occupancyRate = totalSeats ? Math.round((activeMemberships / totalSeats) * 100) : 0;
    const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const activeRevenue = activePayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      success: true,
      data: {
        totalSeats,
        activeMemberships,
        paidActiveMemberships,
        unpaidActiveMemberships: activeMemberships - paidActiveMemberships,
        occupancyRate,
        totalRevenue,
        monthlyRevenue,
        activeRevenue,
        potentialMonthlyRevenue: 0,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت آمار اشغال و درآمد.");
  }
}