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
import { assignStaff } from "@/app/actions/staff/assignments";
import { useRouter } from "next/navigation";

export function AddStaffForm() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>افزودن همکار</CardTitle>
        <CardDescription>
          کاربر موجود را با موبایل یا ایمیل به این سالن وصل کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActionForm
          action={assignStaff}
          onSuccess={() => router.refresh()}
          resetOnSuccess
          className="grid gap-4 md:grid-cols-5"
        >
          <div className="space-y-2">
            <Label htmlFor="identifier">موبایل/ایمیل</Label>
            <Input id="identifier" name="identifier" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">نقش</Label>
            <select
              id="role"
              name="role"
              defaultValue="STAFF"
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="STAFF">STAFF</option>
              <option value="OWNER">OWNER</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate">شروع</Label>
            <Input id="startDate" name="startDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">پایان</Label>
            <Input id="endDate" name="endDate" type="date" />
          </div>
          <Button className="self-end">افزودن</Button>
        </ActionForm>
      </CardContent>
    </Card>
  );
}
