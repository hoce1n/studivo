"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LegalTOC, useActiveHeading } from "./LegalTOC";
import type { LegalHeading } from "@/lib/legal/types";

type LegalMobileTOCProps = {
  headings: LegalHeading[];
};

function LegalMobileTOC({ headings }: LegalMobileTOCProps) {
  const activeId = useActiveHeading(headings);

  if (headings.length === 0) return null;

  const navigate = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 96;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="mb-8 lg:hidden print:hidden">
      <Accordion type="single" collapsible defaultValue="toc">
        <AccordionItem value="toc" className="rounded-2xl border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline">
            فهرست مطالب
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-3">
            <LegalTOC
              headings={headings}
              activeId={activeId}
              onNavigate={navigate}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export { LegalMobileTOC };
