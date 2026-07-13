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
  name: string | null;   // mapped from fullName
  phone: string | null;  // mapped from phoneNumber
  email: string | null;
  venueName: string | null; // mapped from studyhallName
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

  const leads = await prisma.lead.findMany({
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
      fullName: true,
      phoneNumber: true,
      email: true,
      studyhallName: true,
      status: true,
      source: true,
      createdAt: true,
      owner: { select: { id: true, name: true } },
      _count: { select: { demoRequests: true } },
    },
  });

  return leads.map((l) => ({
    id: l.id,
    name: l.fullName,
    phone: l.phoneNumber,
    email: l.email,
    venueName: l.studyhallName,
    status: l.status,
    source: l.source,
    createdAt: l.createdAt,
    owner: l.owner,
    _count: l._count,
  }));
}

export type LeadDetail = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  venueName: string | null;
  message: string | null;  // mapped from notes
  status: string;
  source: string;
  lostReason: string | null; // not in v2 schema — always null
  studyhallId: string | null; // mapped from convertedStudyHallId
  convertedAt: Date | null;   // not in v2 schema — always null
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string } | null;
  demoRequests: {
    id: string;
    status: string;
    preferredTime: string | null; // not in v2 schema — always null
    scheduledAt: Date | null;
    notes: string | null; // mapped from note
    createdAt: Date;
  }[];
};

export async function getLeadById(id: string): Promise<LeadDetail | null> {
  await requirePlatformUser();

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      studyhallName: true,
      notes: true,
      status: true,
      source: true,
      convertedStudyHallId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true } },
      demoRequests: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          scheduledAt: true,
          note: true,
          createdAt: true,
        },
      },
    },
  });

  if (!lead) return null;

  return {
    id: lead.id,
    name: lead.fullName,
    phone: lead.phoneNumber,
    email: lead.email,
    venueName: lead.studyhallName,
    message: lead.notes,
    status: lead.status,
    source: lead.source,
    lostReason: null,          // removed in v2
    studyhallId: lead.convertedStudyHallId,
    convertedAt: null,         // removed in v2
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    owner: lead.owner,
    demoRequests: lead.demoRequests.map((d) => ({
      id: d.id,
      status: d.status,
      preferredTime: null,     // removed in v2
      scheduledAt: d.scheduledAt,
      notes: d.note,
      createdAt: d.createdAt,
    })),
  };
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

  // Schema v2 LeadStatus: NEW, CONTACTED, DEMO_SCHEDULED, DEMO_COMPLETED,
  // NEGOTIATION, CONVERTED, LOST
  const [total, newThisWeek, inDemo] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({
      where: { status: { in: ["DEMO_SCHEDULED", "DEMO_COMPLETED"] } },
    }),
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
  address: string | null;
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

  // Schema v2: StudyHall has sections → seats; no totalSeats denorm field.
  // Derive totalSeats by counting seats across all sections.
  const halls = await prisma.studyHall.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gender: true,
      createdAt: true,
      leads: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { id: true, fullName: true, studyhallName: true },
      },
      sections: {
        select: {
          seats: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
      memberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  return halls.map((h) => ({
    id: h.id,
    name: h.name,
    gender: h.gender,
    totalSeats: h.sections.reduce((sum, s) => sum + s.seats.length, 0),
    createdAt: h.createdAt,
    lead: h.leads[0]
      ? {
          id: h.leads[0].id,
          fullName: h.leads[0].fullName,
          studyhallName: h.leads[0].studyhallName,
        }
      : null,
    _count: { activeSubscriptions: h.memberships.length },
  }));
}

export async function getVenueById(id: string): Promise<VenueDetail | null> {
  await requirePlatformUser();

  // Schema v2: no totalSeats or monthlyFee on StudyHall.
  // Derive them: totalSeats from sections→seats; monthlyFee from lowest active
  // MembershipPlan price (0 if none exist yet).
  const hall = await prisma.studyHall.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      gender: true,
      address: true,
      createdAt: true,
      updatedAt: true,
      leads: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          studyhallName: true,
          status: true,
        },
      },
      sections: {
        select: {
          seats: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
      membershipPlans: {
        where: { isActive: true },
        orderBy: { price: "asc" },
        take: 1,
        select: { price: true },
      },
      memberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
      staffAssignments: {
        where: { isActive: true },
        select: { userId: true },
        distinct: ["userId"],
      },
    },
  });

  if (!hall) return null;

  const totalSeats = hall.sections.reduce((sum, s) => sum + s.seats.length, 0);
  const monthlyFee = hall.membershipPlans[0]
    ? Number(hall.membershipPlans[0].price)
    : 0;

  return {
    id: hall.id,
    name: hall.name,
    gender: hall.gender,
    address: hall.address,
    totalSeats,
    monthlyFee,
    createdAt: hall.createdAt,
    updatedAt: hall.updatedAt,
    lead: hall.leads[0]
      ? {
          id: hall.leads[0].id,
          name: hall.leads[0].fullName,
          phone: hall.leads[0].phoneNumber,
          venueName: hall.leads[0].studyhallName,
          status: hall.leads[0].status,
        }
      : null,
    _count: {
      activeSubscriptions: hall.memberships.length,
      users: hall.staffAssignments.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const updateStatusSchema = z.object({
  leadId: z.string().cuid(),
  // Schema v2 LeadStatus enum values
  status: z.enum([
    "NEW",
    "CONTACTED",
    "DEMO_SCHEDULED",
    "DEMO_COMPLETED",
    "NEGOTIATION",
    "CONVERTED",
    "LOST",
  ]),
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

  const { leadId, status } = parsed.data;

  await prisma.lead.update({
    where: { id: leadId },
    data: { status },
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
    // 1. Create the StudyHall. Schema v2 requires slug, gender.
    //    Use a sanitised slug derived from fullName/studyhallName; fall back
    //    to a random suffix to avoid unique-constraint collisions.
    const baseSlug = (lead.studyhallName ?? lead.fullName ?? "studyhall")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50) || "studyhall";
    const slug = `${baseSlug}-${Date.now()}`;

    const studyhall = await tx.studyHall.create({
      data: {
        name: hallName,
        slug,
        gender: "MALE", // default — owner updates this after onboarding
        isActive: true,
      },
      select: { id: true },
    });

    // 2. Link the lead back to the new studyhall and mark it CONVERTED.
    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedStudyHallId: studyhall.id,
      },
    });

    // 3. Placeholder admin user: if the lead has an email, create a dormant
    //    User record and a StaffAssignment so they can be invited later.
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
