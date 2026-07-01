"use client";

import { MapPin } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StickyCtaBarProps = {
  venueName: string;
  address: string;
  mapsUrl: string;
};

export function StickyCtaBar({ venueName, address, mapsUrl }: StickyCtaBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.45);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/85 p-3 backdrop-blur-xl md:hidden",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0" : "translate-y-full",
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{venueName}</p>
          <p className="truncate text-xs text-muted-foreground">{address}</p>
        </div>
        <Button asChild size="sm" className="shrink-0 rounded-full px-5">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="size-3.5" />
            مسیریابی
          </a>
        </Button>
      </div>
    </div>
  );
}
