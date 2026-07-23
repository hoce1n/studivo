"use client";

/* eslint-disable @next/next/no-img-element */

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ImageIcon, Layers3, Loader2, Plus, Trash2, Upload, Users, WalletCards } from "lucide-react";

import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addSeatsToInventory, assignSeatsToSection, assignStaffToStudyHall, disableMembershipPlan, moveSeatToSection, toggleSeatActive, updateStudyHallSettings, upsertMembershipPlan, upsertSection } from "@/app/actions/settings/mutations";

type Hall = { name: string; gender: "MALE" | "FEMALE"; phoneNumber: string | null; address: string | null; description: string | null; publicPageEnabled: boolean; slug: string | null; heroImage: string | null; galleryImages: string[] };
type SectionRow = { id: string; name: string; description: string | null; isActive: boolean; _count: { seats: number } };
type SeatRow = { id: string; number: string; isActive: boolean; sectionId: string | null };
type Plan = { id: string; name: string; durationDays: number; price: number; hasFixedSeat: boolean; description: string | null; isActive: boolean };
type Staff = { id: string; role: "OWNER" | "STAFF"; startDate: string; endDate: string | null; isActive: boolean; user: { name: string; email: string; phoneNumber: string | null } };

export function SettingsTabs({ hall, sections, seats, plans, staff }: { hall: Hall; sections: SectionRow[]; seats: SeatRow[]; plans: Plan[]; staff: Staff[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [heroImage, setHeroImage] = useState<string | null>(hall.heroImage);
  const [galleryImages, setGalleryImages] = useState(hall.galleryImages);

  return (
    <Tabs defaultValue="general" dir="rtl" className="gap-6">
      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4 md:w-fit">
        <TabsTrigger value="general"><Building2 /> عمومی</TabsTrigger>
        <TabsTrigger value="sections"><Layers3 /> بخش‌ها و صندلی‌ها</TabsTrigger>
        <TabsTrigger value="plans"><WalletCards /> پلن‌ها</TabsTrigger>
        <TabsTrigger value="staff"><Users /> همکاران</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader><CardTitle>مشخصات سالن و تصاویر عمومی</CardTitle><CardDescription>تصاویر را مستقیم آپلود کنید؛ URL برگشتی در StudyHall ذخیره می‌شود.</CardDescription></CardHeader>
          <CardContent>
            <ActionForm action={(formData) => { formData.set("heroImage", heroImage ?? ""); formData.set("galleryImages", JSON.stringify(galleryImages)); return updateStudyHallSettings(formData); }} onSuccess={refresh} className="grid gap-5">
              {(pending) => <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="نام سالن"><Input name="name" defaultValue={hall.name} required /></Field>
                  <Field label="نوع پذیرش"><select name="gender" defaultValue={hall.gender} className="h-10 rounded-2xl border bg-background px-3"><option value="MALE">آقایان</option><option value="FEMALE">بانوان</option></select></Field>
                  <Field label="تلفن"><Input name="phoneNumber" defaultValue={hall.phoneNumber ?? ""} /></Field>
                  <Field label="اسلاگ عمومی"><Input name="slug" dir="ltr" defaultValue={hall.slug ?? ""} placeholder="my-studyhall" /></Field>
                </div>
                <ImageUploader label="تصویر اصلی" value={heroImage} onChange={setHeroImage} />
                <GalleryUploader images={galleryImages} onChange={setGalleryImages} />
                <Field label="آدرس"><textarea name="address" defaultValue={hall.address ?? ""} className="min-h-24 rounded-2xl border bg-background p-3" /></Field>
                <Field label="توضیحات"><textarea name="description" defaultValue={hall.description ?? ""} className="min-h-28 rounded-2xl border bg-background p-3" /></Field>
                <label className="flex items-center gap-3 rounded-2xl border p-4"><Switch name="publicPageEnabled" defaultChecked={hall.publicPageEnabled} /> صفحه عمومی فعال باشد</label>
                <Button className="w-fit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : "ذخیره تنظیمات عمومی"}</Button>
              </>}
            </ActionForm>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sections" className="grid gap-4">
        <Card><CardHeader><CardTitle>موجودی کل صندلی‌های سالن</CardTitle><CardDescription>صندلی‌ها مستقل از بخش ساخته می‌شوند و بعداً به بخش‌ها تخصیص می‌گیرند.</CardDescription></CardHeader><CardContent className="grid gap-4">
          <ActionForm action={addSeatsToInventory} onSuccess={refresh} resetOnSuccess className="rounded-2xl border p-4">
            {(pending) => <div className="grid gap-3 md:grid-cols-6"><input type="hidden" name="mode" value="bulk" /><Field label="پیشوند"><Input name="prefix" placeholder="A-" /></Field><Field label="شروع"><Input name="start" type="number" defaultValue={1} /></Field><Field label="تعداد"><Input name="count" type="number" min={1} max={200} /></Field><div className="self-end md:col-span-2"><Button disabled={pending} variant="secondary"><Plus /> تولید صندلی</Button></div></div>}
          </ActionForm>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{seats.map((seat) => <div key={seat.id} className="flex items-center justify-between gap-2 rounded-2xl border p-3"><div><b>{seat.number}</b><p className="text-xs text-muted-foreground">{sections.find((s) => s.id === seat.sectionId)?.name ?? "بدون بخش"}</p></div><div className="flex gap-2"><ActionForm action={moveSeatToSection} onSuccess={refresh}><input type="hidden" name="seatId" value={seat.id} /><select name="sectionId" defaultValue={seat.sectionId ?? "UNASSIGNED"} className="h-9 rounded-xl border bg-background px-2 text-xs"><option value="UNASSIGNED">بدون بخش</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select><Button size="sm" variant="outline">انتقال</Button></ActionForm><ActionForm action={toggleSeatActive} onSuccess={refresh}><input type="hidden" name="seatId" value={seat.id} /><input type="hidden" name="isActive" value={seat.isActive ? "" : "on"} /><Button size="sm" variant={seat.isActive ? "outline" : "secondary"}>{seat.isActive ? "فعال" : "خارج"}</Button></ActionForm></div></div>)}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>افزودن بخش جدید</CardTitle></CardHeader><CardContent><SectionForm onSuccess={refresh} /></CardContent></Card>
        {sections.map((section) => <Card key={section.id}>
          <CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle>{section.name}</CardTitle><CardDescription>{seats.filter((seat) => seat.sectionId === section.id).length.toLocaleString("fa-IR")} صندلی تخصیص یافته</CardDescription></div><Badge variant={section.isActive ? "default" : "secondary"}>{section.isActive ? "فعال" : "غیرفعال"}</Badge></div></CardHeader>
          <CardContent className="grid gap-5"><SectionForm section={section} onSuccess={refresh} /><SeatAssignmentForm sectionId={section.id} seats={seats} onSuccess={refresh} /></CardContent>
        </Card>)}
      </TabsContent>

      <TabsContent value="plans" className="grid gap-4">
        <Card><CardHeader><CardTitle>ایجاد پلن عضویت</CardTitle></CardHeader><CardContent><PlanForm onSuccess={refresh} /></CardContent></Card>
        <Card><CardHeader><CardTitle>پلن‌های عضویت</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>نام</TableHead><TableHead>مدت</TableHead><TableHead>قیمت</TableHead><TableHead>صندلی ثابت</TableHead><TableHead>وضعیت</TableHead><TableHead>عملیات</TableHead></TableRow></TableHeader><TableBody>{plans.map((plan) => <TableRow key={plan.id}><TableCell>{plan.name}</TableCell><TableCell>{plan.durationDays} روز</TableCell><TableCell>{plan.price.toLocaleString("fa-IR")}</TableCell><TableCell>{plan.hasFixedSeat ? "دارد" : "ندارد"}</TableCell><TableCell><Badge variant={plan.isActive ? "default" : "secondary"}>{plan.isActive ? "فعال" : "غیرفعال"}</Badge></TableCell><TableCell className="flex gap-2"><PlanForm plan={plan} onSuccess={refresh} compact />{plan.isActive && <ActionForm action={disableMembershipPlan} onSuccess={refresh}><input type="hidden" name="planId" value={plan.id} /><Button size="sm" variant="destructive">غیرفعال</Button></ActionForm>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </TabsContent>

      <TabsContent value="staff" className="grid gap-4">
        <Card><CardHeader><CardTitle>افزودن همکار</CardTitle><CardDescription>کاربر موجود را با موبایل یا ایمیل به این سالن وصل کنید.</CardDescription></CardHeader><CardContent><ActionForm action={assignStaffToStudyHall} onSuccess={refresh} resetOnSuccess className="grid gap-4 md:grid-cols-5"><Field label="موبایل/ایمیل"><Input name="identifier" required /></Field><Field label="نقش"><select name="role" defaultValue="STAFF" className="h-10 rounded-2xl border bg-background px-3"><option value="STAFF">STAFF</option><option value="OWNER">OWNER</option></select></Field><Field label="شروع"><Input name="startDate" type="date" required /></Field><Field label="پایان"><Input name="endDate" type="date" /></Field><Button className="self-end">افزودن</Button></ActionForm></CardContent></Card>
        <Card><CardHeader><CardTitle>همکاران سالن</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>نام</TableHead><TableHead>راه ارتباطی</TableHead><TableHead>نقش</TableHead><TableHead>بازه فعالیت</TableHead><TableHead>وضعیت</TableHead></TableRow></TableHeader><TableBody>{staff.map((item) => <TableRow key={item.id}><TableCell>{item.user.name}</TableCell><TableCell>{item.user.phoneNumber ?? item.user.email}</TableCell><TableCell>{item.role}</TableCell><TableCell>{new Date(item.startDate).toLocaleDateString("fa-IR")} تا {item.endDate ? new Date(item.endDate).toLocaleDateString("fa-IR") : "نامحدود"}</TableCell><TableCell><Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "فعال" : "غیرفعال"}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div>; }

function SectionForm({ section, onSuccess }: { section?: SectionRow; onSuccess: () => void }) { return <ActionForm action={upsertSection} onSuccess={onSuccess} className="grid gap-3 md:grid-cols-4"><input type="hidden" name="sectionId" value={section?.id ?? ""} /><Field label="نام بخش"><Input name="name" defaultValue={section?.name ?? ""} required /></Field><Field label="توضیح"><Input name="description" defaultValue={section?.description ?? ""} /></Field><label className="flex items-end gap-2 pb-2"><Switch name="isActive" defaultChecked={section?.isActive ?? true} /> فعال</label><Button className="self-end" variant="secondary">ذخیره بخش</Button></ActionForm>; }

function PlanForm({ plan, onSuccess, compact = false }: { plan?: Plan; onSuccess: () => void; compact?: boolean }) { return <ActionForm action={upsertMembershipPlan} onSuccess={onSuccess} className={compact ? "contents" : "grid gap-3 md:grid-cols-6"}><input type="hidden" name="planId" value={plan?.id ?? ""} />{compact ? <><input type="hidden" name="name" value={plan?.name ?? ""} /><input type="hidden" name="durationDays" value={plan?.durationDays ?? 30} /><input type="hidden" name="price" value={plan?.price ?? 0} /><input type="hidden" name="hasFixedSeat" value={plan?.hasFixedSeat ? "on" : ""} /><input type="hidden" name="description" value={plan?.description ?? ""} /><input type="hidden" name="isActive" value={plan?.isActive ? "" : "on"} /><Button size="sm" variant="outline">{plan?.isActive ? "ویرایش سریع" : "فعال‌سازی"}</Button></> : <><Field label="نام"><Input name="name" required /></Field><Field label="مدت (روز)"><Input name="durationDays" type="number" defaultValue={30} /></Field><Field label="قیمت"><Input name="price" type="number" defaultValue={0} /></Field><Field label="توضیح"><Input name="description" /></Field><label className="flex items-end gap-2 pb-2"><Switch name="hasFixedSeat" defaultChecked /> صندلی ثابت</label><input type="hidden" name="isActive" value="on" /><Button className="self-end">ایجاد پلن</Button></>}</ActionForm>; }

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  const response = await fetch("/api/upload/image", { method: "POST", body: formData });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "آپلود تصویر ناموفق بود.");
  }
  return (await response.json()).url as string;
}

function ImageUploader({ label, value, onChange }: { label: string; value: string | null; onChange: (url: string | null) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onFile(file?: File) {
    if (!file) return;
    setPending(true); setError(null);
    try { onChange(await uploadImage(file)); } catch (err) { setError(err instanceof Error ? err.message : "آپلود تصویر ناموفق بود."); } finally { setPending(false); }
  }
  return <div className="grid gap-2"><Label>{label}</Label><div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void onFile(e.dataTransfer.files[0]); }} className="overflow-hidden rounded-2xl border border-dashed bg-muted/20">{value ? <div className="relative aspect-video"><img src={value} alt={label} className="size-full object-cover" /><div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45"><Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()}><Upload /> تعویض</Button><Button type="button" size="sm" variant="destructive" onClick={() => onChange(null)}><Trash2 /> حذف</Button></div></div> : <button type="button" disabled={pending} onClick={() => inputRef.current?.click()} className="flex aspect-video w-full flex-col items-center justify-center gap-2"><ImageIcon />{pending ? "در حال آپلود..." : "فایل را بکشید یا انتخاب کنید"}</button>}</div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

function GalleryUploader({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function upload(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (!selected.length) return;
    if (images.length + selected.length > 8) { setError("حداکثر ۸ تصویر مجاز است."); return; }
    setPending(true); setError(null);
    try { onChange([...images, ...(await Promise.all(selected.map(uploadImage)))]); } catch (err) { setError(err instanceof Error ? err.message : "آپلود گالری ناموفق بود."); } finally { setPending(false); }
  }
  return <div className="grid gap-2"><Label>گالری تصاویر</Label><div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }} className="grid grid-cols-2 gap-3 rounded-2xl border border-dashed p-3 md:grid-cols-4">{images.map((url) => <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border"><img src={url} alt="گالری" className="size-full object-cover" /><button type="button" onClick={() => onChange(images.filter((image) => image !== url))} className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 group-hover:opacity-100"><Trash2 className="text-white" /></button></div>)}{images.length < 8 && <button type="button" disabled={pending} onClick={() => inputRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-muted/20"><Upload />{pending ? "آپلود..." : "افزودن"}</button>}</div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => void upload(e.target.files)} />{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

function SeatAssignmentForm({ sectionId, seats, onSuccess }: { sectionId: string; seats: SeatRow[]; onSuccess: () => void }) {
  const [selected, setSelected] = useState(() => seats.filter((seat) => seat.sectionId === sectionId).map((seat) => seat.id));
  const available = seats.filter((seat) => !seat.sectionId || seat.sectionId === sectionId);
  return <ActionForm action={(formData) => { formData.set("seatIds", JSON.stringify(selected)); return assignSeatsToSection(formData); }} onSuccess={onSuccess} className="grid gap-3 rounded-2xl border p-4"><input type="hidden" name="sectionId" value={sectionId} /><div className="flex flex-wrap gap-2">{available.map((seat) => <label key={seat.id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(seat.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, seat.id] : current.filter((id) => id !== seat.id))} />{seat.number}</label>)}</div><Button className="w-fit" variant="secondary">ذخیره صندلی‌های بخش</Button></ActionForm>;
}
