"use client";

import * as React from "react";
import {
  Armchair,
  Phone,
  User,
  CalendarClock,
  CalendarPlus,
} from "lucide-react";

import { releaseSeat, renewSubscription } from "@/app/actions/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [renewOpen, setRenewOpen] = React.useState(false);
  const [newEndDate, setNewEndDate] = React.useState("");
  const [renewPending, startRenewTransition] = React.useTransition();
  const [renewError, setRenewError] = React.useState<string | null>(null);

  function handleRelease() {
    if (!subscription) return;
    startTransition(async () => {
      await releaseSeat(subscription.id);
      setConfirmOpen(false);
    });
  }

  function handleRenew() {
    if (!subscription || !newEndDate) return;
    setRenewError(null);
    startRenewTransition(async () => {
      try {
        await renewSubscription(subscription.id, newEndDate);
        setRenewOpen(false);
        setNewEndDate("");
      } catch (error) {
        setRenewError(
          error instanceof Error ? error.message : "تمدید اشتراک ناموفق بود.",
        );
      }
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex flex-col rounded-2xl border p-3 text-right transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
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
              <span
                className={cn("size-1.5 rounded-full", dotClass)}
                aria-hidden
              />
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
              برای مشاهده جزئیات کلیک کنید.
            </p>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="center" className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-base font-bold">
            <Armchair className="size-4 opacity-70" />
            صندلی {seatNumber}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium">
            <span
              className={cn("size-1.5 rounded-full", dotClass)}
              aria-hidden
            />
            {statusLabel}
          </span>
        </div>

        {subscription ? (
          <>
            <div className="space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{subscription.memberName}</span>
              </div>
              <div className="flex items-center gap-2" dir="ltr">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-mono">{subscription.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
                <span>پایان اشتراک: {subscription.endDate}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <AlertDialog
                open={renewOpen}
                onOpenChange={(open) => {
                  setRenewOpen(open);
                  if (!open) setRenewError(null);
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <CalendarPlus />
                    تمدید اشتراک
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <CalendarPlus />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      تمدید اشتراک صندلی {seatNumber}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      اشتراک فعلی {subscription.memberName} بسته شده و یک اشتراک
                      جدید با همان مشخصات و تاریخ پایان زیر ثبت می‌شود.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 text-right">
                    <Label htmlFor={`renew-${subscription.id}`}>
                      تاریخ پایان جدید
                    </Label>
                    <Input
                      id={`renew-${subscription.id}`}
                      type="date"
                      value={newEndDate}
                      onChange={(event) => setNewEndDate(event.target.value)}
                      disabled={renewPending}
                    />
                    {renewError ? (
                      <p className="text-xs text-destructive">{renewError}</p>
                    ) : null}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={renewPending}>
                      انصراف
                    </AlertDialogCancel>
                    <Button
                      onClick={(event) => {
                        event.preventDefault();
                        handleRenew();
                      }}
                      disabled={renewPending || !newEndDate}
                    >
                      {renewPending ? "در حال تمدید…" : "ثبت تمدید"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    تخلیه دستی
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia className="text-destructive">
                      <Armchair />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      تخلیه صندلی {seatNumber}؟
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      اشتراک فعال {subscription.memberName} لغو می‌شود و این
                      صندلی خالی خواهد شد. این عمل قابل بازگشت نیست.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                      انصراف
                    </AlertDialogCancel>
                    <Button
                      variant="destructive"
                      onClick={(event) => {
                        event.preventDefault();
                        handleRelease();
                      }}
                      disabled={pending}
                    >
                      {pending ? "در حال تخلیه…" : "بله، تخلیه کن"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <p className="rounded-2xl border border-dashed p-3 text-center text-xs leading-6 text-muted-foreground">
            این صندلی خالی است. برای پذیرش، شماره آن را در فرم رزرو وارد کنید.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
