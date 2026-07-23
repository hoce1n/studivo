"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Info,
  LayoutGrid,
  Armchair,
  CreditCard,
  Building2
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Field, 
  FieldDescription, 
  FieldGroup, 
  FieldLabel, 
  FieldError 
} from "@/components/ui/field";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/onboarding";
import { submitOnboarding } from "@/app/actions/onboarding";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "اطلاعات پایه", icon: Building2 },
  { id: 2, title: "بخش‌ها", icon: LayoutGrid },
  { id: 3, title: "صندلی‌ها", icon: Armchair },
  { id: 4, title: "پلن‌های عضویت", icon: CreditCard },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema) as any,
    defaultValues: {
      name: "",
      gender: "FEMALE",
      hasSections: false,
      sections: [{ 
        name: "سالن اصلی", 
        seatType: "AUTO", 
        seatCount: 20 
      }],
      plans: [{ 
        name: "ماهانه استاندارد", 
        durationDays: 30, 
        price: 0, 
        hasFixedSeat: true 
      }],
    },
    mode: "onChange",
  });

  const { 
    fields: sectionFields, 
    append: appendSection, 
    remove: removeSection 
  } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  const { 
    fields: planFields, 
    append: appendPlan, 
    remove: removePlan } = useFieldArray({
    control: form.control,
    name: "plans",
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ["name", "gender"];
    if (currentStep === 2) fieldsToValidate = ["sections"];
    if (currentStep === 3) fieldsToValidate = ["sections"];
    if (currentStep === 4) fieldsToValidate = ["plans"];

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit: SubmitHandler<OnboardingValues> = async (data) => {
    // Only submit if we are on the final step
    if (currentStep !== STEPS.length) {
      nextStep();
      return;
    }

    setIsPending(true);
    try {
      const result = await submitOnboarding(data);
      if (result.success) {
        toast.success(result.message);
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("خطایی رخ داد. لطفا دوباره تلاش کنید.");
    } finally {
      setIsPending(false);
    }
  };


  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="mb-8 flex justify-between">
        {STEPS.map((step) => (
          <div key={step.id} className="flex flex-col items-center flex-1 relative">
            <div 
              className={cn(
                "size-10 rounded-full flex items-center justify-center border-2 z-10 bg-background transition-colors",
                currentStep >= step.id ? "border-primary text-primary" : "border-muted text-muted-foreground",
                currentStep === step.id && "bg-primary text-primary-foreground"
              )}
            >
              <step.icon className="size-5" />
            </div>
            <span className={cn(
              "mt-2 text-xs font-medium hidden sm:block",
              currentStep >= step.id ? "text-primary" : "text-muted-foreground"
            )}>
              {step.title}
            </span>
            {step.id < STEPS.length && (
              <div className={cn(
                "absolute top-5 right-1/2 w-full h-0.5 z-0",
                currentStep > step.id ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      <form 
        onSubmit={form.handleSubmit(onSubmit as any)}
      >
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl">{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {currentStep === 1 && "اطلاعات اولیه سالن مطالعه خود را وارد کنید."}
              {currentStep === 2 && "آیا سالن شما دارای بخش‌های مختلف (اتاق، طبقه و ...) است؟"}
              {currentStep === 3 && "تعداد و شماره صندلی‌های هر بخش را مشخص کنید."}
              {currentStep === 4 && "حداقل یک پلن عضویت برای ثبت‌نام اعضا تعریف کنید."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {currentStep === 1 && (
              <FieldGroup className="space-y-6">
                <Field>
                  <FieldLabel>نام سالن مطالعه</FieldLabel>
                  <Input 
                    {...form.register("name")} 
                    placeholder="مثلا: اندیشه"
                    autoFocus
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>

                <Field>
                  <FieldLabel>جنسیت</FieldLabel>
                  <Select 
                    onValueChange={(val) => form.setValue("gender", val as "MALE" | "FEMALE")}
                    value={form.watch("gender")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEMALE">بانوان</SelectItem>
                      <SelectItem value="MALE">آقایان</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.gender]} />
                </Field>
              </FieldGroup>
            )}

            {/* Step 2: Sections */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed">
                  <div className="space-y-0.5">
                    <FieldLabel className="text-base">آیا سالن دارای چندین بخش است؟</FieldLabel>
                    <FieldDescription>بخش‌هایی مثل سالن VIP، طبقه دوم، اتاق مطالعه گروهی و ...</FieldDescription>
                  </div>
                  <Switch 
                    checked={form.watch("hasSections")}
                    onCheckedChange={(checked) => {
                      form.setValue("hasSections", checked);
                      if (!checked && sectionFields.length > 1) {
                        // Reset to one default section if turned off
                        form.setValue("sections", [{ name: "سالن اصلی", seatType: "AUTO", seatCount: 20 }]);
                      }
                    }}
                  />
                </div>

                {form.watch("hasSections") ? (
                  <div className="space-y-4">
                    {sectionFields.map((field, index) => (
                      <Card key={field.id} className="bg-muted/20 border-muted relative">
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">بخش شماره {index + 1}</h4>
                            {sectionFields.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon-sm" 
                                className="text-destructive"
                                onClick={() => removeSection(index)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                              <FieldLabel>نام بخش</FieldLabel>
                              <Input {...form.register(`sections.${index}.name`)} placeholder="مثلا: سالن VIP" />
                              <FieldError errors={[form.formState.errors.sections?.[index]?.name]} />
                            </Field>
                            <Field>
                              <FieldLabel>توضیحات (اختیاری)</FieldLabel>
                              <Input {...form.register(`sections.${index}.description`)} placeholder="توضیح کوتاه..." />
                            </Field>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-dashed"
                      onClick={() => appendSection({ name: "", seatType: "AUTO", seatCount: 20 })}
                    >
                      <Plus className="size-4" /> افزودن بخش جدید
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <LayoutGrid className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">یک بخش پیش‌فرض با نام &quot;سالن اصلی&quot; ساخته خواهد شد.</p>
                      <p className="text-sm text-muted-foreground">می‌توانید بعداً در تنظیمات، بخش‌های بیشتری اضافه کنید.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Seats */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {sectionFields.map((field, index) => (
                  <Card key={field.id} className="border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{form.watch(`sections.${index}.name`) || `بخش ${index + 1}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field>
                        <FieldLabel>نحوه تعریف صندلی‌ها</FieldLabel>
                        <div className="flex gap-2">
                          <Button 
                            type="button"
                            variant={form.watch(`sections.${index}.seatType`) === "AUTO" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => form.setValue(`sections.${index}.seatType`, "AUTO")}
                          >
                            تولید خودکار عددی
                          </Button>
                          <Button 
                            type="button"
                            variant={form.watch(`sections.${index}.seatType`) === "MANUAL" ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => form.setValue(`sections.${index}.seatType`, "MANUAL")}
                          >
                            وارد کردن دستی
                          </Button>
                        </div>
                      </Field>

                      {form.watch(`sections.${index}.seatType`) === "AUTO" ? (
                        <Field>
                          <FieldLabel>تعداد صندلی‌ها</FieldLabel>
                          <Input 
                            type="number" 
                            {...form.register(`sections.${index}.seatCount`)} 
                            min={1} 
                            max={500}
                          />
                          <FieldDescription>سیستم به صورت خودکار صندلی‌های ۱ تا N را می‌سازد.</FieldDescription>
                          <FieldError errors={[form.formState.errors.sections?.[index]?.seatCount]} />
                        </Field>
                      ) : (
                        <Field>
                          <FieldLabel>شماره صندلی‌ها</FieldLabel>
                          <textarea 
                            className="flex min-h-20 w-full rounded-2xl border border-transparent bg-input/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...form.register(`sections.${index}.manualSeats`)}
                            placeholder="A-101, A-102, VIP-1, ..."
                          />
                          <FieldDescription>شماره صندلی‌ها را با کاما (,) از هم جدا کنید.</FieldDescription>
                          <FieldError errors={[form.formState.errors.sections?.[index]?.manualSeats]} />
                        </Field>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 4: Membership Plans */}
            {currentStep === 4 && (
              <div className="space-y-4">
                {planFields.map((field, index) => (
                  <Card key={field.id} className="bg-muted/20 border-muted relative">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm">پلن عضویت شماره {index + 1}</h4>
                        {planFields.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon-sm" 
                            className="text-destructive"
                            onClick={() => removePlan(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel>نام پلن</FieldLabel>
                          <Input {...form.register(`plans.${index}.name`)} placeholder="مثلا: ماهانه VIP" />
                          <FieldError errors={[form.formState.errors.plans?.[index]?.name]} />
                        </Field>
                        <Field>
                          <FieldLabel>مدت زمان (روز)</FieldLabel>
                          <Input type="number" {...form.register(`plans.${index}.durationDays`)} />
                          <FieldError errors={[form.formState.errors.plans?.[index]?.durationDays]} />
                        </Field>
                        <Field>
                          <FieldLabel>قیمت (تومان)</FieldLabel>
                          <Input type="number" {...form.register(`plans.${index}.price`)} />
                          <FieldError errors={[form.formState.errors.plans?.[index]?.price]} />
                        </Field>
                        <div className="flex items-center justify-between p-3 bg-background rounded-xl border mt-auto h-8">
                          <span className="text-xs font-medium">صندلی ثابت؟</span>
                          <Switch 
                            checked={form.watch(`plans.${index}.hasFixedSeat`)}
                            onCheckedChange={(checked) => form.setValue(`plans.${index}.hasFixedSeat`, checked)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed"
                  onClick={() => appendPlan({ name: "", durationDays: 30, price: 0, hasFixedSeat: true })}
                >
                  <Plus className="size-4" /> افزودن پلن جدید
                </Button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-muted/20 py-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={prevStep} 
              disabled={currentStep === 1 || isPending}
            >
              <ChevronRight className="size-4" /> مرحله قبل
            </Button>
            
            {currentStep < STEPS.length ? (
              <button
                className="flex items-center gap-x-2 cursor-pointer bg-primary text-primary-foreground px-3 py-2 rounded-2xl" 
                type="button" 
                onClick={nextStep}
              >
                مرحله بعد <ChevronLeft className="size-4" />
              </button>
            ) : (
              <Button 
                type="submit" 
                disabled={isPending}
              >
                {isPending ? "در حال ثبت..." : "تکمیل راه‌اندازی"}
                <CheckCircle2 className="size-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-primary/5 p-4 text-xs leading-6 text-primary">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          نگران نباشید! تمام این اطلاعات بعداً از طریق بخش تنظیمات سالن در داشبورد قابل ویرایش و مدیریت هستند.
        </span>
      </div>
    </div>
  );
}
