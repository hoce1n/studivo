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
import { Button } from "@/components/ui/button";
import { deleteShift } from "@/app/actions/staff/shifts";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Calendar as CalendarIcon, List } from "lucide-react";
import { ShiftCalendar } from "./shift-calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        <div className="flex bg-muted p-1 rounded-xl">
          <Button 
            variant={view === "calendar" ? "secondary" : "ghost"} 
            size="sm" 
            className="rounded-lg gap-2"
            onClick={() => setView("calendar")}
          >
            <CalendarIcon className="size-4" />
            تقویم
          </Button>
          <Button 
            variant={view === "list" ? "secondary" : "ghost"} 
            size="sm" 
            className="rounded-lg gap-2"
            onClick={() => setView("list")}
          >
            <List className="size-4" />
            لیست
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <ShiftCalendar shifts={shifts} isOwner={isOwner} />
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
                {isOwner && <TableHead className="text-left">عملیات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => {                
                return (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">
                      {shift.staffAssignment.user.name}
                    </TableCell>
                    <TableCell>
                      {formatTehranDate(shift.startsAt)}
                    </TableCell>
                    <TableCell dir="ltr" className="text-right">
                      {formatTehranTime(shift.startsAt)} - {formatTehranTime(shift.endsAt)}
                    </TableCell>
                    <TableCell>{formatDurationBetween(shift.startsAt, shift.endsAt)}</TableCell>
                    <TableCell className="max-w-50 truncate">
                      {shift.note ?? "-"}
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-left">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(shift.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {shifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isOwner ? 6 : 5} className="h-24 text-center">
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
