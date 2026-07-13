"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Banknote,
  CalendarClock,
  CalendarIcon,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  History,
  Loader,
  MessageSquare,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns-jalali";

import {
  releaseSeat,
  reserveSeat,
  swapSeat,
} from "@/app/actions/seat";
import {
  renewSubscription,
  registerPayment,
  fetchMembershipPayments,
  PAYMENT_METHOD_LABELS,
  type MembershipPayment,
} from "@/app/actions/subscription";

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
    id: string; // Membership ID in Schema v2
    memberName: string;
    phoneNumber: string;
    endDate: string;
    startDateISO: string;
    endDateISO: string;
    /** planPrice in toman — pre-fills the payment amount field */
    planPrice: number;
    paymentStatus: "paid" | "unpaid";
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

const PAYMENT_METHODS = ["CASH", "POS", "CARD_TO_CARD", "ONLINE"] as const;

// ---------------------------------------------------------------------------
// PaymentPanel — inline payment registration and history
// ---------------------------------------------------------------------------
function PaymentPanel({
  membershipId,
  planPrice,
  paymentStatus,
}: {
  membershipId: string;
  planPrice: number;
  paymentStatus: "paid" | "unpaid";
}) {
  const [open, setOpen] = React.useState(false);
  const [payments, setPayments] = React.useState<MembershipPayment[] | null>(null);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  async function loadHistory() {
    setLoadingHistory(true);
    const result = await fetchMembershipPayments(membershipId);
    if (result.success) {
      setPayments(result.data ?? null);
    }
    setLoadingHistory(false);
  }

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && payments === null) {
      loadHistory();
    }
  }

  return (
    <div className="rounded-2xl border">
      {/* Header toggle */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          <Banknote className="size-4 text-muted-foreground" />
          <span>پرداخت</span>
          <span
            className={cn(
              "size-2 rounded-full",
              paymentStatus === "paid" ? "bg-emerald-500" : "bg-amber-500 animate-pulse",
            )}
            title={paymentStatus === "paid" ? "پرداخت شده" : "تسویه نشده"}
          />
        </div>
        {open ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Register payment form */}
          <ActionForm
            action={registerPayment}
            successMessage="پرداخت با موفقیت ثبت شد."
            onSuccess={() => {
              loadHistory();
            }}
            className="space-y-3"
          >
            {(pending) => (
              <>
                <input type="hidden" name="membershipId" value={membershipId} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor={`amount-${membershipId}`} className="text-xs font-medium">
                      مبلغ (تومان)
                    </label>
                    <Input
                      id={`amount-${membershipId}`}
                      name="amount"
                      type="number"
                      min={1}
                      step={1000}
                      defaultValue={planPrice}
                      required
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={`method-${membershipId}`} className="text-xs font-medium">
                      روش پرداخت
                    </label>
                    <select
                      id={`method-${membershipId}`}
                      name="method"
                      defaultValue="CASH"
                      required
                      className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-2xl border px-3 text-sm focus-visible:outline-none focus-visible:ring-2"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {PAYMENT_METHOD_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor={`note-${membershipId}`} className="text-xs font-medium">
                    یادداشت (اختیاری)
                  </label>
                  <Input
                    id={`note-${membershipId}`}
                    name="note"
                    placeholder="مثلاً: پرداخت نقدی در سالن"
                    maxLength={300}
                    className="h-9 text-sm"
                  />
                </div>

                <Button type="submit" size="sm" disabled={pending} className="w-full">
                  {pending ? <Loader className="size-3 animate-spin" /> : "ثبت پرداخت"}
                </Button>
              </>
            )}
          </ActionForm>

          {/* Payment history */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">سابقه پرداخت‌ها</p>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : payments === null || payments.length === 0 ? (
              <p className="rounded-2xl border border-dashed py-3 text-center text-xs text-muted-foreground">
                پرداختی ثبت نشده است.
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs",
                      p.status === "VOIDED" && "opacity-50 line-through",
                    )}
                  >
                    <div className="space-y-0.5">
                      <span className="font-medium">
                        {p.amount.toLocaleString("fa-IR")} تومان
                      </span>
                      <div className="text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[p.method as keyof typeof PAYMENT_METHOD_LABELS] ?? p.method}
                        {p.note ? ` · ${p.note}` : ""}
                      </div>
                    </div>
                    <div className="text-left text-muted-foreground">
                      {p.paidAt
                        ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(
                            new Date(p.paidAt),
                          )
                        : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReserveForm
// ---------------------------------------------------------------------------
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
  const [startDate, setStartDate] = React.useState<Date | undefined>(getDefaultStartDate);
  const [date, setDate] = React.useState<Date | undefined>(getDefaultEndDate);
  const [renewDate, setRenewDate] = React.useState<Date | undefined>(getDefaultEndDate);
  const [swapSeatNumber, setSwapSeatNumber] = React.useState("");
  const [renewError, setRenewError] = React.useState<string | null>(null);
  const [swapError, setSwapError] = React.useState<string | null>(null);
  const [renewPending, startRenewTransition] = React.useTransition();
  const [swapPending, startSwapTransition] = React.useTransition();
  const [releasePending, startReleaseTransition] = React.useTransition();

  const [currentSeat, setCurrentSeat] = React.useState<ReserveFormSeat | null>(seat);

  React.useEffect(() => {
    if (seat) {
      setCurrentSeat(seat);
      setRenewDate(getDefaultEndDate());
    }
  }, [seat]);

  const reservationSeatNumber = normalizeSeatNumber(
    currentSeat?.reserveSeatNumber ?? currentSeat?.seatNumber,
  );
  const isAvailable = currentSeat?.status === "available";
  const subscription = currentSeat?.subscription;
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
        const message = getActionErrorMessage(error, "تمدید اشتراک ناموفق بود.");
        setRenewError(message);
        toast.error(message);
      }
    });
  }

  function handleSwap() {
    if (!subscription) return;

    const cleanedSeatNumber = normalizeSeatNumber(swapSeatNumber);
    const parsedSeatNumber = Number(cleanedSeatNumber);
    if (!cleanedSeatNumber || Number.isNaN(parsedSeatNumber) || parsedSeatNumber < 1) {
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
        const message = getActionErrorMessage(error, "جابجایی صندلی ناموفق بود.");
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

  return (
    <Sheet key={seat?.id ?? "empty"} open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-right">
            {isAvailable
              ? "رزرو سریع صندلی"
              : `مدیریت صندلی ${currentSeat?.seatNumber ?? ""}`}
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
              action={reserveSeat}
              onSuccess={handleSuccess}
              className="mt-6"
            >
              {(pending) => (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="seatNumber">شماره صندلی</FieldLabel>
                    <Input
                      id="seatNumber"
                      name="seatNumber"
                      defaultValue={reservationSeatNumber}
                      placeholder="مثلاً ۱"
                      required
                      readOnly
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phoneNumber">تلفن دانش‌آموز</FieldLabel>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      defaultValue={returningMember?.phoneNumber ?? ""}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      required
                      inputMode="tel"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="memberName">نام و نام خانوادگی</FieldLabel>
                    <Input
                      id="memberName"
                      name="memberName"
                      defaultValue={returningMember?.name ?? ""}
                      placeholder="نام دانش‌آموز"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="startDate">تاریخ شروع اشتراک</FieldLabel>
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
                    <FieldLabel htmlFor="endDate">تاریخ پایان اشتراک</FieldLabel>
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
                    <a href={`tel:${subscription.phoneNumber}`} className="font-mono">
                      {subscription.phoneNumber}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-muted-foreground" />
                    <span>پایان فعلی اشتراک: {subscription.endDate}</span>
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

                {/* Payment panel — replaces the legacy paid/unpaid toggle */}
                <PaymentPanel
                  membershipId={subscription.id}
                  planPrice={subscription.planPrice}
                  paymentStatus={subscription.paymentStatus}
                />

                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <CalendarPlus />
                        {renewDate ? format(renewDate, "yyyy/MM/dd") : "تاریخ تمدید"}
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
                  <Button onClick={handleRenew} disabled={renewPending || !renewDate}>
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
                          تخلیه صندلی {currentSeat?.seatNumber}؟
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          اشتراک فعال {subscription.memberName} لغو می‌شود و صندلی خالی خواهد شد.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={releasePending}>انصراف</AlertDialogCancel>
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
                <SeatHistoryTimeline history={currentSeat?.history ?? []} />
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
