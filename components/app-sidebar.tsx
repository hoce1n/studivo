"use client";

import * as React from "react";
import {
  BookOpenCheck,
  LayoutDashboardIcon,
  Settings2Icon,
  UserCircleIcon,
  UsersRoundIcon,
  WalletCardsIcon,
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

function adminOnlyItems(activePath?: string) {
  return [
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
      url: "#",
      icon: <WalletCardsIcon />,
      items: [
        { title: "پرداخت‌ها", url: "#" },
        { title: "گزارش درآمد", url: "#" },
      ],
    },
    {
      title: "کارکنان",
      url: "#",
      icon: <UsersRoundIcon />,
      items: [{ title: "لیست همکاران", url: "/dashboard#staff" }],
    },
  ];
}

function sidebarData(userRole?: string, studyhallName?: string, activePath = "/dashboard") {
  return {
    teams: [
      {
        name: studyhallName ?? "سالن مطالعه",
        logo: <BookOpenCheck />,
        plan: userRole === "admin" ? "مدیر" : "مراقب",
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
        title: "پروفایل",
        url: "/dashboard/profile",
        icon: <UserCircleIcon />,
        isActive: activePath === "/dashboard/profile",
        items: [
          { title: "اطلاعات کاربری", url: "/dashboard/profile" },
          { title: "امنیت و رمز عبور", url: "/dashboard/profile" },
        ],
      },
      ...(userRole === "admin" ? adminOnlyItems(activePath) : []),
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
