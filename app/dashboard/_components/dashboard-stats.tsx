import { Map, CheckCircle2, CalendarClock, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

interface DashboardStatsProps {
  seatsCount: number;
  occupiedCount: number;
  availableCount: number;
  renewalCount: number;
  expiredCount: number;
  membersCount: number;
  staffCount: number;
}

export function DashboardStats({
  seatsCount,
  occupiedCount,
  availableCount,
  renewalCount,
  expiredCount,
  membersCount,
  staffCount,
}: DashboardStatsProps) {
  const summaryCards = [
    {
      title: "کل صندلی‌ها",
      value: formatNumber(seatsCount),
      hint: `${formatNumber(occupiedCount)} صندلی اشغال شده`,
      icon: Map,
      iconClass: "text-muted-foreground",
    },
    {
      title: "صندلی خالی",
      value: formatNumber(availableCount),
      hint: "آماده پذیرش",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    {
      title: "هشدار تمدید",
      value: formatNumber(renewalCount + expiredCount),
      hint: `${formatNumber(renewalCount)} نزدیک پایان · ${formatNumber(expiredCount)} منقضی`,
      icon: CalendarClock,
      iconClass: "text-amber-600",
    },
    {
      title: "اعضا",
      value: formatNumber(membersCount),
      hint: `${formatNumber(staffCount)} همکار فعال`,
      icon: UsersRound,
      iconClass: "text-muted-foreground",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className="gap-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={cn("size-4", card.iconClass)} />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}