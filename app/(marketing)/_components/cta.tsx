"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { submitLead } from "@/app/actions/marketing";

const trustPoints = [
  "راه‌اندازی سریع برای سالن‌های کوچک و بزرگ",
  "مناسب مدیر، پذیرش و شیفت‌های مختلف",
  "تمرکز کامل روی کاهش خطای انسانی و تداخل صندلی",
];

const CTA = () => {
  return (
    <section
      dir="rtl"
      aria-labelledby="studivo-cta-title"
      className="relative overflow-hidden border-y bg-background px-6 py-16 sm:py-20"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary),transparent_75%),transparent_34rem)]" />
      <div className="mx-auto grid w-full max-w-(--breakpoint-xl) items-center gap-8 rounded-[2rem] border bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
        <div className="text-right">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            آرامش خاطر برای مدیریت روزانه سالن مطالعه
          </div>

          <h2
            id="studivo-cta-title"
            className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
          >
            مدیریت سالن خود را از همین امروز هوشمند کنید
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            شماره تماس یا ایمیل خود را وارد کنید تا تیم Studivo برای راه‌اندازی اولیه، بررسی نیازهای سالن و نمایش دمو با شما تماس بگیرد.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <ActionForm 
          action={submitLead}
          resetOnSuccess
          className="rounded-3xl border bg-background/90 p-4 shadow-sm sm:p-5 space-y-0"
        >
          {(pending) => (
            <>
              <label
                htmlFor="cta-contact"
                className="mb-3 block text-right text-sm font-medium text-foreground"
              >
                ایمیل یا شماره موبایل
              </label>
              <div className="flex flex-col gap-3 sm:flex-row-reverse">
                <Input
                  id="cta-contact"
                  name="contact"
                  type="text"
                  required
                  placeholder="مثلاً 0912... یا info@example.com"
                  className="h-12 rounded-2xl border-border bg-muted/40 px-4 text-right transition-all duration-300 placeholder:text-right focus-visible:bg-background"
                  aria-label="ایمیل یا شماره موبایل برای شروع رایگان"
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className="h-12 rounded-2xl px-6 text-base transition-transform duration-300 hover:-translate-y-0.5"
                >
                  {pending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      شروع رایگان
                      <ArrowLeft className="size-5" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-3 text-right text-xs leading-6 text-muted-foreground">
                بدون تعهد پرداخت؛ ابتدا دمو و مسیر راه‌اندازی را شفاف می‌بینید.
              </p>
            </>
          )}
        </ActionForm>
      </div>
    </section>
  );
};

export default CTA;
