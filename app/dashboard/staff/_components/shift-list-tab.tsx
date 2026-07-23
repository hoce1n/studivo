"use client";

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
import { Trash2 } from "lucide-react";

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
              const durationMs = new Date(shift.endsAt).getTime() - new Date(shift.startsAt).getTime();
              const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1);
              
              return (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {shift.staffAssignment.user.name}
                  </TableCell>
                  <TableCell>
                    {new Date(shift.startsAt).toLocaleDateString("fa-IR")}
                  </TableCell>
                  <TableCell dir="ltr" className="text-right">
                    {new Date(shift.startsAt).toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })} - {new Date(shift.endsAt).toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>{durationHours} ساعت</TableCell>
                  <TableCell className="max-w-[200px] truncate">
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
    </div>
  );
}
