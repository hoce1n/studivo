"use client";

import * as React from "react";
import {
  MapPin,
  CalendarDays,
  Users,
  Armchair,
  Banknote,
  Link2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GENDER_LABELS } from "@/app/platform/_components/venues-table";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/app/platform/_components/lead-detail-sheet";
import { ContractView, type ContractData } from "@/app/platform/_components/contract-view";
import type { VenueDetail } from "@/app/actions/platform";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(
    new Date(date)
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n);
}

function OccupancyBar({
  active,
  total,
}: {
  active: number;
  total: number;
}) {
  if (total === 0) return null;
  const pct = Math.round((active / total) * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {fmt(active)} / {fmt(total)} ({fmt(pct)}٪)
      </span>
    </div>
  );
}

interface VenueDetailSheetProps {
  venue: VenueDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VenueDetailSheet({
  venue,
  open,
  onOpenChange,
}: VenueDetailSheetProps) {
  const [activeTab, setActiveTab] = React.useState("details");

  const contractData = React.useMemo(() => {
    if (!venue) return null;

    const today = new Date();
    const contractDate = new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "long",
    }).format(today);

    let subscriptionPlan = "Custom Plan";
    if (venue.monthlyFee === 0) {
      subscriptionPlan = "Free Trial";
    } else if (venue.monthlyFee <= 890000) {
      subscriptionPlan = "پایه (Basic)";
    } else if (venue.monthlyFee <= 1490000) {
      subscriptionPlan = "حرفه‌ای (Professional)";
    } else {
      subscriptionPlan = "ویژه (Premium)";
    }

    const contractNumber = `STD-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${venue.id.slice(0, 8).toUpperCase()}`;
    const managerName = venue.lead?.name || "مدیر سالن مطالعه";
    const phoneNumber = venue.lead?.phone || "ثبت نشده";

    return {
      contractNumber,
      contractDate,
      customerName: venue.name,
      managerName,
      phoneNumber,
      subscriptionPlan,
      version: "v1.0",
      status: "Active",
    } as ContractData;
  }, [venue]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full max-w-lg flex-col gap-0 overflow-y-auto p-0"
      >
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-base">
            {venue?.name ?? "جزئیات سالن"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            {venue && (
              <Badge variant="outline">
                {GENDER_LABELS[venue.gender] ?? venue.gender}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        {!venue ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col gap-0"
          >
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent px-6 py-0">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="contract"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Contract
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 flex flex-col gap-6 p-6">
            {/* Core info */}
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                اطلاعات سالن
              </h3>
              <ul className="flex flex-col gap-2 text-sm">
                {venue.address && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{venue.address}</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Armchair className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {fmt(venue.totalSeats)} صندلی
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {fmt(venue._count.users)} کاربر ثبت‌نام شده
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Banknote className="size-3.5 shrink-0 text-muted-foreground" />
                  <span>
                    {new Intl.NumberFormat("fa-IR", {
                      style: "currency",
                      currency: "IRR",
                      maximumFractionDigits: 0,
                    }).format(venue.monthlyFee)}{" "}
                    / ماه
                  </span>
                </li>
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span>ثبت: {formatDate(venue.createdAt)}</span>
                </li>
              </ul>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                اشغال فعلی
              </h3>
              <OccupancyBar
                active={venue._count.activeSubscriptions}
                total={venue.totalSeats}
              />
              {venue.totalSeats === 0 && (
                <p className="text-xs text-muted-foreground">
                  تعداد صندلی هنوز تنظیم نشده است.
                </p>
              )}
            </section>

            {venue.lead && (
              <>
                <Separator />
                <section className="flex flex-col gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    لید مرتبط
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm">
                    <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">
                      {venue.lead.name ?? venue.lead.venueName ?? "بدون نام"}
                    </span>
                    {venue.lead.phone && (
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {venue.lead.phone}
                      </span>
                    )}
                    <Badge
                      variant={STATUS_VARIANTS[venue.lead.status] ?? "outline"}
                      className="ms-auto"
                    >
                      {STATUS_LABELS[venue.lead.status] ?? venue.lead.status}
                    </Badge>
                  </div>
                </section>
              </>
            )}
            </TabsContent>

            <TabsContent value="contract" className="mt-0 overflow-y-auto">
              {contractData && <ContractView data={contractData} />}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
