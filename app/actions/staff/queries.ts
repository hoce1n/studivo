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
 * Calculates total working hours for a staff member in a date range.
 */
export async function calculateTotalHours(
  staffAssignmentId: string,
  startDate: Date,
  endDate: Date
) {
  const user = await requireScopedUser();
  const { studyHallId } = user;

  // Security check: Ensure assignment belongs to this hall
  const assignment = await prisma.staffAssignment.findFirst({
    where: { id: staffAssignmentId, studyHallId },
    select: { id: true },
  });

  if (!assignment) return 0;

  const shifts = await prisma.shift.findMany({
    where: {
      staffAssignmentId,
      startsAt: { gte: startDate },
      endsAt: { lte: endDate },
    },
    select: { startsAt: true, endsAt: true },
  });

  const totalMilliseconds = shifts.reduce((acc, shift) => {
    return acc + (shift.endsAt.getTime() - shift.startsAt.getTime());
  }, 0);

  return totalMilliseconds / (1000 * 60 * 60); // Return hours
}
