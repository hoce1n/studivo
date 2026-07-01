import Link from "next/link";
import { Bell, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell({ unreadCount = 0 }: { unreadCount?: number }) {
  const hasUnread = unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="relative" aria-label="اعلان‌ها">
          <Bell className="size-5" />
          {hasUnread ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80" dir="rtl">
        <PopoverHeader>
          <div className="flex items-center justify-between gap-3">
            <PopoverTitle>اعلان‌ها</PopoverTitle>
            {hasUnread ? <Badge variant="secondary">{unreadCount.toLocaleString("fa-IR")}</Badge> : null}
          </div>
          <PopoverDescription>یادآوری‌های تمدید و انقضای سالن اینجا نمایش داده می‌شوند.</PopoverDescription>
        </PopoverHeader>
        <div className="rounded-2xl border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          اعلان جدیدی وچود ندارد.
        </div>
        <Button asChild variant="outline" className="w-full justify-between rounded-2xl">
          <Link href="/dashboard/settings#notification-preferences">
            <span>تنظیمات اعلانات</span>
            <Settings2 className="size-4" />
          </Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
