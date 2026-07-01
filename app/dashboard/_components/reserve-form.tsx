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
  History,
  User,
} from "lucide-react";
import { format } from "date-fns-jalali";

import {
  releaseSeat,
  renewSubscription,
  reserveSeat,
  swapSeat,
  updatePaymentStatus,
} from "@/app/actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    paymentStatus: string;
  };
  history?: {
    id: string;
    memberName: string;
    phoneNumber: string;
    startDate: string;
    endDate: string;
    status: string;
    paymentStatus: string;
  }[];
};

const START_DATE_MAX_PAST_DAYS = 30;

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getDefaultStartDate() {
  return startOfDay(new Date());
}

function getDefaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  date.setHours(23, 59, 59, 999);
  return date;
}

function getEarliestAllowedStartDate() {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - START_DATE_MAX_PAST_DAYS);
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

function SeatHistoryTimeline({ history }: { history: NonNullable<ReserveFormSeat["history"]> }) {
  if (!history.length) {
    return (
      <div className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        هنوز سابقه‌ای برای این صندلی ثبت نشده است.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <History className="size-4 text-muted-foreground" />
        آرشیو امن اشغال این صندلی
      </div>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="relative border-r pr-4 text-sm">
            <span className="absolute -right-1.5 top-1.5 size-3 rounded-full bg-primary" aria-hidden />
            <div className="font-medium">{item.memberName}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">{item.phoneNumber}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {item.startDate} تا {item.endDate} · {statusLabels[item.status] ?? item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSmartRenewalPreview(currentEndDateISO: string, selectedDate: Date | undefined) {
  if (!selectedDate) {
    return {
      daysDifference: null,
      isRealRenewal: false,
      buttonText: "انتخاب تاریخ تمدید",
      helpText: "تاریخ جدید را انتخاب کنید تا نوع عملیات مشخص شود.",
    };
  }

  const currentEndDate = new Date(currentEndDateISO);
  const adjustedDate = new Date(selectedDate);
  adjustedDate.setHours(23, 59, 59, 999);
  const daysDifference = Math.ceil(
    (adjustedDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isRealRenewal = daysDifference > 7;

  return {
    daysDifference,
    isRealRenewal,
    buttonText: isRealRenewal ? "ثبت تمدید واقعی" : "اصلاح تاریخ پایان",
    helpText: isRealRenewal
      ? `بیش از ۷ روز اختلاف دارد؛ سابقه فعلی بسته می‌شود و اشتراک جدید ساخته می‌شود (${daysDifference > 0 ? "+" : ""}${daysDifference} روز).`
      : `اختلاف ۷ روز یا کمتر است؛ فقط تاریخ پایان همین اشتراک اصلاح می‌شود (${daysDifference > 0 ? "+" : ""}${daysDifference} روز).`,
  };
}

const statusLabels: Record<string, string> = {
  active: "فعال",
  expired: "منقضی",
  cancelled: "لغوشده",
};

export function ReserveForm({
  maxSeats,
  open,
  seat,
  studyHallName,
  returningMember,
  onOpenChange,
}: {
  maxSeats: number;
  open: boolean;
  seat: ReserveFormSeat | null;
  studyHallName: string;
  returningMember?: { id: string; name: string; phoneNumber: string | null } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    getDefaultStartDate,
  );
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
  const [paymentPending, startPaymentTransition] = React.useTransition();

  const reservationSeatNumber = normalizeSeatNumber(
    seat?.reserveSeatNumber ?? seat?.seatNumber,
  );
  const isAvailable = seat?.status === "available";
  const subscription = seat?.subscription;
  const smartRenewalPreview = React.useMemo(
    () =>
      subscription
        ? getSmartRenewalPreview(subscription.endDateISO, renewDate)
        : null,
    [subscription, renewDate],
  );

  const handleStartDateChange = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const adjustedDate = new Date(selectedDate);
      adjustedDate.setHours(0, 0, 0, 0);
      setStartDate(adjustedDate);
      if (date && adjustedDate > date) {
        const nextEndDate = new Date(adjustedDate);
        nextEndDate.setDate(nextEndDate.getDate() + 30);
        nextEndDate.setHours(23, 59, 59, 999);
        setDate(nextEndDate);
      }
    } else {
      setStartDate(undefined);
    }
  };

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
    setStartDate(getDefaultStartDate());
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
        const result = await renewSubscription(subscription.id, adjustedDate.toISOString());
        if (!result.success) {
          throw new Error(result.error || "تمدید اشتراک ناموفق بود.");
        }
        toast.success(result.message || "تمدید اشتراک با موفقیت ثبت شد.");
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
        const result = await swapSeat(subscription.id, parsedSeatNumber);
        if (!result.success) {
          throw new Error(result.error || "جابجایی صندلی ناموفق بود.");
        }
        toast.success(result.message || "دانش‌آموز با موفقیت به صندلی جدید منتقل شد.");
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
        const result = await releaseSeat(subscription.id);
        if (!result.success) {
          throw new Error(result.error || "تخلیه صندلی ناموفق بود.");
        }
        toast.success(result.message || "صندلی با موفقیت تخلیه شد.");
        onOpenChange(false);
      } catch (error) {
        toast.error(getActionErrorMessage(error, "تخلیه صندلی ناموفق بود."));
      }
    });
  }

  function handlePaymentStatusToggle() {
    if (!subscription) return;

    const nextStatus = subscription.paymentStatus === "paid" ? "unpaid" : "paid";
    startPaymentTransition(async () => {
      try {
        const result = await updatePaymentStatus(subscription.id, nextStatus);
        if (!result.success) {
          throw new Error(result.error || "تغییر وضعیت پرداخت ناموفق بود.");
        }
        toast.success(result.message || "وضعیت پرداخت با موفقیت به‌روزرسانی شد.");
      } catch (error) {
        toast.error(getActionErrorMessage(error, "تغییر وضعیت پرداخت ناموفق بود."));
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
          {isAvailable && returningMember ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-right text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              اطلاعات {returningMember.name} از آرشیو اعضا آماده شده؛ فقط صندلی و تاریخ‌های اشتراک را تأیید کنید.
            </div>
          ) : null}
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
                      defaultValue={returningMember?.phoneNumber ?? ""}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="memberName">نام دانش‌آموز</FieldLabel>
                    <Input
                      id="memberName"
                      name="memberName"
                      placeholder="نام و نام خانوادگی"
                      defaultValue={returningMember?.name ?? ""}
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
                    <FieldLabel htmlFor="startDate">
                      تاریخ شروع اشتراک
                    </FieldLabel>
                    <input
                      id="startDate"
                      type="hidden"
                      name="startDate"
                      value={startDate ? startDate.toISOString() : ""}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          {startDate ? (
                            format(startDate, "yyyy/MM/dd")
                          ) : (
                            <span>انتخاب تاریخ شروع</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={startDate}
                          onSelect={handleStartDateChange}
                          disabled={(day) => {
                            const normalized = new Date(day);
                            normalized.setHours(0, 0, 0, 0);
                            return normalized < getEarliestAllowedStartDate();
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
                            <span>انتخاب تاریخ پایان</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={date}
                          onSelect={handleDateChange}
                          disabled={(day) => {
                            const normalized = new Date(day);
                            normalized.setHours(0, 0, 0, 0);
                            const minEndDate = startDate
                              ? new Date(startDate)
                              : getDefaultStartDate();
                            minEndDate.setHours(0, 0, 0, 0);
                            return normalized <= minEndDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Button
                    type="submit"
                    disabled={pending || !reservationSeatNumber || !startDate || !date}
                  >
                    {pending ? <Loader className="animate-spin" /> : "رزرو"}
                  </Button>
                </FieldGroup>
              )}
            </ActionForm>
          ) : subscription ? (
            <Tabs defaultValue="current" className="text-right">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">مدیریت فعلی</TabsTrigger>
                <TabsTrigger value="history">تاریخچه صندلی</TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="space-y-4">
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-muted-foreground" />
                    <span>پایان فعلی اشتراک: {subscription.endDate}</span>
                  </div>
                  <Button
                    type="button"
                    variant={subscription.paymentStatus === "paid" ? "outline" : "default"}
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-[10px]",
                      subscription.paymentStatus === "paid"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-amber-500 text-white hover:bg-amber-600",
                    )}
                    onClick={handlePaymentStatusToggle}
                    disabled={paymentPending}
                  >
                    {paymentPending ? (
                      <Loader className="size-3 animate-spin" />
                    ) : subscription.paymentStatus === "paid" ? (
                      "پرداخت شده"
                    ) : (
                      "تسویه نشده"
                    )}
                  </Button>
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
                <div className="rounded-2xl border bg-muted/40 p-3 text-xs leading-6 text-muted-foreground">
                  <div className="font-medium text-foreground">
                    پایان فعلی: {subscription.endDate}
                  </div>
                  <div>{smartRenewalPreview?.helpText}</div>
                </div>
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
                  {smartRenewalPreview?.buttonText ?? "تمدید اشتراک"}
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
              </TabsContent>
              <TabsContent value="history">
                <SeatHistoryTimeline history={seat?.history ?? []} />
              </TabsContent>
            </Tabs>
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
