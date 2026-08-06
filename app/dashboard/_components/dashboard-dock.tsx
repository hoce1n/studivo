"use client";

import Dock from "@/components/Dock";
import {
  Settings2,
  DollarSign,
  LayoutGrid,
  ScrollText,
  Handshake,
  UsersRound,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type HallRole = "OWNER" | "STAFF";

const ownerDockLinks = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutGrid },
  { href: "/dashboard/finance", label: "مالی", icon: DollarSign },
  { href: "/dashboard/logs", label: "اتفاقات سالن", icon: ScrollText },
  { href: "/dashboard/staff", label: "همکاران", icon: Handshake },
  { href: "/dashboard/settings", label: "تنظیمات", icon: Settings2 },
] as const;

const staffDockLinks = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutGrid },
  { href: "/dashboard/members", label: "اعضا", icon: UsersRound },
  { href: "/dashboard/staff", label: "همکاران", icon: Handshake },
  { href: "/dashboard/profile", label: "پروفایل", icon: UserCircle },
] as const;

export function MarketingDock({ userRole }: { userRole: HallRole }) {
  const router = useRouter();
  const dockLinks = userRole === "OWNER" ? ownerDockLinks : staffDockLinks;

  const items = dockLinks.map((link) => ({
    label: link.label,
    icon: <link.icon size={18} />,
    onClick: () => router.push(link.href),
  }));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 block md:hidden">
      <div className="pointer-events-auto">
        <Dock
          items={items}
          panelHeight={60}
          baseItemSize={44}
          magnification={62}
          distance={160}
        />
      </div>
    </div>
  );
}
