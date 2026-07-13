"use client";

import { CheckCircle2, MapPin } from "lucide-react";

import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type Props = {
  action: (formData: FormData) => Promise<unknown>;
};

export default function OnboardingForm({ action }: Props) {
  return (
    <ActionForm action={action} successMessage="سالن مطالعه با موفقیت ساخته شد.">
      {(pending: boolean) => (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">نام سالن</FieldLabel>
            <Input
              id="name"
              name="name"
              placeholder="سالن مطالعه نخبگان"
              className="placeholder:text-sm"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="gender">نوع سالن</FieldLabel>
            <select
              id="gender"
              name="gender"
              defaultValue="female"
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-2xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="female">بانوان</option>
              <option value="male">آقایان</option>
            </select>
            <FieldDescription>
              نوع پذیرش سالن برای نمایش و فیلترهای عملیاتی Studivo ذخیره می‌شود.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="address">آدرس سالن</FieldLabel>
            <div className="relative">
              <MapPin className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
              <textarea
                id="address"
                name="address"
                rows={3}
                maxLength={300}
                placeholder="آدرس کامل سالن مطالعه"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-2xl border px-10 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="totalSeats">تعداد صندلی‌ها</FieldLabel>
            <Input
              id="totalSeats"
              name="totalSeats"
              type="number"
              min="1"
              max="500"
              defaultValue={1}
              required
            />
            <FieldDescription>
              تعداد صندلی‌هایی که در سالن در دسترس خواهند بود.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="monthlyFee">شهریه ماهانه پیش‌فرض (اختیاری)</FieldLabel>
            <div className="relative">
              <Input
                id="monthlyFee"
                name="monthlyFee"
                type="number"
                min="0"
                defaultValue={0}
                className="pe-16"
              />
              <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                تومان
              </span>
            </div>
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            <CheckCircle2 className="size-4" />
            ساخت سالن و ورود به داشبورد
          </Button>

          <p className="text-center text-xs leading-6 text-muted-foreground">
            بعداً می‌توانید مشخصات سالن، ظرفیت، آدرس و شهریه را از بخش تنظیمات سالن تغییر دهید.
          </p>
        </FieldGroup>
      )}
    </ActionForm>
  );
}
