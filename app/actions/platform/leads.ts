"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/audit";
import { requirePlatformUser } from "@/app/actions/auth/verify-role";
import type { LeadStatus, LeadSource } from "@/lib/generated/prisma/client";

export async function requireSuperAdmin() {
  const user = await requirePlatformUser();
  if (user.platformRole !== "SUPER_ADMIN") {
    redirect("/platform");
  }
  return user;
}

export type LeadRow = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  studyhallName: string | null;
  status: LeadStatus;
  source: LeadSource;
  createdAt: Date;
  owner: { id: string; name: string } | null;
  _count: { demoRequests: number };
};

export type LeadFilters = {
  status?: string;
  source?: string;
};

/**
 * Fetches all platform leads with optional status and source filtering.
 */
export async function getLeads(filters: LeadFilters = {}): Promise<LeadRow[]> {
  await requirePlatformUser();

  return prisma.lead.findMany({
    where: {
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status as LeadStatus }
        : {}),
      ...(filters.source && filters.source !== "ALL"
        ? { source: filters.source as LeadSource }
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
}

export type PlatformStats = {
  total: number;
  newThisWeek: number;
  inDemo: number;
};

/**
 * Calculates platform overview stats for leads.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  await requirePlatformUser();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [total, newThisWeek, inDemo] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({
      where: {
        status: { in: ["DEMO_SCHEDULED", "DEMO_COMPLETED"] },
      },
    }),
  ]);

  return { total, newThisWeek, inDemo };
}

const updateStatusSchema = z.object({
  leadId: z.string().cuid(),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "DEMO_SCHEDULED",
    "DEMO_COMPLETED",
    "NEGOTIATION",
    "CONVERTED",
    "LOST",
  ]),
  notes: z.string().trim().max(500).optional(),
});

/**
 * Updates the status and notes of a specific lead.
 */
export async function updateLeadStatus(formData: FormData): Promise<ActionResult> {
  await requirePlatformUser();

  const parsed = updateStatusSchema.safeParse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده معتبر نیست.",
    };
  }

  const { leadId, status, notes } = parsed.data;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status,
      notes: notes ?? undefined,
    },
  });

  revalidatePath("/platform");
  return { success: true, message: "وضعیت لید با موفقیت به‌روزرسانی شد." };
}