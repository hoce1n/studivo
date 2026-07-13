import { redirect } from "next/navigation";
import {
  Armchair,
  Info,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

import { completeOnboarding } from "@/app/actions/auth";

import OnboardingForm from "@/components/onboarding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import { getTenantContext } from "@/lib/tenant-context";

const perks = [
  {
    icon: Armchair,
    title: "نقشه زنده صندلی‌ها",
    description: "برای هر صندلی یک ردیف یکتا با شماره مخصوص ساخته می‌شود.",
  },
  {
    icon: Users,
    title: "مدیریت اعضا و کارکنان",
    description: "دانش‌آموزان و مراقبان زیر همین سالن سازماندهی می‌شوند.",
  },
  {
    icon: Wallet,
    title: "پیگیری شهریه و تمدید",
    description: "هشدار تمدید و وضعیت مالی هر صندلی را لحظه‌ای ببینید.",
  },
];

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session?.user.id },
    select: { id: true, phoneNumber: true },
  });

  if (!user?.phoneNumber) {
    redirect("/verify-phone");
  }

  const context = await getTenantContext(user.id);
  if (context) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Settings className="size-6" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
              ۱
            </span>
            <span className="text-foreground">راه‌اندازی سالن</span>
            <span className="h-px w-8 bg-border" aria-hidden />
            <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[11px]">
              ۲
            </span>
            <span>شروع پذیرش</span>
          </div>
        </div>

        <Card className="overflow-hidden p-0 shadow-sm">
          <div className="grid md:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col justify-between gap-8 bg-primary p-8 text-primary-foreground md:p-10">
              <div>
                <h1 className="text-2xl font-bold leading-relaxed text-balance md:text-3xl">
                  راه‌اندازی سالن مطالعه
                </h1>
                <p className="mt-3 text-sm leading-7 text-primary-foreground/80">
                  در یک قدم، اطلاعات پایه‌ی سالن خود را وارد کنید: نام، نوع پذیرش،
                  آدرس، تعداد میزها و شهریه‌ی ماهانه.
                </p>
              </div>

              <ul className="space-y-4">
                {perks.map((perk) => (
                  <li key={perk.title} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
                      <perk.icon className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{perk.title}</p>
                      <p className="text-xs leading-6 text-primary-foreground/70">
                        {perk.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-3 rounded-2xl bg-primary-foreground/10 p-4 text-xs leading-6">
                <Info className="mt-0.5 size-4 shrink-0" />
                <span>
                  هر صندلی با شماره یکتا و مرز داده مخصوص همین سالن ساخته
                  می‌شود.
                </span>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl">مشخصات اولیه سالن</CardTitle>
                <CardDescription>
                  این اطلاعات برای ساخت StudyHall، ذخیره آدرس و نوع سالن، و ایجاد Seatهای اولیه استفاده
                  می‌شود.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <OnboardingForm action={completeOnboarding} />
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
