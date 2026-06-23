"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  requestPasswordResetOTP,
  resetPasswordWithOTP,
} from "@/app/actions/password-reset";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

type Step = "phone" | "otp" | "password";

type ForgotPasswordPopoverProps = {
  email: string;
};

export function ForgotPasswordPopover({ email: loginEmail }: ForgotPasswordPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState<Step>("phone");
  const [email, setEmail] = React.useState(loginEmail);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    setEmail(loginEmail);
  }, [loginEmail]);

  React.useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhoneNumber("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      return;
    }

    if (!email.trim()) return;

    let cancelled = false;

    async function loadPhone() {
      setLoading(true);
      setError(null);
      const result = await requestPasswordResetOTP({ email, sendOtp: false });
      if (cancelled) return;
      setLoading(false);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPhoneNumber(result.data?.phoneNumber ?? "");
    }

    void loadPhone();

    return () => {
      cancelled = true;
    };
  }, [open, email]);

  async function handleSendOtp() {
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordResetOTP({ email, sendOtp: true });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setPhoneNumber(result.data?.phoneNumber ?? phoneNumber);
      setStep("otp");
      toast.success(result.message ?? "کد تایید ارسال شد.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      const message = "کد تایید باید ۶ رقم باشد.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await resetPasswordWithOTP({ email, otp });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      setStep("password");
      toast.success(result.message ?? "کد تایید صحیح است.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      const message = "رمز عبور جدید و تکرار آن یکسان نیستند.";
      setError(message);
      toast.error(message);
      return;
    }

    if (newPassword.length < 8) {
      const message = "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordWithOTP({
        email,
        otp,
        newPassword,
        confirmPassword,
      });

      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "رمز عبور شما با موفقیت تغییر یافت.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="ms-auto text-sm underline-offset-4 hover:underline"
        >
          فراموشی رمز عبور
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <PopoverHeader>
          <PopoverTitle>بازیابی رمز عبور</PopoverTitle>
          <PopoverDescription>
            کد تایید به شماره موبایل ثبت‌شده ارسال می‌شود.
          </PopoverDescription>
        </PopoverHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {step === "phone" ? (
          <div className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="reset-email">ایمیل</FieldLabel>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
                dir="ltr"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="reset-phone">شماره موبایل</FieldLabel>
              <Input
                id="reset-phone"
                value={phoneNumber}
                readOnly
                placeholder={loading ? "در حال بارگذاری..." : "—"}
                className="bg-muted"
                dir="ltr"
              />
              <FieldDescription>
                شماره ثبت‌شده در حساب شما
              </FieldDescription>
            </Field>
            <Button
              type="button"
              disabled={loading || !email.trim() || !phoneNumber}
              onClick={() => void handleSendOtp()}
            >
              {loading ? <Loader2 className="animate-spin" /> : "ارسال کد تایید"}
            </Button>
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="flex flex-col gap-4">
            <FieldDescription className="text-center" dir="ltr">
              کد به {phoneNumber} ارسال شد
            </FieldDescription>
            <Field>
              <FieldLabel>کد تایید ۶ رقمی</FieldLabel>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </Field>
            <Button
              type="button"
              disabled={loading || otp.length !== 6}
              onClick={() => void handleVerifyOtp()}
            >
              {loading ? <Loader2 className="animate-spin" /> : "تایید کد"}
            </Button>
          </div>
        ) : null}

        {step === "password" ? (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="new-password">رمز عبور جدید</FieldLabel>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-background"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">تکرار رمز عبور</FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background"
              />
            </Field>
            <Button
              type="submit"
              disabled={
                loading ||
                !newPassword ||
                !confirmPassword
              }
            >
              {loading ? <Loader2 className="animate-spin" /> : "تغییر رمز عبور"}
            </Button>
          </form>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
