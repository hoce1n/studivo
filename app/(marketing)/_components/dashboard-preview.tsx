import {
  Armchair,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  LayoutDashboard,
  Settings2,
  UsersRound,
} from "lucide-react";

type SeatStatus = "available" | "reserved" | "renewal" | "expired";

const statusStyles: Record<SeatStatus, { label: string; className: string }> = {
  available: {
    label: "خالی",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  reserved: {
    label: "رزرو فعال",
    className: "border-red-200 bg-red-50 text-red-900",
  },
  renewal: {
    label: "نیازمند تمدید",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  expired: {
    label: "منقضی",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

// چیدمان نمونه ۲۴ صندلی برای پیش‌نمایش
const seatLayout: { n: number; status: SeatStatus; name?: string }[] = [
  { n: 1, status: "reserved", name: "علی محمدی" },
  { n: 2, status: "available" },
  { n: 3, status: "reserved", name: "نگار رضایی" },
  { n: 4, status: "renewal", name: "رضا احمدی" },
  { n: 5, status: "reserved", name: "مهسا کریمی" },
  { n: 6, status: "available" },
  { n: 7, status: "expired", name: "حسین قاسمی" },
  { n: 8, status: "reserved", name: "زهرا یوسفی" },
  { n: 9, status: "reserved", name: "امیر حسینی" },
  { n: 10, status: "available" },
  { n: 11, status: "renewal", name: "سارا اکبری" },
  { n: 12, status: "reserved", name: "پارسا نوری" },
];

const stats = [
  { label: "کل صندلی‌ها", value: "۴۵", icon: Armchair, tone: "text-muted-foreground" },
  { label: "خالی", value: "۱۳", icon: CheckCircle2, tone: "text-emerald-600" },
  { label: "هشدار تمدید", value: "۴", icon: CalendarClock, tone: "text-amber-600" },
  { label: "اعضا", value: "۸۶", icon: UsersRound, tone: "text-muted-foreground" },
];

const renewals = [
  { name: "علی محمدی", seat: "۲۴", due: "فردا" },
  { name: "رضا احمدی", seat: "۰۵", due: "۳ روز بعد" },
  { name: "سارا اکبری", seat: "۴۱", due: "پایان هفته" },
];

const sidebarItems = [
  { label: "داشبورد", icon: LayoutDashboard, active: true },
  { label: "اعضا", icon: UsersRound, active: false },
  { label: "مالی", icon: CircleDollarSign, active: false },
  { label: "تنظیمات", icon: Settings2, active: false },
];

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/5">
      {/* نوار بالای پنجره */}
      <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-400" />
          <span className="size-3 rounded-full bg-amber-400" />
          <span className="size-3 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-lg bg-background px-3 py-1 text-xs text-muted-foreground">
          app.studivo.ir/dashboard
        </div>
      </div>

      <div className="flex" dir="rtl">
        {/* سایدبار */}
        <aside className="hidden w-44 shrink-0 flex-col gap-1 border-l bg-muted/30 p-3 sm:flex">
          <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">سالن مطالعه ققنوس</p>
          {sidebarItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                item.active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </div>
          ))}
        </aside>

        {/* محتوای اصلی */}
        <div className="flex-1 space-y-4 p-4">
          {/* کارت‌های آماری */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-background p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`size-4 ${stat.tone}`} />
                </div>
                <p className="mt-2 text-2xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* نقشه زنده صندلی‌ها */}
            <div className="rounded-xl border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold">نقشه زنده صندلی‌ها</h3>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(statusStyles) as SeatStatus[]).map((key) => (
                    <span
                      key={key}
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${statusStyles[key].className}`}
                    >
                      {statusStyles[key].label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {seatLayout.map((seat) => (
                  <div
                    key={seat.n}
                    className={`rounded-xl border p-2 text-center ${statusStyles[seat.status].className}`}
                  >
                    <p className="text-xs font-bold">صندلی {seat.n}</p>
                    <p className="mt-1 truncate text-[10px] opacity-80">{seat.name ?? "آزاد"}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* هشدار تمدید */}
            <div className="rounded-xl border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <CalendarClock className="size-4 text-amber-600" />
                <h3 className="text-sm font-bold">تمدیدهای پیش‌رو</h3>
              </div>
              <div className="space-y-2">
                {renewals.map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">صندلی {r.seat}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                      {r.due}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-dashed p-3 text-center">
                <p className="text-xs font-medium">درآمد این ماه</p>
                <p className="mt-1 text-xl font-black text-emerald-600">۲۴٬۵۰۰٬۰۰۰ ﷼</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
