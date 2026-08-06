"use client";

import { formatDurationBetween, formatTehranDate, formatTehranTime } from "@/lib/date";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddShiftForm } from "./add-shift-form";
import { EditShiftDialog } from "./edit-shift-dialog";
import { Button } from "@/components/ui/button";
import { deleteShift } from "@/app/actions/staff/shifts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Calendar as CalendarIcon, List } from "lucide-react";
import { ShiftCalendar } from "./shift-calendar";

interface Shift {
  id: string;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  staffAssignment: {
    id: string;
    user: { name: string };
  };
}

interface ShiftListTabProps {
  shifts: Shift[];
  staffAssignments: { id: string; user: { name: string } }[];
  isOwner: boolean;
  currentStaffId?: string;
}

export function ShiftListTab({
  shifts,
  staffAssignments,
  isOwner,
  currentStaffId,
}: ShiftListTabProps) {
  const router = useRouter();
  const [view, setView] = useState<"calendar" | "list">("calendar");

  function canEditShift(shift: Shift) {
    return isOwner || shift.staffAssignment.id === currentStaffId;
  }

  // Calendar: all hall shifts. List: staff see only their own rows.
  const listShifts =
    isOwner || !currentStaffId
      ? shifts
      : shifts.filter((shift) => shift.staffAssignment.id === currentStaffId);

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این شیفت اطمینان دارید؟")) return;

    const res = await deleteShift(id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <AddShiftForm
        staffAssignments={staffAssignments}
        defaultStaffId={currentStaffId}
      />

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">تاریخچه شیفت‌ها</h3>
        <div className="flex rounded-xl bg-muted p-1">
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2 rounded-lg"
            onClick={() => setView("calendar")}
          >
            <CalendarIcon className="size-4" />
            تقویم
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2 rounded-lg"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
            لیست
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <ShiftCalendar
          shifts={shifts}
          isOwner={isOwner}
          currentStaffId={currentStaffId}
        />
      ) : (
        <div className="rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام همکار</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>زمان</TableHead>
                <TableHead>مدت</TableHead>
                <TableHead>توضیحات</TableHead>
                <TableHead className="text-left">عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listShifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {shift.staffAssignment.user.name}
                  </TableCell>
                  <TableCell>{formatTehranDate(shift.startsAt)}</TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {formatTehranTime(shift.startsAt)} -{" "}
                    {formatTehranTime(shift.endsAt)}
                  </TableCell>
                  <TableCell>
                    {formatDurationBetween(shift.startsAt, shift.endsAt)}
                  </TableCell>
                  <TableCell className="max-w-50 truncate">
                    {shift.note ?? "-"}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      {canEditShift(shift) && (
                        <EditShiftDialog shift={shift} />
                      )}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(shift.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {listShifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    شیفتی یافت نشد.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
