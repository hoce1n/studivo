"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { ActionForm } from "@/components/action-form";
import {
  JalaliDatePicker,
  toLocalDateParam,
} from "@/components/jalali-date-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateShift } from "@/app/actions/staff/shifts";
import { formatTehranTimeInput } from "@/lib/date";

export type EditableShift = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  staffAssignment: {
    id: string;
    user: { name: string };
  };
};

type EditShiftDialogProps = {
  shift: EditableShift;
};

export function EditShiftDialog({ shift }: EditShiftDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    () => new Date(shift.startsAt),
  );
  const [startTime, setStartTime] = useState(() =>
    formatTehranTimeInput(shift.startsAt),
  );
  const [endTime, setEndTime] = useState(() =>
    formatTehranTimeInput(shift.endsAt),
  );
  const [note, setNote] = useState(shift.note ?? "");

  useEffect(() => {
    if (!open) return;
    setSelectedDate(new Date(shift.startsAt));
    setStartTime(formatTehranTimeInput(shift.startsAt));
    setEndTime(formatTehranTimeInput(shift.endsAt));
    setNote(shift.note ?? "");
  }, [open, shift]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="ویرایش شیفت"
          title="ویرایش شیفت"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>ویرایش شیفت</DialogTitle>
          <DialogDescription>
            اصلاح ساعات ثبت‌شده برای {shift.staffAssignment.user.name}
          </DialogDescription>
        </DialogHeader>

        <ActionForm
          action={updateShift}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
          className="grid gap-4 pt-2"
        >
          <input type="hidden" name="shiftId" value={shift.id} />
          <input
            type="hidden"
            name="date"
            value={selectedDate ? toLocalDateParam(selectedDate) : ""}
          />

          <div className="space-y-2">
            <Label>تاریخ شیفت</Label>
            <JalaliDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              className="w-full"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`startTime-${shift.id}`}>ساعت شروع</Label>
              <Input
                id={`startTime-${shift.id}`}
                name="startTime"
                type="time"
                required
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`endTime-${shift.id}`}>ساعت پایان</Label>
              <Input
                id={`endTime-${shift.id}`}
                name="endTime"
                type="time"
                required
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`note-${shift.id}`}>توضیحات (اختیاری)</Label>
            <Input
              id={`note-${shift.id}`}
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="مثلاً: اصلاح ساعت ورود"
            />
          </div>

          <Button type="submit" className="w-full">
            ذخیره تغییرات
          </Button>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
