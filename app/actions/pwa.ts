"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/audit";
import { sendPushToMany } from "@/lib/push";
import { getSession } from "@/lib/server";


const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  expirationTime: z.number().nullable().optional(),
});

async function requirePushUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    return { ok: false as const, error: "برای فعال‌سازی اعلان‌ها باید وارد شوید." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      studyhallId: true,
      role: true,
    },
  });

  if (!user) {
    return { ok: false as const, error: "کاربر یافت نشد." };
  }

  if (!user.studyhallId) {
    return {
      ok: false as const,
      error: "ابتدا سالن خود را راه‌اندازی کنید تا اعلان‌ها فعال شوند.",
    };
  }

  return { ok: true as const, user: { ...user, studyhallId: user.studyhallId } };
}

export async function subscribeUser(
  subscription: unknown,
): Promise<ActionResult> {
  const authResult = await requirePushUser();
  if (!authResult.ok) {
    return { success: false, error: authResult.error };
  }

  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { success: false, error: "اشتراک اعلان معتبر نیست." };
  }

  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent");

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: authResult.user.id,
      studyhallId: authResult.user.studyhallId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
    update: {
      userId: authResult.user.id,
      studyhallId: authResult.user.studyhallId,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
    },
  });

  return {
    success: true,
    message: "اعلان‌های فشاری برای این دستگاه فعال شد.",
  };
}

export async function unsubscribeUser(
  endpoint?: string,
): Promise<ActionResult> {
  const authResult = await requirePushUser();
  if (!authResult.ok) {
    return { success: false, error: authResult.error };
  }

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: authResult.user.id,
      },
    });
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId: authResult.user.id },
    });
  }

  return {
    success: true,
    message: "اعلان‌های فشاری غیرفعال شد.",
  };
}

export async function sendNotification(message: string): Promise<ActionResult> {
  const authResult = await requirePushUser();
  if (!authResult.ok) {
    return { success: false, error: authResult.error };
  }

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return { success: false, error: "متن اعلان را وارد کنید." };
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: authResult.user.id },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (subscriptions.length === 0) {
    return {
      success: false,
      error: "هیچ اشتراک فعالی برای ارسال اعلان آزمایشی پیدا نشد.",
    };
  }

  const delivery = await sendPushToMany(subscriptions, {
    title: "اعلان آزمایشی استودیوو",
    body: trimmedMessage,
    url: "/dashboard/profile",
  });

  if (delivery.sent === 0) {
    return {
      success: false,
      error: "ارسال اعلان آزمایشی ناموفق بود.",
    };
  }

  return {
    success: true,
    message: `اعلان آزمایشی به ${delivery.sent} دستگاه ارسال شد.`,
  };
}

export async function getPushSubscriptionStatus(): Promise<{
  subscribed: boolean;
  role: string | null;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { subscribed: false, role: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      pushSubscriptions: { select: { id: true }, take: 1 },
    },
  });

  return {
    subscribed: (user?.pushSubscriptions.length ?? 0) > 0,
    role: user?.role ?? null,
  };
}
