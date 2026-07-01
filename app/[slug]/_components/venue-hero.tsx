"use client";

import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { VenueImage } from "./venue-image";

type VenueHeroProps = {
  name: string;
  heroImage: string | null;
  totalSeats: number;
  genderLabel: string;
};

export function VenueHero({
  name,
  heroImage,
  totalSeats,
  genderLabel,
}: VenueHeroProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxOffset = scrollY * 0.35;
  const contentOpacity = Math.max(0, 1 - scrollY / 280);
  const overlayOpacity = Math.min(0.85, 0.45 + scrollY / 600);

  return (
    <section className="relative h-[62vh] min-h-[22rem] w-full overflow-hidden bg-[#141312] md:h-[72vh] md:min-h-[28rem]">
      {heroImage ? (
        <div
          className="absolute inset-0 will-change-transform motion-reduce:transform-none"
          style={{ transform: `translate3d(0, ${parallaxOffset}px, 0) scale(1.08)` }}
        >
          <VenueImage
            src={heroImage}
            alt={name}
            priority
            sizes="100vw"
            className="opacity-90"
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2d2a26_0%,#141312_55%,#0d0c0b_100%)]">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/40 to-transparent transition-opacity duration-150 motion-reduce:opacity-70"
        style={{ opacity: overlayOpacity }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-black/25 via-transparent to-transparent" />

      <div
        className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-6xl flex-col gap-5 px-5 pb-10 pt-24 md:px-8 md:pb-14"
        style={{ opacity: contentOpacity }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/20 bg-white/10 text-white backdrop-blur-sm"
          >
            <BookOpen className="size-3" />
            سالن مطالعه
          </Badge>
          <Badge
            variant="outline"
            className="border-white/15 bg-white/5 text-white/80 backdrop-blur-sm"
          >
            {genderLabel}
          </Badge>
          <Badge
            variant="outline"
            className="border-white/15 bg-white/5 text-white/80 backdrop-blur-sm"
          >
            {totalSeats.toLocaleString("fa-IR")} صندلی
          </Badge>
        </div>

        <div className="max-w-3xl">
          <h1 className="text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-white md:text-6xl md:leading-[1.05]">
            {name}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-sm leading-7 text-white/65 md:text-base">
            فضایی آرام، منظم و قابل اعتماد برای تمرکز عمیق و مطالعه بدون حواس‌پرتی.
          </p>
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#F7F5F2] to-transparent",
          "translate-y-px",
        )}
        aria-hidden
      />
    </section>
  );
}
