"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { actionError } from "@/app/actions/audit";
import type { ActionResult } from "@/app/actions/audit";
import { requireTenantContext } from "@/app/actions/auth";

// ---------------------------------------------------------------------------
// Types (Maintained for UI compatibility)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function inclusiveEndOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

// ---------------------------------------------------------------------------
// Schema for date range validation
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// fetchRevenueReport
// Fetches revenue data for a given date range.
// Migrated to Schema v2: Payment-centric.
// ---------------------------------------------------------------------------
export async function fetchRevenueReport(startDate: Date, endDate: Date): Promise<ActionResult<RevenueReport>> {
  const user = await requireTenantContext();
  const parsed = dateRangeSchema.safeParse({ startDate, endDate });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "بازه گزارش درآمد معتبر نیست." };
  }

  const rangeStart = parsed.data.startDate;
  const rangeEnd = inclusiveEndOfDay(parsed.data.endDate);

  try {
    const payments = await prisma.payment.findMany({
      where: {
        membership: { studyHallId: user.studyHallId },
        status: "COMPLETED",
        paidAt: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        membership: {
          include: {
            user: { select: { name: true, phoneNumber: true } },
            seatAssignments: {
              orderBy: { startsAt: "desc" },
              take: 1,
              include: { seat: { select: { number: true } } },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    });

    const transactions: RevenueTransaction[] = payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      paymentDate: p.paidAt,
      fallbackDate: p.createdAt,
      user: {
        name: p.membership.user.name,
        phoneNumber: p.membership.user.phoneNumber,
      },
      seat: {
        seatNumber: Number(p.membership.seatAssignments[0]?.seat.number ?? 0),
      },
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

// ---------------------------------------------------------------------------
// fetchOverduePayments
// Fetches memberships that are active but have no completed payments.
// Migrated to Schema v2.
// ---------------------------------------------------------------------------
export async function fetchOverduePayments(): Promise<ActionResult<OverduePaymentsReport>> {
  const user = await requireTenantContext();

  try {
    // Overdue definition in Schema v2:
    // Memberships that are ACTIVE but have no COMPLETED payments.
    const memberships = await prisma.membership.findMany({
      where: {
        studyHallId: user.studyHallId,
        status: "ACTIVE",
        payments: {
          none: { status: "COMPLETED" },
        },
      },
      include: {
        user: { select: { name: true, phoneNumber: true } },
        seatAssignments: {
          orderBy: { startsAt: "desc" },
          take: 1,
          include: { seat: { select: { number: true } } },
        },
      },
      orderBy: { endsAt: "asc" },
    });

    const overdueSubscriptions: OverduePayment[] = memberships.map((m) => ({
      id: m.id,
      startDate: m.startsAt,
      endDate: m.endsAt,
      amount: Number(m.planPrice),
      user: {
        name: m.user.name,
        phoneNumber: m.user.phoneNumber,
      },
      seat: {
        seatNumber: Number(m.seatAssignments[0]?.seat.number ?? 0),
      },
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

// ---------------------------------------------------------------------------
// fetchOccupancyRevenueStats
// Fetches current occupancy and potential revenue stats.
// Migrated to Schema v2.
// ---------------------------------------------------------------------------
export async function fetchOccupancyRevenueStats(): Promise<ActionResult<OccupancyRevenueStats>> {
  const user = await requireTenantContext();

  try {
    const studyHall = await prisma.studyHall.findFirst({
      where: { id: user.studyHallId },
      select: {
        sections: {
          select: {
            seats: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
        membershipPlans: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          take: 1,
          select: { price: true },
        },
      },
    });

    if (!studyHall) {
      return { success: false, error: "سالن مطالعه یافت نشد." };
    }

    const totalSeats = studyHall.sections.reduce((sum, s) => sum + s.seats.length, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeMembershipsCount,
      paidActiveMembershipsCount,
      totalRevenueSum,
      monthlyRevenueSum,
      activeRevenueSum
    ] = await Promise.all([
      // Total active memberships (occupancy)
      prisma.membership.count({
        where: { studyHallId: user.studyHallId, status: "ACTIVE" },
      }),
      // Paid active memberships
      prisma.membership.count({
        where: {
          studyHallId: user.studyHallId,
          status: "ACTIVE",
          payments: { some: { status: "COMPLETED" } },
        },
      }),
      // Total revenue (all completed payments)
      prisma.payment.aggregate({
        where: { membership: { studyHallId: user.studyHallId }, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      // Monthly revenue (completed payments in current month)
      prisma.payment.aggregate({
        where: {
          membership: { studyHallId: user.studyHallId },
          status: "COMPLETED",
          paidAt: { gte: monthStart, lte: now },
        },
        _sum: { amount: true },
      }),
      // Active revenue (completed payments for currently active memberships)
      prisma.payment.aggregate({
        where: {
          membership: { studyHallId: user.studyHallId, status: "ACTIVE" },
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
    ]);

    const occupancyRate = totalSeats ? Math.round((activeMembershipsCount / totalSeats) * 100) : 0;

    // Fallback for monthly fee if no plan is found (though onboarding ensures it)
    const defaultMonthlyFee = Number(studyHall.membershipPlans[0]?.price ?? 0);

    return {
      success: true,
      data: {
        totalSeats,
        activeSubscriptions: activeMembershipsCount,
        paidActiveSubscriptions: paidActiveMembershipsCount,
        unpaidActiveSubscriptions: activeMembershipsCount - paidActiveMembershipsCount,
        occupancyRate,
        totalRevenue: Number(totalRevenueSum._sum.amount ?? 0),
        monthlyRevenue: Number(monthlyRevenueSum._sum.amount ?? 0),
        activeRevenue: Number(activeRevenueSum._sum.amount ?? 0),
        potentialMonthlyRevenue: totalSeats * defaultMonthlyFee,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت آمار اشغال و درآمد.");
  }
}
