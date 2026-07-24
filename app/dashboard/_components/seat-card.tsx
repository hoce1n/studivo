"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type SeatCardProps = {
  seatNumber: string;
  statusLabel: string;
  className: string;
  dotClass: string;
  isDuplicate?: boolean;
  duplicateSeats?: string[];
  membership?: {
    id: string;
    memberName: string;
    phoneNumber: string;
    endDate: string;
    paymentStatus?: string;
  };
};

export function SeatCard({
  seatNumber,
  statusLabel,
  className,
  dotClass,
  isDuplicate,
  duplicateSeats,
  membership,
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
          صندلی {seatNumber}
          {isDuplicate && (
            <AlertTriangle
              className="size-4 text-amber-600"
              aria-label={`خطا: این کاربر همزمان صندلی‌های ${duplicateSeats?.join(" و ")} را دارد.`}
            />
          )}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium">
          <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
          {statusLabel}
        </span>
      </div>
      {membership ? (
        <div className="mt-3 space-y-1 text-xs leading-6">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate font-medium">{membership.memberName}</p>
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                membership.paymentStatus === "paid"
                  ? "bg-emerald-500"
                  : membership.paymentStatus === "pending"
                    ? "bg-sky-500 animate-pulse"
                    : "bg-amber-500 animate-pulse",
              )}
              title={
                membership.paymentStatus === "paid"
                  ? "پرداخت شده"
                  : membership.paymentStatus === "pending"
                    ? "بدهی / در انتظار"
                    : "تسویه نشده"
              }
            />
          </div>
          <p className="opacity-80">تا {membership.endDate}</p>
        </div>
      ) : (
        <p className="mt-3 text-xs leading-6 opacity-80">
          برای رزرو کلیک کنید.
        </p>
      )}
    </div>
  );
}
