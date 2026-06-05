import { redirect } from "next/navigation";
import { Settings, Info } from "lucide-react";

import { completeOnboarding } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session?.user.id },
    select: { studyhallId: true },
  });

  if (user?.studyhallId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <Card className="w-full overflow-hidden">
          <div className="grid md:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-primary p-8 text-primary-foreground">
              <div className="mb-10 inline-flex size-12 items-center justify-center rounded-3xl bg-primary-foreground/15">
                <Settings className="size-6" />
              </div>
              <h1 className="text-3xl font-bold leading-relaxed">راه‌اندازی سالن مطالعه</h1>
              <p className="mt-4 text-sm leading-7 text-primary-foreground/80">
                تنظیمات سالن مطالعه خود را وارد کنید. اسم سالن مطالعه، تعداد میزی که دارید و شهریه‌ی ماهانه.
              </p>
              <div className="mt-8 flex items-center gap-3 rounded-3xl bg-primary-foreground/10 p-4 text-sm">
                <Info className="size-5" />
                <span>هر صندلی با شماره یکتا و مرز داده مخصوص همین سالن ساخته می‌شود.</span>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <CardHeader>
                <CardTitle>مشخصات اولیه سالن</CardTitle>
                <CardDescription>
                  این اطلاعات برای ساخت StudyHall و Seatهای اولیه استفاده می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={completeOnboarding}>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="name">نام سالن</FieldLabel>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="سالن مطالعه نخبگان" 
                        className="placeholder:text-sm"
                        required 
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="totalSeats">تعداد صندلی‌ها</FieldLabel>
                      <Input 
                        id="totalSeats" 
                        name="totalSeats" 
                        type="number" 
                        min="1" 
                        max="500" 
                        defaultValue="1" 
                        required 
                      />
                      <FieldDescription>برای هر عدد، یک ردیف Seat با studyhallId همین سالن ساخته می‌شود.</FieldDescription>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="monthlyFee">شهریه ماهانه پیش‌فرض (اختیاری)</FieldLabel>
                      <Input id="monthlyFee" name="monthlyFee" type="number" min="0" defaultValue="0" />
                    </Field>
                    <Button type="submit" size="lg">تایید</Button>
                  </FieldGroup>
                </form>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}