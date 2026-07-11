"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ReadingProgressProps = {
  targetId?: string;
};

function ReadingProgress({ targetId = "legal-article" }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.getElementById(targetId);
    if (!article) return;

    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const articleTop = rect.top + window.scrollY;
      const articleHeight = article.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollable = articleHeight - viewportHeight;

      if (scrollable <= 0) {
        setProgress(100);
        return;
      }

      const scrolled = window.scrollY - articleTop;
      const next = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
      setProgress(next);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [targetId]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-60 h-0.5 bg-transparent print:hidden"
    >
      <div
        className={cn(
          "h-full origin-right bg-primary transition-transform duration-150 ease-out"
        )}
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}

export { ReadingProgress };