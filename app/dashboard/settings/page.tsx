import { redirect } from "next/navigation";
import { Building2, Settings2 } from "lucide-react";

import { requireUser } from "@/app/actions/actions";
import { HallSettingsForm } from "@/app/dashboard/settings/_components/hall-settings-form";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function HallSettingsPage() {
  const user = await requireUser();

  if (!user.studyhallId || !user.studyhall) {
    redirect("/onboarding");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        side="right"
        userRole={user.role}
        studyhallName={user.studyhall.name}
        activePath="/dashboard/settings"
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ms-1" />
              <Separator
                orientation="vertical"
                className="me-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>تنظیمات سالن</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <NotificationBell />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
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
                {user.studyhall.name}
              </div>
            </div>
          </section>

          <HallSettingsForm studyHall={user.studyhall} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
