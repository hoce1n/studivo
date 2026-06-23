import { ShieldAlert, User } from "lucide-react";

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
import { ProfileSettings } from "./_components/profile-settings";
import { requireUser } from "@/app/actions/actions";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <SidebarProvider>
      <AppSidebar
        side="right"
        userRole={user.role}
        studyhallName={user.studyhall?.name ?? ""}
        activePath="/dashboard/profile"
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
                    <BreadcrumbPage>پروفایل و امنیت</BreadcrumbPage>
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
                  <ShieldAlert className="size-4 text-primary" />
                  مرکز کنترل حساب کاربری
                </div>
                <div>
                  <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-4xl">
                    <User className="size-7 text-primary" />
                    پروفایل و امنیت
                  </h1>
                  <p className="mt-3 max-w-2xl leading-8 text-muted-foreground">
                    اطلاعات هویتی، سطح دسترسی و رمز عبور خود را در یک فضای امن و ساده مدیریت کنید.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border bg-background px-4 py-3 text-sm font-bold text-muted-foreground">
                {user.studyhall?.name ?? ""}
              </div>
            </div>
          </section>

          <ProfileSettings user={user} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
