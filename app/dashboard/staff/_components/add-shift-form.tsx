"use client";

import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createShift } from "@/app/actions/staff/shifts";
import { useRouter } from "next/navigation";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { useState } from "react";

interface AddShiftFormProps {
  staffAssignments: {
    id: string;
    user: { name: string };
  }[];
  defaultStaffId?: string;
}

export function AddShiftForm({ staffAssignments, defaultStaffId }: AddShiftFormProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle>ثبت شیفت جدید</CardTitle>
        <CardDescription>
          ساعات کاری خود یا همکاران را ثبت کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm
          action={createShift}
          onSuccess={() => router.refresh()}
          resetOnSuccess
          className="grid gap-4"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="staffAssignmentId">همکار</Label>
              <select
                id="staffAssignmentId"
                name="staffAssignmentId"
                defaultValue={defaultStaffId}
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                {staffAssignments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>تاریخ شیفت</Label>
              <JalaliDatePicker 
                value={selectedDate} 
                onChange={setSelectedDate} 
                className="w-full"
              />
              <input type="hidden" name="date" value={selectedDate?.toISOString() || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">ساعت شروع</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">ساعت پایان</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">توضیحات (اختیاری)</Label>
            <Input id="note" name="note" placeholder="مثلاً: شیفت صبح یا توضیحات خاص..." />
          </div>

          <Button className="w-full md:w-auto px-8 self-end">ثبت شیفت</Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
