"use client";

import { formatTehranDate } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddStaffForm } from "./add-staff-form";
import { Button } from "@/components/ui/button";
import { deactivateStaff } from "@/app/actions/staff/assignments";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface StaffMember {
  id: string;
  role: "OWNER" | "STAFF";
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  totalHoursThisMonth?: number;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
}

interface StaffListTabProps {
  staff: StaffMember[];
  isOwner: boolean;
}

export function StaffListTab({ staff, isOwner }: StaffListTabProps) {
  const router = useRouter();

  async function handleDeactivate(id: string) {
    if (!confirm("آیا از غیرفعال کردن این همکار اطمینان دارید؟")) return;
    
    const res = await deactivateStaff(id);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {isOwner && <AddStaffForm />}

      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>نقش</TableHead>
              <TableHead>شروع فعالیت</TableHead>
              <TableHead>ساعت کاری (ماه جاری)</TableHead>
              <TableHead>وضعیت</TableHead>
              {isOwner && <TableHead className="text-left">عملیات</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>{item.user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.user.phoneNumber ?? item.user.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{item.role}</Badge>
                </TableCell>
                <TableCell>
                  {formatTehranDate(item.startDate)}
                </TableCell>
                <TableCell>
                  {item.totalHoursThisMonth?.toFixed(1) ?? "0"} ساعت
                </TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "فعال" : "غیرفعال"}
                  </Badge>
                </TableCell>
                {isOwner && (
                  <TableCell className="text-left">
                    {item.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeactivate(item.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOwner ? 6 : 5} className="h-24 text-center">
                  همکاری یافت نشد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
