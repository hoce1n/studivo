import { Navbar } from "@/app/(marketing)/_components/navbar";
import { StackedCircularFooter } from "@/app/(marketing)/_components/stacked-circular-footer";
import { BackToTopButton } from "./BackToTopButton";
import { LegalContent } from "./LegalContent";
import { LegalFooter } from "./LegalFooter";
import { LegalHeader } from "./LegalHeader";
import { LegalMobileTOC } from "./LegalMobileTOC";
import {
  LegalPageInteractions,
  LegalSidebarTOC,
} from "./LegalPageInteractions";
import { LegalRelatedDocs } from "./LegalRelatedDocs";
import { LegalSidebar } from "./LegalSidebar";
import { ReadingProgress } from "./ReadingProgress";
import { getRelatedDocuments } from "@/lib/legal/config";
import type { LegalDocument } from "@/lib/legal/types";
import { cn } from "@/lib/utils";

type LegalLayoutProps = {
  document: LegalDocument;
  className?: string;
};

function LegalLayout({ document, className }: LegalLayoutProps) {
  const relatedDocuments = getRelatedDocuments(document.slug);

  return (
    <>
      <Navbar />
      <ReadingProgress />
      <LegalPageInteractions headings={document.headings}>
        <div
          className={cn(
            "mx-auto w-full max-w-[1280px] px-4 sm:px-6",
            className,
          )}
        >
          <main
            id="legal-main"
            className="py-10 lg:py-14"
            aria-labelledby="legal-page-title"
          >
            <div className="flex gap-10 xl:gap-12">
              <LegalSidebar>
                <LegalSidebarTOC headings={document.headings} />
              </LegalSidebar>

              <div className="min-w-0 flex-1">
                <LegalHeader document={document} />
                <LegalMobileTOC headings={document.headings} />
                <LegalContent content={document.content} />
                <LegalFooter />
              </div>

              <LegalRelatedDocs documents={relatedDocuments} />
            </div>
          </main>
        </div>
      </LegalPageInteractions>
      <BackToTopButton />
      <StackedCircularFooter />
    </>
  );
}

export { LegalLayout };
