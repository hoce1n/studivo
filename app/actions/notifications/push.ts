"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/audit";
import { sendPushToMany } from "@/lib/push";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { getSession } from "@/lib/server";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url("آدرس endpoint معتبر نیست."),
  keys: z.object({
    p256dh: z.string().min(1, "کلید p256dh الزامی است."),
    auth: z.string().min(1, "کلید auth الزامی است."),
  }),
  expirationTime: z.number().nullable().optional(),
});

/**
 * Subscribes a user device to Web Push Notifications.
 */
export async function subscribeUser(
  subscription: unknown
): Promise<ActionResult> {
  const user = await requireScopedUser();

  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اشتراک اعلان معتبر نیست.",
    };
  }

  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent");

  try {
    const existing = await prisma.pushSubscription.findFirst({ where: { endpoint: parsed.data.endpoint }, select: { id: true } });
    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { userId: user.id, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent },
      });
    } else {
      await prisma.pushSubscription.create({
        data: { userId: user.id, endpoint: parsed.data.endpoint, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth, userAgent },
      });
    }

    return {
      success: true,
      message: "اعلان‌های فشاری برای این دستگاه فعال شد.",
    };
  } catch (error) {
    console.error("[subscribeUser] Error:", error);
    return {
      success: false,
      error: "ثبت دستگاه برای ارسال اعلان با خطا مواجه شد.",
    };
  }
}

/**
 * Unsubscribes a user device (or all devices) from Push Notifications.
 */
export async function unsubscribeUser(
  endpoint?: string
): Promise<ActionResult> {
  const user = await requireScopedUser();

  try {
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint,
          userId: user.id,
        },
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId: user.id },
      });
    }

    return {
      success: true,
      message: "اعلان‌های فشاری غیرفعال شد.",
    };
  } catch (error) {
    console.error("[unsubscribeUser] Error:", error);
    return {
      success: false,
      error: "لغو اشتراک اعلان با خطا مواجه شد.",
    };
  }
}

/**
 * Sends a test push notification to all devices registered by the current user.
 */
export async function sendNotification(message: string): Promise<ActionResult> {
  const user = await requireScopedUser();

  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    return { success: false, error: "متن اعلان را وارد کنید." };
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
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
  } catch (error) {
    console.error("[sendNotification] Error:", error);
    return {
      success: false,
      error: "خطا در پردازش ارسال اعلان.",
    };
  }
}

/**
 * Retrieves current push notification subscription status for the current session.
 */
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
      staffAssignments: { where: { isActive: true }, select: { role: true }, take: 1 },
      pushSubscriptions: { select: { id: true }, take: 1 },
    },
  });

  return {
    subscribed: (user?.pushSubscriptions.length ?? 0) > 0,
    role: user?.staffAssignments[0]?.role ?? null,
  };
}