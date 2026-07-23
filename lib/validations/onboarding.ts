import { z } from "zod";

const sectionBaseSchema = z.object({
  name: z.string().trim().min(1, "نام بخش الزامی است.").max(80, "نام بخش طولانی است."),
});

const autoSectionSchema = sectionBaseSchema.extend({
  mode: z.literal("AUTO"),
  seatCount: z.coerce
    .number()
    .int("تعداد صندلی باید عدد صحیح باشد.")
    .min(1, "تعداد صندلی باید حداقل ۱ باشد.")
    .max(500, "تعداد صندلی در هر بخش نمی‌تواند بیشتر از ۵۰۰ باشد."),
  manualSeats: z.string().trim().optional(),
});

const manualSectionSchema = sectionBaseSchema.extend({
  mode: z.literal("MANUAL"),
  seatCount: z.coerce.number().int().min(1).optional(),
  manualSeats: z
    .string()
    .trim()
    .min(1, "شماره صندلی‌های دستی را با کاما جدا کنید."),
});

export const onboardingSectionSchema = z.discriminatedUnion("mode", [
  autoSectionSchema,
  manualSectionSchema,
]);

export const onboardingPlanSchema = z.object({
  name: z.string().trim().min(2, "نام طرح عضویت باید حداقل ۲ کاراکتر باشد.").max(80),
  durationDays: z.coerce
    .number()
    .int("مدت طرح باید عدد صحیح باشد.")
    .min(1, "مدت طرح باید حداقل ۱ روز باشد.")
    .max(3660, "مدت طرح بیش از حد مجاز است."),
  price: z.coerce
    .number()
    .min(0, "قیمت طرح نمی‌تواند منفی باشد.")
    .max(999_999_999, "قیمت طرح بیش از حد مجاز است."),
  hasFixedSeat: z.boolean(),
});

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.").max(100),
    gender: z.enum(["MALE", "FEMALE"], { error: "نوع سالن را انتخاب کنید." }),
    phoneNumber: z.string().trim().max(30).optional(),
    address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300),
    description: z.string().trim().max(500).optional(),
    hasSections: z.boolean(),
    seatCount: z.coerce
      .number()
      .int("تعداد صندلی باید عدد صحیح باشد.")
      .min(1, "تعداد صندلی باید حداقل ۱ باشد.")
      .max(500, "تعداد صندلی نمی‌تواند بیشتر از ۵۰۰ باشد."),
    sections: z.array(onboardingSectionSchema).min(1, "حداقل یک بخش باید تعریف شود."),
    plans: z.array(onboardingPlanSchema).min(1, "حداقل یک طرح عضویت باید تعریف شود."),
  })
  .superRefine((data, ctx) => {
    if (!data.hasSections && data.seatCount < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["seatCount"],
        message: "برای سالن بدون بخش‌بندی، تعداد صندلی الزامی است.",
      });
    }

    if (data.hasSections && data.sections.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["sections"],
        message: "برای سالن بخش‌بندی‌شده، حداقل یک بخش تعریف کنید.",
      });
    }
  });

export type OnboardingValues = z.infer<typeof onboardingSchema>;
