import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Silk from "@/components/Silk";

const Hero = () => {
  return (
    <section className="min-h-[calc(100vh-4rem)] w-full overflow-hidden border-b border-border/60">
      <div className="absolute inset-0 -z-20">
        <Silk
          speed={2.5}
          scale={1.05}
          color="#9AA7B5"
          noiseIntensity={0.55}
          rotation={0.2}
        />
      </div>
      {/* Soft wash so Silk stays atmospheric, not the main focus */}
      <div className="absolute inset-0 -z-10 bg-background/72" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-linear-to-t from-background to-transparent" />

      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) items-center justify-center gap-x-12 gap-y-14 px-6 py-16 lg:min-h-[calc(100vh-4rem)] lg:py-0">
        <div className="max-w-xl text-center">
          <h1 className="max-w-[20ch] text-3xl font-semibold leading-[1.2]! tracking-tight xs:text-4xl sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
            مدیریت سالن مطالعه، بدون تداخل صندلی
          </h1>
          <p className="mx-auto mt-5 max-w-[42ch] text-base leading-8 text-muted-foreground xs:text-lg">
            رزرو، تمدید و وضعیت اعضا در یک داشبورد ساده — بدون دفتر و پیام‌های پراکنده.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full text-base sm:w-auto"
            >
              <Link href="/demo">
                درخواست دمو رایگان <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full rounded-full text-base text-muted-foreground sm:w-auto"
            >
              <Link href="/#features">مشاهده امکانات</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
