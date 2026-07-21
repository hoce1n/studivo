"use server";

import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  OTP_PURPOSE,
  createOtpVerification,
  verifyOtp,
} from "@/lib/otp";
import { SMS_SEND_FAILURE_MESSAGE } from "@/lib/sms";

const emailSchema = z
  .string()
  .trim()
  .email("ایمیل معتبر وارد کنید.");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل باید به فرمت ۰۹xxxxxxxxx باشد.");

const otpSchema = z.string().length(6, "کد تایید باید ۶ رقم باشد.");

const passwordSchema = z
  .string()
  .min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.");

export type PasswordResetActionResult =
  | { ok: true; message?: string; data?: { phoneNumber: string; verified?: boolean } }
  | { ok: false; error: string };

const GENERIC_ERROR = "امکان بازیابی رمز عبور برای این حساب وجود ندارد.";

/**
 * Finds user and validates attached phone number.
 */
async function findUserWithPhone(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      phoneNumber: true,
    },
  });

  if (!user?.phoneNumber) {
    return null;
  }

  const phoneParsed = phoneSchema.safeParse(user.phoneNumber);
  if (!phoneParsed.success) {
    return null;
  }

  return { ...user, phoneNumber: phoneParsed.data };
}

/**
 * Requests an OTP code to be sent to user's registered phone number for password reset.
 */
export async function requestPasswordResetOTP(input: {
  email: string;
  sendOtp?: boolean;
}): Promise<PasswordResetActionResult> {
  const parsed = z
    .object({
      email: emailSchema,
      sendOtp: z.boolean().optional().default(true),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده صحیح نیست.",
    };
  }

  const user = await findUserWithPhone(parsed.data.email);
  if (!user) {
    return { ok: false, error: GENERIC_ERROR };
  }

  if (parsed.data.sendOtp) {
    try {
      await createOtpVerification({
        phoneNumber: user.phoneNumber,
        purpose: OTP_PURPOSE.PASSWORD_RESET,
      });
    } catch (error) {
      if (error instanceof Error && error.message === SMS_SEND_FAILURE_MESSAGE) {
        return { ok: false, error: error.message };
      }

      console.error(
        "[password-reset] Failed to send password reset OTP:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return { ok: false, error: "خطایی در ارسال پیامک رخ داد. لطفاً دوباره تلاش کنید." };
    }
  }

  return {
    ok: true,
    message: parsed.data.sendOtp ? "کد تایید ارسال شد." : undefined,
    data: { phoneNumber: user.phoneNumber },
  };
}

/**
 * Verifies submitted OTP code and updates user account password with Better-Auth compatibility.
 */
export async function resetPasswordWithOTP(input: {
  email: string;
  otp: string;
  newPassword?: string;
  confirmPassword?: string;
}): Promise<PasswordResetActionResult> {
  const baseParsed = z
    .object({
      email: emailSchema,
      otp: otpSchema,
      newPassword: passwordSchema.optional(),
      confirmPassword: z.string().optional(),
    })
    .safeParse(input);

  if (!baseParsed.success) {
    return {
      ok: false,
      error: baseParsed.error.issues[0]?.message ?? "اطلاعات وارد شده صحیح نیست.",
    };
  }

  const { email, otp, newPassword, confirmPassword } = baseParsed.data;
  const verifyOnly = !newPassword;

  const user = await findUserWithPhone(email);
  if (!user) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const otpResult = await verifyOtp({
    phoneNumber: user.phoneNumber,
    code: otp,
    purpose: OTP_PURPOSE.PASSWORD_RESET,
  });

  if (!otpResult.ok) {
    return { ok: false, error: otpResult.error };
  }

  if (verifyOnly) {
    return {
      ok: true,
      message: "کد تایید صحیح است.",
      data: { phoneNumber: user.phoneNumber, verified: true },
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      ok: false,
      error: "رمز عبور جدید و تکرار آن یکسان نیستند.",
    };
  }

  const credentialAccount = await prisma.account.findFirst({
    where: {
      userId: user.id,
      providerId: "credential",
    },
    select: { id: true },
  });

  if (!credentialAccount) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const hashedPassword = await hashPassword(newPassword);

  try {
    await prisma.$transaction([
      prisma.account.update({
        where: { id: credentialAccount.id },
        data: { password: hashedPassword },
      }),
      prisma.otpVerification.delete({ where: { id: otpResult.record.id } }),
    ]);
  } catch (error) {
    console.error("[resetPasswordWithOTP] Error updating password:", error);
    return { ok: false, error: "خطایی در بروزرسانی رمز عبور رخ داد." };
  }

  return {
    ok: true,
    message: "رمز عبور شما با موفقیت تغییر یافت.",
    data: { phoneNumber: user.phoneNumber },
  };
}