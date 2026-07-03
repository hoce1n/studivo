import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function LegalFooter() {
  return (
    <footer className="mt-16 space-y-6 print:hidden">
      <Separator />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          سؤالی دارید؟{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            با تیم استادیو تماس بگیرید
          </Link>
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeftIcon />
            بازگشت به صفحه اصلی
          </Link>
        </Button>
      </div>
    </footer>
  );
}

export { LegalFooter };
