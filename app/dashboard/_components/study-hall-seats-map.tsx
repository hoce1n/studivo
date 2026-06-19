"use client";

import { useState } from "react";
import Link from "next/link";
import { Armchair, Filter, Search, XIcon } from "lucide-react";

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
  type ReserveFormSeat,
} from "@/app/dashboard/_components/reserve-form";
import { SeatCard } from "@/app/dashboard/_components/seat-card";

type SeatStatus = ReserveFormSeat["status"];

type StatusCopy = Record<
  SeatStatus,
  {
    label: string;
    className: string;
    dot: string;
  }
>;

type SeatMapItem = ReserveFormSeat;

type StudyHallSeatsMapProps = {
  seats: SeatMapItem[];
  shouldSortByRenewal: boolean;
  statusCopy: StatusCopy;
  stats: Record<SeatStatus, string>;
};

export function StudyHallSeatsMap({
  seats,
  shouldSortByRenewal,
  statusCopy,
  stats,
}: StudyHallSeatsMapProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeat, setSelectedSeat] = useState<SeatMapItem | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase("fa-IR");
  const isSearchActive = normalizedSearchQuery.length >= 3;

  const handleSeatSelect = (seat: SeatMapItem) => {
    setSelectedSeat(seat);
  };

  const handleReserveSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedSeat(null);
    }
  };

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
              وضعیت هر صندلی بر اساس تاریخ پایان اشتراک به‌روز می‌شود.
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
        {seats.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
            {seats.map((seat) => {
              const copy = statusCopy[seat.status];
              const studentName = seat.subscription?.memberName ?? "";
              const isMatch = studentName
                .toLocaleLowerCase("fa-IR")
                .includes(normalizedSearchQuery);

              return (
                <button
                  key={seat.id}
                  type="button"
                  className={cn(
                    "rounded-2xl text-right focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    isSearchActive && !isMatch && "pointer-events-none",
                  )}
                  onClick={() => handleSeatSelect(seat)}
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
                    subscription={seat.subscription}
                  />
                </button>
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
        maxSeats={seats.length}
        open={selectedSeat !== null}
        seat={selectedSeat}
        onOpenChange={handleReserveSheetOpenChange}
      />
    </Card>
  );
}
