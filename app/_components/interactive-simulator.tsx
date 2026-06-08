"use client";

import { useMemo, useState } from "react";
import { Armchair, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type SeatState = "available" | "reserved";

type Seat = {
  id: number;
  state: SeatState;
  label?: string;
};

const initialSeats: Seat[] = [
  { id: 1, state: "reserved", label: "رزرو فعال" },
  { id: 2, state: "available" },
  { id: 3, state: "available" },
  { id: 4, state: "reserved", label: "مشغول" },
  { id: 5, state: "available" },
  { id: 6, state: "reserved", label: "مشغول" },
  { id: 7, state: "available" },
  { id: 8, state: "available" },
  { id: 9, state: "reserved", label: "رزرو فعال" },
  { id: 10, state: "available" },
  { id: 11, state: "reserved", label: "مشغول" },
  { id: 12, state: "available" },
];

const persianSeatNumber = new Intl.NumberFormat("fa-IR", {
  useGrouping: false,
});

export function InteractiveSimulator() {
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [activeSeatId, setActiveSeatId] = useState<number | null>(null);

  const availableSeats = useMemo(
    () => seats.filter((seat) => seat.state === "available").length,
    [seats],
  );

  const reservedSeats = seats.length - availableSeats;

  function toggleSeat(seat: Seat) {
    setSeats((currentSeats) =>
      currentSeats.map((currentSeat) => {
        if (currentSeat.id !== seat.id) {
          return currentSeat;
        }

        const nextState = currentSeat.state === "available" ? "reserved" : "available";

        return {
          ...currentSeat,
          state: nextState,
          label: nextState === "reserved" ? "رزرو جدید" : undefined,
        };
      }),
    );

    setActiveSeatId(seat.state === "available" ? seat.id : null);
  }

  function resetSeats() {
    setSeats(initialSeats);
    setActiveSeatId(null);
  }

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border bg-card p-4 text-right shadow-xl shadow-foreground/5 md:p-6"
      dir="rtl"
      aria-label="شبیه‌ساز تعاملی رزرو صندلی"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-l from-transparent via-primary/40 to-transparent" />
      <div className="pointer-events-none absolute -left-16 -top-16 size-40 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-12 size-44 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3 lg:max-w-sm">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-bold text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-primary" />
            تجربه زنده بدون ساخت حساب
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              روی یک صندلی خالی بزنید و رزرو فوری را حس کنید.
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              این مینی‌سالن نشان می‌دهد مدیر سالن مطالعه، کتابخانه یا پانسیون کنکور چگونه با یک کلیک
              وضعیت صندلی و اولین موعد تمدید شهریه را شفاف می‌کند.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <p className="text-xs font-medium opacity-80">صندلی خالی</p>
              <p className="mt-1 text-2xl font-black">{persianSeatNumber.format(availableSeats)}</p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              <p className="text-xs font-medium opacity-80">رزرو شده</p>
              <p className="mt-1 text-2xl font-black">{persianSeatNumber.format(reservedSeats)}</p>
            </div>
          </div>
        </div>

        <div className="relative w-full lg:max-w-xl">
          {activeSeatId ? (
            <div className="absolute -top-3 left-2 right-2 z-10 animate-in fade-in slide-in-from-top-2 duration-300 md:left-auto md:right-6 md:w-80">
              <div className="rounded-2xl border border-emerald-200 bg-background/95 p-4 shadow-2xl shadow-emerald-950/10 backdrop-blur dark:border-emerald-500/30">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <p className="text-sm font-bold leading-6">
                    صندلی با موفقیت به نام دانش‌آموز جدید رزرو شد! موعد اولین تمدید شهریه: ۳۰ روز آینده.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border bg-background/80 p-3 shadow-inner md:p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  خالی
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/30">
                  <span className="size-2 rounded-full bg-red-500" />
                  مشغول
                </span>
              </div>
              <button
                type="button"
                onClick={resetSeats}
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                بازنشانی
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3" role="list" aria-label="چیدمان صندلی‌ها">
              {seats.map((seat) => {
                const isAvailable = seat.state === "available";
                const isActive = seat.id === activeSeatId;

                return (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => toggleSeat(seat)}
                    className={cn(
                      "group relative min-h-24 rounded-2xl border p-2 text-center transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-28",
                      isAvailable
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-900/10 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
                        : "border-red-200 bg-red-50 text-red-900 shadow-sm dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
                      isActive && "-translate-y-1 ring-2 ring-emerald-400 ring-offset-2 ring-offset-background",
                    )}
                    aria-pressed={!isAvailable}
                    aria-label={`صندلی ${persianSeatNumber.format(seat.id)} ${isAvailable ? "خالی" : "مشغول"}`}
                  >
                    <span
                      className={cn(
                        "mx-auto flex size-10 items-center justify-center rounded-2xl transition-all duration-300 sm:size-12",
                        isAvailable ? "bg-emerald-500 text-white" : "bg-red-500 text-white",
                        isActive && "scale-110 shadow-lg shadow-emerald-500/25",
                      )}
                    >
                      <Armchair className="size-5 sm:size-6" />
                    </span>
                    <span className="mt-2 block text-xs font-black sm:text-sm">
                      صندلی {persianSeatNumber.format(seat.id)}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold opacity-75 sm:text-xs">
                      {isAvailable ? "خالی" : seat.label ?? "مشغول"}
                    </span>
                    {isAvailable ? (
                      <span className="absolute inset-x-2 bottom-2 rounded-full bg-white/70 px-2 py-1 text-[10px] font-bold opacity-0 transition-opacity group-hover:opacity-100 dark:bg-background/50">
                        کلیک برای رزرو
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
