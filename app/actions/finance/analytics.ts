"use server";

import { prisma } from "@/lib/db";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { actionError } from "@/app/actions/audit/helpers";
import type { ActionResult } from "@/app/actions/audit/helpers";

export type FinancialMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeMembershipsCount: number;
  averageRevenuePerMember: number;
  pendingPaymentsCount: number;
  collectionRate: number;
};

export type ChartData = {
  date: string;
  revenue: number;
  expense: number;
};

export type CategoryData = {
  name: string;
  value: number;
};

export type FinanceDashboardData = {
  metrics: FinancialMetrics;
  trendData: ChartData[];
  methodData: CategoryData[];
  expenseCategoryData: CategoryData[];
  topPlans: { name: string; count: number; revenue: number }[];
  upcomingRenewals: { name: string; date: Date; amount: number }[];
  recentTransactions: any[];
};

export async function fetchFinanceDashboard(
  startDate: Date,
  endDate: Date,
): Promise<ActionResult<FinanceDashboardData>> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  if (user.role !== "OWNER") {
    return { success: false, error: "دسترسی غیرمجاز" };
  }

  try {
    const [
      payments,
      expenses,
      activeMemberships,
      pendingPaymentsCount,
      membershipPlans,
      expiringMemberships,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          membership: { studyHallId },
          status: "COMPLETED",
          paidAt: { gte: startDate, lte: endDate },
        },
        include: {
          membership: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.expense.findMany({
        where: {
          studyHallId,
          voidedAt: null,
          occurredAt: { gte: startDate, lte: endDate },
        },
        include: { createdBy: { select: { name: true } } },
      }),
      prisma.membership.findMany({
        where: { studyHallId, status: "ACTIVE", endsAt: { gte: new Date() } },
        select: { id: true, planPrice: true },
      }),
      prisma.payment.count({
        where: { membership: { studyHallId }, status: "PENDING" },
      }),
      prisma.membershipPlan.findMany({
        where: { studyHallId },
        include: { _count: { select: { memberships: true } } },
      }),
      prisma.membership.findMany({
        where: {
          studyHallId,
          status: "ACTIVE",
          endsAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: { user: { select: { name: true } } },
        orderBy: { endsAt: "asc" },
        take: 5,
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const netProfit = totalRevenue - totalExpenses;

    const activeMembershipsCount = activeMemberships.length;
    const averageRevenuePerMember =
      activeMembershipsCount > 0
        ? activeMemberships.reduce((sum, m) => sum + Number(m.planPrice), 0) /
          activeMembershipsCount
        : 0;

    const completedCount = payments.length;
    const totalPossibleCount = completedCount + pendingPaymentsCount;
    const collectionRate =
      totalPossibleCount > 0 ? (completedCount / totalPossibleCount) * 100 : 0;

    // Group by date for trend chart
    const trendMap = new Map<string, { revenue: number; expense: number }>();
    payments.forEach((p) => {
      const d = p.paidAt!.toISOString().split("T")[0];
      const current = trendMap.get(d) || { revenue: 0, expense: 0 };
      trendMap.set(d, {
        ...current,
        revenue: current.revenue + Number(p.amount),
      });
    });
    expenses.forEach((e) => {
      const d = e.occurredAt.toISOString().split("T")[0];
      const current = trendMap.get(d) || { revenue: 0, expense: 0 };
      trendMap.set(d, {
        ...current,
        expense: current.expense + Number(e.amount),
      });
    });

    const trendData = Array.from(trendMap.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by method
    const methodMap = new Map<string, number>();
    payments.forEach((p) => {
      methodMap.set(
        p.method,
        (methodMap.get(p.method) || 0) + Number(p.amount),
      );
    });
    const methodData = Array.from(methodMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Group by expense category
    const expenseCatMap = new Map<string, number>();
    expenses.forEach((e) => {
      expenseCatMap.set(
        e.category,
        (expenseCatMap.get(e.category) || 0) + Number(e.amount),
      );
    });
    const expenseCategoryData = Array.from(expenseCatMap.entries()).map(
      ([name, value]) => ({ name, value }),
    );

    // Top plans
    const topPlans = membershipPlans
      .map((p) => ({
        name: p.name,
        count: p._count.memberships,
        revenue: p._count.memberships * Number(p.price),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const upcomingRenewals = expiringMemberships.map((m) => ({
      name: m.user.name,
      date: m.endsAt,
      amount: Number(m.planPrice),
    }));

    const recentTransactions = [
      ...payments.map((p) => ({
        id: p.id,
        type: "PAYMENT" as const,
        amount: Number(p.amount),
        date: p.paidAt ?? new Date(0),
        title: p.membership.user.name,
      })),
      ...expenses.map((e) => ({
        id: e.id,
        type: "EXPENSE" as const,
        amount: Number(e.amount),
        date: e.occurredAt,
        title: e.title,
      })),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);

    return {
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalExpenses,
          netProfit,
          activeMembershipsCount,
          averageRevenuePerMember,
          pendingPaymentsCount,
          collectionRate,
        },
        trendData,
        methodData,
        expenseCategoryData,
        topPlans,
        upcomingRenewals,
        recentTransactions,
      },
    };
  } catch (error) {
    return actionError(error, "خطا در دریافت گزارش جامع مالی.");
  }
}
