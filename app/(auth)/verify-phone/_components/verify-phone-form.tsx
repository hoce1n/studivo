"use client";

import * as React from "react";
import { Loader2, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  requestSignupPhoneOTP,
  verifySignupPhoneOTP,
} from "@/app/actions/signup-verification";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Step = "phone" | "otp";

export function VerifyPhoneForm() {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSendOtp() {
    setError(null);
    setLoading(true);
    try {
      const result = await requestSignupPhoneOTP(phoneNumber);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

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
      const result = await verifySignupPhoneOTP(phoneNumber, otp);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(result.message ?? "شماره موبایل شما تایید شد.");
      router.push("/onboarding");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Smartphone className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">تایید شماره موبایل</h1>
          <p className="mt-1 text-sm text-balance text-muted-foreground">
            برای ادامه، شماره موبایل خود را وارد و تایید کنید.
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        {step === "phone" ? (
          <>
            <Field>
              <FieldLabel htmlFor="phone">شماره موبایل</FieldLabel>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09123456789"
                inputMode="numeric"
                dir="ltr"
                className="bg-background"
              />
              <FieldDescription>
                کد تایید به این شماره ارسال می‌شود.
              </FieldDescription>
            </Field>
            <Button
              type="button"
              disabled={loading || phoneNumber.trim().length < 11}
              onClick={() => void handleSendOtp()}
            >
              {loading ? <Loader2 className="animate-spin" /> : "ارسال کد تایید"}
            </Button>
          </>
        ) : null}

        {step === "otp" ? (
          <>
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
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                disabled={loading || otp.length !== 6}
                onClick={() => void handleVerifyOtp()}
              >
                {loading ? <Loader2 className="animate-spin" /> : "تایید و ادامه"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={loading}
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError(null);
                }}
              >
                تغییر شماره موبایل
              </Button>
            </div>
          </>
        ) : null}
      </FieldGroup>
    </div>
  );
}
