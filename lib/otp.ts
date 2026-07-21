import { prisma } from "@/lib/db";
import { sendVerificationCode } from "@/lib/sms";
import type { OtpPurpose } from "@/lib/generated/prisma/client";

export { OtpPurpose };

export const OTP_PURPOSE = {
  PASSWORD_RESET: "PASSWORD_RESET" as OtpPurpose,
  SIGNUP: "SIGNUP" as OtpPurpose,
} as const;

const OTP_EXPIRY_MINUTES = 5;

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createOtpVerification({
  phoneNumber,
  purpose,
}: {
  phoneNumber: string;
  purpose: OtpPurpose;
}) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpVerification.deleteMany({
    where: { phoneNumber, purpose },
  });

  const record = await prisma.otpVerification.create({
    data: {
      phoneNumber,
      code,
      purpose,
      expiresAt,
    },
  });

  await sendVerificationCode(phoneNumber, code);

  return { code, expiresAt, id: record.id };
}

export async function verifyOtp({
  phoneNumber,
  code,
  purpose,
}: {
  phoneNumber: string;
  code: string;
  purpose: OtpPurpose;
}) {
  const record = await prisma.otpVerification.findFirst({
    where: {
      phoneNumber,
      purpose,
      code,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { ok: false as const, error: "کد تایید نامعتبر یا منقضی شده است." };
  }

  return { ok: true as const, record };
}

export async function consumeOtp(id: string) {
  await prisma.otpVerification.delete({ where: { id } });
}