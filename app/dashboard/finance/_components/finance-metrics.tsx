import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  Percent, 
  Clock,
} from "lucide-react";

interface MetricProps {
  title: string;
  value: string | number;
  hint?: string;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, hint, icon: Icon, trend }: MetricProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {trend && (
          <div className={`mt-2 flex items-center gap-1 text-xs ${trend.isPositive ? 'text-emerald-600' : 'text-destructive'}`}>
            {trend.isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            <span>{trend.value}% نسبت به قبل</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinanceMetricsGrid({ metrics }: { metrics: any }) {
  const formatMoney = (val: number) => val.toLocaleString("fa-IR") + " ریال";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        title="درآمد کل"
        value={formatMoney(metrics.totalRevenue)}
        icon={Wallet}
        hint="مجموع دریافتی‌های بازه"
      />
      <MetricCard
        title="هزینه‌ها"
        value={formatMoney(metrics.totalExpenses)}
        icon={TrendingDown}
        hint="مجموع مخارج ثبت‌شده"
      />
      <MetricCard
        title="سود خالص"
        value={formatMoney(metrics.netProfit)}
        icon={TrendingUp}
        hint="تفاضل درآمد و هزینه"
      />
      <MetricCard
        title="اشتراک‌های فعال"
        value={metrics.activeMembershipsCount.toLocaleString("fa-IR")}
        icon={Users}
        hint="تعداد اعضای دارای اشتراک معتبر"
      />
      <MetricCard
        title="میانگین درآمد (ARPU)"
        value={formatMoney(metrics.averageRevenuePerMember)}
        icon={Percent}
        hint="درآمد به ازای هر عضو فعال"
      />
      <MetricCard
        title="نرخ وصول"
        value={`${metrics.collectionRate.toFixed(1)}٪`}
        icon={Clock}
        hint={`${metrics.pendingPaymentsCount} پرداخت در انتظار`}
      />
    </div>
  );
}
