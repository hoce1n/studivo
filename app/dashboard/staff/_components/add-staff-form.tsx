"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { assignStaff } from "@/app/actions/staff/assignments";
import { useRouter } from "next/navigation";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Key } from "lucide-react";
import { toast } from "sonner";

export function AddStaffForm() {
  const router = useRouter();
  const [createNewUser, setCreateNewUser] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password?: string } | null>(null);

  const handleSuccess = (result: any) => {
    if (result.data) {
      setCredentials(result.data);
    } else {
      toast.success(result.message);
      setCredentials(null);
    }
    router.refresh();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("کپی شد!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>افزودن همکار</CardTitle>
          <CardDescription>
            کاربر موجود را وصل کنید یا یک حساب کاربری جدید بسازید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={assignStaff}
            onSuccess={handleSuccess}
            resetOnSuccess
            className="grid gap-6"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="identifier">موبایل یا ایمیل</Label>
                <Input id="identifier" name="identifier" placeholder="0912... یا email@example.com" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">نقش</Label>
                <select
                  id="role"
                  name="role"
                  defaultValue="STAFF"
                  className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="STAFF">STAFF (مراقب)</option>
                  <option value="OWNER">OWNER (مدیر)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>تاریخ شروع</Label>
                <JalaliDatePicker name="startDate" className="w-full" />
              </div>

              <div className="space-y-2">
                <Label>تاریخ پایان (اختیاری)</Label>
                <JalaliDatePicker name="endDate" className="w-full" />
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox 
                id="createNewUser" 
                name="createNewUser" 
                checked={createNewUser}
                onCheckedChange={(checked) => setCreateNewUser(!!checked)}
                value="true"
              />
              <Label htmlFor="createNewUser" className="cursor-pointer">ساخت حساب کاربری جدید برای این همکار</Label>
            </div>

            {createNewUser && (
              <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input id="name" name="name" placeholder="مثلاً: علی محمدی" required={createNewUser} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">رمز عبور موقت</Label>
                  <Input id="password" name="password" type="password" placeholder="حداقل ۸ کاراکتر" required={createNewUser} />
                </div>
              </div>
            )}

            <Button className="w-full md:w-auto px-8">افزودن همکار</Button>
          </ActionForm>
        </CardContent>
      </Card>

      {credentials && (
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20">
          <Key className="size-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-400">حساب کاربری با موفقیت ساخته شد</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              لطفاً اطلاعات ورود زیر را در اختیار همکار خود قرار دهید:
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center justify-between rounded-lg bg-background border p-2 text-sm">
                <span className="text-muted-foreground ml-2">نام کاربری:</span>
                <span className="font-mono font-bold">{credentials.email}</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.email)}>
                  <Copy className="size-3" />
                </Button>
              </div>
              <div className="flex flex-1 items-center justify-between rounded-lg bg-background border p-2 text-sm">
                <span className="text-muted-foreground ml-2">رمز عبور:</span>
                <span className="font-mono font-bold">{credentials.password}</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.password || "")}>
                  <Copy className="size-3" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
