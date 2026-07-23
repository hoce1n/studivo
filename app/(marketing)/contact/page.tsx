"use client";

import { useTransition, useState } from "react";
import { Navbar } from "../_components/navbar";
import { StackedCircularFooter } from "../_components/stacked-circular-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitLead, type SubmitDemoResult } from "@/app/actions/marketing/lead";
import { Loader2, ShieldAlert, CheckCircle2, CalendarClock } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Success panel
// ---------------------------------------------------------------------------
function SuccessPanel({ name }: { name: string }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-start gap-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-6 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xl font-semibold leading-snug">
          {name ? `${name} عزیز، درخواست شما ثبت شد.` : "درخواست شما با موفقیت ثبت شد."}
        </p>
        <p className="mt-3 leading-8 text-muted-foreground">
          تیم Studivo درخواست دمو را دریافت کرد و
          <span className="font-medium text-foreground"> ظرف ۲۴ ساعت کاری </span>
          با شماره موبایلی که ثبت کردید تماس می‌گیرد.
        </p>
      </div>

      <div className="w-full rounded-2xl border bg-muted/40 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="size-4 text-primary shrink-0" aria-hidden="true" />
          مرحله بعد چیست؟
        </div>
        <ol className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
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

      <p className="text-sm text-muted-foreground">
        همچنین می‌توانید از طریق{" "}
        <a href="mailto:sales@studivo.ir" className="text-foreground underline underline-offset-4 hover:no-underline">
          sales@studivo.ir
        </a>{" "}
        با ما در تماس باشید.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact page
// ---------------------------------------------------------------------------
export default function ContactPage() {
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
    <>
      <Navbar />
      <main
        dir="rtl"
        className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 px-6 py-16 text-right lg:grid-cols-[0.9fr_1.1fr]"
      >
        {/* Left column: contact info */}
        <section>
          <p className="text-sm font-medium text-primary">تماس با ما</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            برای دمو، پشتیبانی و بررسی نیازهای سالن با Studivo در ارتباط باشید
          </h1>
          <p className="mt-6 leading-8 text-muted-foreground">
            فرم زیر برای درخواست دمو، پرسش درباره تعرفه حرفه‌ای و هماهنگی راه‌اندازی اولیه در نظر گرفته شده است.
            پاسخ‌گویی در روزهای کاری و بر اساس ترتیب ثبت درخواست انجام می‌شود.
          </p>
          <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6">
            <p>
              <span className="font-semibold">ایمیل پشتیبانی:</span>{" "}
              <a href="mailto:support@studivo.ir" className="text-muted-foreground hover:text-foreground transition-colors">
                support@studivo.ir
              </a>
            </p>
            <p>
              <span className="font-semibold">ایمیل فروش:</span>{" "}
              <a href="mailto:sales@studivo.ir" className="text-muted-foreground hover:text-foreground transition-colors">
                sales@studivo.ir
              </a>
            </p>
            <p>
              <span className="font-semibold">ساعات پاسخ‌گویی:</span> شنبه تا چهارشنبه، ۹ تا ۱۸
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              برای مکاتبات رسمی، درخواست‌های پشتیبانی از مسیر ایمیل پشتیبانی یا فرم همین صفحه ثبت و پیگیری می‌شود.
            </p>
          </div>
        </section>

        {/* Right column: form or success panel */}
        {submittedName !== null ? (
          <SuccessPanel name={submittedName} />
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8 space-y-5"
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
              <Label htmlFor="contact-name">نام و نام خانوادگی</Label>
              <Input
                id="contact-name"
                name="name"
                required
                className="mt-2 text-right"
                placeholder="نام مدیر یا نماینده سالن"
              />
            </div>

            <div>
              <Label htmlFor="contact-phone">شماره موبایل کاری</Label>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                className="mt-2 text-right"
                placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
              />
            </div>

            <div>
              <Label htmlFor="contact-venue">نام سالن مطالعه</Label>
              <Input
                id="contact-venue"
                name="venueName"
                required
                className="mt-2 text-right"
                placeholder="نام مجموعه شما"
              />
            </div>

            <div>
              <Label htmlFor="contact-message">موضوع درخواست</Label>
              <Input
                id="contact-message"
                name="message"
                className="mt-2 text-right"
                placeholder="درخواست دمو، راه‌اندازی، پشتیبانی یا پرسش تعرفه"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="rounded-full w-full"
            >
              {pending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                "ثبت درخواست تماس"
              )}
            </Button>
          </form>
        )}
      </main>
      <StackedCircularFooter />
    </>
  );
}
