"use client";

import { formatJalaliNumeric, toDate } from "@/lib/date";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type SubscriptionProgressProps = {
  startDate: string | Date;
  endDate: string | Date;
  className?: string;
};

export function SubscriptionProgress({
  startDate,
  endDate,
  className,
}: SubscriptionProgressProps) {
  const start = toDate(startDate);
  const end = toDate(endDate);
  const now = Date.now();

  const total = start && end ? end.getTime() - start.getTime() : 0;
  const elapsed = start ? now - start.getTime() : 0;

  // Clamp the elapsed ratio between 0 (future start) and 100 (expired).
  const progress =
    total <= 0 ? 100 : Math.min(100, Math.max(0, (elapsed / total) * 100));

  return (
    <div className={cn("space-y-2 text-right", className)}>
      <p className="text-xs font-medium text-muted-foreground">
        اعتبار اشتراک
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          پایان: {formatJalaliNumeric(end)}
        </span>
        <span>شروع: {formatJalaliNumeric(start)}</span>
      </div>
      <Progress
        value={progress}
        className="h-1.5 [&>[data-slot=progress-indicator]]:bg-emerald-500"
        aria-label={`اعتبار اشتراک: ${Math.round(progress)} درصد سپری شده`}
      />
    </div>
  );
}
