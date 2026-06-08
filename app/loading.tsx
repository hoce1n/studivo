import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function Loading() {
  return (
    <div className="flex min-h-screen" dir="rtl">
      
      <div className="flex-1">
        <header className="flex h-16 items-center gap-2 border-b px-4">
          <Skeleton className="h-8 w-8 rounded-md" /> {/* دکمه منو */}
          <Separator orientation="vertical" className="h-4 mx-2" />
          <Skeleton className="h-5 w-24" /> {/* بردکرامب نام سالن */}
        </header>

        <main className="flex flex-col gap-6 p-4 md:p-6">
          
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" /> {/* سلام کاربر */}
              <Skeleton className="h-4 w-64" /> {/* متن زیرین */}
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-14 rounded-full" /> {/* نقش */}
              <Skeleton className="h-6 w-24 rounded-full" /> {/* درصد اشغال */}
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            
            <div className="rounded-xl border p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-72" />
                </div>
                {/* اسکلتون لند یا راهنمای رنگ وضعیت‌ها */}
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-20 rounded-full" />
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border p-3 h-24 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-14" />
                      <Skeleton className="size-2 rounded-full" />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              
              <div className="rounded-xl border p-5 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-3 w-48" />
              </div>

              <div className="rounded-xl border p-5 space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="space-y-3 pt-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  ))}
                  <Skeleton className="h-9 w-full rounded-md mt-4" /> {/* دکمه ثبت */}
                </div>
              </div>

              <div className="rounded-xl border p-5 space-y-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-9 w-full rounded-md" />
                <Separator />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="space-y-1.5 w-full">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>
    </div>
  );
}