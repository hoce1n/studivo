// app/dashboard/_components/revenue-card.tsx
import { CircleDollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

interface RevenueCardProps {
  monthlyRevenue: number;
  occupiedCount: number;
  activeRevenue: number;
  atRiskRevenue: number;
}

export function RevenueCard({
  monthlyRevenue,
  occupiedCount,
  activeRevenue,
  atRiskRevenue,
}: RevenueCardProps) {
  return (
    <Card className="gap-2 bg-primary text-primary-foreground relative overflow-hidden group">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

      <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-primary-foreground/80">
          درآمد فعال اشتراک‌ها
        </CardTitle>
        <CircleDollarSign className="size-4 text-primary-foreground/70" />
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-2xl font-bold tracking-tight">
          {formatNumber(monthlyRevenue)}{" "}
          <span className="text-base font-normal text-primary-foreground/70">
            تومان
          </span>
        </div>

        <p className="text-xs text-primary-foreground/70 border-b border-primary-foreground/10 pb-2">
          بر اساس {formatNumber(occupiedCount)} اشتراک فعال سالن
        </p>

        <div className="pt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-primary-foreground/60">
          <div className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>وصول شده: {formatNumber(activeRevenue)}</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span className="size-1.5 rounded-full bg-amber-400" />
            <span>در آستانه انقضا: {formatNumber(atRiskRevenue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}