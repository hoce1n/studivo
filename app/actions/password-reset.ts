"use server";

import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import { prisma } from "@/lib/db";
import {
  OTP_PURPOSE,
  createOtpVerification,
  verifyOtp,
} from "@/lib/otp";

const emailSchema = z
  .string()
  .trim()
  .email("ایمیل معتبر وارد کنید.");

const phoneSchema = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, "شماره موبایل باید به فرمت ۰۹xxxxxxxxx باشد");

const otpSchema = z.string().length(6, "کد تایید باید ۶ رقم باشد.");

const passwordSchema = z
  .string()
  .min(8, "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.");

type ActionResult =
  | { ok: true; message?: string; data?: { phoneNumber: string; verified?: boolean } }
  | { ok: false; error: string };

const GENERIC_ERROR = "امکان بازیابی رمز عبور برای این حساب وجود ندارد.";

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

export async function requestPasswordResetOTP(input: {
  email: string;
  sendOtp?: boolean;
}): Promise<ActionResult> {
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
    await createOtpVerification({
      phoneNumber: user.phoneNumber,
      purpose: OTP_PURPOSE.PASSWORD_RESET,
    });
  }

  return {
    ok: true,
    message: parsed.data.sendOtp
      ? "کد تایید ارسال شد."
      : undefined,
    data: { phoneNumber: user.phoneNumber },
  };
}

export async function resetPasswordWithOTP(input: {
  email: string;
  otp: string;
  newPassword?: string;
  confirmPassword?: string;
}): Promise<ActionResult> {
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

  await prisma.$transaction([
    prisma.account.update({
      where: { id: credentialAccount.id },
      data: { password: hashedPassword },
    }),
    prisma.otpVerification.delete({ where: { id: otpResult.record.id } }),
  ]);

  return {
    ok: true,
    message: "رمز عبور شما با موفقیت تغییر یافت.",
    data: { phoneNumber: user.phoneNumber },
  };
}
