"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  CircleDollarSign,
  Map,
  UsersRound,
  Armchair,
  BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock seat data for the preview
const mockSeats = Array.from({ length: 24 }).map((_, i) => ({
  id: `seat-${i + 1}`,
  seatNumber: i + 1,
  status: (() => {
    const mod = i % 7;
    if (mod === 0) return "renewal";
    if (mod === 1) return "expired";
    if (mod === 2 || mod === 3) return "reserved";
    return "available";
  })() as "available" | "reserved" | "renewal" | "expired",
  memberName: ["علی محمدی", "فاطمه رضایی", "محمد حسینی", "زهرا کریمی"][i % 4],
  endDate: "۱۴۰۵/۰۴/۱۵",
}));

const statusConfig = {
  available: {
    label: "خالی",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "رزرو فعال",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    dot: "bg-red-500",
  },
  renewal: {
    label: "نیازمند تمدید",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    dot: "bg-amber-500",
  },
  expired: {
    label: "منقضی",
    className:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    dot: "bg-slate-400",
  },
};

const stats = {
  available: mockSeats.filter((s) => s.status === "available").length,
  reserved: mockSeats.filter((s) => s.status === "reserved").length,
  renewal: mockSeats.filter((s) => s.status === "renewal").length,
  expired: mockSeats.filter((s) => s.status === "expired").length,
};

const occupancyRate = Math.round(
  ((stats.reserved + stats.renewal) / mockSeats.length) * 100
);

const monthlyFee = 890000;
const occupied = stats.reserved + stats.renewal;
const monthlyRevenue = occupied * monthlyFee;
const activeRevenue = stats.reserved * monthlyFee;
const atRiskRevenue = stats.renewal * monthlyFee;

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function DashboardPreview() {
  return (
    <div className="relative w-full rounded-[2rem] border bg-card p-5 shadow-lg overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Main container with sidebar-like frame */}
      <div className="rounded-[1.5rem] border bg-background overflow-hidden">
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/50 backdrop-blur-sm">
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <BookOpenCheck className="size-4" />
              </div>
              <div className="text-sm font-medium">سالن مطالعه گام</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <span className="inline-block size-1.5 rounded-full bg-emerald-500" />
                اشغال {formatNumber(occupancyRate)}٪
              </Badge>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="p-4 space-y-4">
          {/* Summary cards row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                title: "کل صندلی‌ها",
                value: formatNumber(mockSeats.length),
                hint: `${formatNumber(occupied)} اشغال شده`,
                icon: Map,
                iconClass: "text-muted-foreground",
              },
              {
                title: "صندلی خالی",
                value: formatNumber(stats.available),
                hint: "آماده پذیرش",
                icon: CheckCircle2,
                iconClass: "text-emerald-600",
              },
              {
                title: "هشدار تمدید",
                value: formatNumber(stats.renewal + stats.expired),
                hint: "نیاز به اقدام",
                icon: Map,
                iconClass: "text-amber-600",
              },
              {
                title: "اعضا",
                value: formatNumber(28),
                hint: "۲ همکار فعال",
                icon: UsersRound,
                iconClass: "text-muted-foreground",
              },
            ].map((card) => (
              <Card key={card.title} className="gap-2">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className={cn("size-3.5", card.iconClass)} />
                </CardHeader>
                <CardContent className="space-y-0.5">
                  <div className="text-lg font-bold tracking-tight">
                    {card.value}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Seat map and revenue section */}
          <div className="grid gap-4 lg:grid-cols-[1fr_0.5fr]">
            {/* Seat map */}
            <Card className="gap-4">
              <CardHeader className="pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-sm">نقشه زنده صندلی‌ها</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    وضعیت هر صندلی بر اساس تاریخ پایان اشتراک
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-2">
                  {mockSeats.map((seat) => {
                    const config = statusConfig[seat.status];
                    return (
                      <div
                        key={seat.id}
                        className={cn(
                          "flex flex-col rounded-xl border p-2 text-right transition-shadow hover:shadow-md text-[10px]",
                          config.className
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-0.5 font-bold">
                            <Armchair className="size-2.5 opacity-70" />
                            {seat.seatNumber}
                          </span>
                          <span className={cn("size-1 rounded-full", config.dot)} />
                        </div>
                        {seat.status !== "available" && (
                          <p className="mt-1 truncate font-medium opacity-90">
                            {seat.memberName}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Revenue card */}
            <Card className="gap-2 bg-primary text-primary-foreground relative overflow-hidden h-fit group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-primary-foreground/80">
                  درآمد ماهانه تخمینی
                </CardTitle>
                <CircleDollarSign className="size-3.5 text-primary-foreground/70" />
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="text-xl font-bold tracking-tight">
                  {formatNumber(monthlyRevenue)}{" "}
                  <span className="text-xs font-normal text-primary-foreground/70">
                    تومان
                  </span>
                </div>

                <p className="text-[10px] text-primary-foreground/70 border-b border-primary-foreground/10 pb-2">
                  بر اساس {formatNumber(occupied)} صندلی اشغال‌شده
                </p>

                <div className="pt-1 grid grid-cols-2 gap-x-1 gap-y-1 text-[9px] text-primary-foreground/60">
                  <div className="flex items-center gap-1">
                    <span className="size-1 rounded-full bg-emerald-400" />
                    <span>وصول: {formatNumber(activeRevenue)}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="size-1 rounded-full bg-amber-400" />
                    <span>در آستانه: {formatNumber(atRiskRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(statusConfig).map(([key, config]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2 py-1"
              >
                <span className={cn("size-1.5 rounded-full", config.dot)} />
                {config.label}
                <span className="font-semibold">
                  {formatNumber(stats[key as keyof typeof stats])}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
