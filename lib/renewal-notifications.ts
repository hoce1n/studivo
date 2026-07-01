import { prisma } from "@/lib/db";
import { sendPushToMany } from "@/lib/push";

const dayInMs = 24 * 60 * 60 * 1000;
export const DEFAULT_RENEWAL_THRESHOLD_DAYS = 3;

type ReminderCandidate = {
  subscriptionId: string;
  studyhallId: string;
  studyhallName: string;
  seatNumber: number;
  memberName: string;
  endDate: Date;
  kind: "renewal" | "expired";
  daysLeft: number;
  paymentStatus: string;
};

function getReminderKey(kind: ReminderCandidate["kind"], dateKey: string) {
  return `${kind}-${dateKey}`;
}

function formatDaysLeft(daysLeft: number) {
  if (daysLeft <= 0) {
    return "منقضی شده";
  }

  if (daysLeft === 1) {
    return "۱ روز تا انقضا";
  }

  return `${daysLeft} روز تا انقضا`;
}

function buildReminderMessage(candidate: ReminderCandidate) {
  const timing = formatDaysLeft(candidate.daysLeft);

  if (candidate.kind === "expired") {
    return {
      title: "اشتراک منقضی شده",
      body: `${candidate.studyhallName}: صندلی ${candidate.seatNumber} · ${candidate.memberName} · ${timing}`,
    };
  }

  return {
    title: "یادآوری تمدید اشتراک",
    body: `${candidate.studyhallName}: صندلی ${candidate.seatNumber} · ${candidate.memberName} · ${timing}`,
  };
}

export async function sendRenewalReminders() {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const maxReminderDaysBefore = 14;
  const renewalCutoff = new Date(now.getTime() + maxReminderDaysBefore * dayInMs);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: "active",
      OR: [{ endDate: { lt: now } }, { endDate: { lte: renewalCutoff } }],
      studyhall: {
        OR: [
          { renewalRemindersEnabled: true },
          { expiryRemindersEnabled: true },
        ],
      },
    },
    select: {
      id: true,
      endDate: true,
      studyhallId: true,
      paymentStatus: true,
      studyhall: {
        select: {
          name: true,
          reminderDaysBefore: true,
          renewalRemindersEnabled: true,
          expiryRemindersEnabled: true,
        },
      },
      seat: { select: { seatNumber: true } },
      user: { select: { name: true } },
    },
  });

  // Handle paymentStatus reset for expired subscriptions
  const expiredPaidSubscriptions = subscriptions.filter(
    (sub) => sub.endDate < now && sub.paymentStatus === "paid"
  );

  if (expiredPaidSubscriptions.length > 0) {
    console.log(`Found ${expiredPaidSubscriptions.length} expired paid subscriptions. Setting paymentStatus to unpaid.`);
    await prisma.$transaction(
      expiredPaidSubscriptions.map((sub) =>
        prisma.subscription.update({
          where: { id: sub.id },
          data: { paymentStatus: "unpaid" },
        })
      )
    );
  }

  const candidates: ReminderCandidate[] = subscriptions.flatMap((subscription) => {
    const daysLeft = Math.ceil(
      (subscription.endDate.getTime() - now.getTime()) / dayInMs,
    );
    const kind = daysLeft < 0 ? "expired" : "renewal";

    if (kind === "expired" && !subscription.studyhall.expiryRemindersEnabled) {
      return [];
    }

    if (
      kind === "renewal" &&
      (!subscription.studyhall.renewalRemindersEnabled ||
        daysLeft > subscription.studyhall.reminderDaysBefore)
    ) {
      return [];
    }

    return [{
      subscriptionId: subscription.id,
      studyhallId: subscription.studyhallId,
      studyhallName: subscription.studyhall.name,
      seatNumber: subscription.seat.seatNumber,
      memberName: subscription.user.name,
      endDate: subscription.endDate,
      kind,
      daysLeft,
    }];
  });

  if (candidates.length === 0) {
    return {
      candidates: 0,
      remindersSent: 0,
      pushDeliveries: 0,
      skipped: 0,
      staleSubscriptions: 0,
      failedDeliveries: 0,
    };
  }

  const existingReminders = await prisma.renewalReminder.findMany({
    where: {
      subscriptionId: { in: candidates.map((candidate) => candidate.subscriptionId) },
      reminderKey: {
        in: candidates.map((candidate) =>
          getReminderKey(candidate.kind, dateKey),
        ),
      },
    },
    select: { subscriptionId: true, reminderKey: true },
  });

  const alreadySent = new Set(
    existingReminders.map(
      (reminder) => `${reminder.subscriptionId}:${reminder.reminderKey}`,
    ),
  );

  let remindersSent = 0;
  let pushDeliveries = 0;
  let skipped = 0;
  let staleSubscriptions = 0;
  let failedDeliveries = 0;

  const pushSubscriptionsByHall = new Map<
    string,
    Awaited<ReturnType<typeof loadOperatorPushSubscriptions>>
  >();

  for (const candidate of candidates) {
    const reminderKey = getReminderKey(candidate.kind, dateKey);
    const dedupeKey = `${candidate.subscriptionId}:${reminderKey}`;

    if (alreadySent.has(dedupeKey)) {
      skipped += 1;
      continue;
    }

    let pushSubscriptions = pushSubscriptionsByHall.get(candidate.studyhallId);
    if (!pushSubscriptions) {
      pushSubscriptions = await loadOperatorPushSubscriptions(candidate.studyhallId);
      pushSubscriptionsByHall.set(candidate.studyhallId, pushSubscriptions);
    }

    if (pushSubscriptions.length === 0) {
      skipped += 1;
      continue;
    }

    const message = buildReminderMessage(candidate);
    const delivery = await sendPushToMany(pushSubscriptions, {
      ...message,
      url: "/dashboard?sortBy=renewal",
    });

    await prisma.renewalReminder.create({
      data: {
        subscriptionId: candidate.subscriptionId,
        studyhallId: candidate.studyhallId,
        reminderKey,
      },
    });

    remindersSent += 1;
    pushDeliveries += delivery.sent;
    staleSubscriptions += delivery.stale;
    failedDeliveries += delivery.failed;
  }

  return {
    candidates: candidates.length,
    remindersSent,
    pushDeliveries,
    skipped,
    staleSubscriptions,
    failedDeliveries,
  };
}

async function loadOperatorPushSubscriptions(studyhallId: string) {
  return prisma.pushSubscription.findMany({
    where: {
      studyhallId,
      user: {
        role: { in: ["admin", "staff"] },
      },
    },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });
}
