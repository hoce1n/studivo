"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLeadById } from "@/app/actions/platform";
import {
  LeadDetailSheet,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SOURCE_LABELS,
} from "@/app/platform/_components/lead-detail-sheet";
import type { LeadRow, LeadDetail } from "@/app/actions/platform";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(
    new Date(date)
  );
}

const ALL_STATUSES = ["NEW", "CONTACTED", "DEMO", "TRIAL", "CUSTOMER", "LOST"];
const ALL_SOURCES = ["MARKETING_SITE", "REFERRAL", "DIRECT", "OTHER"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface LeadsTableProps {
  leads: LeadRow[];
  isSuperAdmin: boolean;
}

export function LeadsTable({ leads, isSuperAdmin }: LeadsTableProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = React.useState<string>("ALL");
  const [selectedLead, setSelectedLead] = React.useState<LeadDetail | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [isLoadingDetail, startDetailTransition] = React.useTransition();

  // Client-side filtering (data already fetched server-side sorted by createdAt desc).
  const filtered = leads.filter((lead) => {
    const matchStatus =
      statusFilter === "ALL" || lead.status === statusFilter;
    const matchSource =
      sourceFilter === "ALL" || lead.source === sourceFilter;
    return matchStatus && matchSource;
  });

  function handleRowClick(leadId: string) {
    setSheetOpen(true);
    startDetailTransition(async () => {
      const detail = await getLeadById(leadId);
      setSelectedLead(detail);
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">همه وضعیت‌ها</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue placeholder="منبع" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">همه منابع</SelectItem>
              {ALL_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <span className="ms-auto text-xs text-muted-foreground">
          {new Intl.NumberFormat("fa-IR").format(filtered.length)} لید
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>تلفن</TableHead>
              <TableHead>سالن پیشنهادی</TableHead>
              <TableHead>منبع</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>مسئول</TableHead>
              <TableHead>تاریخ ثبت</TableHead>
              <TableHead>دمو</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  لیدی با این فیلترها یافت نشد.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(lead.id)}
                  aria-label={`مشاهده جزئیات لید ${lead.name ?? "بدون نام"}`}
                >
                  <TableCell className="font-medium">
                    {lead.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">
                    {lead.phone ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-muted-foreground">
                    {lead.venueName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {SOURCE_LABELS[lead.source] ?? lead.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[lead.status] ?? "outline"}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.owner?.name ?? (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {new Intl.NumberFormat("fa-IR").format(
                      lead._count.demoRequests
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      <LeadDetailSheet
        lead={isLoadingDetail ? null : selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  );
}
