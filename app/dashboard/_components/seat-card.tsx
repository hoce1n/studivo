"use client";

import { Armchair } from "lucide-react";

import { cn } from "@/lib/utils";

export type SeatCardProps = {
  seatNumber: string;
  statusLabel: string;
  className: string;
  dotClass: string;
  subscription?: {
    id: string;
    memberName: string;
    phoneNumber: string;
    endDate: string;
  };
};

export function SeatCard({
  seatNumber,
  statusLabel,
  className,
  dotClass,
  subscription,
}: SeatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-3 text-right transition-shadow hover:shadow-md",
        className,
      )}
      aria-label={`جزئیات صندلی ${seatNumber} — ${statusLabel}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 font-bold">
          <Armchair className="size-3.5 opacity-70" />
          صندلی {seatNumber}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium">
          <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
          {statusLabel}
        </span>
      </div>
      {subscription ? (
        <div className="mt-3 space-y-1 text-xs leading-6">
          <p className="truncate font-medium">{subscription.memberName}</p>
          <p className="opacity-80">تا {subscription.endDate}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs leading-6 opacity-80">
          برای رزرو کلیک کنید.
        </p>
      )}
    </div>
  );
}
