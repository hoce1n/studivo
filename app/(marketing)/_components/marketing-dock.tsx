"use client";

import Dock from "@/components/Dock";
import {
  BadgeDollarSign,
  CircleHelp,
  Sparkles,
  MessageCircleHeart,
} from "lucide-react";
import { useRouter } from "next/navigation";

const dockLinks = [
  { href: "/#features", label: "ویژگی‌ها", icon: Sparkles },
  { href: "/#testimonials", label: "نظر مشتریان", icon: MessageCircleHeart },
  { href: "/#pricing", label: "تعرفه‌ها", icon: BadgeDollarSign },
  { href: "/#faq", label: "سوالات", icon: CircleHelp },
] as const;

export function MarketingDock() {
  const router = useRouter();

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
