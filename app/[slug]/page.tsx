import { notFound } from "next/navigation";
import {
  Calendar,
  MapPin,
  Sparkles,
  Users,
  Wallet,
  Wifi,
  Volume2,
  Armchair,
  Coffee,
  Wind,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";

import { FadeIn } from "@/app/[slug]/_components/fade-in";
import { ScrollStackGallery } from "@/app/[slug]/_components/scroll-stack-gallery";
import { StickyCtaBar } from "@/app/[slug]/_components/sticky-cta-bar";
import { VenueHero } from "@/app/[slug]/_components/venue-hero";
import { VenueDemoForm } from "@/app/[slug]/_components/venue-demo-form";
import { PublicSeatMap } from "@/app/[slug]/_components/public-seat-map";
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
    description: `سالن مطالعه ${hall.name} — ${hall.address}. فضایی آرام برای تمرکز عمیق و مطالعه بدون حواس‌پرتی.`,
    openGraph: {
      title: hall.name,
      description: `سالن مطالعه ${hall.name} در ${hall.address}`,
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

type FacilityItemProps = {
  icon: LucideIcon;
  label: string;
  delay?: number;
};

function FacilityItem({ icon: Icon, label, delay = 0 }: FacilityItemProps) {
  return (
    <FadeIn delay={delay}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-white/10 text-secondary-fixed">
          <Icon className="size-8" />
        </div>
        <span className="text-white font-label-md text-label-md">{label}</span>
      </div>
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

  // Mock available seats (in real scenario, calculate from subscriptions)
  const mockAvailableSeats = Math.max(
    Math.floor(hall.totalSeats * 0.3),
    1
  );

  const facilities = [
    { icon: Wifi, label: "WiFi پرسرعت" },
    { icon: Volume2, label: "منطقه سکوت مطلق" },
    { icon: Armchair, label: "صندلی ارگونومیک" },
    { icon: Coffee, label: "بوفه چای و قهوه" },
    { icon: Wind, label: "تهویه هوای مطبوع" },
    { icon: Lightbulb, label: "روشنایی اختصاصی" },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F5F2] pb-28 font-sans text-foreground antialiased md:pb-0"
    >
      {/* Hero Section */}
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
            {/* About Section */}
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
                  قابل اعتماد برای مطالعه جدی فراهم کرده است. ما معتقدیم کیفیت خروجی ذهنی شما
                  مستقیماً به اتمسفر پیرامونتان وابسته است.
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

            {/* Facilities Section */}
            <FadeIn>
              <section className="rounded-3xl bg-primary py-12 px-6 md:py-16 md:px-8">
                <h2 className="text-center font-headline-lg-mobile text-headline-lg-mobile text-on-primary mb-12">
                  امکانات رفاهی
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {facilities.map((facility, index) => (
                    <FacilityItem
                      key={facility.label}
                      icon={facility.icon}
                      label={facility.label}
                      delay={index * 80}
                    />
                  ))}
                </div>
              </section>
            </FadeIn>

            {/* Live Seat Map Section */}
            <FadeIn>
              <section id="map" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl mb-2">
                    نقشه زنده صندلی‌ها
                  </h2>
                  <p className="text-muted-foreground">
                    وضعیت لحظه‌ای صندلی‌ها و ظرفیت موجود برای رزرو
                  </p>
                </div>
                <PublicSeatMap
                  totalSeats={hall.totalSeats}
                  occupiedSeats={hall.totalSeats - mockAvailableSeats}
                />
              </section>
            </FadeIn>

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
            {/* Demo Form */}
            <FadeIn delay={120}>
              <div className="sticky top-6 lg:top-8">
                <VenueDemoForm venueName={hall.name} />
              </div>
            </FadeIn>

            {/* Address Card */}
            <FadeIn delay={220}>
              <Card className="rounded-3xl border-[#E8E4DF]/80 bg-white py-0 shadow-[0_24px_60px_-40px_rgba(20,19,18,0.2)] ring-0">
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

            {/* Powered by Studivo */}
            <FadeIn delay={300}>
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

      {/* Footer */}
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
