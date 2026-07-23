"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/app/actions/auth/verify-role";
import { prisma } from "@/lib/db";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/onboarding";
import type { ActionResult } from "@/app/actions/audit/helpers";

export async function submitOnboarding(data: OnboardingValues): Promise<ActionResult> {
  const user = await requireUser();

  if (user.staffAssignments.length > 0) redirect("/dashboard");

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "اطلاعات راه‌اندازی سالن معتبر نیست." };

  const values = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const studyHall = await tx.studyHall.create({
        data: {
          name: values.name,
          gender: values.gender,
          phoneNumber: values.phoneNumber || null,
          address: values.address,
          description: values.description || null,
          heroImage: values.heroImage ?? null,
          galleryImages: values.galleryImages,
          isActive: true,
        },
        select: { id: true },
      });

      const sectionByName = new Map<string, string>();
      for (const sectionInput of values.sections) {
        const section = await tx.section.create({ data: { studyHallId: studyHall.id, name: sectionInput.name, description: sectionInput.description || null, isActive: true }, select: { id: true } });
        sectionByName.set(sectionInput.name, section.id);
      }

      const firstSectionId = sectionByName.get(values.sections[0].name);
      const tableSection = new Map<string, string | null>();
      for (const sectionInput of values.sections) {
        const sectionId = sectionByName.get(sectionInput.name) ?? null;
        sectionInput.tableLabels.forEach((label) => tableSection.set(label, sectionId));
      }
      const seatSection = new Map<string, string | null>();
      for (const sectionInput of values.sections) {
        const sectionId = sectionByName.get(sectionInput.name) ?? null;
        sectionInput.seatNumbers.forEach((number) => seatSection.set(number, sectionId));
      }

      for (const [index, tableInput] of values.tables.entries()) {
        const table = await tx.physicalTable.create({ data: { studyHallId: studyHall.id, label: tableInput.label, sortOrder: index + 1 }, select: { id: true } });
        await tx.seat.createMany({
          data: Array.from({ length: tableInput.seatCount }, (_, seatIndex) => {
            const number = tableInput.prefix ? `${tableInput.prefix}${seatIndex + 1}` : `T${index + 1}-S${seatIndex + 1}`;
            return { tableId: table.id, number, sectionId: seatSection.get(number) ?? tableSection.get(tableInput.label) ?? firstSectionId ?? null, isActive: true };
          }),
        });
      }

      await tx.membershipPlan.createMany({ data: values.plans.map((plan) => ({ studyHallId: studyHall.id, name: plan.name, durationDays: plan.durationDays, price: plan.price, hasFixedSeat: plan.hasFixedSeat, isActive: true })) });
      await tx.staffAssignment.create({ data: { userId: user.id, studyHallId: studyHall.id, role: "OWNER", startDate: new Date(), isActive: true } });
    });
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "راه‌اندازی سالن با خطا مواجه شد." };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "سالن مطالعه با موفقیت ساخته شد." };
}
