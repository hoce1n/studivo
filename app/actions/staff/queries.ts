"use server";

import { prisma } from "@/lib/db";
import { requireScopedUser } from "@/app/actions/auth/verify-role";

/**
 * Fetches all staff assignments for the current study hall.
 */
export async function getStaffList() {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  return await prisma.staffAssignment.findMany({
    where: { studyHallId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          image: true,
        },
      },
    },
    orderBy: [
      { isActive: "desc" },
      { role: "asc" },
      { startDate: "desc" },
    ],
  });
}

/**
 * Fetches shifts for the current study hall with optional filters.
 */
export async function getShifts(filters: {
  staffAssignmentId?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  const where: any = {
    staffAssignment: { studyHallId },
  };

  if (filters.staffAssignmentId) {
    where.staffAssignmentId = filters.staffAssignmentId;
  }

  // If user is STAFF, they can only see their own shifts unless OWNER
  if (user.role === "STAFF") {
    const currentAssignment = await prisma.staffAssignment.findFirst({
      where: { userId: user.id, studyHallId, isActive: true },
      select: { id: true },
    });

    if (currentAssignment) {
      where.staffAssignmentId = currentAssignment.id;
    }
  }

  if (filters.startDate || filters.endDate) {
    where.startsAt = {};
    if (filters.startDate) where.startsAt.gte = filters.startDate;
    if (filters.endDate) where.startsAt.lte = filters.endDate;
  }

  return await prisma.shift.findMany({
    where,
    include: {
      staffAssignment: {
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { startsAt: "desc" },
  });
}

/**
 * Calculates total working hours for a staff member in a half-open date range
 * [startDate, endExclusive). Overlapping overnight shifts are clamped to the range.
 */
export async function calculateTotalHours(
  staffAssignmentId: string,
  startDate: Date,
  endExclusive: Date,
) {
  const hoursByAssignment = await calculateStaffHoursMap(
    [staffAssignmentId],
    startDate,
    endExclusive,
  );
  return hoursByAssignment[staffAssignmentId] ?? 0;
}

/**
 * Batch version: hours per staff assignment for [startDate, endExclusive).
 */
export async function calculateStaffHoursMap(
  staffAssignmentIds: string[],
  startDate: Date,
  endExclusive: Date,
): Promise<Record<string, number>> {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  if (staffAssignmentIds.length === 0) return {};

  const shifts = await prisma.shift.findMany({
    where: {
      staffAssignmentId: { in: staffAssignmentIds },
      staffAssignment: { studyHallId },
      // Overlap with [startDate, endExclusive)
      startsAt: { lt: endExclusive },
      endsAt: { gt: startDate },
    },
    select: { staffAssignmentId: true, startsAt: true, endsAt: true },
  });

  const rangeStartMs = startDate.getTime();
  const rangeEndMs = endExclusive.getTime();
  const hoursByAssignment: Record<string, number> = {};

  for (const id of staffAssignmentIds) {
    hoursByAssignment[id] = 0;
  }

  for (const shift of shifts) {
    const startMs = Math.max(shift.startsAt.getTime(), rangeStartMs);
    const endMs = Math.min(shift.endsAt.getTime(), rangeEndMs);
    if (endMs <= startMs) continue;
    hoursByAssignment[shift.staffAssignmentId] =
      (hoursByAssignment[shift.staffAssignmentId] ?? 0) +
      (endMs - startMs) / (1000 * 60 * 60);
  }

  return hoursByAssignment;
}
