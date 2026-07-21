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
  .regex(/^09\d{9}$/, "شماره موبایل باید به فرمت ۰۹xxxxxxxxx باشد.")
  .length(11, "شماره موبایل باید ۱۱ رقم باشد.");

const otpSchema = z.string().length(6, "کد تایید باید ۶ رقم باشد.");

export type SignupVerificationResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * Checks session and ensures user is authenticated but doesn't have a verified phone yet.
 */
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

/**
 * Checks whether a phone number is already attached to another user account.
 */
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

/**
 * Requests an OTP code to verify user's signup phone number.
 */
export async function requestSignupPhoneOTP(
  phoneNumber: string
): Promise<SignupVerificationResult> {
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
      error instanceof Error ? error.message : "Unknown error"
    );
    return { ok: false, error: "خطایی در ارسال پیامک رخ داد. لطفاً دوباره تلاش کنید." };
  }

  return { ok: true, message: "کد تایید با موفقیت ارسال شد." };
}

/**
 * Verifies submitted OTP code and links the phone number to the current user.
 */
export async function verifySignupPhoneOTP(
  phoneNumber: string,
  otp: string
): Promise<SignupVerificationResult> {
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
    return { ok: false, error: "این شماره موبایل قبلاً برای حساب دیگری ثبت شده است." };
  }

  const otpResult = await verifyOtp({
    phoneNumber: parsed.data.phoneNumber,
    code: parsed.data.otp,
    purpose: OTP_PURPOSE.SIGNUP,
  });

  if (!otpResult.ok) {
    return { ok: false, error: otpResult.error };
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: auth.user.id },
        data: {
          phoneNumber: parsed.data.phoneNumber,
        },
      }),
      prisma.otpVerification.delete({ where: { id: otpResult.record.id } }),
    ]);
  } catch (error) {
    console.error("[verifySignupPhoneOTP] Error saving phone number:", error);
    return {
      ok: false,
      error: "خطایی در ثبت شماره موبایل در سیستم رخ داد.",
    };
  }

  revalidatePath("/verify-phone");
  revalidatePath("/onboarding");

  return { ok: true, message: "شماره موبایل شما با موفقیت تایید و ثبت شد." };
}