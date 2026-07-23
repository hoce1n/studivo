"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/app/actions/auth/verify-role";
import { prisma } from "@/lib/db";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/onboarding";
import type { ActionResult } from "@/app/actions/audit/helpers";

function normalizeManualSeatNumbers(value: string) {
  return value.split(",").map((seat) => seat.trim()).filter(Boolean);
}

function uniqueSeatNumbers(numbers: string[]) {
  return Array.from(new Set(numbers));
}

function buildInventory(values: OnboardingValues["seatInventory"]) {
  return values.mode === "AUTO"
    ? Array.from({ length: values.seatCount }, (_, index) => `${values.prefix ?? ""}${values.start + index}`)
    : uniqueSeatNumbers(normalizeManualSeatNumbers(values.manualSeats));
}

export async function submitOnboarding(data: OnboardingValues): Promise<ActionResult> {
  const user = await requireUser();

  if (user.staffAssignments.length > 0) {
    redirect("/dashboard");
  }

  const parsed = onboardingSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات راه‌اندازی سالن معتبر نیست.",
    };
  }

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
          isActive: true,
        },
        select: { id: true },
      });

      const seatNumbers = buildInventory(values.seatInventory);
      if (seatNumbers.length === 0) {
        throw new Error("حداقل یک صندلی در موجودی سالن تعریف کنید.");
      }

      await tx.seat.createMany({
        data: seatNumbers.map((number) => ({
          studyHallId: studyHall.id,
          number,
          isActive: true,
        })),
      });

      const sectionInputs = values.hasSections
        ? values.sections
        : [{ name: "سالن اصلی", description: "", seatNumbers }];

      for (const sectionInput of sectionInputs) {
        const section = await tx.section.create({
          data: {
            studyHallId: studyHall.id,
            name: sectionInput.name,
            description: sectionInput.description || null,
            isActive: true,
          },
          select: { id: true },
        });

        if (sectionInput.seatNumbers.length > 0) {
          await tx.seat.updateMany({
            where: { studyHallId: studyHall.id, number: { in: sectionInput.seatNumbers } },
            data: { sectionId: section.id },
          });
        }
      }

      await tx.membershipPlan.createMany({
        data: values.plans.map((plan) => ({
          studyHallId: studyHall.id,
          name: plan.name,
          durationDays: plan.durationDays,
          price: plan.price,
          hasFixedSeat: plan.hasFixedSeat,
          isActive: true,
        })),
      });

      await tx.staffAssignment.create({
        data: {
          userId: user.id,
          studyHallId: studyHall.id,
          role: "OWNER",
          startDate: new Date(),
          isActive: true,
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "راه‌اندازی سالن با خطا مواجه شد.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "سالن مطالعه با موفقیت ساخته شد." };
}
