"use client";

import { cn } from "@/lib/utils";

/**
 * SeatCardProps defines the data structure for the SeatCard component.
 *
 * Note for Schema v2:
 * - The `subscription` prop name is kept for UI compatibility.
 * - In Schema v2, this object represents a `Membership` entity.
 * - `subscription.id` corresponds to `Membership.id`.
 * - `paymentStatus` is derived from the existence of completed `Payment` records for the membership.
 */
export type SeatCardProps = {
  seatNumber: string;
  statusLabel: string;
  className: string;
  dotClass: string;
  subscription?: {
    /** The ID of the Membership (Schema v2) */
    id: string;
    memberName: string;
    phoneNumber: string;
    endDate: string;
    /**
     * Mapping from Schema v2:
     * "paid" if membership has at least one COMPLETED payment, else "unpaid".
     */
    paymentStatus: string;
  };
};

/**
 * SeatCard displays the current status and assignment details of a study hall seat.
 *
 * This component is optimized for the dashboard's live seat map and maintains
 * legacy terminology ("subscription") while operating on Schema v2 data models.
 */
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
          صندلی {seatNumber}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium">
          <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
          {statusLabel}
        </span>
      </div>
      {subscription ? (
        <div className="mt-3 space-y-1 text-xs leading-6">
          <div className="flex items-center justify-between gap-1">
            <p className="truncate font-medium">{subscription.memberName}</p>
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                subscription.paymentStatus === "paid"
                  ? "bg-emerald-500"
                  : "bg-amber-500 animate-pulse",
              )}
              title={subscription.paymentStatus === "paid" ? "پرداخت شده" : "تسویه نشده"}
            />
          </div>
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
