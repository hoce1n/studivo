import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";

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
import { requireUser } from "@/app/actions/auth";
import ThemeToggle from "../(marketing)/_components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";



export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {

  const user = await requireUser();

  // Platform users (SALES / SUPER_ADMIN) have no studyhallId and must not
  // reach onboarding. Redirect them to their own route group before the
  // studyhallId check runs. See ADR-010 and ADR-015.
  if (user.platformRole) {
    redirect("/platform");
  }

  if (!user.studyhallId || !user.studyhall) {
    redirect("/onboarding");
  }

  return (
    <SidebarProvider>
      <AppSidebar
        side="right"
        userRole={user?.role}
        studyhallName={user.studyhall.name}
        activePath="/dashboard"
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ms-1" />
              <Separator
                orientation="vertical"
                className="me-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>{user.studyhall.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
