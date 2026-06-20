"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  CalendarClock,
  CalendarIcon,
  CalendarPlus,
  Loader,
  MessageSquare,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns-jalali";

import {
  releaseSeat,
  renewSubscription,
  reserveSeat,
  swapSeat,
} from "@/app/actions/actions";
import { ActionForm } from "@/components/action-form";
import { SubscriptionProgress } from "@/app/dashboard/_components/subscription-progress";
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
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getActionErrorMessage } from "@/lib/action-errors";
import { cn } from "@/lib/utils";

export type SeatStatus = "available" | "reserved" | "renewal" | "expired";

export type ReserveFormSeat = {
  id: string;
  seatNumber: string;
  reserveSeatNumber: number;
  status: SeatStatus;
  subscription?: {
    id: string;
    memberName: string;
    phoneNumber: string;
    endDate: string;
    startDateISO: string;
    endDateISO: string;
  };
};

function getDefaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getStatusMessage(
  statusLabel: string,
  memberName: string,
  seatNumber: string,
  studyHallName: string,
): string {
  const baseMessage = `سلام ${memberName} عزیز، از سالن مطالعه ${studyHallName || ""} مزاحمتون میشم. `;

  switch (statusLabel) {
    case "renewal":
    case "نیازمند تمدید":
      return `${baseMessage}اشتراک صندلی شماره ${seatNumber} شما رو به اتمام است. لطفاً جهت تمدید و حفظ صندلی خود اقدام کنید.`;
    case "expired":
    case "منقضی":
      return `${baseMessage}اشتراک صندلی شماره ${seatNumber} شما به اتمام رسیده است. در صورت تمایل به ادامه حضور، لطفاً نسبت به تمدید آن اقدام فرمایید.`;
    case "reserved":
    case "رزرو شده":
    default:
      return `${baseMessage}خواستار ارتباط با شما در خصوص صندلی شماره ${seatNumber} بودم.`;
  }
}

function normalizeSeatNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
}

export function ReserveForm({
  maxSeats,
  open,
  seat,
  studyHallName,
  onOpenChange,
}: {
  maxSeats: number;
  open: boolean;
  seat: ReserveFormSeat | null;
  studyHallName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(getDefaultEndDate);
  const [renewDate, setRenewDate] = React.useState<Date | undefined>(
    getDefaultEndDate,
  );
  const [swapSeatNumber, setSwapSeatNumber] = React.useState("");
  const [renewError, setRenewError] = React.useState<string | null>(null);
  const [swapError, setSwapError] = React.useState<string | null>(null);
  const [renewPending, startRenewTransition] = React.useTransition();
  const [swapPending, startSwapTransition] = React.useTransition();
  const [releasePending, startReleaseTransition] = React.useTransition();

  const reservationSeatNumber = normalizeSeatNumber(
    seat?.reserveSeatNumber ?? seat?.seatNumber,
  );
  const isAvailable = seat?.status === "available";
  const subscription = seat?.subscription;

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(23, 59, 59, 999);
      setDate(adjustedDate);
    } else {
      setDate(undefined);
    }
  };

  const handleSuccess = () => {
    setDate(getDefaultEndDate());
    onOpenChange(false);
  };

  function handleSendStatusMessage() {
    if (!seat || !subscription) return;

    const message = getStatusMessage(
      seat.status,
      subscription.memberName,
      seat.seatNumber,
      studyHallName,
    );

    window.open(
      `sms:${subscription.phoneNumber}?body=${encodeURIComponent(message)}`,
      "_blank",
    );
  }

  function handleRenew() {
    if (!subscription || !renewDate) return;

    const adjustedDate = new Date(renewDate);
    adjustedDate.setHours(23, 59, 59, 999);
    setRenewError(null);
    startRenewTransition(async () => {
      try {
        await renewSubscription(subscription.id, adjustedDate.toISOString());
        toast.success("تمدید اشتراک با موفقیت ثبت شد.");
        setRenewDate(getDefaultEndDate());
        onOpenChange(false);
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

    const cleanedSeatNumber = normalizeSeatNumber(swapSeatNumber);
    const parsedSeatNumber = Number(cleanedSeatNumber);
    if (
      !cleanedSeatNumber ||
      Number.isNaN(parsedSeatNumber) ||
      parsedSeatNumber < 1
    ) {
      setSwapError("شماره صندلی مقصد معتبر نیست.");
      return;
    }

    setSwapError(null);
    startSwapTransition(async () => {
      try {
        await swapSeat(subscription.id, parsedSeatNumber);
        toast.success("دانش‌آموز با موفقیت به صندلی جدید منتقل شد.");
        setSwapSeatNumber("");
        onOpenChange(false);
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

  function handleRelease() {
    if (!subscription) return;

    startReleaseTransition(async () => {
      try {
        await releaseSeat(subscription.id);
        toast.success("صندلی با موفقیت تخلیه شد.");
        onOpenChange(false);
      } catch (error) {
        toast.error(getActionErrorMessage(error, "تخلیه صندلی ناموفق بود."));
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-right">
            {isAvailable
              ? "رزرو سریع صندلی"
              : `مدیریت صندلی ${seat?.seatNumber ?? ""}`}
          </SheetTitle>
          <SheetDescription className="text-right">
            {isAvailable
              ? "شماره صندلی از نقشه پر شده است؛ ابتدا تلفن دانش‌آموز را وارد کنید."
              : "مشخصات دانش‌آموز را بررسی کنید یا عملیات تمدید، انتقال و تخلیه را انجام دهید."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          {isAvailable ? (
            <ActionForm
              key={seat?.id ?? "empty"}
              action={reserveSeat}
              successMessage="رزرو صندلی با موفقیت ثبت شد."
              resetOnSuccess
              onSuccess={handleSuccess}
            >
              {(pending) => (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="phoneNumber">شماره تلفن</FieldLabel>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      inputMode="tel"
                      placeholder="09123456789"
                      autoFocus
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="memberName">نام دانش‌آموز</FieldLabel>
                    <Input
                      id="memberName"
                      name="memberName"
                      placeholder="نام و نام خانوادگی"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="seatNumber">شماره صندلی</FieldLabel>
                    <Input
                      id="seatNumber"
                      name="seatNumber"
                      type="number"
                      min="1"
                      max={maxSeats}
                      value={reservationSeatNumber}
                      readOnly
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="endDate">
                      تاریخ پایان اشتراک
                    </FieldLabel>
                    <input
                      id="endDate"
                      type="hidden"
                      name="endDate"
                      value={date ? date.toISOString() : ""}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          {date ? (
                            format(date, "yyyy/MM/dd")
                          ) : (
                            <span>انتخاب تاریخ تمدید</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={date}
                          onSelect={handleDateChange}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Button
                    type="submit"
                    disabled={pending || !reservationSeatNumber}
                  >
                    {pending ? <Loader className="animate-spin" /> : "رزرو"}
                  </Button>
                </FieldGroup>
              )}
            </ActionForm>
          ) : subscription ? (
            <div className="space-y-4 text-right">
              <div className="space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <span className="font-medium">{subscription.memberName}</span>
                </div>
                <div className="flex items-center gap-2" dir="ltr">
                  <Phone className="size-4 text-muted-foreground" />
                  <a
                    href={`tel:${subscription.phoneNumber}`}
                    className="font-mono"
                  >
                    {subscription.phoneNumber}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  <span>پایان اشتراک: {subscription.endDate}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2 bg-background/80"
                  onClick={handleSendStatusMessage}
                >
                  <MessageSquare className="size-4" />
                  ارسال پیامک اطلاع‌رسانی
                </Button>
              </div>

              <SubscriptionProgress
                startDate={subscription.startDateISO}
                endDate={subscription.endDateISO}
                className="rounded-2xl border p-3"
              />

              <div className="grid gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <CalendarPlus />
                      {renewDate
                        ? format(renewDate, "yyyy/MM/dd")
                        : "تاریخ تمدید"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      className="w-full"
                      mode="single"
                      selected={renewDate}
                      onSelect={setRenewDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {renewError ? (
                  <p className="text-xs text-destructive">{renewError}</p>
                ) : null}
                <Button
                  onClick={handleRenew}
                  disabled={renewPending || !renewDate}
                >
                  {renewPending ? (
                    <Loader className="animate-spin" />
                  ) : (
                    <CalendarPlus />
                  )}
                  تمدید اشتراک
                </Button>

                <div className="flex gap-2">
                  <Input
                    value={swapSeatNumber}
                    onChange={(event) => setSwapSeatNumber(event.target.value)}
                    inputMode="numeric"
                    placeholder="شماره صندلی مقصد"
                    disabled={swapPending}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSwap}
                    disabled={swapPending || !swapSeatNumber}
                  >
                    {swapPending ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <ArrowLeftRight />
                    )}
                    انتقال
                  </Button>
                </div>
                {swapError ? (
                  <p className="text-xs text-destructive">{swapError}</p>
                ) : null}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={releasePending}>
                      <Trash2 />
                      تخلیه صندلی
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia className="text-destructive">
                        <Trash2 />
                      </AlertDialogMedia>
                      <AlertDialogTitle>
                        تخلیه صندلی {seat?.seatNumber}؟
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        اشتراک فعال {subscription.memberName} لغو می‌شود و صندلی
                        خالی خواهد شد.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={releasePending}>
                        انصراف
                      </AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleRelease}
                        disabled={releasePending}
                      >
                        {releasePending ? (
                          <Loader className="animate-spin" />
                        ) : (
                          "بله، تخلیه کن"
                        )}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed p-3 text-center text-sm text-muted-foreground">
              برای این صندلی اشتراک فعالی ثبت نشده است.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
