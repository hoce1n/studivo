"use client";

import * as React from "react";
import {
  BookOpenCheck,
  LayoutDashboardIcon,
  Settings2Icon,
  UserCircleIcon,
  ScrollTextIcon,
  UsersRoundIcon,
  TrendingUpIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

function adminOnlyItems(activePath?: string, userRole?: string) {
  const isOwner = userRole === "OWNER" || userRole === "admin" || userRole === "ADMIN";
  
  const items = [];

  if (isOwner) {
    items.push(
      {
        title: "تنظیمات سالن",
        url: "/dashboard/settings",
        icon: <Settings2Icon />,
        isActive: activePath === "/dashboard/settings",
        items: [
          { title: "مشخصات سالن", url: "/dashboard/settings" },
          { title: "ظرفیت و صندلی‌ها", url: "/dashboard/settings" },
        ],
      },
      {
        title: "مالی",
        url: "/dashboard/finance",
        icon: <TrendingUpIcon />,
        isActive: activePath === "/dashboard/finance",
        items: [
          { title: "گزارش‌های مالی", url: "/dashboard/finance" },
          { title: "پرداخت‌های معوقه", url: "/dashboard/finance#overdue" },
        ],
      },
      {
        title: "دفترچه وقایع",
        url: "/dashboard/logs",
        icon: <ScrollTextIcon />,
        isActive: activePath === "/dashboard/logs",
        items: [{ title: "گزارش عملکرد روزانه", url: "/dashboard/logs" }],
      }
    );
  }

  items.push({
    title: "کارکنان",
    url: "/dashboard/staff",
    icon: <UsersRoundIcon />,
    isActive: activePath?.startsWith("/dashboard/staff"),
    items: [
      { title: "لیست همکاران", url: "/dashboard/staff" },
      { title: "شیفت‌ها", url: "/dashboard/staff?tab=shifts" },
    ],
  });

  return items;
}

function sidebarData(
  userRole?: string, 
  studyhallName?: string, 
  activePath = "/dashboard"
) {
  // Check against v2 HallRole ("OWNER") as well as legacy ("admin" / "ADMIN")
  const isOwnerOrAdmin = userRole === "OWNER" || userRole === "admin" || userRole === "ADMIN";

  return {
    teams: [
      {
        name: studyhallName ?? "سالن مطالعه",
        logo: <BookOpenCheck />,
        plan: isOwnerOrAdmin ? "مدیر" : "مراقب",
      },
    ],
    navMain: [
      {
        title: "داشبورد",
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: activePath === "/dashboard",
        items: [
          { title: "نقشه صندلی‌ها", url: "/dashboard#map" },
          { title: "پذیرش", url: "/dashboard#reserve" },
        ],
      },
      {
        title: "اعضا",
        url: "/dashboard/members",
        icon: <UsersRoundIcon />,
        isActive: activePath === "/dashboard/members",
        items: [
          { title: "اعضای فعال", url: "/dashboard/members?status=active" },
          { title: "آرشیو اعضا", url: "/dashboard/members?status=inactive" },
        ],
      },
      {
        title: "پروفایل",
        url: "/dashboard/profile",
        icon: <UserCircleIcon />,
        isActive: activePath === "/dashboard/profile",
        items: [
          { title: "اطلاعات کاربری", url: "/dashboard/profile" },
          { title: "امنیت و رمز عبور", url: "/dashboard/profile" },
        ],
      },
      ...(isOwnerOrAdmin || userRole === "STAFF" ? adminOnlyItems(activePath, userRole) : []),
    ],
    projects: [],
  };
}

export function AppSidebar({
  userRole,
  studyhallName,
  activePath,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userRole?: string;
  studyhallName?: string;
  activePath?: string;
}) {
  const data = sidebarData(userRole, studyhallName, activePath);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}