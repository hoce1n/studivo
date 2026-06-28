"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getVenueById } from "@/app/actions/platform";
import { VenueDetailSheet } from "@/app/platform/_components/venue-detail-sheet";
import type { VenueRow, VenueDetail } from "@/app/actions/platform";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(date)
  );
}

export const GENDER_LABELS: Record<string, string> = {
  male: "آقایان",
  female: "بانوان",
  mixed: "مختلط",
  unspecified: "نامشخص",
};

function OccupancyBadge({
  active,
  total,
}: {
  active: number;
  total: number;
}) {
  if (total === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  const pct = Math.round((active / total) * 100);
  const variant =
    pct >= 90
      ? "destructive"
      : pct >= 60
        ? "warning"
        : pct >= 30
          ? "secondary"
          : "outline";
  return (
    <Badge variant={variant as never}>
      {new Intl.NumberFormat("fa-IR").format(pct)}٪
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface VenuesTableProps {
  venues: VenueRow[];
}

export function VenuesTable({ venues }: VenuesTableProps) {
  const [selectedVenue, setSelectedVenue] = React.useState<VenueDetail | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [isLoadingDetail, startDetailTransition] = React.useTransition();

  function handleRowClick(venueId: string) {
    setSheetOpen(true);
    startDetailTransition(async () => {
      const detail = await getVenueById(venueId);
      setSelectedVenue(detail);
    });
  }

  const fmt = (n: number) => new Intl.NumberFormat("fa-IR").format(n);

  return (
    <>
      {/* Row count */}
      <div className="flex items-center justify-end">
        <span className="text-xs text-muted-foreground">
          {fmt(venues.length)} سالن
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام سالن</TableHead>
              <TableHead>نوع / جنسیت</TableHead>
              <TableHead className="text-center">کل صندلی‌ها</TableHead>
              <TableHead className="text-center">اعضای فعال</TableHead>
              <TableHead className="text-center">اشغال</TableHead>
              <TableHead>تاریخ ثبت</TableHead>
              <TableHead>لید مرتبط</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {venues.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  هیچ سالنی ثبت نشده است.
                </TableCell>
              </TableRow>
            ) : (
              venues.map((venue) => (
                <TableRow
                  key={venue.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(venue.id)}
                  aria-label={`مشاهده جزئیات سالن ${venue.name}`}
                >
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {GENDER_LABELS[venue.gender] ?? venue.gender}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {fmt(venue.totalSeats)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {fmt(venue._count.activeSubscriptions)}
                  </TableCell>
                  <TableCell className="text-center">
                    <OccupancyBadge
                      active={venue._count.activeSubscriptions}
                      total={venue.totalSeats}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(venue.createdAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {venue.lead ? (
                      <span className="text-sm">
                        {venue.lead.name ?? venue.lead.venueName ?? "—"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Skeleton rows while loading detail */}
      {isLoadingDetail && (
        <div className="flex flex-col gap-2 px-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}

      {/* Detail sheet */}
      <VenueDetailSheet
        venue={isLoadingDetail ? null : selectedVenue}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
