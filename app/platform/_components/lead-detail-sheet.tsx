"use client";

import * as React from "react";
import { toast } from "sonner";
import { Phone, Mail, Building2, MessageSquare, CalendarDays } from "lucide-react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { updateLeadStatus } from "@/app/actions/platform/leads";
import type { LeadDetail } from "@/app/actions/platform/leads";
import { convertLeadToStudyHall } from "@/app/actions/platform/venues"

export const STATUS_LABELS: Record<string, string> = {
  NEW: "جدید",
  CONTACTED: "تماس گرفته شده",
  DEMO: "دمو",
  TRIAL: "آزمایشی",
  CUSTOMER: "مشتری",
  LOST: "از دست رفته",
};

export const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "muted"
> = {
  NEW: "default",
  CONTACTED: "secondary",
  DEMO: "warning",
  TRIAL: "outline",
  CUSTOMER: "success",
  LOST: "destructive",
};

export const SOURCE_LABELS: Record<string, string> = {
  MARKETING_SITE: "سایت بازاریابی",
  REFERRAL: "معرفی",
  DIRECT: "مستقیم",
  OTHER: "سایر",
};

const ALL_STATUSES = ["NEW", "CONTACTED", "DEMO", "TRIAL", "CUSTOMER", "LOST"];

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function DemoRequestList({ demos }: { demos: LeadDetail["demoRequests"] }) {
  if (demos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        هیچ درخواست دمویی ثبت نشده است.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {demos.map((demo: LeadDetail["demoRequests"][number]) => (
        <li
          key={demo.id}
          className="flex flex-col gap-1 rounded-xl border bg-muted/30 p-3 text-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">
              {demo.status === "requested"
                ? "درخواست ارسال شده"
                : demo.status === "scheduled"
                  ? "برنامه‌ریزی شده"
                  : demo.status === "completed"
                    ? "برگزار شده"
                    : "لغو شده"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(demo.createdAt)}
            </span>
          </div>
          {demo.preferredTime && (
            <p className="text-xs text-muted-foreground">
              زمان پیشنهادی: {demo.preferredTime}
            </p>
          )}
          {demo.scheduledAt && (
            <p className="text-xs text-muted-foreground">
              زمان برنامه‌ریزی شده: {formatDateTime(demo.scheduledAt)}
            </p>
          )}
          {demo.notes && (
            <p className="text-xs text-muted-foreground">یادداشت: {demo.notes}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

interface LeadDetailSheetProps {
  lead: LeadDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin: boolean;
}

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  isSuperAdmin,
}: LeadDetailSheetProps) {
  const [selectedStatus, setSelectedStatus] = React.useState<string>(
    lead?.status ?? "NEW"
  );
  const [lostReason, setLostReason] = React.useState<string>(
    lead?.lostReason ?? ""
  );
  // Tracks the studyhallId after a successful conversion in this session.
  // Distinct from lead.studyhallId so the success panel shows even before the
  // sheet is closed and re-opened with fresh data.
  const [convertedStudyhallId, setConvertedStudyhallId] = React.useState<
    string | null
  >(lead?.studyhallId ?? null);
  const [isPendingStatus, startStatusTransition] = React.useTransition();
  const [isPendingConvert, startConvertTransition] = React.useTransition();

  // Sync local state when a new lead is loaded.
  React.useEffect(() => {
    if (lead) {
      setSelectedStatus(lead.status);
      setLostReason(lead.lostReason ?? "");
      setConvertedStudyhallId(lead.studyhallId ?? null);
    }
  }, [lead]);

  function handleStatusUpdate() {
    if (!lead) return;
    const formData = new FormData();
    formData.set("leadId", lead.id);
    formData.set("status", selectedStatus);
    if (selectedStatus === "LOST" && lostReason.trim()) {
      formData.set("lostReason", lostReason.trim());
    }
    startStatusTransition(async () => {
      const result = await updateLeadStatus(formData);
      if (result.success) {
        toast.success(result.message ?? "وضعیت به‌روز شد.");
      } else {
        toast.error(result.error ?? "خطا در به‌روزرسانی وضعیت.");
      }
    });
  }

  function handleConvert() {
    if (!lead) return;
    const formData = new FormData();
    formData.set("leadId", lead.id);
    startConvertTransition(async () => {
      const result = await convertLeadToStudyHall(formData);
      if (result.success) {
        toast.success(result.message ?? "تبدیل انجام شد.");
        if (result.data?.studyhallId) {
          setConvertedStudyhallId(result.data.studyhallId);
        }
      } else {
        toast.error(result.error ?? "خطا در تبدیل لید.");
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full max-w-lg flex-col gap-0 overflow-y-auto p-0"
      >
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-base">
            {lead?.name ?? "لید بدون نام"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {lead && (
              <>
                <Badge variant={STATUS_VARIANTS[lead.status] ?? "outline"}>
                  {STATUS_LABELS[lead.status] ?? lead.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </span>
              </>
            )}
          </SheetDescription>
        </SheetHeader>

        {!lead ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6">
            {/* Contact info */}
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                اطلاعات تماس
              </h3>
              <ul className="flex flex-col gap-2 text-sm">
                {lead.phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                    <span dir="ltr">{lead.phone}</span>
                  </li>
                )}
                {lead.email && (
                  <li className="flex items-center gap-2">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </li>
                )}
                {lead.venueName && (
                  <li className="flex items-center gap-2">
                    <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>{lead.venueName}</span>
                  </li>
                )}
                {lead.message && (
                  <li className="flex items-start gap-2">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="whitespace-pre-wrap text-muted-foreground">
                      {lead.message}
                    </span>
                  </li>
                )}
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span>ثبت: {formatDateTime(lead.createdAt)}</span>
                </li>
                {lead.owner && (
                  <li className="text-xs text-muted-foreground">
                    مسئول: {lead.owner.name}
                  </li>
                )}
              </ul>
            </section>

            <Separator />

            {/* Status updater */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                وضعیت لید
              </h3>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ALL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {selectedStatus === "LOST" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lostReason" className="text-xs">
                    دلیل از دست دادن (اختیاری)
                  </Label>
                  <Input
                    id="lostReason"
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="مثلاً: رقیب قیمت کمتری داد"
                    maxLength={500}
                  />
                </div>
              )}

              <Button
                onClick={handleStatusUpdate}
                disabled={isPendingStatus || selectedStatus === lead.status}
                size="sm"
              >
                {isPendingStatus ? "در حال ذخیره..." : "ذخیره وضعیت"}
              </Button>
            </section>

            <Separator />

            {/* Demo requests */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                درخواست‌های دمو ({lead.demoRequests.length})
              </h3>
              <DemoRequestList demos={lead.demoRequests} />
            </section>

            {/* Convert section — SUPER_ADMIN only */}
            {isSuperAdmin && (
              <>
                <Separator />
                <section className="flex flex-col gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    تبدیل به سالن مطالعه
                  </h3>

                  {convertedStudyhallId ? (
                    // Success state — shown immediately after conversion or if
                    // the lead was already converted previously.
                    <div className="flex flex-col gap-2 rounded-xl border border-dashed bg-muted/30 p-4">
                      <p className="text-sm font-medium">
                        سالن مطالعه با موفقیت ایجاد شد.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        سالن در تب «سالن‌ها» قابل مشاهده است. مدیر سالن
                        می‌تواند پس از دریافت دعوت‌نامه وارد شود.
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/platform?tab=venues">
                          مشاهده سالن در لیست
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    // Convert button — shown only when not yet converted.
                    <>
                      <p className="text-xs text-muted-foreground">
                        یک سالن مطالعه جدید ایجاد می‌شود و لید به وضعیت «مشتری»
                        تغییر می‌کند. در صورت وجود ایمیل، یک کاربر مدیر پیش‌نویس
                        ساخته می‌شود.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleConvert}
                        disabled={isPendingConvert || lead.status === "CUSTOMER"}
                      >
                        {isPendingConvert
                          ? "در حال پردازش..."
                          : "تبدیل به سالن مطالعه"}
                      </Button>
                    </>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
