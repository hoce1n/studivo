"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SeatResult = { id: string; seatNumber: number; status?: string };
type MemberResult = { id: string; name?: string; phoneNumber?: string };

type ShortcutItem = { type: "nav"; id: string; title: string; href: string };
type SeatItem = { type: "seat"; id: string; title: string; meta: SeatResult };
type MemberItem = { type: "member"; id: string; title: string; meta: MemberResult };

type Item = ShortcutItem | SeatItem | MemberItem;

export default function CommandPalette({
  initialSeats = [],
  initialMembers = [],
}: {
  initialSeats?: SeatResult[];
  initialMembers?: MemberResult[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // local filtering — fast and offline after initial load
  const seatsFiltered = query
    ? initialSeats.filter((s) => String(s.seatNumber).includes(query.replace(/[^0-9]/g, "")) || (s.status || "").toLowerCase().includes(query.toLowerCase()))
    : [];

  const membersFiltered = query
    ? initialMembers.filter((m) => (m.name || "").toLowerCase().includes(query.toLowerCase()) || (m.phoneNumber || "").includes(query))
    : [];

  const shortcuts: ShortcutItem[] = [
    { type: "nav", id: "dashboard", title: "داشبورد", href: "/dashboard" },
    { type: "nav", id: "settings", title: "پروفایل", href: "/dashboard/profile" },
    { type: "nav", id: "staff", title: "کارکنان", href: "/dashboard#staff" },
  ];

  const items: Item[] = [
    // if no query, show shortcuts; otherwise show filtered results after shortcuts
    ...(query ? shortcuts : shortcuts),
    ...seatsFiltered.map((s) => ({ type: "seat", id: s.id, title: `صندلی ${s.seatNumber}`, meta: s } as SeatItem)),
    ...membersFiltered.map((m) => ({ type: "member", id: m.id, title: m.name || m.phoneNumber || "بدون نام", meta: m } as MemberItem)),
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key === "k") || (!isMac && e.ctrlKey && e.key === "k")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[selected];
      if (!item) return;
      if (item.type === "nav") {
        setOpen(false);
        router.push(item.href);
      } else if (item.type === "seat") {
        setOpen(false);
        router.push(`/dashboard#map`);
      } else if (item.type === "member") {
        setOpen(false);
        router.push(`/dashboard`);
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="top">
        <div dir="rtl" className="max-w-2xl mx-auto w-full">
          <SheetHeader>
            <SheetTitle className="text-right">اجرای سریع</SheetTitle>
            <SheetDescription className="text-right">برای باز کردن: Ctrl/⌘ + K</SheetDescription>
          </SheetHeader>

          <div className="p-4">
            <Input
              ref={inputRef}
              placeholder="جستجو: صندلی، نام یا شماره"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Command palette search"
            />

            <div className="mt-3 max-h-64 overflow-auto rounded-md border bg-popover p-1">
              {items.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground text-right">نتیجه‌ای یافت نشد.</div>
              ) : (
                items.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onMouseEnter={() => setSelected(idx)}
                    onClick={() => {
                      if (item.type === "nav") router.push(item.href);
                      else if (item.type === "seat") router.push(`/dashboard#map`);
                      else router.push(`/dashboard`);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-right px-3 py-2 text-sm hover:bg-muted/60 focus:outline-none",
                      selected === idx ? "bg-muted/60" : ""
                    )}
                    role="option"
                    aria-selected={selected === idx}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-end">
                        <span className="font-medium">{item.title}</span>
                        {item.type === "seat" && (
                          <span className="text-xs text-muted-foreground">{(item.meta as SeatResult)?.status}</span>
                        )}
                        {item.type === "member" && (
                          <span className="text-xs text-muted-foreground">{(item.meta as MemberResult)?.phoneNumber}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}