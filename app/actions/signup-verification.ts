"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  OTP_PURPOSE,
  createOtpVerification,
  verifyOtp,
} from "@/lib/otp";
import { SMS_SEND_FAILURE_MESSAGE } from "@/lib/sms";
import { getSession } from "@/lib/server";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل باید به فرمت ۰۹xxxxxxxxx باشد")
  .length(11, "شماره موبایل باید ۱۱ رقم باشد");

const otpSchema = z.string().length(6, "کد تایید باید ۶ رقم باشد.");

type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function requireUnverifiedPhoneUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    return { ok: false as const, error: "برای ادامه باید وارد شوید." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, phoneNumber: true },
  });

  if (!user) {
    return { ok: false as const, error: "کاربر یافت نشد." };
  }

  if (user.phoneNumber) {
    return {
      ok: false as const,
      error: "شماره موبایل شما قبلاً تایید شده است.",
    };
  }

  return { ok: true as const, user };
}

async function isPhoneTaken(phoneNumber: string, excludeUserId: string) {
  const existing = await prisma.user.findFirst({
    where: {
      phoneNumber,
      id: { not: excludeUserId },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

export async function requestSignupPhoneOTP(
  phoneNumber: string,
): Promise<ActionResult> {
  const auth = await requireUnverifiedPhoneUser();
  if (!auth.ok) {
    return auth;
  }

  const parsed = phoneSchema.safeParse(phoneNumber);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "شماره موبایل معتبر نیست.",
    };
  }

  if (await isPhoneTaken(parsed.data, auth.user.id)) {
    return { ok: false, error: "این شماره موبایل قبلاً ثبت شده است." };
  }

  try {
    await createOtpVerification({
      phoneNumber: parsed.data,
      purpose: OTP_PURPOSE.SIGNUP,
    });
  } catch (error) {
    if (error instanceof Error && error.message === SMS_SEND_FAILURE_MESSAGE) {
      return { ok: false, error: error.message };
    }

    console.error(
      "[signup-verification] Failed to send signup OTP:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { ok: false, error: "خطایی رخ داد. لطفاً دوباره تلاش کنید." };
  }

  return { ok: true, message: "کد تایید ارسال شد." };
}

export async function verifySignupPhoneOTP(
  phoneNumber: string,
  otp: string,
): Promise<ActionResult> {
  const auth = await requireUnverifiedPhoneUser();
  if (!auth.ok) {
    return auth;
  }

  const parsed = z
    .object({
      phoneNumber: phoneSchema,
      otp: otpSchema,
    })
    .safeParse({ phoneNumber, otp });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده صحیح نیست.",
    };
  }

  if (await isPhoneTaken(parsed.data.phoneNumber, auth.user.id)) {
    return { ok: false, error: "این شماره موبایل قبلاً ثبت شده است." };
  }

  const otpResult = await verifyOtp({
    phoneNumber: parsed.data.phoneNumber,
    code: parsed.data.otp,
    purpose: OTP_PURPOSE.SIGNUP,
  });

  if (!otpResult.ok) {
    return { ok: false, error: otpResult.error };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.user.id },
      data: { phoneNumber: parsed.data.phoneNumber },
    }),
    prisma.otpVerification.delete({ where: { id: otpResult.record.id } }),
  ]);

  revalidatePath("/verify-phone");
  revalidatePath("/onboarding");

  return { ok: true, message: "شماره موبایل شما با موفقیت تایید شد." };
}
