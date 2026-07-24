import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { fetchFinanceDashboard } from "@/app/actions/finance/analytics";
import { FinanceMetricsGrid } from "./_components/finance-metrics";
import { RevenueTrendChart, DistributionPieChart } from "./_components/finance-charts";
import { TransactionList } from "./_components/transaction-list";
import { FinanceInsights } from "./_components/finance-insights";
import { FinanceFilters } from "./_components/finance-filters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";
import { redirect } from "next/navigation";

interface FinancePageProps {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const user = await requireScopedUser();
  if (user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const startDate = params.startDate ? new Date(params.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = params.endDate ? new Date(params.endDate) : now;

  const result = await fetchFinanceDashboard(startDate, endDate);

  if (!result.success || !result.data) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-dashed text-destructive">
        {result.error || "خطا در بارگذاری داده‌های مالی"}
      </div>
    );
  }

  const {
    metrics,
    trendData,
    methodData,
    expenseCategoryData,
    topPlans,
    upcomingRenewals,
    recentTransactions
  } = result.data;

  // Localize method and category names for charts
  const localizedMethodData = methodData.map(d => ({
    ...d,
    name: d.name === 'CASH' ? 'نقدی' : d.name === 'POS' ? 'کارتخوان' : d.name === 'CARD_TO_CARD' ? 'کارت به کارت' : 'آنلاین'
  }));

  const expenseCategoryLabels: Record<string, string> = {
    RENT: "اجاره",
    ELECTRICITY: "برق",
    WATER: "آب",
    INTERNET: "اینترنت",
    CLEANING: "نظافت",
    EQUIPMENT: "تجهیزات",
    SALARY: "حقوق",
    OTHER: "سایر"
  };

  const localizedExpenseData = expenseCategoryData.map(d => ({
    ...d,
    name: expenseCategoryLabels[d.name] || d.name
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-6 text-primary" />
            <h1 className="text-xl font-bold md:text-2xl">داشبورد مالی</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            گزارش جامع درآمد، هزینه‌ها و سود خالص سالن مطالعه
          </p>
        </div>
        <Badge variant="outline" className="gap-2 bg-background/50 py-1.5 px-3">
          <DollarSign className="size-4 text-emerald-500" />
          <span className="font-bold">{metrics.totalRevenue.toLocaleString("fa-IR")} ریال</span>
        </Badge>
      </div>

      <FinanceFilters />

      <FinanceMetricsGrid metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueTrendChart data={trendData} />
        <DistributionPieChart data={localizedMethodData} title="روش‌های پرداخت" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">تراکنش‌های اخیر</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={recentTransactions} />
          </CardContent>
        </Card>
        <DistributionPieChart data={localizedExpenseData} title="توزیع هزینه‌ها" />
      </div>

      <FinanceInsights topPlans={topPlans} upcomingRenewals={upcomingRenewals} />
    </div>
  );
}
