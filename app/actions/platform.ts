"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/audit";
import { requirePlatformUser } from "@/app/actions/auth";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;

/**
 * requireSuperAdmin — asserts the current session is a SUPER_ADMIN.
 * Redirects SALES users back to /platform (read-only view).
 * Builds on requirePlatformUser which already handles no-session → /login
 * and no-platformRole → /dashboard.
 */
export async function requireSuperAdmin() {
  const user = await requirePlatformUser();
  if (user.platformRole !== "SUPER_ADMIN") {
    redirect("/platform");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Read helpers (used directly by Server Components)
// ---------------------------------------------------------------------------

export type LeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  venueName: string | null;
  status: string;
  source: string;
  createdAt: Date;
  owner: { id: string; name: string } | null;
  _count: { demoRequests: number };
};

export type LeadFilters = {
  status?: string;
  source?: string;
};

export async function getLeads(filters: LeadFilters = {}): Promise<LeadRow[]> {
  await requirePlatformUser();

  return prisma.lead.findMany({
    where: {
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status as never }
        : {}),
      ...(filters.source && filters.source !== "ALL"
        ? { source: filters.source as never }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      venueName: true,
      status: true,
      source: true,
      createdAt: true,
      owner: { select: { id: true, name: true } },
      _count: { select: { demoRequests: true } },
    },
  });
}

export type LeadDetail = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  venueName: string | null;
  message: string | null;
  status: string;
  source: string;
  lostReason: string | null;
  studyhallId: string | null;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string } | null;
  demoRequests: {
    id: string;
    status: string;
    preferredTime: string | null;
    scheduledAt: Date | null;
    notes: string | null;
    createdAt: Date;
  }[];
};

export async function getLeadById(id: string): Promise<LeadDetail | null> {
  await requirePlatformUser();

  return prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      venueName: true,
      message: true,
      status: true,
      source: true,
      lostReason: true,
      studyhallId: true,
      convertedAt: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true } },
      demoRequests: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          preferredTime: true,
          scheduledAt: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });
}

export type PlatformStats = {
  total: number;
  newThisWeek: number;
  inDemo: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  await requirePlatformUser();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [total, newThisWeek, inDemo] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { status: "DEMO" } }),
  ]);

  return { total, newThisWeek, inDemo };
}

// ---------------------------------------------------------------------------
// Venues read helpers
// ---------------------------------------------------------------------------

export type VenueRow = {
  id: string;
  name: string;
  gender: string;
  totalSeats: number;
  createdAt: Date;
  lead: { id: string; fullName: string | null; studyhallName: string | null } | null;
  _count: { activeSubscriptions: number };
};

export type VenueDetail = {
  id: string;
  name: string;
  gender: string;
  address: string;
  totalSeats: number;
  monthlyFee: number;
  createdAt: Date;
  updatedAt: Date;
  lead: {
    id: string;
    name: string | null;
    phone: string | null;
    venueName: string | null;
    status: string;
  } | null;
  _count: { activeSubscriptions: number; users: number };
};

export async function getVenues(): Promise<VenueRow[]> {
  await requirePlatformUser();

  const halls = await prisma.studyHall.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gender: true,
      totalSeats: true,
      createdAt: true,
      lead: {
        select: { id: true, fullName: true, studyhallName: true },
      },
      subscriptions: {
        where: { status: "active" },
        select: { id: true },
      },
    },
  });

  return halls.map((h) => ({
    id: h.id,
    name: h.name,
    gender: h.gender,
    totalSeats: h.totalSeats,
    createdAt: h.createdAt,
    lead: h.lead
      ? {
          id: h.lead.id,
          name: h.lead.fullName,
          venueName: h.lead.studyhallName,
        }
      : null,
    _count: { activeSubscriptions: h.subscriptions.length },
  }));
}

export async function getVenueById(id: string): Promise<VenueDetail | null> {
  await requirePlatformUser();

  const hall = await prisma.studyHall.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      gender: true,
      address: true,
      totalSeats: true,
      monthlyFee: true,
      createdAt: true,
      updatedAt: true,
      lead: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          studyhallName: true,
          status: true,
        },
      },
      subscriptions: {
        where: { status: "active" },
        select: { id: true },
      },
      users: {
        select: { id: true },
      },
    },
  });

  if (!hall) return null;

  return {
    id: hall.id,
    name: hall.name,
    gender: hall.gender,
    address: hall.address,
    totalSeats: hall.totalSeats,
    monthlyFee: hall.monthlyFee,
    createdAt: hall.createdAt,
    updatedAt: hall.updatedAt,
    lead: hall.lead
      ? {
          id: hall.lead.id,
          name: hall.lead.fullName,
          phone: hall.lead.phoneNumber,
          venueName: hall.lead.studyhallName,
          status: hall.lead.status,
        }
      : null,
    _count: {
      activeSubscriptions: hall.subscriptions.length,
      users: hall.users.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const updateStatusSchema = z.object({
  leadId: z.string().cuid(),
  status: z.enum(["NEW", "CONTACTED", "DEMO", "TRIAL", "CUSTOMER", "LOST"]),
  lostReason: z.string().trim().max(500).optional(),
});

export async function updateLeadStatus(
  formData: FormData
): Promise<ActionResult> {
  await requirePlatformUser();

  const parsed = updateStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    lostReason: formData.get("lostReason") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "داده‌های وارد شده معتبر نیست.",
    };
  }

  const { leadId, status, lostReason } = parsed.data;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      lostReason: status === "LOST" ? (lostReason ?? null) : null,
    },
  });

  revalidatePath("/platform");
  return { success: true, message: "وضعیت لید با موفقیت به‌روز شد." };
}

export async function convertLeadToStudyHall(
  formData: FormData
): Promise<ActionResult<{ studyhallId: string }>> {
  // Only SUPER_ADMIN can convert a lead.
  await requireSuperAdmin();

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) {
    return { success: false, error: "شناسه لید الزامی است." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      status: true,
      convertedStudyHallId: true,
      fullName: true,
      studyhallName: true,
      phoneNumber: true,
      email: true,
    },
  });

  if (!lead) {
    return { success: false, error: "لید یافت نشد." };
  }
  if (lead.convertedStudyHallId) {
    return {
      success: false,
      error: "این لید قبلاً به سالن مطالعه تبدیل شده است.",
    };
  }

  // Derive a StudyHall name: prefer the prospect's stated venue name, fall back
  // to the contact name, or use the generic default.
  const hallName =
    lead.studyhallName?.trim() ||
    (lead.fullName ? `سالن ${lead.fullName}` : "سالن مطالعه");

  const studyhallId = await prisma.$transaction(async (tx: TransactionClient) => {
    // 1. Create the StudyHall with sensible defaults. totalSeats is 0 because
    //    the venue hasn't configured their space yet — the admin can update it
    //    after logging in. All other settings follow StudyHall model defaults.
    const studyhall = await tx.studyHall.create({
      data: { name: hallName },
      select: { id: true },
    });

    // 2. Link the lead back to the new studyhall and mark it converted.
    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedStudyHallId: studyhall.id,
      },
    });

    // 3. Placeholder admin user: if the lead has an email, create a dormant
    //    User record scoped to the new StudyHall so they can be invited later.
    //    We do NOT call auth.api.signUpEmail here because there is no password
    //    yet — this stub just ensures the user row exists and is linked.
    //    A real invite flow (password-reset link, OTP, etc.) is a future task.
    if (lead.email) {
      let userId: string;
      const existingUser = await tx.user.findUnique({
        where: { email: lead.email },
        select: { id: true },
      });

      if (!existingUser) {
        const nanoid = () =>
          Math.random().toString(36).slice(2) +
          Math.random().toString(36).slice(2);
        userId = nanoid();
        await tx.user.create({
          data: {
            id: userId,
            name: lead.fullName ?? lead.studyhallName ?? "مدیر سالن",
            email: lead.email,
            emailVerified: false,
            phoneNumber: lead.phoneNumber ?? null,
          },
        });
      } else {
        userId = existingUser.id;
      }

      // Check if user already has a StaffAssignment for this hall or any hall
      const existingAssignment = await tx.staffAssignment.findFirst({
        where: { userId },
      });

      if (!existingAssignment) {
        await tx.staffAssignment.create({
          data: {
            userId,
            studyHallId: studyhall.id,
            role: "OWNER",
            startDate: new Date(),
            isActive: true,
          },
        });
      }
    }

    return studyhall.id;
  });

  revalidatePath("/platform");
  return {
    success: true,
    message: `سالن مطالعه «${hallName}» با موفقیت ایجاد شد.`,
    data: { studyhallId },
  };
}
