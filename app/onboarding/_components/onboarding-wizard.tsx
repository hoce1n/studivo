"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, CheckCircle2, Grid2X2, Loader2, Plus, Trash2, WalletCards } from "lucide-react";

import { submitOnboarding } from "@/app/actions/onboarding";
import { ImageUploadField } from "@/components/image-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/onboarding";

const DEFAULT_PLAN: OnboardingValues["plans"][number] = { name: "عضویت ماهانه", durationDays: 30, price: 0, hasFixedSeat: true };
const initialValues: OnboardingValues = {
  name: "", gender: "FEMALE", phoneNumber: "", address: "", description: "", heroImage: null, galleryImages: [],
  tables: [{ label: "میز ۱", seatCount: 4, prefix: "T1-S" }],
  sections: [{ name: "سالن اصلی", description: "", tableLabels: ["میز ۱"], seatNumbers: [] }],
  plans: [DEFAULT_PLAN],
};

export function OnboardingWizard() {
  const router = useRouter();
  const [values, setValues] = React.useState<OnboardingValues>(initialValues);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const allSeats = values.tables.flatMap((table, tableIndex) => Array.from({ length: Number(table.seatCount) || 0 }, (_, seatIndex) => table.prefix ? `${table.prefix}${seatIndex + 1}` : `T${tableIndex + 1}-S${seatIndex + 1}`));

  function set<K extends keyof OnboardingValues>(key: K, value: OnboardingValues[K]) { setValues((current) => ({ ...current, [key]: value })); }
  function addGallery(url: string | null, index: number) {
    if (!url) set("galleryImages", values.galleryImages.filter((_, i) => i !== index));
    else if (index >= values.galleryImages.length) set("galleryImages", [...values.galleryImages, url]);
    else set("galleryImages", values.galleryImages.map((item, i) => i === index ? url : item));
  }
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    const parsed = onboardingSchema.safeParse(values);
    if (!parsed.success) { const message = parsed.error.issues[0]?.message ?? "اطلاعات راه‌اندازی سالن معتبر نیست."; setError(message); toast.error(message); return; }
    startTransition(async () => { const result = await submitOnboarding(parsed.data); if (!result.success) { const message = result.error ?? "راه‌اندازی سالن با خطا مواجه شد."; setError(message); toast.error(message); return; } toast.success(result.message); router.push("/dashboard"); router.refresh(); });
  }

  return <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-5" /> مشخصات و رسانه سالن</CardTitle><CardDescription>تصاویر را مستقیم بارگذاری کنید؛ URL پس از آپلود خودکار ذخیره می‌شود.</CardDescription></CardHeader><CardContent><FieldGroup>
      <Field><FieldLabel>نام سالن</FieldLabel><Input value={values.name} onChange={(e) => set("name", e.target.value)} required /></Field>
      <Field><FieldLabel>نوع سالن</FieldLabel><Select value={values.gender} onValueChange={(v: "MALE" | "FEMALE") => set("gender", v)}><SelectTrigger className="h-10 w-full rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FEMALE">بانوان</SelectItem><SelectItem value="MALE">آقایان</SelectItem></SelectContent></Select></Field>
      <Field><FieldLabel>شماره تماس</FieldLabel><Input value={values.phoneNumber ?? ""} onChange={(e) => set("phoneNumber", e.target.value)} /></Field>
      <Field><FieldLabel>آدرس سالن</FieldLabel><textarea value={values.address} onChange={(e) => set("address", e.target.value)} className="min-h-24 rounded-2xl border bg-background p-3" required /></Field>
      <ImageUploadField label="تصویر اصلی سالن" value={values.heroImage ?? null} onChange={(url) => set("heroImage", url)} />
      <div className="grid gap-3 md:grid-cols-2">{[...values.galleryImages, ...(values.galleryImages.length < 8 ? [null] : [])].map((url, index) => <ImageUploadField key={index} label={`تصویر گالری ${index + 1}`} value={url} onChange={(next) => addGallery(next, index)} />)}</div>
    </FieldGroup></CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Grid2X2 className="size-5" /> چیدمان میزها، صندلی‌ها و بخش‌ها</CardTitle><CardDescription>ابتدا میزهای فیزیکی را بسازید، سپس میز یا صندلی‌ها را به بخش‌هایی مثل VIP اختصاص دهید.</CardDescription></CardHeader><CardContent className="space-y-5">
      {values.tables.map((table, index) => <div key={index} className="grid gap-3 rounded-3xl border p-4 md:grid-cols-4"><Field><FieldLabel>نام میز</FieldLabel><Input value={table.label} onChange={(e) => set("tables", values.tables.map((t, i) => i === index ? { ...t, label: e.target.value } : t))} /></Field><Field><FieldLabel>تعداد صندلی</FieldLabel><Input type="number" min={1} max={50} value={table.seatCount} onChange={(e) => set("tables", values.tables.map((t, i) => i === index ? { ...t, seatCount: Number(e.target.value) } : t))} /></Field><Field><FieldLabel>پیشوند شماره</FieldLabel><Input value={table.prefix ?? ""} onChange={(e) => set("tables", values.tables.map((t, i) => i === index ? { ...t, prefix: e.target.value } : t))} placeholder="T1-S" /></Field><Button type="button" variant="ghost" className="self-end" disabled={values.tables.length === 1} onClick={() => set("tables", values.tables.filter((_, i) => i !== index))}><Trash2 className="size-4" /> حذف</Button></div>)}
      <Button type="button" variant="secondary" onClick={() => set("tables", [...values.tables, { label: `میز ${values.tables.length + 1}`, seatCount: 4, prefix: `T${values.tables.length + 1}-S` }])}><Plus className="size-4" /> افزودن میز</Button>
      <div className="space-y-4">{values.sections.map((section, index) => <div key={index} className="space-y-3 rounded-3xl border p-4"><div className="flex justify-between gap-3"><Input value={section.name} onChange={(e) => set("sections", values.sections.map((s, i) => i === index ? { ...s, name: e.target.value } : s))} /><Button type="button" variant="ghost" disabled={values.sections.length === 1} onClick={() => set("sections", values.sections.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button></div><FieldDescription>اختصاص میز کامل</FieldDescription><div className="flex flex-wrap gap-2">{values.tables.map((table) => <label key={table.label} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><Checkbox checked={section.tableLabels.includes(table.label)} onCheckedChange={(checked) => set("sections", values.sections.map((s, i) => i === index ? { ...s, tableLabels: checked ? [...s.tableLabels, table.label] : s.tableLabels.filter((label) => label !== table.label) } : s))} />{table.label}</label>)}</div><FieldDescription>یا صندلی‌های خاص</FieldDescription><div className="flex flex-wrap gap-2">{allSeats.map((seat) => <label key={seat} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"><Checkbox checked={section.seatNumbers.includes(seat)} onCheckedChange={(checked) => set("sections", values.sections.map((s, i) => i === index ? { ...s, seatNumbers: checked ? [...s.seatNumbers, seat] : s.seatNumbers.filter((number) => number !== seat) } : s))} />{seat}</label>)}</div></div>)}</div>
      <Button type="button" variant="secondary" onClick={() => set("sections", [...values.sections, { name: `بخش ${values.sections.length + 1}`, description: "", tableLabels: [], seatNumbers: [] }])}><Plus className="size-4" /> افزودن بخش</Button>
    </CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><WalletCards className="size-5" /> طرح‌های عضویت</CardTitle></CardHeader><CardContent className="space-y-4">{values.plans.map((plan, index) => <div key={index} className="grid gap-4 rounded-3xl border p-4 md:grid-cols-4"><Field><FieldLabel>نام طرح</FieldLabel><Input value={plan.name} onChange={(e) => set("plans", values.plans.map((p, i) => i === index ? { ...p, name: e.target.value } : p))} /></Field><Field><FieldLabel>مدت</FieldLabel><Input type="number" value={plan.durationDays} onChange={(e) => set("plans", values.plans.map((p, i) => i === index ? { ...p, durationDays: Number(e.target.value) } : p))} /></Field><Field><FieldLabel>قیمت</FieldLabel><Input type="number" value={plan.price} onChange={(e) => set("plans", values.plans.map((p, i) => i === index ? { ...p, price: Number(e.target.value) } : p))} /></Field><label className="flex items-center gap-3"><Switch checked={plan.hasFixedSeat} onCheckedChange={(checked) => set("plans", values.plans.map((p, i) => i === index ? { ...p, hasFixedSeat: checked } : p))} /> صندلی ثابت</label></div>)}<Button type="button" variant="secondary" onClick={() => set("plans", [...values.plans, { ...DEFAULT_PLAN, name: `طرح ${values.plans.length + 1}` }])}><Plus className="size-4" /> افزودن طرح</Button></CardContent></Card>
    {error ? <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
    <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} ساخت سالن و ورود به داشبورد</Button>
  </form>;
}
