"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ActionForm } from "@/components/action-form";

interface CreateStaffFormProps {
  createStaff: (formData: FormData) => Promise<unknown>;
}

export function CreateStaffForm({ createStaff }: CreateStaffFormProps) {
  return (
    <ActionForm
      action={createStaff}
      successMessage="همکار جدید با موفقیت اضافه شد."
      resetOnSuccess
    >
      {(pending) => (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="staffName">نام همکار</FieldLabel>
            <Input
              id="staffName"
              name="name"
              placeholder="نام مراقب"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="staffEmail">ایمیل همکار</FieldLabel>
            <Input
              id="staffEmail"
              name="email"
              type="email"
              placeholder="staff@example.com"
              required
            />
            <FieldDescription>
              این بخش فقط برای مدیر نمایش داده می‌شود.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel>رمز عبور</FieldLabel>
            <Input
              id="staffPassword"
              name="password"
              type="password"
              required
            />
            <FieldDescription>
              مراقب پس از ورود میتواند رمزش را عوض کند.
            </FieldDescription>
          </Field>
          <Button type="submit" variant="secondary" disabled={pending}>
            افزودن همکار
          </Button>
        </FieldGroup>
      )}
    </ActionForm>
  );
}
