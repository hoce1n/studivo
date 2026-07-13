import { Building2, Settings2 } from "lucide-react";

import { requireOwnerUser } from "@/app/actions/auth";
import { HallSettingsForm } from "@/app/dashboard/settings/_components/hall-settings-form";
import { PublicPageSettingsForm } from "@/app/dashboard/settings/_components/public-page-settings-form";

export default async function HallSettingsPage() {
  // Use requireOwnerUser which handles authentication, tenant scoping, and owner role check.
  const user = await requireOwnerUser();

  return (
    <section className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
        <div className="absolute -left-20 -top-20 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-bold text-muted-foreground">
              <Settings2 className="size-4 text-primary" />
              مرکز مدیریت سالن
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-4xl">
                <Building2 className="size-7 text-primary" />
                تنظیمات سالن
              </h1>
              <p className="mt-3 max-w-2xl leading-8 text-muted-foreground">
                مشخصات سالن، نوع پذیرش، آدرس، ظرفیت و شهریه را در بخش اختصاصی مدیریت سالن به‌روزرسانی کنید.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-background px-4 py-3 text-sm font-bold text-muted-foreground">
            {user.studyHall.name}
          </div>
        </div>
      </section>

      <HallSettingsForm studyHall={user.studyHall} />

      <PublicPageSettingsForm
        studyHall={{ slug: user.studyHall.slug }}
        studyhallId={user.studyHallId}
      />
    </section>
  );
}
