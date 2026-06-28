"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/audit";
import { requirePlatformUser } from "@/app/actions/auth";

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

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
): Promise<ActionResult> {
  // Only SUPER_ADMIN can convert a lead.
  await requireSuperAdmin();

  const leadId = formData.get("leadId")?.toString();
  if (!leadId) {
    return { success: false, error: "شناسه لید الزامی است." };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, status: true, studyhallId: true, venueName: true },
  });

  if (!lead) {
    return { success: false, error: "لید یافت نشد." };
  }
  if (lead.studyhallId) {
    return { success: false, error: "این لید قبلاً به سالن مطالعه تبدیل شده است." };
  }

  // Phase 1: placeholder — mark as CUSTOMER, set convertedAt.
  // Real conversion (creating a StudyHall record + inviting the owner) is a
  // future milestone and is deliberately NOT implemented here (YAGNI).
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "CUSTOMER",
      convertedAt: new Date(),
    },
  });

  revalidatePath("/platform");
  return {
    success: true,
    message:
      "لید به مشتری تبدیل شد. (ایجاد سالن مطالعه در مرحله بعدی پیاده‌سازی خواهد شد.)",
  };
}
