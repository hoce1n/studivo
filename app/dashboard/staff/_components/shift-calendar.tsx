"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDurationFa,
  formatTehranDate,
  formatTehranTime,
} from "@/lib/date";
import { EditShiftDialog, type EditableShift } from "./edit-shift-dialog";

interface ShiftCalendarProps {
  shifts: EditableShift[];
  isOwner: boolean;
  currentStaffId?: string;
}

export function ShiftCalendar({
  shifts,
  isOwner,
  currentStaffId,
}: ShiftCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedDateShifts = shifts.filter(
    (shift) =>
      new Date(shift.startsAt).toDateString() === date?.toDateString(),
  );

  const shiftDays = shifts.map((s) => new Date(s.startsAt));

  function canEditShift(shift: EditableShift) {
    return isOwner || shift.staffAssignment.id === currentStaffId;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <Card className="h-fit">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-2xl"
            modifiers={{ hasShift: shiftDays }}
            modifiersClassNames={{
              hasShift:
                "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {date
              ? formatTehranDate(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              : "انتخاب تاریخ"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedDateShifts.length > 0 ? (
              selectedDateShifts.map((shift) => {
                const start = new Date(shift.startsAt);
                const end = new Date(shift.endsAt);
                const duration =
                  (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-4"
                  >
                    <div className="space-y-1">
                      <div className="font-bold">
                        {shift.staffAssignment.user.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTehranTime(start)} تا {formatTehranTime(end)} (
                        {formatDurationFa(duration)})
                      </div>
                      {shift.note && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          نکته: {shift.note}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {canEditShift(shift) && (
                        <EditShiftDialog shift={shift} />
                      )}
                      <Badge variant="outline" className="bg-background">
                        شیفت کاری
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed text-muted-foreground">
                <p>در این تاریخ شیفتی ثبت نشده است.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
