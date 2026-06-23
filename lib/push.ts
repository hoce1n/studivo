import webpush, { type PushSubscription as WebPushSubscription } from "web-push";

import { prisma } from "@/lib/db";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export type StoredPushSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured.");
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:1hccein@gmail.com",
    publicKey,
    privateKey,
  );

  vapidConfigured = true;
}

export function toWebPushSubscription(
  record: StoredPushSubscription,
): WebPushSubscription {
  return {
    endpoint: record.endpoint,
    keys: {
      p256dh: record.p256dh,
      auth: record.auth,
    },
  };
}

export async function sendPushToSubscription(
  record: StoredPushSubscription,
  payload: PushPayload,
) {
  ensureVapidConfigured();

  try {
    await webpush.sendNotification(
      toWebPushSubscription(record),
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/dashboard",
      }),
    );

    return { ok: true as const };
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? Number(error.statusCode)
        : undefined;

    if (statusCode === 404 || statusCode === 410) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: record.endpoint },
      });

      return { ok: false as const, stale: true };
    }

    throw error;
  }
}

export async function sendPushToMany(
  records: StoredPushSubscription[],
  payload: PushPayload,
) {
  const results = await Promise.allSettled(
    records.map((record) => sendPushToSubscription(record, payload)),
  );

  let sent = 0;
  let stale = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.ok) {
        sent += 1;
      } else if (result.value.stale) {
        stale += 1;
      }
      continue;
    }

    failed += 1;
  }

  return { sent, stale, failed };
}
