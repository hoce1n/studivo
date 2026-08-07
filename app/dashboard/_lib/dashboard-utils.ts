import { formatTehranDate } from "@/lib/date";

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type SeatStatus = "available" | "reserved" | "renewal" | "expired";

type AssignmentLike = {
  id: string;
  endsAt: Date | string | null;
  membership: {
    id: string;
    status: string;
    startsAt: Date | string;
    endsAt: Date | string;
    planPrice?: unknown;
    user?: { name: string | null; phoneNumber: string | null };
    payments?: { id: string; status?: string; method?: string }[];
  };
};

function toTime(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Determines if a seat assignment represents an active occupancy.
 * 
 * Logic:
 * 1. If membership is CANCELLED, it's never an active occupancy.
 * 2. Canonical V2: If endsAt is null, it's currently active.
 * 3. Legacy Compatibility: In early V2 migration, active assignments had endsAt 
 *    set to the membership end date. We treat them as active ONLY if endsAt 
 *    matches the membership end date exactly.
 * 4. If endsAt is even slightly earlier than the membership end date, it means 
 *    the seat was explicitly vacated (via swapSeat or releaseSeat) and is vacant.
 */
export function isOccupyingAssignment(assignment: {
  endsAt: Date | string | null;
  membership: { status: string; endsAt: Date | string };
}): boolean {
  if (assignment.membership.status === "CANCELLED") return false;

  // Canonical V2: Open assignments are active.
  if (assignment.endsAt == null) return true;

  const assignmentEnd = toTime(assignment.endsAt);
  const membershipEnd = toTime(assignment.membership.endsAt);

  if (assignmentEnd == null || membershipEnd == null) return false;

  /**
   * Legacy check:
   * Migrated rows from V1 were created with assignment.endsAt === membership.endsAt.
   * If a seat is swapped or released, we set assignment.endsAt = now.
   *
   * CRITICAL FIX: The legacy equality check must ONLY apply if the membership
   * is still ACTIVE or PENDING. If a membership is EXPIRED, old legacy rows
   * should not be considered "occupying" if a newer (now closed) assignment exists.
   */
  const isLegacyActive =
    assignmentEnd === membershipEnd &&
    (assignment.membership.status === "ACTIVE" ||
      assignment.membership.status === "PENDING");

  return isLegacyActive;
}

export function getActiveAssignment<T extends AssignmentLike>(
  assignments: T[] | undefined
): T | undefined {
  if (!assignments?.length) return undefined;

  /**
   * CRITICAL FIX: We should only ever consider the MOST RECENT assignment
   * for occupancy. If the latest assignment is closed (e.g. via swap or release),
   * the seat is vacant. We must not fall back to older legacy assignments
   * in the history that might happen to satisfy the equality check.
   */
  const latest = assignments[0];
  if (isOccupyingAssignment(latest)) {
    return latest;
  }

  return undefined;
}

export function getSeatStatus(
  endsAt?: Date | string | null,
  membershipStatus?: string
): SeatStatus {
  const endTime = toTime(endsAt ?? null);
  if (endTime == null) return "available";
  if (membershipStatus === "CANCELLED") return "available";
  if (membershipStatus === "EXPIRED") return "expired";

  const diffDays = Math.ceil((endTime - Date.now()) / DAY_IN_MS);
  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "renewal";
  return "reserved";
}


export const statusCopy: Record<
  SeatStatus,
  {
    label: string;
    className: string;
    dot: string;
    badge: "success" | "warning" | "destructive" | "muted";
  }
> = {
  available: {
    label: "خالی",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    dot: "bg-emerald-500",
    badge: "success",
  },
  reserved: {
    label: "رزرو فعال",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    dot: "bg-red-500",
    badge: "destructive",
  },
  renewal: {
    label: "نیازمند تمدید",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    dot: "bg-amber-500",
    badge: "warning",
  },
  expired: {
    label: "منقضی",
    className:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    dot: "bg-slate-400",
    badge: "muted",
  },
};

export function formatDate(date: Date) {
  return formatTehranDate(date);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export function processSeatData(
  seats: { number: string; assignments: AssignmentLike[] }[],
  sortByRenewal: boolean
) {
  // Track active assignments by membership ID to find duplicates
  const activeAssignmentsByMembership = new Map<string, string[]>();
  seats.forEach((seat) => {
    const active = getActiveAssignment(seat.assignments);
    if (active?.membership.id) {
      const existing = activeAssignmentsByMembership.get(active.membership.id) || [];
      activeAssignmentsByMembership.set(active.membership.id, [...existing, seat.number]);
    }
  });

  const initialSeatView = seats.map((seat) => {
    const currentAssignment = getActiveAssignment(seat.assignments);
    const membership = currentAssignment?.membership;
    const seatNum = parseInt(seat.number, 10) || 0;

    const isDuplicate =
      membership?.id && (activeAssignmentsByMembership.get(membership.id)?.length ?? 0) > 1;

    return {
      ...seat,
      seatNumber: seatNum,
      membership,
      status: getSeatStatus(membership?.endsAt, membership?.status),
      isDuplicate,
      duplicateSeats: isDuplicate ? activeAssignmentsByMembership.get(membership.id!) : undefined,
    };
  });

  const seatView = sortByRenewal
    ? [...initialSeatView].sort((a, b) => {
        const timeA = a.membership
          ? new Date(a.membership.endsAt).getTime()
          : Infinity;
        const timeB = b.membership
          ? new Date(b.membership.endsAt).getTime()
          : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return a.seatNumber - b.seatNumber;
      })
    : initialSeatView;

  const stats = {
    available: seatView.filter((s) => s.status === "available").length,
    reserved: seatView.filter((s) => s.status === "reserved").length,
    renewal: seatView.filter((s) => s.status === "renewal").length,
    expired: seatView.filter((s) => s.status === "expired").length,
  };

  let activeRevenue = 0;
  let atRiskRevenue = 0;

  seatView.forEach((s) => {
    if (s.membership) {
      const price = Number(s.membership.planPrice) || 0;
      if (s.status === "reserved") activeRevenue += price;
      if (s.status === "renewal") atRiskRevenue += price;
    }
  });

  return { seatView, stats, activeRevenue, atRiskRevenue };
}
