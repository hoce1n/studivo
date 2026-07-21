"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2, ShieldAlert, CalendarClock } from "lucide-react";
import { submitLead, type SubmitDemoResult } from "@/app/actions/marketing/lead";
import { toast } from "sonner";

const trustPoints = [
  "راه‌اندازی سریع برای سالن‌های کوچک و بزرگ",
  "مناسب مدیر، پذیرش و شیفت‌های مختلف",
  "تمرکز کامل روی کاهش خطای انسانی و تداخل صندلی",
];

// ---------------------------------------------------------------------------
// Success panel — shown after a lead is created successfully
// ---------------------------------------------------------------------------
function SuccessPanel({ name }: { name: string }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center gap-5 rounded-3xl border bg-background/90 p-8 shadow-sm text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-snug">
          {name ? `${name} عزیز، درخواست شما ثبت شد.` : "درخواست شما ثبت شد."}
        </p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          تیم Studivo درخواست دمو را دریافت کرد و
          <span className="font-medium text-foreground"> ظرف ۲۴ ساعت کاری </span>
          با شماره موبایلی که ثبت کردید تماس می‌گیرد.
        </p>
      </div>
      <div className="w-full rounded-2xl border bg-muted/40 p-4 text-right">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="size-4 text-primary shrink-0" aria-hidden="true" />
          <span>مرحله بعد چیست؟</span>
        </div>
        <ol className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">۱.</span>
            کارشناس Studivo با شما تماس می‌گیرد تا نیازهای سالن را بررسی کند.
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">۲.</span>
            یک جلسه دموی زنده و رایگان برگزار می‌شود.
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground shrink-0">۳.</span>
            اگر Studivo مناسب سالن شما بود، راه‌اندازی اولیه را با هم انجام می‌دهیم.
          </li>
        </ol>
      </div>
      <p className="text-xs text-muted-foreground">
        بدون تعهد پرداخت؛ ابتدا دمو و مسیر راه‌اندازی را شفاف می‌بینید.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CTA section
// ---------------------------------------------------------------------------
const CTA = () => {
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString() ?? "";

    setErrorMessage(null);
    startTransition(async () => {
      let result: SubmitDemoResult;
      try {
        result = await submitLead(formData);
      } catch {
        setErrorMessage("مشکلی پیش آمد. لطفاً دوباره تلاش کنید.");
        return;
      }

      if (!result.success) {
        setErrorMessage(result.error);
        toast.error(result.error);
        return;
      }

      form.reset();
      setSubmittedName(name);
    });
  }

  return (
    <section
      id="demo"
      dir="rtl"
      aria-labelledby="studivo-cta-title"
      className="relative scroll-mt-20 overflow-hidden border-y bg-background px-6 py-16 sm:py-20"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary),transparent_75%),transparent_34rem)]" />
      <div className="mx-auto grid w-full max-w-(--breakpoint-xl) items-center gap-8 rounded-[2rem] border bg-card/80 p-6 shadow-sm backdrop-blur sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
        {/* Left: value proposition */}
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
            اطلاعات سالن خود را وارد کنید تا تیم Studivo برای راه‌اندازی اولیه، بررسی نیازهای سالن و نمایش دمو با شما تماس بگیرد.
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

        {/* Right: form or success panel */}
        {submittedName !== null ? (
          <SuccessPanel name={submittedName} />
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-3xl border bg-background/90 p-4 shadow-sm sm:p-5 space-y-4"
            aria-label="فرم درخواست دمو"
          >
            {errorMessage && (
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>خطا در ثبت درخواست</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="cta-name" className="text-right">
                نام شما
              </Label>
              <Input
                id="cta-name"
                name="name"
                type="text"
                required
                placeholder="مثلاً علی رضایی"
                className="mt-2 h-12 rounded-2xl border-border bg-muted/40 px-4 text-right transition-all placeholder:text-right focus-visible:bg-background"
                aria-label="نام شما برای درخواست دمو"
              />
            </div>

            <div>
              <Label htmlFor="cta-phone" className="text-right">
                شماره موبایل
              </Label>
              <Input
                id="cta-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
                className="mt-2 h-12 rounded-2xl border-border bg-muted/40 px-4 text-right transition-all placeholder:text-right focus-visible:bg-background"
                aria-label="شماره موبایل برای درخواست دمو"
              />
            </div>

            <div>
              <Label htmlFor="cta-venue" className="text-right">
                نام سالن مطالعه
              </Label>
              <Input
                id="cta-venue"
                name="venueName"
                type="text"
                required
                placeholder="نام مجموعه شما"
                className="mt-2 h-12 rounded-2xl border-border bg-muted/40 px-4 text-right transition-all placeholder:text-right focus-visible:bg-background"
                aria-label="نام سالن مطالعه"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="w-full h-12 rounded-2xl text-base transition-transform duration-300 hover:-translate-y-0.5"
            >
              {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  درخواست دمو
                  <ArrowLeft className="size-5" aria-hidden="true" />
                </>
              )}
            </Button>

            <p className="text-right text-xs leading-6 text-muted-foreground">
              بدون تعهد پرداخت؛ ابتدا دمو و مسیر راه‌اندازی را شفاف می‌بینید.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

export default CTA;
