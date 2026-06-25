import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlay, Sparkles } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="min-h-[calc(100vh-4rem)] w-full overflow-hidden border-b border-accent bg-[radial-gradient(circle_at_top_left,color-mix(in_oklch,var(--primary),transparent_82%),transparent_34rem)]">
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
              <Link href="/signup">
                شروع <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full rounded-full text-base shadow-none sm:w-auto">
              <Link href="/contact">
                <CirclePlay className="h-5! w-5!" /> درخواست دمو و مشاوره
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative w-full rounded-[2rem] border bg-card p-5 shadow-sm lg:max-w-lg xl:max-w-xl">
          <div className="rounded-[1.5rem] border bg-background p-4">
            <div className="mb-4 flex items-center justify-between border-b pb-3 text-sm text-muted-foreground">
              <span>نمای زنده سالن</span>
              <span>ظرفیت نمونه: ۴۸ صندلی</span>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: 30 }).map((_, index) => {
                const state = index % 7 === 0 ? "bg-amber-500/80" : index % 5 === 0 ? "bg-destructive/80" : index % 3 === 0 ? "bg-primary/80" : "bg-emerald-500/80";
                return (
                  <div key={index} className={`flex aspect-square items-center justify-center rounded-2xl text-xs font-semibold text-white ${state}`}>
                    {new Intl.NumberFormat("fa-IR").format(index + 1)}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-4">
              <span>سبز: آزاد</span><span>آبی: فعال</span><span>زرد: نیازمند تمدید</span><span>قرمز: منقضی</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
