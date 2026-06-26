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
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import ThemeToggle from "../(marketing)/_components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";



export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {

  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      studyhallId: true,
      studyhall: {
        select: {
          id: true,
          name: true,
          totalSeats: true,
          monthlyFee: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
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
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 mt-16">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}