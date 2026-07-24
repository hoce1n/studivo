"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { Search, Filter, X } from "lucide-react";
import { auditActionLabels, auditEntityLabels } from "../_lib/log-utils";
import { AuditAction, AuditEntity } from "@/lib/generated/prisma/client";

interface LogFiltersProps {
  actors: { id: string; name: string }[];
  actions: AuditAction[];
  entities: AuditEntity[];
}

export function LogFilters({ actors, actions, entities }: LogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  );

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset to first page on filter change

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleReset() {
    setSearch("");
    setStartDate(undefined);
    setEndDate(undefined);
    router.push(pathname);
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="size-4" />
        <h3 className="font-bold">فیلترها</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="search">جستجو</Label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="جستجو در متادیتا یا شناسه..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateFilters({ search })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>از تاریخ</Label>
          <JalaliDatePicker
            value={startDate}
            onChange={(date) => {
              setStartDate(date);
              updateFilters({ startDate: date?.toISOString() || null });
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>تا تاریخ</Label>
          <JalaliDatePicker
            value={endDate}
            onChange={(date) => {
              setEndDate(date);
              updateFilters({ endDate: date?.toISOString() || null });
            }}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="action">نوع عملیات</Label>
          <select
            id="action"
            className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchParams.get("action") || ""}
            onChange={(e) => updateFilters({ action: e.target.value })}
          >
            <option value="">همه</option>
            {actions.map((a) => (
              <option key={a} value={a}>{auditActionLabels[a] || a}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entity">موجودیت</Label>
          <select
            id="entity"
            className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={searchParams.get("entityType") || ""}
            onChange={(e) => updateFilters({ entityType: e.target.value })}
          >
            <option value="">همه</option>
            {entities.map((e) => (
              <option key={e} value={e}>{auditEntityLabels[e] || e}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
          <X className="size-4" />
          پاک کردن فیلترها
        </Button>
        <Button size="sm" onClick={() => updateFilters({ search })}>
          اعمال فیلتر
        </Button>
      </div>
    </div>
  );
}
