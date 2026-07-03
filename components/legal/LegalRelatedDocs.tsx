import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RelatedLegalDocument } from "@/lib/legal/types";

type LegalRelatedDocsProps = {
  documents: RelatedLegalDocument[];
  className?: string;
};

function LegalRelatedDocs({ documents, className }: LegalRelatedDocsProps) {
  if (documents.length === 0) return null;

  return (
    <aside
      aria-label="اسناد مرتبط"
      className={cn(
        "sticky top-24 hidden h-fit shrink-0 self-start xl:block xl:w-56 print:hidden",
        className
      )}
    >
      <Card size="sm" className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">اسناد مرتبط</CardTitle>
          <CardDescription>
            سایر اسناد حقوقی استادیو را نیز مطالعه کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.map((doc) => (
            <Link
              key={doc.slug}
              href={doc.href}
              className="group flex items-start gap-2 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium leading-5">
                  {doc.title}
                </span>
                <span className="block text-xs leading-5 text-muted-foreground">
                  {doc.description}
                </span>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}

export { LegalRelatedDocs };
