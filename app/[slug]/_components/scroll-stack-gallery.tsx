"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { VenueImage } from "./venue-image";

type ScrollStackGalleryProps = {
  images: string[];
  venueName: string;
};

export function ScrollStackGallery({ images, venueName }: ScrollStackGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const updateScrollBounds = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const cards = el.querySelectorAll<HTMLElement>("[data-gallery-card]");
    if (cards.length === 0) return;

    const containerRect = el.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
    setCanScrollStart(closestIndex > 0);
    setCanScrollEnd(closestIndex < images.length - 1);
  }, [images.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollBounds();
    el.addEventListener("scroll", updateScrollBounds, { passive: true });
    window.addEventListener("resize", updateScrollBounds);
    return () => {
      el.removeEventListener("scroll", updateScrollBounds);
      window.removeEventListener("resize", updateScrollBounds);
    };
  }, [updateScrollBounds]);

  const scrollByCard = (direction: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-gallery-card]");
    const gap = 20;
    const distance = (card?.offsetWidth ?? el.clientWidth * 0.78) + gap;
    const delta = direction === "next" ? distance : -distance;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (images.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            گالری
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            نگاهی به فضای سالن
          </h2>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            disabled={!canScrollStart}
            onClick={() => scrollByCard("prev")}
            aria-label="تصویر قبلی"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-full"
            disabled={!canScrollEnd}
            onClick={() => scrollByCard("next")}
            aria-label="تصویر بعدی"
          >
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>

      <div className="relative -mx-5 md:-mx-8">
        <div
          ref={scrollRef}
          className={cn(
            "flex gap-5 overflow-x-auto px-5 pb-2 md:px-8",
            "snap-x snap-mandatory scroll-smooth",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {images.map((url, i) => {
            const distance = Math.abs(i - activeIndex);
            const isActive = i === activeIndex;

            return (
              <div
                key={url}
                data-gallery-card
                className={cn(
                  "relative shrink-0 snap-center transition-all duration-500 ease-out motion-reduce:transition-none",
                  "h-[17rem] w-[78vw] sm:h-[20rem] sm:w-[58vw] md:h-[24rem] md:w-[42vw] lg:w-[36vw]",
                )}
                style={{
                  transform: `scale(${isActive ? 1 : 0.94 - distance * 0.02})`,
                  opacity: isActive ? 1 : Math.max(0.55, 0.88 - distance * 0.12),
                }}
              >
                <div
                  className={cn(
                    "relative h-full overflow-hidden rounded-3xl ring-1 ring-black/5",
                    "shadow-[0_24px_60px_-28px_rgba(20,19,18,0.45)]",
                    isActive && "shadow-[0_32px_80px_-24px_rgba(20,19,18,0.55)]",
                  )}
                >
                  <VenueImage
                    src={url}
                    alt={`تصویر ${i + 1} از ${venueName}`}
                    sizes="(max-width: 768px) 78vw, 42vw"
                    className="transition-transform duration-700 hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                  <div className="absolute bottom-4 right-4 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {`${(i + 1).toLocaleString("fa-IR")} / ${images.length.toLocaleString("fa-IR")}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#F7F5F2] to-transparent md:w-16" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#F7F5F2] to-transparent md:w-16" />
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            aria-label={`رفتن به تصویر ${i + 1}`}
            onClick={() => {
              const el = scrollRef.current;
              const card = el?.querySelectorAll<HTMLElement>("[data-gallery-card]")[i];
              card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
            }}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === activeIndex ? "w-8 bg-foreground" : "w-1.5 bg-foreground/20 hover:bg-foreground/35",
            )}
          />
        ))}
      </div>
    </div>
  );
}
