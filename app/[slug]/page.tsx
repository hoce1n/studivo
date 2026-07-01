import { notFound } from "next/navigation";
import {
  Calendar,
  MapPin,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { FadeIn } from "@/app/[slug]/_components/fade-in";
import { ScrollStackGallery } from "@/app/[slug]/_components/scroll-stack-gallery";
import { StickyCtaBar } from "@/app/[slug]/_components/sticky-cta-bar";
import { VenueHero } from "@/app/[slug]/_components/venue-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
async function getVenueBySlug(slug: string) {
  return prisma.studyHall.findFirst({
    where: { slug, publicPageEnabled: true },
    select: {
      id: true,
      name: true,
      gender: true,
      address: true,
      totalSeats: true,
      monthlyFee: true,
      heroImage: true,
      galleryImages: true,
      createdAt: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hall = await getVenueBySlug(slug);
  if (!hall) return { title: "سالن یافت نشد" };
  return {
    title: `${hall.name} | استودیوو`,
    description: `سالن مطالعه ${hall.name} — ${hall.address}`,
    openGraph: {
      title: hall.name,
      description: hall.address,
      images: hall.heroImage ? [hall.heroImage] : [],
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function genderLabel(gender: string) {
  if (gender === "male") return "آقایان";
  if (gender === "female") return "بانوان";
  return "مختلط";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function buildMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  delay?: number;
};

function StatCard({ icon: Icon, label, value, hint, delay = 0 }: StatCardProps) {
  return (
    <FadeIn delay={delay}>
      <Card className="group relative overflow-hidden rounded-3xl border-[#E8E4DF]/80 bg-white py-0 shadow-[0_1px_0_rgba(20,19,18,0.04)] ring-0 transition-shadow duration-300 hover:shadow-[0_20px_50px_-30px_rgba(20,19,18,0.25)]">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              {label}
            </span>
            <div className="flex size-9 items-center justify-center rounded-2xl bg-[#F7F5F2] text-foreground/80 transition-colors group-hover:bg-[#141312] group-hover:text-white">
              <Icon className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </CardContent>
      </Card>
    </FadeIn>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function VenuePublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const hall = await getVenueBySlug(slug);

  if (!hall) notFound();

  const mapsUrl = buildMapsUrl(hall.address);
  const monthlyFeeDisplay =
    hall.monthlyFee > 0
      ? hall.monthlyFee.toLocaleString("fa-IR")
      : "تماس بگیرید";

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F5F2] pb-28 font-sans text-foreground antialiased md:pb-0"
    >
      <VenueHero
        name={hall.name}
        heroImage={hall.heroImage}
        totalSeats={hall.totalSeats}
        genderLabel={genderLabel(hall.gender)}
      />

      {/* Quick facts strip */}
      <section className="relative z-10 -mt-6 border-b border-[#E8E4DF] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-5 py-5 md:px-8 md:py-6">
          <FadeIn className="flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-foreground" />
            <span className="truncate">{hall.address}</span>
          </FadeIn>
          <FadeIn delay={80} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Users className="size-4 shrink-0 text-foreground" />
            <span>{hall.totalSeats.toLocaleString("fa-IR")} صندلی فعال</span>
          </FadeIn>
          <FadeIn delay={160} className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0 text-foreground" />
            <span>فعال از {formatDate(hall.createdAt)}</span>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          {/* Main column */}
          <div className="flex flex-col gap-14">
            {/* Intro */}
            <FadeIn>
              <div className="max-w-2xl">
                <Badge variant="secondary" className="mb-4 rounded-full px-3 py-1">
                  <Sparkles className="size-3" />
                  فضای مطالعه اختصاصی
                </Badge>
                <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                  محیطی برای تمرکز، نظم و پیشرفت
                </h2>
                <p className="mt-4 text-pretty text-base leading-8 text-muted-foreground">
                  {hall.name} با مدیریت حرفه‌ای صندلی‌ها و اشتراک‌ها، فضایی آرام و
                  قابل اعتماد برای مطالعه جدی فراهم کرده است. برای رزرو صندلی یا
                  اطلاعات بیشتر، با سالن تماس بگیرید.
                </p>
              </div>
            </FadeIn>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Users}
                label="ظرفیت"
                value={hall.totalSeats.toLocaleString("fa-IR")}
                hint="صندلی"
                delay={0}
              />
              <StatCard
                icon={Sparkles}
                label="نوع پذیرش"
                value={genderLabel(hall.gender)}
                delay={100}
              />
              <StatCard
                icon={Wallet}
                label="شهریه ماهانه"
                value={monthlyFeeDisplay}
                hint={hall.monthlyFee > 0 ? "تومان" : undefined}
                delay={200}
              />
            </div>

            {/* Gallery */}
            {hall.galleryImages.length > 0 ? (
              <FadeIn>
                <ScrollStackGallery
                  images={hall.galleryImages}
                  venueName={hall.name}
                />
              </FadeIn>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-5">
            <FadeIn delay={120}>
              <Card className="sticky top-6 rounded-3xl border-[#E8E4DF]/80 bg-white py-0 shadow-[0_24px_60px_-40px_rgba(20,19,18,0.2)] ring-0 lg:top-8">
                <CardHeader className="border-b border-[#E8E4DF]/80 px-6 pt-6 pb-5">
                  <CardTitle className="text-lg font-semibold">آدرس و دسترسی</CardTitle>
                  <CardDescription>
                    برای بازدید حضوری یا رزرو صندلی با سالن هماهنگ کنید.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 py-6">
                  <div className="flex gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#F7F5F2]">
                      <MapPin className="size-4 text-foreground/80" />
                    </div>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {hall.address}
                    </p>
                  </div>

                  <Separator className="bg-[#E8E4DF]/80" />

                  <div className="space-y-3">
                    <Button asChild className="w-full rounded-full">
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="size-4" />
                        مسیریابی در نقشه
                      </a>
                    </Button>
                    <p className="text-center text-xs leading-6 text-muted-foreground">
                      برای رزرو صندلی یا اطلاعات بیشتر با سالن تماس بگیرید.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={220}>
              <div
                className={cn(
                  "rounded-3xl border border-[#E8E4DF]/80 bg-[#141312] p-6 text-white",
                  "shadow-[0_24px_60px_-30px_rgba(20,19,18,0.55)]",
                )}
              >
                <p className="text-xs font-medium tracking-[0.18em] text-white/50 uppercase">
                  مدیریت شده با
                </p>
                <p className="mt-2 text-xl font-semibold tracking-tight">استودیوو</p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  سیستم مدیریت سالن مطالعه برای جلوگیری از تداخل صندلی و پیگیری
                  منظم اشتراک‌ها.
                </p>
              </div>
            </FadeIn>
          </aside>
        </div>
      </div>

      <footer className="border-t border-[#E8E4DF] bg-white py-8 text-center">
        <p className="text-xs text-muted-foreground">
          این صفحه توسط{" "}
          <span className="font-semibold text-foreground">استودیوو</span> پشتیبانی
          می‌شود.
        </p>
      </footer>

      <StickyCtaBar
        venueName={hall.name}
        address={hall.address}
        mapsUrl={mapsUrl}
      />
    </main>
  );
}
