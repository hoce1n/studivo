"use client";

import { useTransition, useState } from "react";
import { Navbar } from "../_components/navbar";
import { StackedCircularFooter } from "../_components/stacked-circular-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitLead, type SubmitDemoResult } from "@/app/actions/marketing";
import {
  Loader2,
  ShieldAlert,
  CheckCircle2,
  CalendarClock,
  Clock,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// What to expect cards
// ---------------------------------------------------------------------------
const steps = [
  {
    icon: Clock,
    title: "تماس ظرف ۲۴ ساعت",
    body: "کارشناس Studivo در روز کاری بعدی با شماره‌ای که ثبت کردید تماس می‌گیرد.",
  },
  {
    icon: Users,
    title: "جلسه دموی زنده",
    body: "یک جلسه رایگان برگزار می‌شود تا امکانات مرتبط با سالن شما را نشان دهیم.",
  },
  {
    icon: Zap,
    title: "راه‌اندازی سریع",
    body: "اگر Studivo مناسب بود، در همان جلسه اول راه‌اندازی را با هم شروع می‌کنیم.",
  },
];

// ---------------------------------------------------------------------------
// Success panel
// ---------------------------------------------------------------------------
function SuccessPanel({ name }: { name: string }) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-start gap-8"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
      </div>

      <div>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {name ? `${name} عزیز، درخواست شما ثبت شد.` : "درخواست شما با موفقیت ثبت شد."}
        </h2>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          تیم Studivo درخواست دمو را دریافت کرد و
          <span className="font-medium text-foreground"> ظرف ۲۴ ساعت کاری </span>
          با شماره موبایلی که ثبت کردید تماس می‌گیرد.
        </p>
      </div>

      <div className="w-full rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2 font-semibold">
          <CalendarClock className="size-5 text-primary shrink-0" aria-hidden="true" />
          مراحل بعدی
        </div>
        <ol className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <span className="font-semibold text-foreground">{step.title} — </span>
                {step.body}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-sm text-muted-foreground">
        سؤالی دارید؟{" "}
        <a
          href="mailto:sales@studivo.ir"
          className="text-foreground underline underline-offset-4 hover:no-underline"
        >
          sales@studivo.ir
        </a>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo request page
// ---------------------------------------------------------------------------
export default function DemoPage() {
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
        className="mx-auto grid w-full max-w-(--breakpoint-xl) items-start gap-12 px-6 py-16 lg:grid-cols-[1fr_0.85fr]"
      >
        {/* Left column: intro */}
        <section className="text-right">
          <p className="text-sm font-medium text-primary">درخواست دمو رایگان</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            ببینید Studivo چطور سالن شما را متحول می‌کند
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            در کمتر از دو دقیقه درخواست دمو ثبت کنید. کارشناس ما با شما تماس می‌گیرد تا یک جلسه رایگان و زنده برگزار شود.
          </p>

          {/* What to expect */}
          <div className="mt-10 space-y-6">
            {steps.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm leading-7 text-muted-foreground rounded-2xl border bg-muted/40 px-4 py-3">
            بدون تعهد پرداخت. ابتدا دمو و مسیر راه‌اندازی را شفاف می‌بینید، بعد تصمیم می‌گیرید.
          </p>
        </section>

        {/* Right column: form or success */}
        <div>
          {submittedName !== null ? (
            <SuccessPanel name={submittedName} />
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8 space-y-5"
              aria-label="فرم درخواست دمو"
            >
              <h2 className="text-xl font-semibold text-right">اطلاعات سالن خود را وارد کنید</h2>

              {errorMessage && (
                <Alert variant="destructive">
                  <ShieldAlert />
                  <AlertTitle>خطا در ثبت درخواست</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="demo-name">نام و نام خانوادگی</Label>
                <Input
                  id="demo-name"
                  name="name"
                  required
                  className="mt-2 text-right"
                  placeholder="نام مدیر یا نماینده سالن"
                />
              </div>

              <div>
                <Label htmlFor="demo-phone">شماره موبایل کاری</Label>
                <Input
                  id="demo-phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  required
                  className="mt-2 text-right"
                  placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
                />
              </div>

              <div>
                <Label htmlFor="demo-venue">نام سالن مطالعه</Label>
                <Input
                  id="demo-venue"
                  name="venueName"
                  required
                  className="mt-2 text-right"
                  placeholder="نام مجموعه شما"
                />
              </div>

              <div>
                <Label htmlFor="demo-message">
                  توضیحات (اختیاری)
                </Label>
                <Input
                  id="demo-message"
                  name="message"
                  className="mt-2 text-right"
                  placeholder="تعداد صندلی‌ها، وضعیت فعلی مدیریت، پرسش خاص"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={pending}
                className="w-full rounded-full"
              >
                {pending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال ثبت درخواست...
                  </>
                ) : (
                  "ثبت درخواست دمو رایگان"
                )}
              </Button>

              <p className="text-center text-xs leading-6 text-muted-foreground">
                اطلاعات شما نزد Studivo محفوظ است و با هیچ‌کسی به اشتراک گذاشته نمی‌شود.
              </p>
            </form>
          )}
        </div>
      </main>
      <StackedCircularFooter />
    </>
  );
}
