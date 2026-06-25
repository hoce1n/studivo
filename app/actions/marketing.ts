"use server";

import { z } from "zod";

const leadSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد.").optional(),
  contact: z.string().trim().min(5, "لطفاً ایمیل یا شماره تماس معتبری وارد کنید."),
  phone: z.string().trim().regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.").optional(),
  venue: z.string().trim().min(2, "نام سالن را وارد کنید.").optional(),
  message: z.string().trim().optional(),
});

export async function submitLead(formData: FormData) {
  const data = {
    name: formData.get("name")?.toString(),
    contact: formData.get("contact")?.toString() || formData.get("phone")?.toString(),
    phone: formData.get("phone")?.toString(),
    venue: formData.get("venue")?.toString(),
    message: formData.get("message")?.toString(),
  };

  const parsed = leadSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "اطلاعات وارد شده معتبر نیست.",
    };
  }

  // In a real production app, we would save this to a 'Leads' table or send to a CRM/Email.
  // For now, we simulate a successful submission as per the "highly descriptive client-side success states" requirement.
  console.log("[Marketing Lead]:", parsed.data);

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    success: true,
    message: "درخواست شما با موفقیت ثبت شد. تیم استادیو به‌زودی با شما تماس می‌گیرد.",
  };
}
