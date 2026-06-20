"use client";

import { format } from "date-fns-jalali";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SubscriptionProgressProps = {
  startDate: string | Date;
  endDate: string | Date;
  className?: string;
};

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function formatJalali(date: Date) {
  return Number.isNaN(date.getTime()) ? "—" : format(date, "yyyy/MM/dd");
}

export function SubscriptionProgress({
  startDate,
  endDate,
  className,
}: SubscriptionProgressProps) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const now = Date.now();

  const total = end.getTime() - start.getTime();
  const elapsed = now - start.getTime();

  // Clamp the elapsed ratio between 0 (future start) and 100 (expired).
  const progress =
    total <= 0 ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100));

  return (
    <div className={cn("space-y-2 text-right", className)}>
      <p className="text-xs font-medium text-muted-foreground">
        اعتبار اشتراک
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>شروع: {formatJalali(start)}</span>
        <span className="font-medium text-emerald-600 dark:text-emerald-400">
          پایان: {formatJalali(end)}
        </span>
      </div>
      <Progress
        value={progress}
        className="h-1.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
        aria-label={`اعتبار اشتراک: ${Math.round(progress)} درصد سپری شده`}
      />
    </div>
  );
}
