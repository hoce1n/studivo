"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Armchair,
  Phone,
  User,
  CalendarClock,
  CalendarPlus,
  Loader,
  CalendarIcon,
  ArrowLeftRight,
} from "lucide-react";

import { releaseSeat, renewSubscription, swapSeat } from "@/app/actions/actions";
import {
  AlertDialog,
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
import { getActionErrorMessage } from "@/lib/action-errors";
import { cn } from "@/lib/utils";
import { format } from "date-fns-jalali";
import { Calendar } from "../../../components/ui/calendar";

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

function getStatusMessage(statusLabel: string, memberName: string, seatNumber: string): string {
  const baseMessage = `سلام ${memberName} عزیز، از سالن مطالعه ${""} مزاحمتون میشم. `;

  switch (statusLabel) {
    case "نیازمند تمدید":
      return `${baseMessage}اشتراک صندلی شماره ${seatNumber} شما رو به اتمام است. لطفاً جهت تمدید و حفظ صندلی خود اقدام کنید.`;
    case "منقضی":
      return `${baseMessage}اشتراک صندلی شماره ${seatNumber} شما به اتمام رسیده است. در صورت تمایل به ادامه حضور، لطفاً نسبت به تمدید آن اقدام فرمایید.`;
    case "رزرو شده":
    default:
      return `${baseMessage}خواستار ارتباط با شما در خصوص صندلی شماره ${seatNumber} بودم.`;
  }
}

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
  const [newEndDate, setNewEndDate] = React.useState<Date | undefined>(
    undefined,
  );
  const [renewPending, startRenewTransition] = React.useTransition();
  const [renewError, setRenewError] = React.useState<string | null>(null);

  const [swapOpen, setSwapOpen] = React.useState(false);
  const [newSeatNumber, setNewSeatNumber] = React.useState("");
  const [swapPending, startSwapTransition] = React.useTransition();
  const [swapError, setSwapError] = React.useState<string | null>(null);

  function handleRelease() {
    if (!subscription) return;
    startTransition(async () => {
      try {
        await releaseSeat(subscription.id);
        setConfirmOpen(false);
        toast.success("صندلی با موفقیت تخلیه شد.");
      } catch (error) {
        toast.error(getActionErrorMessage(error, "تخلیه صندلی ناموفق بود."));
      }
    });
  }

  function handleRenew() {    if (!subscription || !newEndDate) return;
    setRenewError(null);
    startRenewTransition(async () => {
      try {
        await renewSubscription(subscription.id, newEndDate.toISOString());
        setRenewOpen(false);
        setNewEndDate(undefined);
        toast.success("تمدید اشتراک با موفقیت ثبت شد.");
      } catch (error) {
        const message = getActionErrorMessage(
          error,
          "تمدید اشتراک ناموفق بود.",
        );
        setRenewError(message);
        toast.error(message);
      }
    });
  }

  function handleSwap() {
    if (!subscription) return;
    const parsedSeat = Number(newSeatNumber);
    if (!newSeatNumber || Number.isNaN(parsedSeat) || parsedSeat < 1) {
      setSwapError("شماره صندلی معتبر وارد کنید.");
      return;
    }
    setSwapError(null);
    startSwapTransition(async () => {
      try {
        await swapSeat(subscription.id, parsedSeat);
        setSwapOpen(false);
        setNewSeatNumber("");
        toast.success("دانش‌آموز با موفقیت به صندلی جدید منتقل شد.");
      } catch (error) {
        const message = getActionErrorMessage(
          error,
          "جابجایی صندلی ناموفق بود.",
        );
        setSwapError(message);
        toast.error(message);
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
              <div className="flex items-center gap-1.5">
                <a 
                  href={`sms:${subscription.phoneNumber}?body=${encodeURIComponent(
                    getStatusMessage(statusLabel, subscription.memberName, seatNumber)
                  )}`}
                  className="inline-flex items-center justify-center rounded-lg border bg-background px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground w-full"
                  title="ارسال پیامک پیش‌فرض"
                >
                  پیامک
                </a>
                {/* <a
                  href={`https://wa.me/${subscription.phoneNumber.replace(/^0/, "+98")}?text=${encodeURIComponent(
                    getStatusMessage(statusLabel, subscription.memberName, seatNumber)
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50/50 px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                  title="ارسال در واتس‌اپ"
                >
                  واتس‌اپ
                </a> */}
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

                  <div className="space-y-3 text-right">
                    <Label htmlFor={`renew-${subscription.id}`}>
                      تاریخ پایان جدید
                    </Label>

                    <div className="flex flex-col gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "",
                              !newEndDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                            {newEndDate ? (
                              format(newEndDate, "yyyy/MM/dd")
                            ) : (
                              <span>انتخاب تاریخ از تقویم</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className=" p-0" align="center">
                          <Calendar
                            className="w-full"
                            mode="single"
                            selected={newEndDate}
                            onSelect={setNewEndDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {renewError && (
                      <p className="text-xs text-destructive">{renewError}</p>
                    )}
                    {/* <Input
                      id={`renew-${subscription.id}`}
                      type="date"
                      value={newEndDate}
                      onChange={(event) => setNewEndDate(event.target.value)}
                      disabled={renewPending}
                    />
                    
                    {renewError ? (
                      <p className="text-xs text-destructive">{renewError}</p>
                    ) : null} */}
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
                      {renewPending ? (
                        <Loader className="animate-spin" />
                      ) : (
                        "ثبت تمدید"
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={swapOpen}
                onOpenChange={(open) => {
                  setSwapOpen(open);
                  if (!open) {
                    setSwapError(null);
                    setNewSeatNumber("");
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <ArrowLeftRight />
                    جابجایی صندلی
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <ArrowLeftRight />
                    </AlertDialogMedia>
                    <AlertDialogTitle>
                      جابجایی از صندلی {seatNumber}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {subscription.memberName} از صندلی {seatNumber} به صندلی
                      خالی دیگری منتقل می‌شود. اشتراک و تاریخ پایان آن بدون تغییر
                      باقی می‌ماند.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-3 text-right">
                    <Label htmlFor={`swap-${subscription.id}`}>
                      شماره صندلی جدید
                    </Label>
                    <Input
                      id={`swap-${subscription.id}`}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      placeholder="مثلاً ۱۲"
                      value={newSeatNumber}
                      onChange={(event) => setNewSeatNumber(event.target.value)}
                      disabled={swapPending}
                    />
                    {swapError && (
                      <p className="text-xs text-destructive">{swapError}</p>
                    )}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={swapPending}>
                      انصراف
                    </AlertDialogCancel>
                    <Button
                      onClick={(event) => {
                        event.preventDefault();
                        handleSwap();
                      }}
                      disabled={swapPending || !newSeatNumber}
                    >
                      {swapPending ? (
                        <Loader className="animate-spin" />
                      ) : (
                        "انتقال به صندلی جدید"
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>                <AlertDialogTrigger asChild>
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
                      {pending ? (
                        <Loader className="animate-spin" />
                      ) : (
                        "بله، تخلیه کن"
                      )}
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
