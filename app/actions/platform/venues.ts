"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/app/actions/audit/helpers";
import { requireSuperAdmin } from "./leads";
import { requirePlatformUser } from "../auth/verify-role";

export type VenueRow = {
  id: string;
  name: string;
  gender: string;
  totalSeats: number;
  createdAt: Date;
  convertedFromLead: { id: string; fullName: string; studyhallName: string | null } | null;
  _count: { activeMemberships: number };
};

/**
 * Fetches all registered study halls for platform view.
 */
export async function getVenues(): Promise<VenueRow[]> {
  await requirePlatformUser();

  const halls = await prisma.studyHall.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      gender: true,
      createdAt: true,
      leads: {
        select: { id: true, fullName: true, studyhallName: true },
        take: 1,
      },
      seats: {
        where: { isActive: true },
        select: { id: true },
      },
      memberships: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  });

  return halls.map((h) => {
    const totalSeats = h.seats.length;
    return {
      id: h.id,
      name: h.name,
      gender: h.gender,
      totalSeats,
      createdAt: h.createdAt,
      convertedFromLead: h.leads[0] ?? null,
      _count: { activeMemberships: h.memberships.length },
    };
  });
}

/**
 * Converts an existing lead into an active StudyHall and links default owner.
 */
export async function convertLeadToStudyHall(
  formData: FormData
): Promise<ActionResult<{ studyhallId: string }>> {
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
    return { success: false, error: "این لید قبلاً به سالن مطالعه تبدیل شده است." };
  }

  const hallName =
    lead.studyhallName?.trim() ||
    (lead.fullName ? `سالن ${lead.fullName}` : "سالن مطالعه جدید");

  const studyhallId = await prisma.$transaction(async (tx) => {
    // 1. Create StudyHall (defaulting gender to MALE; can be changed in settings)
    const studyhall = await tx.studyHall.create({
      data: {
        name: hallName,
        gender: "MALE",
        phoneNumber: lead.phoneNumber,
        isActive: true,
      },
      select: { id: true },
    });

    // 2. Mark lead as CONVERTED and link the new studyhall
    await tx.lead.update({
      where: { id: leadId },
      data: {
        status: "CONVERTED",
        convertedStudyHallId: studyhall.id,
      },
    });

    // 3. Link or create User record and assign OWNER role via StaffAssignment
    if (lead.email) {
      let user = await tx.user.findUnique({
        where: { email: lead.email },
        select: { id: true },
      });

      if (!user) {
        const nanoid = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        user = await tx.user.create({
          data: {
            id: nanoid,
            name: lead.fullName,
            email: lead.email,
            emailVerified: false,
            phoneNumber: lead.phoneNumber,
          },
          select: { id: true },
        });
      }

      // Assign OWNER role in StaffAssignment
      await tx.staffAssignment.create({
        data: {
          userId: user.id,
          studyHallId: studyhall.id,
          role: "OWNER",
          startDate: new Date(),
          isActive: true,
        },
      });
    }

    return studyhall.id;
  });

  revalidatePath("/platform");
  return {
    success: true,
    message: `سالن مطالعه «${hallName}» با موفقیت ایجاد گردید.`,
    data: { studyhallId },
  };
}
export type VenueDetail = VenueRow & { address: string | null; phoneNumber: string | null; description: string | null; monthlyFee: number; lead: (VenueRow["convertedFromLead"] & { name?: string | null; phone?: string | null; venueName?: string | null; status: string }) | null; _count: { activeMemberships: number; activeSubscriptions: number; users: number } };

export async function getVenueById(id: string): Promise<VenueDetail | null> {
  await requirePlatformUser();
  const hall = await prisma.studyHall.findUnique({
    where: { id },
    select: { id: true, name: true, gender: true, address: true, phoneNumber: true, description: true, createdAt: true, leads: { select: { id: true, fullName: true, studyhallName: true }, take: 1 }, seats: { where: { isActive: true }, select: { id: true } }, memberships: { where: { status: "ACTIVE" }, select: { id: true } } },
  });
  if (!hall) return null;
  const totalSeats = hall.seats.length;
  const lead = hall.leads[0] ?? null;
  return { id: hall.id, name: hall.name, gender: hall.gender, address: hall.address, phoneNumber: hall.phoneNumber, description: hall.description, monthlyFee: 0, totalSeats, createdAt: hall.createdAt, convertedFromLead: lead, lead: lead ? { ...lead, status: "CONVERTED" } : null, _count: { activeMemberships: hall.memberships.length, activeSubscriptions: hall.memberships.length, users: 0 } };
}
