"use client";

import { useCallback, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CopyHeadingLink } from "./CopyHeadingLink";
import { LegalTOCWithObserver } from "./LegalTOC";
import type { LegalHeading } from "@/lib/legal/types";

type LegalPageInteractionsProps = {
  headings: LegalHeading[];
  children: React.ReactNode;
};

function LegalPageInteractions({
  headings,
  children,
}: LegalPageInteractionsProps) {
  const navigateToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 96;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const article = document.getElementById("legal-article");
    if (!article) return;

    const roots: Root[] = [];
    const headingElements = article.querySelectorAll("h2, h3, h4");

    headingElements.forEach((heading) => {
      if (!(heading instanceof HTMLElement) || !heading.id) return;

      heading.classList.add("group/heading", "legal-heading-anchor");

      const mount = document.createElement("span");
      mount.className = "legal-heading-link-slot";
      heading.appendChild(mount);

      const root = createRoot(mount);
      root.render(<CopyHeadingLink id={heading.id} />);
      roots.push(root);
    });

    return () => {
      roots.forEach((root) => root.unmount());
      article
        .querySelectorAll(".legal-heading-link-slot")
        .forEach((slot) => slot.remove());
    };
  }, [headings]);

  useEffect(() => {
    if (!window.location.hash) return;

    const id = window.location.hash.slice(1);
    window.requestAnimationFrame(() => navigateToHeading(id));
  }, [navigateToHeading]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        ticking = false;

        const article = document.getElementById("legal-article");
        if (!article) return;

        const articleTop = article.offsetTop;
        const scrollPosition = window.scrollY + 120;

        let currentId = headings[0]?.id;
        for (const heading of headings) {
          const element = document.getElementById(heading.id);
          if (!element) continue;
          if (element.offsetTop + articleTop <= scrollPosition) {
            currentId = heading.id;
          }
        }

        if (currentId && window.location.hash !== `#${currentId}`) {
          window.history.replaceState(null, "", `#${currentId}`);
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return <>{children}</>;
}

type LegalSidebarTOCProps = {
  headings: LegalHeading[];
};

function LegalSidebarTOC({ headings }: LegalSidebarTOCProps) {
  const navigate = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 96;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <LegalTOCWithObserver headings={headings} onNavigate={navigate} />
  );
}

export { LegalPageInteractions, LegalSidebarTOC };
