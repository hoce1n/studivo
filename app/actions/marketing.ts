"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Validation schema
//
// The form is intentionally short (name, phone, venue name, optional message).
// We require a phone number because it is the primary contact channel for
// study-hall operators in the Iranian market.
// ---------------------------------------------------------------------------

const submitDemoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام باید حداقل ۲ کاراکتر باشد.")
    .max(120, "نام نمی‌تواند بیش از ۱۲۰ کاراکتر باشد."),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود."),
  venueName: z
    .string()
    .trim()
    .min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.")
    .max(200, "نام سالن نمی‌تواند بیش از ۲۰۰ کاراکتر باشد."),
  message: z.string().trim().max(1000).optional(),
});

export type SubmitDemoResult =
  | { success: true; leadId: string }
  | { success: false; error: string };

/**
 * submitLead — the primary marketing-to-sales conversion action.
 *
 * Creates a Lead (source: MARKETING_SITE, status: NEW) and a linked
 * DemoRequest in a single transaction. Both records are platform-level and
 * never scoped to a studyhallId.
 *
 * Used by:
 *   - The CTA section on the homepage (/#demo)
 *   - The /contact page
 *   - The dedicated /demo page
 */
export async function submitLead(formData: FormData): Promise<SubmitDemoResult> {
  const raw = {
    name: formData.get("name")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    venueName: formData.get("venueName")?.toString() ?? formData.get("venue")?.toString() ?? "",
    message: formData.get("message")?.toString() ?? undefined,
  };

  const parsed = submitDemoSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده معتبر نیست.",
    };
  }

  const { name, phone, venueName, message } = parsed.data;

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          fullName: name,
          phoneNumber: phone,
          studyhallName: venueName,
          notes: message ?? null,
          source: "MARKETING_SITE",
          status: "NEW",
        },
      });

      await tx.demoRequest.create({
        data: {
          leadId: createdLead.id,
          status: "requested",
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
