import { Skeleton } from "@/components/ui/skeleton";

export default function VenuePublicLoading() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#F7F5F2]">
      <Skeleton className="h-[62vh] min-h-[22rem] w-full rounded-none md:h-[72vh]" />

      <section className="border-b border-[#E8E4DF] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-6 px-5 py-6 md:px-8">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-36" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </main>
  );
}
