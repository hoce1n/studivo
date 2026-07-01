"use client";

import { useMemo } from "react";
import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

type SeatStatus = "available" | "reserved" | "expired";

type PublicSeatMapProps = {
  totalSeats: number;
  occupiedSeats?: number;
};

function getSeatStatus(index: number, occupiedSeats: number): SeatStatus {
  // Distribute occupied seats across the map
  const occupancyRate = occupiedSeats / Math.max(totalSeats, 1);
  const seatIndex = index / Math.max(totalSeats, 1);

  if (seatIndex < occupancyRate * 0.7) {
    return "reserved";
  }
  if (seatIndex < occupancyRate) {
    return "expired";
  }
  return "available";
}

const statusStyles: Record<SeatStatus, string> = {
  available:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-900",
  reserved:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100 cursor-not-allowed opacity-75",
  expired:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 cursor-not-allowed opacity-60",
};

const statusLabels: Record<SeatStatus, string> = {
  available: "خالی",
  reserved: "اشغال شده",
  expired: "منقضی",
};

export function PublicSeatMap({ totalSeats, occupiedSeats = 0 }: PublicSeatMapProps) {
  const seats = useMemo(() => {
    return Array.from({ length: totalSeats }, (_, i) => ({
      number: i + 1,
      status: getSeatStatus(i, occupiedSeats),
    }));
  }, [totalSeats, occupiedSeats]);

  const stats = useMemo(() => {
    return {
      available: seats.filter((s) => s.status === "available").length,
      reserved: seats.filter((s) => s.status === "reserved").length,
      expired: seats.filter((s) => s.status === "expired").length,
    };
  }, [seats]);

  function formatNumber(value: number) {
    return new Intl.NumberFormat("fa-IR").format(value);
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-900 dark:bg-emerald-950">
          <p className="text-sm text-emerald-700 dark:text-emerald-200">خالی</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {formatNumber(stats.available)}
          </p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-200">اشغال شده</p>
          <p className="mt-1 text-2xl font-bold text-red-900 dark:text-red-100">
            {formatNumber(stats.reserved)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-700 dark:text-slate-300">منقضی</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatNumber(stats.expired)}
          </p>
        </div>
      </div>

      {/* Seat grid */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {seats.map((seat) => (
            <div
              key={seat.number}
              className={cn(
                "flex h-12 items-center justify-center rounded-lg border text-sm font-medium transition-all",
                statusStyles[seat.status],
              )}
              title={`صندلی ${formatNumber(seat.number)} - ${statusLabels[seat.status]}`}
            >
              {formatNumber(seat.number)}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="size-4 rounded border border-emerald-200 bg-emerald-50" />
          <span className="text-muted-foreground">خالی</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 rounded border border-red-200 bg-red-50" />
          <span className="text-muted-foreground">اشغال شده</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-4 rounded border border-slate-200 bg-slate-100" />
          <span className="text-muted-foreground">منقضی</span>
        </div>
      </div>
    </div>
  );
}
