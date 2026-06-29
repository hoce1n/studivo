import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";

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

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#F7F5F2] font-sans text-[#1A1917]"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative h-[55vh] min-h-72 w-full overflow-hidden bg-[#1A1917] md:h-[65vh]">
        {hall.heroImage ? (
          <Image
            src={hall.heroImage}
            alt={hall.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2825] to-[#1A1917]" />
        )}

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Hall name over the hero */}
        <div className="absolute bottom-0 right-0 p-6 md:p-10">
          <p className="mb-2 text-sm font-medium tracking-widest text-white/60 uppercase">
            سالن مطالعه
          </p>
          <h1 className="text-balance text-3xl font-black leading-tight text-white md:text-5xl">
            {hall.name}
          </h1>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Info strip                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-5 py-5 md:px-8">
          <div className="flex items-center gap-2 text-sm text-[#8C877F]">
            <MapPin className="size-4 shrink-0 text-[#1A1917]" />
            <span>{hall.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8C877F]">
            <Users className="size-4 shrink-0 text-[#1A1917]" />
            <span>{hall.totalSeats.toLocaleString("fa-IR")} صندلی</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#8C877F]">
            <Calendar className="size-4 shrink-0 text-[#1A1917]" />
            <span>از {formatDate(hall.createdAt)}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Body                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="mx-auto max-w-5xl px-5 py-10 md:px-8 md:py-14">
        <div className="grid gap-8 md:grid-cols-3">

          {/* Left column — details */}
          <div className="flex flex-col gap-6 md:col-span-2">

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
                <p className="text-xs font-medium tracking-wide text-[#8C877F]">
                  ظرفیت
                </p>
                <p className="mt-2 text-2xl font-black">
                  {hall.totalSeats.toLocaleString("fa-IR")}
                </p>
                <p className="text-xs text-[#8C877F]">صندلی</p>
              </div>

              <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
                <p className="text-xs font-medium tracking-wide text-[#8C877F]">
                  نوع پذیرش
                </p>
                <p className="mt-2 text-2xl font-black">
                  {genderLabel(hall.gender)}
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E4DF] bg-white p-5">
                <p className="text-xs font-medium tracking-wide text-[#8C877F]">
                  شهریه ماهانه
                </p>
                <p className="mt-2 text-2xl font-black">
                  {hall.monthlyFee > 0
                    ? hall.monthlyFee.toLocaleString("fa-IR")
                    : "—"}
                </p>
                {hall.monthlyFee > 0 && (
                  <p className="text-xs text-[#8C877F]">تومان</p>
                )}
              </div>
            </div>

            {/* Gallery */}
            {hall.galleryImages.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-black">تصاویر سالن</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {hall.galleryImages.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-[#E8E4DF] bg-[#E8E4DF]"
                    >
                      <Image
                        src={url}
                        alt={`تصویر ${i + 1} از ${hall.name}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — address card */}
          <div className="flex flex-col gap-4">
            <div className="sticky top-6 rounded-3xl border border-[#E8E4DF] bg-white p-6">
              <h2 className="mb-4 text-base font-black">آدرس سالن</h2>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#8C877F]" />
                <p className="text-sm leading-7 text-[#5A554F]">
                  {hall.address}
                </p>
              </div>

              <div className="mt-6 border-t border-[#E8E4DF] pt-5">
                <p className="text-xs text-[#8C877F]">
                  برای رزرو صندلی یا اطلاعات بیشتر با سالن تماس بگیرید.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer strip                                                         */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t border-[#E8E4DF] bg-white py-6 text-center text-xs text-[#8C877F]">
        این صفحه توسط{" "}
        <span className="font-bold text-[#1A1917]">استودیوو</span> پشتیبانی
        می‌شود.
      </footer>
    </main>
  );
}
