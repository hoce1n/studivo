"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "./navbar/logo";
import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { submitLead } from "@/app/actions/marketing/lead";
import { Loader2 } from "lucide-react";

const footerLinks = [
  { href: "/", label: "خانه" },
  { href: "/about", label: "درباره ما" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/term-of-service", label: "قوانین و مقررات" },
  { href: "/privacy-policy", label: "حریم خصوصی" },
  { href: "/refund-policy", label: "سیاست بازگشت وجه" },
];

function StackedCircularFooter() {
  return (
    <footer className="border-t bg-background py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-8 rounded-full bg-primary/10 p-8">
            <Logo />
          </div>
          <nav className="mb-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {footerLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mb-8 w-full max-w-md">
            <ActionForm 
              action={submitLead}
              resetOnSuccess
              className="flex gap-2 space-y-0"
            >
              {(pending) => (
                <>
                  <div className="grow">
                    <Label htmlFor="footer-contact" className="sr-only">شماره تماس</Label>
                    <Input 
                      id="footer-contact" 
                      name="contact"
                      placeholder="شماره تماس برای درخواست دمو" 
                      type="tel" 
                      required
                      className="rounded-full text-right" 
                    />
                  </div>
                  <Button type="submit" disabled={pending} className="rounded-full min-w-20">
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "ثبت"}
                  </Button>
                </>
              )}
            </ActionForm>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              ثبت این فرم به معنی درخواست تماس درباره خدمات استادیو است.
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © ۱۴۰۵ استادیو. تمامی حقوق محفوظ است.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { StackedCircularFooter };
