"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";

import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function normalizeDay(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

type RevenueDateRangeFormProps = {
  startDate: Date;
  endDate: Date;
};

export function RevenueDateRangeForm({ startDate, endDate }: RevenueDateRangeFormProps) {
  const [start, setStart] = React.useState(() => normalizeDay(startDate));
  const [end, setEnd] = React.useState(() => normalizeDay(endDate));

  return (
    <form
      className="grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-[1fr_1fr_auto]"
      action="/dashboard/finance"
    >
      <div className="space-y-2">
        <Label htmlFor="startDate">از تاریخ</Label>
        <JalaliDatePicker
          id="startDate"
          name="startDate"
          value={start}
          placeholder="انتخاب تاریخ شروع"
          onChange={(date) => {
            if (!date) return;
            const nextStart = normalizeDay(date);
            setStart(nextStart);
            if (end < nextStart) setEnd(nextStart);
          }}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endDate">تا تاریخ</Label>
        <JalaliDatePicker
          id="endDate"
          name="endDate"
          value={end}
          placeholder="انتخاب تاریخ پایان"
          onChange={(date) => {
            if (!date) return;
            setEnd(normalizeDay(date));
          }}
          disabled={(day) => normalizeDay(day) < start}
        />
      </div>
      <Button type="submit" className="self-end gap-2">
        <CalendarDays className="size-4" />
        اعمال
      </Button>
    </form>
  );
}
