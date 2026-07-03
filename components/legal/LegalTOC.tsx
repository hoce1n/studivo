"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LegalHeading } from "@/lib/legal/types";

type LegalTOCProps = {
  headings: LegalHeading[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  className?: string;
};

function LegalTOC({
  headings,
  activeId,
  onNavigate,
  className,
}: LegalTOCProps) {
  if (headings.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground",
          className
        )}
      >
        فهرست مطالب برای این سند در دسترس نیست.
      </div>
    );
  }

  return (
    <nav aria-label="فهرست مطالب" className={cn("space-y-1", className)}>
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        فهرست مطالب
      </p>
      <ul className="space-y-0.5">
        {headings.map((heading) => {
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id}>
              <Link
                href={`#${heading.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  onNavigate?.(heading.id);
                }}
                className={cn(
                  "block rounded-lg px-2.5 py-1.5 text-sm leading-6 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                  heading.level === 3 && "pe-5",
                  heading.level === 4 && "pe-8 text-xs",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "location" : undefined}
              >
                {heading.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type LegalTOCObserverProps = {
  headings: LegalHeading[];
  onActiveChange: (id: string) => void;
};

function useActiveHeading(
  headings: LegalHeading[],
  articleId = "legal-article"
) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top
          );

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 0.25, 0.5, 1],
      }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings, articleId]);

  return activeId;
}

function LegalTOCWithObserver({
  headings,
  onActiveChange,
  onNavigate,
  ...props
}: LegalTOCProps & { onActiveChange?: (id: string) => void }) {
  const activeId = useActiveHeading(headings);

  useEffect(() => {
    onActiveChange?.(activeId);
  }, [activeId, onActiveChange]);

  return (
    <LegalTOC
      headings={headings}
      activeId={activeId}
      onNavigate={onNavigate}
      {...props}
    />
  );
}

export { LegalTOC, LegalTOCWithObserver, useActiveHeading };
