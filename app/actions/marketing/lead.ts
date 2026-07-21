"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

const submitDemoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد.")
    .max(120, "نام نمی‌تواند بیش از ۱۲۰ کاراکتر باشد."),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود."),
  studyhallName: z
    .string()
    .trim()
    .min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.")
    .max(200, "نام سالن نمی‌تواند بیش از ۲۰۰ کاراکتر باشد."),
  notes: z.string().trim().max(1000).optional(),
});

export type SubmitDemoResult =
  | { success: true; leadId: string }
  | { success: false; error: string };

/**
 * submitLead — Primary marketing-to-sales conversion action.
 *
 * Creates a Lead (source: WEBSITE, status: NEW) and a linked
 * DemoRequest (status: PENDING) in a single transaction.
 */
export async function submitLead(formData: FormData): Promise<SubmitDemoResult> {
  const raw = {
    fullName: formData.get("fullName")?.toString() ?? formData.get("name")?.toString() ?? "",
    phoneNumber: formData.get("phoneNumber")?.toString() ?? formData.get("phone")?.toString() ?? "",
    studyhallName:
      formData.get("studyhallName")?.toString() ??
      formData.get("venueName")?.toString() ??
      formData.get("venue")?.toString() ??
      "",
    notes: formData.get("notes")?.toString() ?? formData.get("message")?.toString() ?? undefined,
  };

  const parsed = submitDemoSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده معتبر نیست.",
    };
  }

  const { fullName, phoneNumber, studyhallName, notes } = parsed.data;

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          fullName,
          phoneNumber,
          studyhallName,
          notes: notes ?? null,
          source: "WEBSITE",
          status: "NEW",
        },
      });

      await tx.demoRequest.create({
        data: {
          leadId: createdLead.id,
          status: "PENDING",
          note: notes ?? null,
        },
      });

      return createdLead;
    });

    return { success: true, leadId: lead.id };
  } catch (error) {
    console.error("[submitLead] DB error:", error);
    return {
      success: false,
      error: "مشکلی در ثبت درخواست پیش آمد. لطفاً دوباره تلاش کنید.",
    };
  }
}