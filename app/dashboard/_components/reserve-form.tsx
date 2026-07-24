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

import { releaseSeat, swapSeat } from "@/app/actions/seats/manage";
import { reserveSeat } from "@/app/actions/seats/reserve";
import { renewMembership } from "@/app/actions/memberships/renew";
import { recordPayment } from "@/app/actions/memberships/payments";

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

export type MembershipPlanOption = {
  id: string;
  name: string;
  durationDays: number;
  price: number;
  hasFixedSeat: boolean;
};

export type AvailableSeatOption = {
  id: string;
  number: string;
  sectionId: string;
  sectionName: string;
};

export type ReserveFormSeat = {
  id: string;
  seatNumber: string;
  isActive: boolean;
  sectionId: string | null;
  sectionName: string;
  sectionIsActive: boolean;
  status: SeatStatus;
  isDuplicate?: boolean;
  duplicateSeats?: string[];
  seatAssignmentId?: string;
  membership?: {
    id: string;
    status: string;
    memberName: string;
    phoneNumber: string;
    endDate: string;
    startDateISO: string;
    endDateISO: string;
    planName: string;
    planDurationDays: number;
    planPrice: number;
    hasFixedSeat: boolean;
    paymentStatus?: "paid" | "pending" | "unpaid";
    paymentMethod?: string;
    payments: {
      id: string;
      amount: number;
      status: string;
      method: string;
      createdAt: string;
    }[];
  };
  history?: {
    id: string;
    memberName: string;
    phoneNumber: string;
    startDate: string;
    endDate: string;
    startsAtISO: string;
    endsAtISO: string;
    status: string;
    paymentStatus: string;
  }[];
};

const START_DATE_MAX_PAST_DAYS = 30;

const PAYMENT_METHODS = [
  { value: "CASH", label: "نقد" },
  { value: "POS", label: "کارتخوان" },
  { value: "CARD_TO_CARD", label: "کارت‌به‌کارت" },
  { value: "ONLINE", label: "آنلاین" },
] as const;

const membershipStatusLabels: Record<string, string> = {
  PENDING: "در انتظار",
  ACTIVE: "فعال",
  EXPIRED: "منقضی",
  CANCELLED: "لغوشده",
  pending: "در انتظار",
  active: "فعال",
  expired: "منقضی",
  cancelled: "لغوشده",
};

function startOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function endOfDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
}

function getDefaultStartDate() {
  return startOfDay(new Date());
}

function addPlanDays(start: Date, durationDays: number) {
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return endOfDay(end);
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
    default:
      return `${baseMessage}خواستار ارتباط با شما در خصوص صندلی شماره ${seatNumber} بودم.`;
  }
}

function SeatHistoryTimeline({
  history,
}: {
  history: NonNullable<ReserveFormSeat["history"]>;
}) {
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
        تاریخچه دانش‌آموزان این صندلی
      </div>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.id} className="relative border-r pr-4 text-sm">
            <span
              className="absolute -right-1.5 top-1.5 size-3 rounded-full bg-primary"
              aria-hidden
            />
            <div className="font-medium">{item.memberName}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">
              {item.phoneNumber}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {format(new Date(item.startsAtISO), "yyyy/MM/dd")} تا{" "}
              {item.endsAtISO
                ? format(new Date(item.endsAtISO), "yyyy/MM/dd")
                : "اکنون"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              وضعیت: {membershipStatusLabels[item.status] ?? item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getSmartRenewalPreview(
  currentEndDateISO: string,
  selectedDate: Date | undefined,
) {
  if (!selectedDate) {
    return {
      daysDifference: null,
      isRealRenewal: false,
      buttonText: "انتخاب تاریخ تمدید",
      helpText: "تاریخ جدید را انتخاب کنید تا نوع عملیات مشخص شود.",
    };
  }

  const currentEndDate = new Date(currentEndDateISO);
  const adjustedDate = endOfDay(selectedDate);
  const daysDifference = Math.ceil(
    (adjustedDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isRealRenewal = daysDifference > 7;

  return {
    daysDifference,
    isRealRenewal,
    buttonText: isRealRenewal ? "ثبت تمدید واقعی" : "اصلاح تاریخ پایان",
    helpText: isRealRenewal
      ? `بیش از ۷ روز اختلاف دارد؛ سابقه فعلی بسته می‌شود و عضویت جدید ساخته می‌شود (${daysDifference > 0 ? "+" : ""}${daysDifference} روز).`
      : `اختلاف ۷ روز یا کمتر است؛ فقط تاریخ پایان همین عضویت اصلاح می‌شود (${daysDifference > 0 ? "+" : ""}${daysDifference} روز).`,
  };
}

const selectClassName =
  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-2xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

export function ReserveForm({
  membershipPlans,
  availableSeats,
  open,
  seat,
  studyHallName,
  returningMember,
  onOpenChange,
}: {
  membershipPlans: MembershipPlanOption[];
  availableSeats: AvailableSeatOption[];
  open: boolean;
  seat: ReserveFormSeat | null;
  studyHallName: string;
  returningMember?: {
    id: string;
    name: string;
    phoneNumber: string | null;
  } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const defaultPlanId = membershipPlans[0]?.id ?? "";
  const [selectedPlanId, setSelectedPlanId] = React.useState(defaultPlanId);
  const [startDate, setStartDate] = React.useState<Date | undefined>(
    getDefaultStartDate,
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(() =>
    addPlanDays(getDefaultStartDate(), membershipPlans[0]?.durationDays ?? 30),
  );
  const [paymentMethod, setPaymentMethod] =
    React.useState<(typeof PAYMENT_METHODS)[number]["value"]>("CASH");
  const [paymentStatus, setPaymentStatus] = React.useState<
    "COMPLETED" | "PENDING"
  >("COMPLETED");
  const [amount, setAmount] = React.useState(
    String(membershipPlans[0]?.price ?? 0),
  );
  const [note, setNote] = React.useState("");

  const [renewDate, setRenewDate] = React.useState<Date | undefined>(() =>
    addPlanDays(getDefaultStartDate(), 30),
  );
  const [swapSeatId, setSwapSeatId] = React.useState("");
  const [managePaymentMethod, setManagePaymentMethod] =
    React.useState<(typeof PAYMENT_METHODS)[number]["value"]>("CASH");
  const [renewError, setRenewError] = React.useState<string | null>(null);
  const [swapError, setSwapError] = React.useState<string | null>(null);
  const [renewPending, startRenewTransition] = React.useTransition();
  const [swapPending, startSwapTransition] = React.useTransition();
  const [releasePending, startReleaseTransition] = React.useTransition();
  const [paymentPending, startPaymentTransition] = React.useTransition();

  const [currentSeat, setCurrentSeat] = React.useState<ReserveFormSeat | null>(
    seat,
  );

  const selectedPlan =
    membershipPlans.find((plan) => plan.id === selectedPlanId) ??
    membershipPlans[0];

  React.useEffect(() => {
    if (!seat) return;
    setCurrentSeat(seat);
    setRenewDate(addPlanDays(getDefaultStartDate(), 30));
    setSwapSeatId("");
    setManagePaymentMethod("CASH");

    const plan = membershipPlans[0];
    if (plan) {
      setSelectedPlanId(plan.id);
      const start = getDefaultStartDate();
      setStartDate(start);
      setEndDate(addPlanDays(start, plan.durationDays));
      setAmount(String(plan.price));
    }
    setPaymentMethod("CASH");
    setPaymentStatus("COMPLETED");
    setNote("");
  }, [seat, membershipPlans]);

  const applyPlanDates = React.useCallback(
    (plan: MembershipPlanOption | undefined, start: Date | undefined) => {
      if (!plan || !start) return;
      setEndDate(addPlanDays(start, plan.durationDays));
      setAmount(String(plan.price));
    },
    [],
  );

  const isAvailable = currentSeat?.status === "available";
  const membership = currentSeat?.membership;
  const seatAssignmentId = currentSeat?.seatAssignmentId;
  const totalPaid = React.useMemo(() => {
    return (
      membership?.payments
        ?.filter((p) => p.status === "COMPLETED")
        .reduce((sum, p) => sum + p.amount, 0) ?? 0
    );
  }, [membership]);

  const remainingBalance = React.useMemo(() => {
    if (!membership) return 0;
    return Math.max(0, membership.planPrice - totalPaid);
  }, [membership, totalPaid]);

  const smartRenewalPreview = React.useMemo(
    () =>
      membership
        ? getSmartRenewalPreview(membership.endDateISO, renewDate)
        : null,
    [membership, renewDate],
  );

  const swapSections = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const option of availableSeats) {
      map.set(option.sectionId, option.sectionName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [availableSeats]);

  const [swapSectionId, setSwapSectionId] = React.useState(
    swapSections[0]?.id ?? "",
  );

  React.useEffect(() => {
    if (
      swapSections.length &&
      !swapSections.some((s) => s.id === swapSectionId)
    ) {
      setSwapSectionId(swapSections[0]?.id ?? "");
    }
  }, [swapSections, swapSectionId]);

  const swapSeatsInSection = availableSeats.filter(
    (option) =>
      option.sectionId === swapSectionId && option.id !== currentSeat?.id,
  );

  const handleStartDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setStartDate(undefined);
      return;
    }
    const adjusted = startOfDay(selectedDate);
    setStartDate(adjusted);
    applyPlanDates(selectedPlan, adjusted);
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = membershipPlans.find((item) => item.id === planId);
    applyPlanDates(plan, startDate);
  };

  const handleSuccess = () => {
    onOpenChange(false);
  };

  function handleSendStatusMessage() {
    if (!seat || !membership) return;
    const message = getStatusMessage(
      seat.status,
      membership.memberName,
      seat.seatNumber,
      studyHallName,
    );
    window.open(
      `sms:${membership.phoneNumber}?body=${encodeURIComponent(message)}`,
      "_blank",
    );
  }

  function handleRenew(isAdjustment = false) {
    if (!membership || !renewDate) return;
    const adjustedDate = endOfDay(renewDate);
    setRenewError(null);
    startRenewTransition(async () => {
      try {
        const result = await renewMembership(membership.id, {
          endsAt: adjustedDate.toISOString(),
          startsAt: startDate?.toISOString(),
          membershipPlanId: selectedPlanId,
          isAdjustment,
        });
        if (!result.success) {
          throw new Error(
            result.error ||
              (isAdjustment ? "اصلاح تاریخ ناموفق بود." : "تمدید عضویت ناموفق بود."),
          );
        }
        toast.success(result.message || "عملیات با موفقیت انجام شد.");
        onOpenChange(false);
      } catch (error) {
        const message = getActionErrorMessage(
          error,
          isAdjustment ? "اصلاح تاریخ ناموفق بود." : "تمدید عضویت ناموفق بود.",
        );
        setRenewError(message);
        toast.error(message);
      }
    });
  }

  function handleSwap() {
    if (!membership || !swapSeatId) {
      setSwapError("صندلی مقصد را انتخاب کنید.");
      return;
    }
    setSwapError(null);
    startSwapTransition(async () => {
      try {
        if (!seatAssignmentId) {
          throw new Error("شناسه تخصیص صندلی نامعتبر است.");
        }
        const result = await swapSeat(seatAssignmentId, swapSeatId);
        if (!result.success) {
          throw new Error(result.error || "جابجایی صندلی ناموفق بود.");
        }
        toast.success(
          result.message || "دانش‌آموز با موفقیت به صندلی جدید منتقل شد.",
        );
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
    if (!seatAssignmentId) return;
    startReleaseTransition(async () => {
      try {
        const result = await releaseSeat(seatAssignmentId);
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

  const [managePaymentAmount, setManagePaymentAmount] = React.useState("");

  function handleRecordPayment() {
    if (!membership) return;
    const payAmount = Number(managePaymentAmount) || remainingBalance;

    if (payAmount <= 0) {
      toast.error("مبلغ پرداخت باید بزرگتر از صفر باشد.");
      return;
    }

    startPaymentTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("membershipId", membership.id);
        formData.set("amount", String(payAmount));
        formData.set("method", managePaymentMethod);

        const result = await recordPayment(formData);
        if (!result.success) {
          throw new Error(result.error || "ثبت پرداخت ناموفق بود.");
        }

        toast.success(result.message || "پرداخت با موفقیت ثبت شد.");
        onOpenChange(false);
      } catch (error) {
        toast.error(getActionErrorMessage(error, "ثبت پرداخت ناموفق بود."));
      }
    });
  }

  return (
    <Sheet key={seat?.id ?? "empty"} open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-right">
            {isAvailable
              ? "ثبت عضویت و رزرو صندلی"
              : `مدیریت صندلی ${currentSeat?.seatNumber ?? ""}`}
          </SheetTitle>
          <SheetDescription className="text-right">
            {isAvailable
              ? "طرح عضویت، پرداخت و صندلی را مطابق مدل v2 ثبت کنید."
              : "تمدید، پرداخت، انتقال بخش‌آگاه یا تخلیه عضویت."}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-6">
          {isAvailable && returningMember ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-right text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              اطلاعات {returningMember.name} از آرشیو اعضا آماده شده است.
            </div>
          ) : null}

          {isAvailable ? (
            <ActionForm
              key={currentSeat?.id ?? "empty"}
              action={reserveSeat}
              successMessage="عضویت با موفقیت ثبت شد."
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

                  <input
                    type="hidden"
                    name="seatId"
                    value={currentSeat?.id ?? ""}
                  />
                  <Field>
                    <FieldLabel>بخش / صندلی</FieldLabel>
                    <Input
                      readOnly
                      value={`${currentSeat?.sectionName ?? "—"} · صندلی ${currentSeat?.seatNumber ?? ""}`}
                    />
                    <p className="text-xs text-muted-foreground">
                      سلسله‌مراتب Section ← Seat از نقشه انتخاب شده است.
                    </p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="membershipPlanId">
                      طرح عضویت
                    </FieldLabel>
                    <select
                      id="membershipPlanId"
                      name="membershipPlanId"
                      className={selectClassName}
                      required
                      disabled={pending || membershipPlans.length === 0}
                      value={selectedPlanId}
                      onChange={(event) => handlePlanChange(event.target.value)}
                    >
                      {membershipPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ·{" "}
                          {plan.durationDays.toLocaleString("fa-IR")} روز ·{" "}
                          {plan.price.toLocaleString("fa-IR")} تومان
                          {plan.hasFixedSeat ? " · صندلی ثابت" : " · شناور"}
                        </option>
                      ))}
                    </select>
                    {selectedPlan ? (
                      <p className="text-xs text-muted-foreground">
                        اسنپ‌شات: {selectedPlan.name} /{" "}
                        {selectedPlan.durationDays.toLocaleString("fa-IR")} روز
                        /{" "}
                        {selectedPlan.hasFixedSeat
                          ? "صندلی ثابت"
                          : "بدون صندلی ثابت"}
                      </p>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel>تاریخ شروع</FieldLabel>
                    <input
                      type="hidden"
                      name="startsAt"
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
                          {startDate
                            ? format(startDate, "yyyy/MM/dd")
                            : "انتخاب تاریخ شروع"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={startDate}
                          onSelect={handleStartDateChange}
                          disabled={(day) =>
                            startOfDay(day) < getEarliestAllowedStartDate()
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

                  <Field>
                    <FieldLabel>تاریخ پایان</FieldLabel>
                    <input
                      type="hidden"
                      name="endsAt"
                      value={endDate ? endDate.toISOString() : ""}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-right font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                          {endDate
                            ? format(endDate, "yyyy/MM/dd")
                            : "انتخاب تاریخ پایان"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={endDate}
                          onSelect={(day) =>
                            setEndDate(day ? endOfDay(day) : undefined)
                          }
                          disabled={(day) => {
                            const min = startDate
                              ? startOfDay(startDate)
                              : getDefaultStartDate();
                            return startOfDay(day) <= min;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      با انتخاب طرح، پایان از روی durationDays پر می‌شود؛ قابل
                      ویرایش است.
                    </p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="paymentMethod">روش پرداخت</FieldLabel>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      className={selectClassName}
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target
                            .value as (typeof PAYMENT_METHODS)[number]["value"],
                        )
                      }
                      disabled={pending}
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="paymentStatus">
                      وضعیت پرداخت
                    </FieldLabel>
                    <select
                      id="paymentStatus"
                      name="paymentStatus"
                      className={selectClassName}
                      value={paymentStatus}
                      onChange={(event) =>
                        setPaymentStatus(
                          event.target.value as "COMPLETED" | "PENDING",
                        )
                      }
                      disabled={pending}
                    >
                      <option value="COMPLETED">پرداخت‌شده (COMPLETED)</option>
                      <option value="PENDING">بدهی / بعداً (PENDING)</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      COMPLETED → عضویت ACTIVE · PENDING → عضویت PENDING
                    </p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="amount">مبلغ (تومان)</FieldLabel>
                    <Input
                      id="amount"
                      name="amount"
                      inputMode="numeric"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="note">یادداشت (اختیاری)</FieldLabel>
                    <Input
                      id="note"
                      name="note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="توضیح کوتاه"
                    />
                  </Field>

                  <Button
                    type="submit"
                    disabled={
                      pending ||
                      !currentSeat?.id ||
                      !startDate ||
                      !endDate ||
                      membershipPlans.length === 0
                    }
                  >
                    {pending ? (
                      <Loader className="animate-spin" />
                    ) : (
                      "ثبت عضویت"
                    )}
                  </Button>
                </FieldGroup>
              )}
            </ActionForm>
          ) : membership ? (
            <Tabs defaultValue="current" className="text-right">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">مدیریت فعلی</TabsTrigger>
                <TabsTrigger value="history">تاریخچه صندلی</TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="space-y-4">
                <div className="space-y-2 rounded-2xl bg-muted/50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <span className="font-medium">{membership.memberName}</span>
                    <span className="ms-auto rounded-full border px-2 py-0.5 text-[10px]">
                      {membershipStatusLabels[membership.status] ??
                        membership.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" dir="ltr">
                    <Phone className="size-4 text-muted-foreground" />
                    <a
                      href={`tel:${membership.phoneNumber}`}
                      className="font-mono"
                    >
                      {membership.phoneNumber}
                    </a>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentSeat?.sectionName} · صندلی {currentSeat?.seatNumber}
                    {membership.hasFixedSeat ? " · صندلی ثابت" : " · شناور"}
                  </div>
                  <div className="text-xs">
                    طرح: {membership.planName} ·{" "}
                    {membership.planDurationDays.toLocaleString("fa-IR")} روز ·{" "}
                    {membership.planPrice.toLocaleString("fa-IR")} تومان
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-muted-foreground" />
                    <span>پایان: {membership.endDate}</span>
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
                  startDate={membership.startDateISO}
                  endDate={membership.endDateISO}
                  className="rounded-2xl border p-3"
                />

                <div className="space-y-3 rounded-2xl border p-3">
                  <div className="text-sm font-medium">وضعیت مالی</div>
                  <div className="flex justify-between text-xs">
                    <span>کل مبلغ طرح:</span>
                    <span>{membership.planPrice.toLocaleString("fa-IR")} تومان</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>مجموع پرداخت شده:</span>
                    <span>{totalPaid.toLocaleString("fa-IR")} تومان</span>
                  </div>
                  {remainingBalance > 0 && (
                    <div className="flex justify-between text-xs font-bold text-destructive">
                      <span>باقیمانده بدهی:</span>
                      <span>{remainingBalance.toLocaleString("fa-IR")} تومان</span>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
                      <Input
                        type="numeric"
                        placeholder="مبلغ (تومان)"
                        value={managePaymentAmount}
                        onChange={(e) => setManagePaymentAmount(e.target.value)}
                        className="h-9 text-xs"
                      />
                      <select
                        className={cn(selectClassName, "h-9 text-xs")}
                        value={managePaymentMethod}
                        onChange={(event) =>
                          setManagePaymentMethod(
                            event.target
                              .value as (typeof PAYMENT_METHODS)[number]["value"],
                          )
                        }
                        disabled={paymentPending}
                      >
                        {PAYMENT_METHODS.map((method) => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full"
                      onClick={handleRecordPayment}
                      disabled={paymentPending || remainingBalance <= 0}
                    >
                      {paymentPending ? (
                        <Loader className="animate-spin" />
                      ) : (
                        `ثبت پرداخت ${managePaymentAmount ? Number(managePaymentAmount).toLocaleString("fa-IR") : "باقیمانده"}`
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="space-y-2 rounded-2xl border p-3">
                    <div className="text-sm font-medium">تمدید یا تغییر طرح</div>
                    <select
                      className={cn(selectClassName, "h-9 text-xs")}
                      value={selectedPlanId}
                      onChange={(event) => handlePlanChange(event.target.value)}
                      disabled={renewPending}
                    >
                      {membershipPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ·{" "}
                          {plan.durationDays.toLocaleString("fa-IR")} روز
                        </option>
                      ))}
                    </select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs"
                        >
                          <CalendarPlus className="size-3" />
                          {renewDate
                            ? format(renewDate, "yyyy/MM/dd")
                            : "تاریخ جدید"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          className="w-full"
                          mode="single"
                          selected={renewDate}
                          onSelect={setRenewDate}
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="rounded-lg bg-muted/40 p-2 text-[10px] leading-5 text-muted-foreground">
                      <div className="font-medium text-foreground">
                        پایان فعلی: {membership.endDate}
                      </div>
                      <div>{smartRenewalPreview?.helpText}</div>
                    </div>

                    {renewError ? (
                      <p className="text-[10px] text-destructive">
                        {renewError}
                      </p>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => handleRenew(true)}
                        disabled={renewPending || !renewDate}
                      >
                        {renewPending ? (
                          <Loader className="animate-spin size-3" />
                        ) : (
                          "اصلاح تاریخ"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleRenew(false)}
                        disabled={renewPending || !renewDate}
                      >
                        {renewPending ? (
                          <Loader className="animate-spin size-3" />
                        ) : (
                          "ثبت تمدید"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-2xl border p-3">
                    <div className="text-sm font-medium">انتقال صندلی</div>
                    {swapSections.length > 1 ? (
                      <select
                        className={selectClassName}
                        value={swapSectionId}
                        onChange={(event) => {
                          setSwapSectionId(event.target.value);
                          setSwapSeatId("");
                        }}
                        disabled={swapPending}
                      >
                        {swapSections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    ) : null}
                    <div className="flex gap-2">
                      <select
                        className={selectClassName}
                        value={swapSeatId}
                        onChange={(event) => setSwapSeatId(event.target.value)}
                        disabled={
                          swapPending || swapSeatsInSection.length === 0
                        }
                      >
                        <option value="">صندلی مقصد</option>
                        {swapSeatsInSection.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.number}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSwap}
                        disabled={swapPending || !swapSeatId}
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
                  </div>

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
                          عضویت فعال {membership.memberName} لغو می‌شود و صندلی
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
                <SeatHistoryTimeline history={currentSeat?.history ?? []} />
              </TabsContent>
            </Tabs>
          ) : (
            <p className="rounded-2xl border border-dashed p-3 text-center text-sm text-muted-foreground">
              برای این صندلی عضویت فعالی ثبت نشده است.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
