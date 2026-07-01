"use client";

import { useTransition, useState } from "react";
import { Loader2, ShieldAlert, CheckCircle2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { submitLead, type SubmitDemoResult } from "@/app/actions/marketing";
import { toast } from "sonner";

type VenueDemoFormProps = {
  venueName: string;
};

// ---------------------------------------------------------------------------
// Success panel — shown after a lead is created successfully
// ---------------------------------------------------------------------------
function SuccessPanel({ name, venueName }: { name: string; venueName: string }) {
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
          تیم Studivo درخواست بازدید {venueName} را دریافت کرد و
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
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              ۱
            </span>
            <div>
              <span className="font-semibold text-foreground">تماس ظرف ۲۴ ساعت — </span>
              کارشناس Studivo در روز کاری بعدی با شماره‌ای که ثبت کردید تماس می‌گیرد.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              ۲
            </span>
            <div>
              <span className="font-semibold text-foreground">جلسه دموی زنده — </span>
              یک جلسه رایگان برگزار می‌شود تا امکانات مرتبط با سالن شما را نشان دهیم.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              ۳
            </span>
            <div>
              <span className="font-semibold text-foreground">راه‌اندازی سریع — </span>
              اگر Studivo مناسب بود، در همان جلسه اول راه‌اندازی را با هم شروع می‌کنیم.
            </div>
          </li>
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
// Venue demo form
// ---------------------------------------------------------------------------
export function VenueDemoForm({ venueName }: VenueDemoFormProps) {
  const [pending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString() ?? "";

    // Ensure venueName is set to the current venue
    formData.set("venueName", venueName);

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
      {submittedName !== null ? (
        <SuccessPanel name={submittedName} venueName={venueName} />
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8 space-y-5"
          aria-label="فرم درخواست بازدید"
        >
          <h2 className="text-xl font-semibold text-right">درخواست بازدید رایگان</h2>

          {errorMessage && (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>خطا در ثبت درخواست</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="venue-demo-name">نام و نام خانوادگی</Label>
            <Input
              id="venue-demo-name"
              name="name"
              required
              className="mt-2 text-right"
              placeholder="نام شما"
            />
          </div>

          <div>
            <Label htmlFor="venue-demo-phone">شماره موبایل</Label>
            <Input
              id="venue-demo-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              className="mt-2 text-right"
              placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷"
            />
          </div>

          <div>
            <Label htmlFor="venue-demo-message">توضیحات (اختیاری)</Label>
            <Input
              id="venue-demo-message"
              name="message"
              className="mt-2 text-right"
              placeholder="نیازهای خاص یا سؤال‌های خود را بنویسید"
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
              "درخواست بازدید رایگان"
            )}
          </Button>

          <p className="text-center text-xs leading-6 text-muted-foreground">
            اطلاعات شما نزد Studivo محفوظ است و با هیچ‌کسی به اشتراک گذاشته نمی‌شود.
          </p>
        </form>
      )}
    </>
  );
}
