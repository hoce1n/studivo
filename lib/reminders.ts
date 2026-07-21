import { prisma } from "@/lib/db";
import { sendPushToMany } from "@/lib/push";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_RENEWAL_THRESHOLD_DAYS = 3;

type ReminderCandidate = {
  membershipId: string;
  studyHallId: string;
  studyHallName: string;
  memberName: string;
  endsAt: Date;
  kind: "renewal" | "expired";
  daysLeft: number;
};

function formatDaysLeft(daysLeft: number) {
  if (daysLeft <= 0) return "منقضی شده";
  if (daysLeft === 1) return "۱ روز تا انقضا";
  return `${daysLeft} روز تا انقضا`;
}

function buildReminderMessage(candidate: ReminderCandidate) {
  const timing = formatDaysLeft(candidate.daysLeft);
  if (candidate.kind === "expired") {
    return {
      title: "اشتراک منقضی شده",
      body: `${candidate.studyHallName}: دانش‌آموز ${candidate.memberName} · ${timing}`,
    };
  }
  return {
    title: "یادآوری تمدید اشتراک",
    body: `${candidate.studyHallName}: دانش‌آموز ${candidate.memberName} · ${timing}`,
  };
}

/**
 * Clean & minimal renewal reminder service aligned with v2 Schema.
 */
export async function sendRenewalReminders() {
  const now = new Date();
  const maxReminderDaysBefore = 7;
  const renewalCutoff = new Date(now.getTime() + maxReminderDaysBefore * DAY_IN_MS);

  // Query active memberships close to expiry or expired
  const memberships = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ endsAt: { lt: now } }, { endsAt: { lte: renewalCutoff } }],
    },
    select: {
      id: true,
      endsAt: true,
      studyHallId: true,
      user: { select: { name: true } },
    },
  });

  const candidates: ReminderCandidate[] = memberships.map((membership) => {
    const daysLeft = Math.ceil(
      (membership.endsAt.getTime() - now.getTime()) / DAY_IN_MS
    );
    const kind = daysLeft < 0 ? "expired" : "renewal";

    return {
      membershipId: membership.id,
      studyHallId: membership.studyHallId,
      studyHallName: "سالن مطالعه",
      memberName: membership.user.name,
      endsAt: membership.endsAt,
      kind,
      daysLeft,
    };
  });

  if (candidates.length === 0) {
    return { candidates: 0, remindersSent: 0, pushDeliveries: 0 };
  }

  let remindersSent = 0;
  let pushDeliveries = 0;

  for (const candidate of candidates) {
    // Find push subscriptions for users in the studyhall
    const pushSubscriptions = await prisma.pushSubscription.findMany({
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
      take: 10,
    });

    if (pushSubscriptions.length === 0) continue;

    const message = buildReminderMessage(candidate);
    const delivery = await sendPushToMany(pushSubscriptions, {
      ...message,
      url: "/dashboard/memberships",
    });

    remindersSent += 1;
    pushDeliveries += delivery.sent;
  }

  return {
    candidates: candidates.length,
    remindersSent,
    pushDeliveries,
  };
}