import { Inbox, TrendingUp, CalendarCheck2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlatformStats } from "@/app/actions/platform/leads";

interface StatsHeaderProps {
  stats: PlatformStats;
}

const statCards = (stats: PlatformStats) => [
  {
    title: "کل لیدها",
    value: stats.total,
    hint: "از ابتدا تاکنون",
    icon: Inbox,
  },
  {
    title: "لید جدید این هفته",
    value: stats.newThisWeek,
    hint: "۷ روز گذشته",
    icon: TrendingUp,
  },
  {
    title: "در مرحله دمو",
    value: stats.inDemo,
    hint: "در انتظار برگزاری",
    icon: CalendarCheck2,
  },
];

export function StatsHeader({ stats }: StatsHeaderProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {statCards(stats).map((card) => (
        <Card key={card.title} className="gap-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">
              {new Intl.NumberFormat("fa-IR").format(card.value)}
            </div>
            <p className="text-xs text-muted-foreground">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
