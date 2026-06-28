import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlay, Sparkles } from "lucide-react";
import Link from "next/link";
import { DashboardPreview } from "./dashboard-preview";

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden border-b border-accent bg-background">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>
      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) flex-col items-center justify-between gap-x-10 gap-y-14 px-6 py-12 lg:min-h-[calc(100vh-4rem)] lg:flex-row lg:py-0">
        <div className="max-w-xl text-right">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            نرم‌افزار تخصصی مدیریت سالن‌های مطالعه، کتابخانه‌های خصوصی و پانسیون‌ها
          </div>

          <h1 className="mt-6 max-w-[22ch] text-3xl font-semibold leading-[1.2]! tracking-tight xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
            مدیریت سالن مطالعه، بدون تداخل صندلی و پیگیری‌های فرساینده
          </h1>
          <p className="mt-6 max-w-[64ch] text-base leading-8 text-muted-foreground xs:text-lg">
            ثبت‌نام، رزرو صندلی، تمدید اشتراک و وضعیت اعضا را در یک داشبورد ساده و قابل اعتماد مدیریت کنید؛ تا هر روز با آرامش بیشتری سالن را اداره کنید.
          </p>
          <div className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span className="rounded-2xl border bg-background/70 px-4 py-3 text-xs">حذف دوباره‌رزروی صندلی</span>
            <span className="rounded-2xl border bg-background/70 px-4 py-3 text-xs">هشدار تمدید و انقضا</span>
            <span className="rounded-2xl border bg-background/70 px-4 py-3 text-xs">نقشه تصویری ظرفیت سالن</span>
          </div>
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full text-base sm:w-auto">
              <Link href="/demo">
                درخواست دمو رایگان <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full rounded-full text-base shadow-none sm:w-auto">
              <Link href="/#features">
                <CirclePlay className="h-5! w-5!" /> مشاهده امکانات
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative w-full lg:max-w-2xl">
          {/* Subtle depth effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent rounded-[2rem] blur-2xl" />
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;
