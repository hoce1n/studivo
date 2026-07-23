import { z } from "zod";

const sectionBaseSchema = z.object({
  name: z.string().trim().min(1, "نام بخش الزامی است.").max(80, "نام بخش طولانی است."),
  description: z.string().trim().max(300).optional(),
  seatNumbers: z.array(z.string().trim().min(1).max(20)).default([]),
});

export const onboardingSectionSchema = sectionBaseSchema;

export const seatInventorySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("AUTO"),
    seatCount: z.coerce.number().int("تعداد صندلی باید عدد صحیح باشد.").min(1, "تعداد صندلی باید حداقل ۱ باشد.").max(500, "تعداد صندلی نمی‌تواند بیشتر از ۵۰۰ باشد."),
    prefix: z.string().trim().max(12).optional(),
    start: z.coerce.number().int().min(1).default(1),
    manualSeats: z.string().trim().optional(),
  }),
  z.object({
    mode: z.literal("MANUAL"),
    seatCount: z.coerce.number().int().min(1).optional(),
    prefix: z.string().trim().max(12).optional(),
    start: z.coerce.number().int().min(1).optional(),
    manualSeats: z.string().trim().min(1, "برچسب صندلی‌ها را با کاما جدا کنید."),
  }),
]);

export const onboardingPlanSchema = z.object({
  name: z.string().trim().min(2, "نام طرح عضویت باید حداقل ۲ کاراکتر باشد.").max(80),
  durationDays: z.coerce.number().int("مدت طرح باید عدد صحیح باشد.").min(1, "مدت طرح باید حداقل ۱ روز باشد.").max(3660, "مدت طرح بیش از حد مجاز است."),
  price: z.coerce.number().min(0, "قیمت طرح نمی‌تواند منفی باشد.").max(999_999_999, "قیمت طرح بیش از حد مجاز است."),
  hasFixedSeat: z.boolean(),
});

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد.").max(100),
    gender: z.enum(["MALE", "FEMALE"], { error: "نوع سالن را انتخاب کنید." }),
    phoneNumber: z.string().trim().max(30).optional(),
    address: z.string().trim().min(5, "آدرس سالن را کامل‌تر وارد کنید.").max(300),
    description: z.string().trim().max(500).optional(),
    seatInventory: seatInventorySchema,
    hasSections: z.boolean(),
    sections: z.array(onboardingSectionSchema).min(1, "حداقل یک بخش باید تعریف شود."),
    plans: z.array(onboardingPlanSchema).min(1, "حداقل یک طرح عضویت باید تعریف شود."),
  })
  .superRefine((data, ctx) => {
    const inventorySeats = data.seatInventory.mode === "AUTO"
      ? Array.from({ length: data.seatInventory.seatCount }, (_, index) => `${data.seatInventory.prefix ?? ""}${(data.seatInventory.start ?? 1) + index}`)
      : data.seatInventory.manualSeats.split(",").map((seat) => seat.trim()).filter(Boolean);

    if (new Set(inventorySeats).size !== inventorySeats.length) {
      ctx.addIssue({ code: "custom", path: ["seatInventory"], message: "برچسب صندلی‌ها نباید تکراری باشد." });
    }

    const assigned = data.sections.flatMap((section) => section.seatNumbers);
    if (assigned.some((seat) => !inventorySeats.includes(seat))) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "صندلی‌های تخصیص داده‌شده باید از موجودی سالن انتخاب شوند." });
    }
    if (new Set(assigned).size !== assigned.length) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "هر صندلی فقط می‌تواند به یک بخش تخصیص داده شود." });
    }
  });

export type OnboardingValues = z.infer<typeof onboardingSchema>;
