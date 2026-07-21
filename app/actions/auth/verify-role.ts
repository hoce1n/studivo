"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/server";
import { prisma } from "@/lib/db"; // کلاینت جدید v2

export async function requireUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetching user using the updated v2 schema structure
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
      platformRole: true,
      image: true,
      // In v2, roles are fetched via the relation table
      staffAssignments: {
        where: { isActive: true },
        select: {
          studyHallId: true,
          role: true,
          studyHall: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireScopedUser() {
  const user = await requireUser();
  const activeAssignment = user.staffAssignments[0];

  if (!activeAssignment) {
    redirect("/onboarding");
  }

  return {
    ...user,
    studyHallId: activeAssignment.studyHallId,
    role: activeAssignment.role, // Returns 'OWNER' or 'STAFF'
    studyHall: activeAssignment.studyHall,
  };
}

export async function requirePlatformUser() {
  const user = await requireUser();

  if (!user.platformRole) {
    redirect("/dashboard");
  }

  return { ...user, platformRole: user.platformRole };
}