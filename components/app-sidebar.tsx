"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ArmchairIcon, LayoutDashboardIcon, Settings2Icon, UsersRoundIcon, WalletCardsIcon } from "lucide-react"

const adminOnlyItems = [
  {
    title: "تنظیمات سالن",
    url: "#",
    icon: <Settings2Icon />,
    items: [
      { title: "مشخصات سالن", url: "#" },
      { title: "ظرفیت و صندلی‌ها", url: "#" },
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
];

function sidebarData(userRole?: string, studyhallName?: string) {
  return {
    teams: [
      {
        name: studyhallName ?? "سالن مطالعه",
        logo: <ArmchairIcon />,
        plan: userRole === "admin" ? "مدیر" : "همکار",
      },
    ],
    navMain: [
      {
        title: "داشبورد",
        url: "/dashboard",
        icon: <LayoutDashboardIcon />,
        isActive: true,
        items: [
          { title: "نقشه صندلی‌ها", url: "#" },
          { title: "پذیرش سریع", url: "#" },
        ],
      },
      {
        title: "کارکنان",
        url: "#",
        icon: <UsersRoundIcon />,
        items: [
          { title: "لیست همکاران", url: "#" },
        ],
      },
      ...(userRole === "admin" ? adminOnlyItems : []),
    ],
    projects: [],
  };
}

export function AppSidebar({ userRole, studyhallName, ...props }: React.ComponentProps<typeof Sidebar> & { userRole?: string; studyhallName?: string }) {
  const data = sidebarData(userRole, studyhallName);

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
  )
}
