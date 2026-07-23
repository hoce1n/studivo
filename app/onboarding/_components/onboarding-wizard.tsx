"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Armchair, Building2, CheckCircle2, Layers3, Loader2, Plus, Trash2, WalletCards } from "lucide-react";

import { submitOnboarding } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/onboarding";

const DEFAULT_SECTION: OnboardingValues["sections"][number] = {
  name: "سالن اصلی",
  mode: "AUTO",
  seatCount: 30,
  manualSeats: "",
};

const DEFAULT_PLAN: OnboardingValues["plans"][number] = {
  name: "عضویت ماهانه",
  durationDays: 30,
  price: 0,
  hasFixedSeat: true,
};

const initialValues: OnboardingValues = {
  name: "",
  gender: "FEMALE",
  phoneNumber: "",
  address: "",
  description: "",
  hasSections: false,
  seatCount: 30,
  sections: [DEFAULT_SECTION],
  plans: [DEFAULT_PLAN],
};

function cloneSection(section: OnboardingValues["sections"][number]) {
  return { ...section };
}

function clonePlan(plan: OnboardingValues["plans"][number]) {
  return { ...plan };
}

export function OnboardingWizard() {
  const router = useRouter();
  const [values, setValues] = React.useState<OnboardingValues>(initialValues);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const visibleSections = values.hasSections ? values.sections : [values.sections[0] ?? DEFAULT_SECTION];

  function updateField<K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateSection(index: number, next: OnboardingValues["sections"][number]) {
    setValues((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? next : section,
      ),
    }));
  }

  function addSection() {
    setValues((current) => ({
      ...current,
      sections: [
        ...current.sections,
        { ...DEFAULT_SECTION, name: `بخش ${current.sections.length + 1}` },
      ],
    }));
  }

  function removeSection(index: number) {
    setValues((current) => ({
      ...current,
      sections: current.sections.length > 1
        ? current.sections.filter((_, sectionIndex) => sectionIndex !== index)
        : current.sections,
    }));
  }

  function updatePlan(index: number, next: OnboardingValues["plans"][number]) {
    setValues((current) => ({
      ...current,
      plans: current.plans.map((plan, planIndex) => (planIndex === index ? next : plan)),
    }));
  }

  function addPlan() {
    setValues((current) => ({
      ...current,
      plans: [
        ...current.plans,
        { ...DEFAULT_PLAN, name: `طرح ${current.plans.length + 1}` },
      ],
    }));
  }

  function removePlan(index: number) {
    setValues((current) => ({
      ...current,
      plans: current.plans.length > 1
        ? current.plans.filter((_, planIndex) => planIndex !== index)
        : current.plans,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: OnboardingValues = {
      ...values,
      sections: values.hasSections ? values.sections : [cloneSection(values.sections[0] ?? DEFAULT_SECTION)],
      plans: values.plans.map(clonePlan),
    };

    const parsed = onboardingSchema.safeParse(payload);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "اطلاعات راه‌اندازی سالن معتبر نیست.";
      setError(message);
      toast.error(message);
      return;
    }

    startTransition(async () => {
      const result = await submitOnboarding(parsed.data);
      if (!result.success) {
        const message = result.error ?? "راه‌اندازی سالن با خطا مواجه شد.";
        setError(message);
        toast.error(message);
        return;
      }

      toast.success(result.message ?? "سالن مطالعه با موفقیت ساخته شد.");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            مشخصات سالن
          </CardTitle>
          <CardDescription>اطلاعات پایه سالن مطالعه و نوع پذیرش را وارد کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="studyhall-name">نام سالن</FieldLabel>
              <Input
                id="studyhall-name"
                value={values.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="سالن مطالعه نخبگان"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="studyhall-gender">نوع سالن</FieldLabel>
              <Select
                value={values.gender}
                onValueChange={(value: "MALE" | "FEMALE") => updateField("gender", value)}
              >
                <SelectTrigger id="studyhall-gender" className="h-10 w-full rounded-2xl border-input bg-background">
                  <SelectValue placeholder="نوع سالن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEMALE">بانوان</SelectItem>
                  <SelectItem value="MALE">آقایان</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="studyhall-phone">شماره تماس سالن (اختیاری)</FieldLabel>
              <Input
                id="studyhall-phone"
                value={values.phoneNumber ?? ""}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                placeholder="021... یا 09..."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="studyhall-address">آدرس سالن</FieldLabel>
              <textarea
                id="studyhall-address"
                value={values.address}
                onChange={(event) => updateField("address", event.target.value)}
                rows={3}
                maxLength={300}
                placeholder="آدرس کامل سالن مطالعه"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-24 w-full rounded-2xl border px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="size-5" />
            بخش‌ها و صندلی‌ها
          </CardTitle>
          <CardDescription>در v2، هر صندلی زیر یک Section ساخته می‌شود.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field orientation="horizontal" className="justify-between rounded-2xl border p-4">
            <div>
              <FieldLabel htmlFor="has-sections">بخش‌بندی سالن</FieldLabel>
              <FieldDescription>اگر خاموش باشد، همه صندلی‌ها در «سالن اصلی» ساخته می‌شوند.</FieldDescription>
            </div>
            <Switch
              id="has-sections"
              checked={values.hasSections}
              onCheckedChange={(checked) => updateField("hasSections", checked)}
            />
          </Field>

          {!values.hasSections ? (
            <Field>
              <FieldLabel htmlFor="seat-count">تعداد صندلی‌ها</FieldLabel>
              <Input
                id="seat-count"
                type="number"
                min={1}
                max={500}
                value={values.seatCount}
                onChange={(event) => updateField("seatCount", Number(event.target.value))}
                required
              />
            </Field>
          ) : null}

          {values.hasSections ? (
            <div className="space-y-4">
              {visibleSections.map((section, index) => (
                <div key={`${section.name}-${index}`} className="space-y-4 rounded-3xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-bold">
                      <Armchair className="size-4 text-muted-foreground" />
                      بخش {index + 1}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(index)}
                      disabled={values.sections.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <Field>
                    <FieldLabel>نام بخش</FieldLabel>
                    <Input
                      value={section.name}
                      onChange={(event) => updateSection(index, { ...section, name: event.target.value })}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel>روش ساخت صندلی</FieldLabel>
                    <Select
                      value={section.mode}
                      onValueChange={(mode: "AUTO" | "MANUAL") => {
                        updateSection(index, mode === "AUTO"
                          ? { name: section.name, mode, seatCount: section.seatCount ?? 1, manualSeats: section.manualSeats ?? "" }
                          : { name: section.name, mode, seatCount: section.seatCount ?? 1, manualSeats: section.manualSeats ?? "" });
                      }}
                    >
                      <SelectTrigger className="h-10 w-full rounded-2xl border-input bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">خودکار ۱ تا N</SelectItem>
                        <SelectItem value="MANUAL">ورود دستی با کاما</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {section.mode === "AUTO" ? (
                    <Field>
                      <FieldLabel>تعداد صندلی</FieldLabel>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={section.seatCount}
                        onChange={(event) => updateSection(index, { ...section, seatCount: Number(event.target.value) })}
                        required
                      />
                    </Field>
                  ) : (
                    <Field>
                      <FieldLabel>شماره صندلی‌ها</FieldLabel>
                      <Input
                        value={section.manualSeats}
                        onChange={(event) => updateSection(index, { ...section, manualSeats: event.target.value })}
                        placeholder="1, 2, A1, A2"
                        required
                      />
                      <FieldDescription>شماره‌ها با کاما جدا می‌شوند و فاصله‌های اضافه حذف می‌شود.</FieldDescription>
                    </Field>
                  )}
                </div>
              ))}

              <Button type="button" variant="secondary" className="w-full" onClick={addSection}>
                <Plus className="size-4" />
                افزودن بخش
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletCards className="size-5" />
            طرح‌های عضویت
          </CardTitle>
          <CardDescription>طرح‌ها به MembershipPlan سالن متصل می‌شوند.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {values.plans.map((plan, index) => (
            <div key={`${plan.name}-${index}`} className="grid gap-4 rounded-3xl border p-4 md:grid-cols-2">
              <div className="flex items-center justify-between gap-3 md:col-span-2">
                <div className="font-bold">طرح {index + 1}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlan(index)}
                  disabled={values.plans.length === 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Field>
                <FieldLabel>نام طرح</FieldLabel>
                <Input
                  value={plan.name}
                  onChange={(event) => updatePlan(index, { ...plan, name: event.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>مدت (روز)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={plan.durationDays}
                  onChange={(event) => updatePlan(index, { ...plan, durationDays: Number(event.target.value) })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>قیمت</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  value={plan.price}
                  onChange={(event) => updatePlan(index, { ...plan, price: Number(event.target.value) })}
                  required
                />
              </Field>
              <Field orientation="horizontal" className="items-center justify-between rounded-2xl bg-muted/40 p-3">
                <FieldLabel>صندلی ثابت دارد</FieldLabel>
                <Switch
                  checked={plan.hasFixedSeat}
                  onCheckedChange={(checked) => updatePlan(index, { ...plan, hasFixedSeat: checked })}
                />
              </Field>
            </div>
          ))}

          <Button type="button" variant="secondary" className="w-full" onClick={addPlan}>
            <Plus className="size-4" />
            افزودن طرح عضویت
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        ساخت سالن و ورود به داشبورد
      </Button>
    </form>
  );
}
