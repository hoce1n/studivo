"use client";

import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

type Props = {
  action: any;
};

export default function OnboardingForm({ action }: Props) {
  return (
    <ActionForm action={action}>
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
              برای هر عدد، یک ردیف Seat با studyhallId همین سالن ساخته
              می‌شود.
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
            بعداً می‌توانید تعداد صندلی‌ها و شهریه را تغییر دهید.
          </p>
        </FieldGroup>
      )}
    </ActionForm>
  );
}
