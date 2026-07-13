import { prisma } from "@/lib/db";
import { sendPushToMany } from "@/lib/push";

const dayInMs = 24 * 60 * 60 * 1000;
export const DEFAULT_RENEWAL_THRESHOLD_DAYS = 3;

type ReminderCandidate = {
  membershipId: string;
  studyhallId: string;
  studyhallName: string;
  seatNumber: string;
  memberName: string;
  endDate: Date;
  kind: "renewal" | "expired";
  daysLeft: number;
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

/**
 * Sends renewal reminders for memberships nearing expiry or already expired.
 * Migrated to Schema v2: Membership, Payment, and SeatAssignment models.
 *
 * NOTE: The legacy RenewalReminder model is not present in Schema v2.
 * Deduplication logic is currently disabled until a replacement strategy
 * (e.g., Notification history or a new dedicated model) is implemented.
 */
export async function sendRenewalReminders() {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const maxReminderDaysBefore = 14;
  const renewalCutoff = new Date(now.getTime() + maxReminderDaysBefore * dayInMs);

  // Fetch active memberships nearing expiry or already expired
  const memberships = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ endDate: { lt: now } }, { endDate: { lte: renewalCutoff } }],
    },
    include: {
      studyHall: {
        select: {
          id: true,
          name: true,
          // Note: reminder settings are currently missing from Schema v2 StudyHall model
          // Using defaults for now to maintain behavior
        },
      },
      user: { select: { name: true } },
      seatAssignments: {
        where: { endsAt: null },
        take: 1,
        include: { seat: { select: { number: true } } },
      },
      payments: {
        where: { status: "COMPLETED" },
        take: 1,
      }
    },
  });

  const candidates: ReminderCandidate[] = memberships.flatMap((membership) => {
    const daysLeft = Math.ceil(
      (membership.endDate.getTime() - now.getTime()) / dayInMs,
    );
    const kind = daysLeft < 0 ? "expired" : "renewal";

    // Since Schema v2 StudyHall lacks reminder settings, we default to enabled
    // and use the default threshold.
    const reminderDaysBefore = DEFAULT_RENEWAL_THRESHOLD_DAYS;

    if (kind === "renewal" && daysLeft > reminderDaysBefore) {
      return [];
    }

    return [{
      membershipId: membership.id,
      studyhallId: membership.studyHallId,
      studyhallName: membership.studyHall.name,
      seatNumber: membership.seatAssignments[0]?.seat.number ?? "—",
      memberName: membership.user.name,
      endDate: membership.endDate,
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

  // Deduplication logic using RenewalReminder is removed as the model is not in Schema v2.
  // TODO: Implement a new deduplication strategy using the Notification model or a background job log.

  let remindersSent = 0;
  let pushDeliveries = 0;
  let skipped = 0;
  let staleSubscriptions = 0;
  let failedDeliveries = 0;

  const pushSubscriptionsByHall = new Map<
    string,
    any[]
  >();

  for (const candidate of candidates) {
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

    // Note: Cannot create RenewalReminder as it is missing from Schema v2.
    // We should ideally create a Notification record here for the operator.

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

/**
 * Loads push subscriptions for operators (OWNER/STAFF) of a study hall.
 * Adapted for Schema v2 StaffAssignment model.
 */
async function loadOperatorPushSubscriptions(studyhallId: string) {
  return prisma.pushSubscription.findMany({
    where: {
      user: {
        staffAssignments: {
          some: {
            studyHallId: studyhallId,
            isActive: true,
          }
        }
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
