"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { Calendar as CalendarIcon } from "lucide-react";

export function FinanceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined
  );

  function updateRange(start: Date | undefined, end: Date | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (start) params.set("startDate", start.toISOString());
    else params.delete("startDate");
    
    if (end) params.set("endDate", end.toISOString());
    else params.delete("endDate");

    router.push(`${pathname}?${params.toString()}`);
  }

  function setQuickFilter(type: 'month' | 'quarter' | 'year') {
    const now = new Date();
    let start = new Date();
    
    if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (type === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
    } else if (type === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
    }

    setStartDate(start);
    setEndDate(now);
    updateRange(start, now);
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">بازه گزارش:</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setQuickFilter('month')}>ماه جاری</Button>
        <Button variant="outline" size="sm" onClick={() => setQuickFilter('quarter')}>فصل جاری</Button>
        <Button variant="outline" size="sm" onClick={() => setQuickFilter('year')}>سال جاری</Button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <JalaliDatePicker 
          value={startDate} 
          onChange={(d) => { setStartDate(d); updateRange(d, endDate); }} 
          placeholder="از تاریخ"
        />
        <span className="text-muted-foreground">تا</span>
        <JalaliDatePicker 
          value={endDate} 
          onChange={(d) => { setEndDate(d); updateRange(startDate, d); }} 
          placeholder="تا تاریخ"
        />
      </div>
    </div>
  );
}
