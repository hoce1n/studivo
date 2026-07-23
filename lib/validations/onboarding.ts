import { z } from "zod";

export const onboardingTableSchema = z.object({
  label: z.string().trim().min(1, "نام میز الزامی است.").max(40, "نام میز طولانی است."),
  seatCount: z.coerce
    .number()
    .int("تعداد صندلی باید عدد صحیح باشد.")
    .min(1, "هر میز باید حداقل ۱ صندلی داشته باشد.")
    .max(50, "تعداد صندلی هر میز نمی‌تواند بیشتر از ۵۰ باشد."),
  prefix: z.string().trim().max(16, "پیشوند شماره صندلی طولانی است.").optional(),
});

export const onboardingSectionSchema = z.object({
  name: z.string().trim().min(1, "نام بخش الزامی است.").max(80, "نام بخش طولانی است."),
  description: z.string().trim().max(300, "توضیح بخش طولانی است.").optional(),
  tableLabels: z.array(z.string().trim().min(1)).default([]),
  seatNumbers: z.array(z.string().trim().min(1)).default([]),
});

export const onboardingPlanSchema = z.object({
  name: z.string().trim().min(2, "نام طرح عضویت باید حداقل ۲ کاراکتر باشد.").max(80),
  durationDays: z.coerce.number().int("مدت طرح باید عدد صحیح باشد.").min(1).max(3660),
  price: z.coerce.number().min(0, "قیمت طرح نمی‌تواند منفی باشد.").max(999_999_999),
  hasFixedSeat: z.boolean(),
});

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.").max(100),
    gender: z.enum(["MALE", "FEMALE"], { error: "نوع سالن را انتخاب کنید." }),
    phoneNumber: z.string().trim().max(30).optional(),
    address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300),
    description: z.string().trim().max(500).optional(),
    heroImage: z.string().url("تصویر اصلی معتبر نیست.").nullable().optional(),
    galleryImages: z.array(z.string().url("تصویر گالری معتبر نیست.")).max(8, "حداکثر ۸ تصویر گالری مجاز است.").default([]),
    tables: z.array(onboardingTableSchema).min(1, "حداقل یک میز تعریف کنید.").max(100, "تعداد میزها بیش از حد مجاز است."),
    sections: z.array(onboardingSectionSchema).min(1, "حداقل یک بخش باید تعریف شود."),
    plans: z.array(onboardingPlanSchema).min(1, "حداقل یک طرح عضویت باید تعریف شود."),
  })
  .superRefine((data, ctx) => {
    const tableLabels = new Set<string>();
    data.tables.forEach((table, index) => {
      if (tableLabels.has(table.label)) ctx.addIssue({ code: "custom", path: ["tables", index, "label"], message: "نام میزها نباید تکراری باشد." });
      tableLabels.add(table.label);
    });
    data.sections.forEach((section, index) => {
      const hasAssignment = section.tableLabels.length > 0 || section.seatNumbers.length > 0;
      if (!hasAssignment) ctx.addIssue({ code: "custom", path: ["sections", index], message: "برای هر بخش حداقل یک میز یا صندلی انتخاب کنید." });
    });
  });

export type OnboardingValues = z.infer<typeof onboardingSchema>;
