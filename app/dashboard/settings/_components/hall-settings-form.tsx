"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, MapPin } from "lucide-react";
import { z } from "zod";

import { updateStudyHallSettings } from "@/app/actions/actions";
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

export type StudyHallSettingsData = {
  name: string;
  totalSeats: number;
  monthlyFee: number;
  gender: string;
  address: string;
};

const studyHallSettingsClientSchema = z.object({
  name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد."),
  totalSeats: z.coerce
    .number()
    .int("تعداد صندلی باید عدد صحیح باشد.")
    .min(1, "تعداد صندلی باید حداقل ۱ باشد.")
    .max(500, "تعداد صندلی نمی‌تواند بیشتر از ۵۰۰ باشد."),
  monthlyFee: z.coerce.number().min(0, "شهریه ماهانه نمی‌تواند منفی باشد."),
  gender: z.enum(["male", "female"], {
    error: "نوع سالن را انتخاب کنید.",
  }),
  address: z
    .string()
    .trim()
    .min(5, "آدرس سالن را کامل‌تر وارد کنید.")
    .max(300, "آدرس نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد."),
});

function genderLabel(gender?: string) {
  if (gender === "male") return "آقایان";
  if (gender === "female") return "بانوان";
  return "تعیین نشده";
}

export function HallSettingsForm({ studyHall }: { studyHall: StudyHallSettingsData }) {
  const router = useRouter();

  async function validateStudyHallSettings(formData: FormData) {
    const parsed = studyHallSettingsClientSchema.safeParse({
      name: formData.get("name"),
      totalSeats: formData.get("totalSeats"),
      monthlyFee: formData.get("monthlyFee"),
      gender: formData.get("gender"),
      address: formData.get("address") ?? "",
    });

    if (!parsed.success) {
      return {
        success: false,
        error:
          parsed.error.issues[0]?.message ??
          "اطلاعات تنظیمات سالن معتبر نیست.",
      };
    }

    return updateStudyHallSettings(formData);
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <div>
              <CardTitle className="text-xl font-black">تنظیمات سالن</CardTitle>
              <CardDescription className="mt-1 leading-6">
                مشخصات عمومی، ظرفیت، شهریه، نوع پذیرش و آدرس سالن مطالعه را مدیریت کنید.
              </CardDescription>
            </div>
          </div>
          <div className="rounded-2xl border bg-background px-4 py-2 text-sm font-bold text-muted-foreground">
            فقط مدیر سالن
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">ظرفیت فعلی</p>
            <p className="mt-2 font-bold">
              {studyHall.totalSeats.toLocaleString("fa-IR")} صندلی
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">شهریه ماهانه</p>
            <p className="mt-2 font-bold">
              {studyHall.monthlyFee.toLocaleString("fa-IR")} تومان
            </p>
          </div>
          <div className="rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs font-medium text-muted-foreground">نوع سالن</p>
            <p className="mt-2 font-bold">{genderLabel(studyHall.gender)}</p>
          </div>
        </div>

        <ActionForm
          action={validateStudyHallSettings}
          successMessage="تنظیمات سالن با موفقیت به‌روزرسانی شد."
          onSuccess={() => router.refresh()}
          className="rounded-3xl border bg-background p-4"
        >
          {(pending) => (
            <div className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="studyhall-name">نام سالن</Label>
                  <Input
                    id="studyhall-name"
                    name="name"
                    defaultValue={studyHall.name}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyhall-gender">نوع سالن</Label>
                  <select
                    id="studyhall-gender"
                    name="gender"
                    defaultValue={studyHall.gender === "female" ? "female" : "male"}
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-2xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="male">آقایان</option>
                    <option value="female">بانوان</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyhall-total-seats">تعداد کل صندلی‌ها</Label>
                  <Input
                    id="studyhall-total-seats"
                    name="totalSeats"
                    type="number"
                    min={1}
                    max={500}
                    defaultValue={studyHall.totalSeats}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studyhall-monthly-fee">شهریه ماهانه</Label>
                  <Input
                    id="studyhall-monthly-fee"
                    name="monthlyFee"
                    type="number"
                    min={0}
                    step="1000"
                    defaultValue={studyHall.monthlyFee}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studyhall-address">آدرس سالن</Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                  <textarea
                    id="studyhall-address"
                    name="address"
                    defaultValue={studyHall.address}
                    maxLength={300}
                    rows={4}
                    placeholder="آدرس کامل سالن مطالعه"
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-28 w-full rounded-2xl border px-10 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={pending} className="min-w-40">
                  {pending ? <Loader2 className="animate-spin" /> : "ذخیره تنظیمات سالن"}
                </Button>
              </div>
            </div>
          )}
        </ActionForm>
      </CardContent>
    </Card>
  );
}
