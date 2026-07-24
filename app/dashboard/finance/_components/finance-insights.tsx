import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns-jalali";
import { TrendingUp, Calendar, Zap } from "lucide-react";

interface InsightProps {
  topPlans: any[];
  upcomingRenewals: any[];
}

export function FinanceInsights({ topPlans, upcomingRenewals }: InsightProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <TrendingUp className="size-4 text-primary" />
          <CardTitle className="text-base font-semibold">محبوب‌ترین پلن‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPlans.map((plan, index) => (
              <div key={plan.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{plan.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{plan.count.toLocaleString("fa-IR")} عضو</span>
                  <Badge variant="secondary">{plan.revenue.toLocaleString("fa-IR")} ریال</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Calendar className="size-4 text-primary" />
          <CardTitle className="text-base font-semibold">تمدیدهای پیش‌رو (۷ روز آینده)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingRenewals.map((renewal) => (
              <div key={renewal.name + renewal.date} className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{renewal.name}</span>
                  <span className="text-xs text-muted-foreground">
                    تاریخ انقضا: {format(new Date(renewal.date), "yyyy/MM/dd")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-3 text-amber-500" />
                  <span className="text-sm font-bold text-emerald-600">
                    {renewal.amount.toLocaleString("fa-IR")} ریال
                  </span>
                </div>
              </div>
            ))}
            {upcomingRenewals.length === 0 && (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                تمدیدی در ۷ روز آینده وجود ندارد.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
