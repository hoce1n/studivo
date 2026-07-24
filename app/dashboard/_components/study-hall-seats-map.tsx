"use client";

import { useState } from "react";
import Link from "next/link";
import { Armchair, Filter, Search, Wrench, XIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ReserveForm,
  type AvailableSeatOption,
  type MembershipPlanOption,
  type ReserveFormSeat,
} from "@/app/dashboard/_components/reserve-form";
import { SeatCard } from "@/app/dashboard/_components/seat-card";
import {
  formatDate,
  getActiveAssignment,
  getSeatStatus,
} from "@/app/dashboard/_lib/dashboard-utils";

type SeatStatus = ReserveFormSeat["status"];

type StatusCopy = Record<
  SeatStatus,
  {
    label: string;
    className: string;
    dot: string;
  }
>;

type DashboardSeatData = {
  id: string;
  number: string;
  isActive: boolean;
  sectionId: string | null;
  sectionName: string;
  sectionIsActive: boolean;
  assignments: {
    id: string;
    startsAt: Date;
    endsAt: Date | null;
    membership: {
      id: string;
      status: string;
      startsAt: Date;
      endsAt: Date;
      planName: string;
      planDurationDays: number;
      planPrice: number;
      hasFixedSeat: boolean;
      user: {
        name: string;
        phoneNumber: string | null;
      };
      payments: { id: string; status: string; method: string }[];
    };
  }[];
};

type StudyHallSeatsMapProps = {
  seats: DashboardSeatData[];
  availableSeats: AvailableSeatOption[];
  membershipPlans: MembershipPlanOption[];
  shouldSortByRenewal: boolean;
  statusCopy: StatusCopy;
  stats: Record<SeatStatus, string>;
  studyHallName: string;
  returningMember?: {
    id: string;
    name: string;
    phoneNumber: string | null;
  } | null;
};

function naturalSeatCompare(a: string, b: string) {
  return a.localeCompare(b, "fa-IR-u-kn-true", {
    numeric: true,
    sensitivity: "base",
  });
}

function paymentStatusFromPayments(
  payments: { status: string }[],
): "paid" | "pending" | "unpaid" {
  const latest = payments[0];
  if (!latest) return "unpaid";
  if (latest.status === "COMPLETED") return "paid";
  if (latest.status === "PENDING") return "pending";
  return "unpaid";
}

function toSeatMapItem(
  seat: DashboardSeatData,
  activeAssignmentsByMembership: Map<string, string[]>,
): ReserveFormSeat {
  const activeAssignment = getActiveAssignment(seat.assignments);
  const membership = activeAssignment?.membership;

  const isDuplicate =
    membership?.id &&
    (activeAssignmentsByMembership.get(membership.id)?.length ?? 0) > 1;

  return {
    id: seat.id,
    seatAssignmentId: activeAssignment?.id,
    seatNumber: seat.number,
    isActive: seat.isActive,
    sectionId: seat.sectionId,
    sectionName: seat.sectionName,
    sectionIsActive: seat.sectionIsActive,
    status: getSeatStatus(membership?.endsAt, membership?.status),
    isDuplicate,
    duplicateSeats: isDuplicate
      ? activeAssignmentsByMembership.get(membership.id!)
      : undefined,
    membership: membership
      ? {
          id: membership.id,
          status: membership.status,
          memberName: membership.user.name ?? "بدون نام",
          phoneNumber: membership.user.phoneNumber ?? "—",
          endDate: formatDate(new Date(membership.endsAt)),
          startDateISO: new Date(membership.startsAt).toISOString(),
          endDateISO: new Date(membership.endsAt).toISOString(),
          planName: membership.planName,
          planDurationDays: membership.planDurationDays,
          planPrice: Number(membership.planPrice),
          hasFixedSeat: membership.hasFixedSeat,
          paymentStatus: paymentStatusFromPayments(membership.payments),
          paymentMethod: membership.payments[0]?.method,
        }
      : undefined,
    history: seat.assignments
      .filter((assignment) => assignment.id !== activeAssignment?.id)
      .map((assignment) => ({
        id: assignment.id,
        memberName: assignment.membership.user.name ?? "بدون نام",
        phoneNumber: assignment.membership.user.phoneNumber ?? "—",
        startDate: formatDate(new Date(assignment.membership.startsAt)),
        endDate: formatDate(new Date(assignment.membership.endsAt)),
        status: assignment.membership.status.toLowerCase(),
        paymentStatus: paymentStatusFromPayments(
          assignment.membership.payments,
        ),
      })),
  };
}

export function StudyHallSeatsMap({
  seats,
  availableSeats,
  membershipPlans,
  shouldSortByRenewal,
  statusCopy,
  stats,
  studyHallName,
  returningMember,
}: StudyHallSeatsMapProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<ReserveFormSeat | null>(
    null,
  );
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("fa-IR");
  const isSearchActive = normalizedSearchQuery.length >= 3;

  // Track active assignments by membership ID to find duplicates
  const activeAssignmentsByMembership = new Map<string, string[]>();
  seats.forEach((seat) => {
    const active = getActiveAssignment(seat.assignments);
    if (active?.membership.id) {
      const existing =
        activeAssignmentsByMembership.get(active.membership.id) || [];
      activeAssignmentsByMembership.set(active.membership.id, [
        ...existing,
        seat.number,
      ]);
    }
  });

  const seatItems = seats.map((s) =>
    toSeatMapItem(s, activeAssignmentsByMembership),
  );
  const sortedSeats = shouldSortByRenewal
    ? [...seatItems].sort((a, b) => {
        const timeA = a.membership
          ? new Date(a.membership.endDateISO).getTime()
          : Infinity;
        const timeB = b.membership
          ? new Date(b.membership.endDateISO).getTime()
          : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return naturalSeatCompare(a.seatNumber, b.seatNumber);
      })
    : [...seatItems].sort((a, b) =>
        naturalSeatCompare(a.seatNumber, b.seatNumber),
      );

  const visibleSeats = sortedSeats.filter((seat) => seat.sectionIsActive);
  const groupedSeats = visibleSeats.reduce((groups, seat) => {
    const key = seat.sectionId ?? "unassigned";
    const current = groups.get(key);
    if (current) current.seats.push(seat);
    else {
      groups.set(key, {
        name: seat.sectionId ? seat.sectionName : "صندلی‌های عمومی",
        seats: [seat],
      });
    }
    return groups;
  }, new Map<string, { name: string; seats: ReserveFormSeat[] }>());

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full">
            <Search className="absolute top-2 right-2 size-4 text-muted-foreground" />
            <Input
              className="px-8"
              placeholder="جستجو..."
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="جستجوی نام دانش‌آموز"
            />
            {searchQuery.length > 0 ? (
              <button
                type="button"
                className="absolute top-1.5 left-1.5 inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                onClick={() => setSearchQuery("")}
                aria-label="پاک کردن جستجو"
              >
                <XIcon className="size-4" />
              </button>
            ) : null}
          </div>
          <div className="space-y-1">
            <CardTitle>نقشه زنده صندلی‌ها</CardTitle>
            <CardDescription>
              وضعیت هر صندلی بر اساس عضویت و تاریخ پایان به‌روز می‌شود.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={shouldSortByRenewal ? "?" : "?sortBy=renewal"}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                shouldSortByRenewal
                  ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {shouldSortByRenewal ? (
                <div className="flex gap-1">
                  <XIcon className="size-3.5" />
                  <span>لغو فیلتر</span>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Filter className="size-3.5" />
                  <span>مرتب سازی بر اساس تاریخ اشتراک</span>
                </div>
              )}
            </Link>
            {Object.entries(statusCopy).map(([key, copy]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
              >
                <span
                  className={cn("size-2 rounded-full", copy.dot)}
                  aria-hidden
                />
                {copy.label}
                <span className="font-semibold">
                  {stats[key as SeatStatus]}
                </span>
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visibleSeats.length ? (
          <div className="grid gap-5">
            {[...groupedSeats.entries()].map(([sectionId, group]) => {
              const availableCount = group.seats.filter(
                (seat) => seat.isActive && seat.status === "available",
              ).length;
              return (
                <section
                  key={sectionId}
                  className="rounded-2xl border bg-muted/10 p-3 sm:p-4"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{group.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {group.seats.length} صندلی · {availableCount} صندلی خالی
                      </p>
                    </div>
                    {sectionId === "unassigned" ? (
                      <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                        بدون بخش
                      </span>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 ">
                    {group.seats.map((seat) => {
                      const copy = statusCopy[seat.status];
                      const studentName = seat.membership?.memberName ?? "";
                      const isMatch = studentName
                        .toLocaleLowerCase("fa-IR")
                        .includes(normalizedSearchQuery);

                      if (!seat.isActive) {
                        return (
                          <div
                            key={seat.id}
                            className="rounded-2xl border border-dashed border-amber-300 bg-muted/60 p-3 text-muted-foreground opacity-75"
                            aria-label={`صندلی ${seat.seatNumber} خارج از سرویس`}
                          >
                            <div className="flex items-center justify-between gap-2 text-sm font-bold">
                              <span>صندلی {seat.seatNumber}</span>
                              <Wrench className="size-4 text-amber-600" />
                            </div>
                            <p className="mt-3 text-xs">خارج از سرویس</p>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          className={cn(
                            "rounded-2xl text-right focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            isSearchActive && !isMatch && "pointer-events-none",
                          )}
                          onClick={() => setSelectedSeat(seat)}
                          aria-label={`باز کردن ${seat.status === "available" ? "فرم رزرو" : "مدیریت"} صندلی ${seat.seatNumber}`}
                        >
                          <SeatCard
                            seatNumber={seat.seatNumber}
                            statusLabel={copy.label}
                            className={cn(
                              copy.className,
                              "h-full transition-all duration-200",
                              isSearchActive &&
                                !isMatch &&
                                "scale-95 opacity-20 blur-[0.5px]",
                              isSearchActive &&
                                isMatch &&
                                "z-10 scale-105 ring-2 ring-indigo-500",
                            )}
                            dotClass={copy.dot}
                            isDuplicate={seat.isDuplicate}
                            duplicateSeats={seat.duplicateSeats}
                            membership={seat.membership}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-12 text-center">
            <Armchair className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">هنوز صندلی‌ای ثبت نشده است.</p>
            <p className="text-xs text-muted-foreground">
              از بخش تنظیمات، تعداد صندلی‌ها را مشخص کنید.
            </p>
          </div>
        )}
      </CardContent>
      <ReserveForm
        membershipPlans={membershipPlans}
        availableSeats={availableSeats}
        open={selectedSeat !== null}
        seat={selectedSeat}
        studyHallName={studyHallName}
        returningMember={returningMember}
        onOpenChange={(open) => {
          if (!open) setSelectedSeat(null);
        }}
      />
    </Card>
  );
}
