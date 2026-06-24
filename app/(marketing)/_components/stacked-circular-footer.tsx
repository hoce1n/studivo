import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./navbar/logo";
import Enamad from "@/components/enamad";
import Link from "next/link";

const footerLinks = [
  { href: "/", label: "خانه" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/terms", label: "قوانین و مقررات" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/refund", label: "سیاست بازگشت وجه" },
];

function StackedCircularFooter() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 rounded-full bg-primary/10 p-8"><Logo /></div>
          <nav className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {footerLinks.map((link) => <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">{link.label}</Link>)}
          </nav>
          <div className="mb-8 w-full max-w-md">
            <form className="flex gap-2">
              <div className="grow">
                <Label htmlFor="footer-contact" className="sr-only">شماره تماس</Label>
                <Input id="footer-contact" placeholder="شماره تماس برای درخواست دمو" type="tel" className="rounded-full text-right" />
              </div>
              <Button type="submit" className="rounded-full">ثبت</Button>
            </form>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">ثبت این فرم به معنی درخواست تماس درباره خدمات استادیو است.</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">© ۱۴۰۵ استادیو. تمامی حقوق محفوظ است.</p>
          </div>
          <Enamad />
        </div>
      </div>
    </footer>
  );
}

export { StackedCircularFooter };
