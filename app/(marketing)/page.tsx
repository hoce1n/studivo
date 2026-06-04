import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  LayoutGrid,
  Library,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

const features = [
  {
    title: "نقشه گرافیکی میزها",
    desc: "وضعیت تمام میزهای سالن را در یک نگاه ببینید؛ میزهای پر قرمز و میزهای خالی سبز هستند.",
    icon: <LayoutGrid className="size-5" />,
  },
  {
    title: "هشدار خودکار شهریه",
    desc: "موعد تمدید شهریه دانش‌آموزان را قبل از اتمام مهلت شناسایی کنید و از ضرر مالی جلوگیری کنید.",
    icon: <Clock className="size-5" />,
  },
  {
    title: "مدیریت ساده اعضا",
    desc: "اطلاعات تماس، کد ملی و تاریخچه ثبت‌نام دانش‌آموزان را یک‌بار برای همیشه یکپارچه کنید.",
    icon: <Users className="size-5" />,
  },
  {
    title: "کنترل وضعیت پرداخت",
    desc: "به سادگی مشخص کنید چه کسی شهریه را تسویه کرده و چه کسی در وضعیت «در انتظار پرداخت» است.",
    icon: <Wallet className="size-5" />,
  },
];

const checklist = [
  "مشاهده میزهای خالی سالن",
  "بررسی تمدیدهای ۳ روز آینده",
  "ثبت فیش واریزی دانش‌آموز جدید",
  "ارسال پیامک یادآوری شهریه",
];

const dashboardStats = [
  { label: "میزهای اشغال شده", value: "۳۲/۴۵" },
  { label: "تمدیدهای رو به اتمام", value: "۴ میز" },
  { label: "شهریه‌های معوقه", value: "۳ مورد" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      {/* هدر سایت */}
      <section className="relative isolate px-6 py-6 md:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--muted-foreground)/0.12),transparent_26%)]" />
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Library className="size-4" />
            </span>
            Studivo
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              امکانات سامانه
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              مراحل راه‌اندازی
            </a>
            <a href="#dashboard" className="transition-colors hover:text-foreground">
              پیش‌نمایش داشبورد
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              ورود به پنل
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              ثبت نام سالن
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* بخش هیرو (Hero Section) */}
      <section className="px-6 pb-16 pt-8 md:px-10 md:pb-24 lg:px-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              ویژه مدیران سالن‌های مطالعه، کتابخانه‌ها و پانسیون‌های کنکور
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
                مدیریت میزها و شهریه‌ها، به سادگی یک نگاه
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                نرم‌افزار Studivo یک داشبورد مینیمال برای پایش وضعیت صندلی‌ها، مدیریت تمدید شهریه ماهانه و ساماندهی اعضای سالن مطالعه شماست؛ بدون شلوغی و پیچیدگی‌های سیستم‌های قدیمی.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
              >
                تنظیم ۴۵ میز سالن من
                <ArrowLeft className="size-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border bg-background/70 px-6 py-3 text-base font-bold transition-colors hover:bg-muted"
              >
                مشاهده دموی داشبورد
              </Link>
            </div>
            <div className="grid max-w-2xl gap-3 pt-4 sm:grid-cols-3">
              {dashboardStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* پیش‌نمایش کامپوننت داشبورد */}
          <div id="dashboard" className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />
            <div className="rounded-[2rem] border bg-card p-4 shadow-2xl">
              <div className="rounded-[1.5rem] border bg-background p-5">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">میز انتخاب شده</p>
                    <h2 className="mt-1 text-xl font-black">میز شماره ۱۲ (VIP)</h2>
                  </div>
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-500">
                    رزرو شده (پر)
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {dashboardStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-muted/60 p-4">
                      <p className="text-xl font-black">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
                  <div className="rounded-2xl border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <CalendarDays className="size-5 text-primary" />
                      <h3 className="font-bold">تمدیدهای پیش‌رو (این هفته)</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        ["علی محمدی (میز ۲۴)", "فردا"],
                        ["رضا احمدی (میز ۰۵)", "۳ روز بعد"],
                        ["سارا اکبری (میز ۴۱)", "پایان هفته"],
                      ].map(([title, status]) => (
                        <div key={title} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                          <span className="text-sm font-medium">{title}</span>
                          <span className="text-xs text-red-500 font-medium">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-primary" />
                      <h3 className="font-bold">چک‌لیست روزانه مدیر</h3>
                    </div>
                    <div className="space-y-3">
                      {checklist.map((item, index) => (
                        <div key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className={index < 2 ? "mt-0.5 size-4 text-green-500" : "mt-0.5 size-4 text-muted-foreground"} />
                          <span className={index < 2 ? "text-foreground" : "text-muted-foreground"}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* بخش ویژگی‌ها (Features) */}
      <section id="features" className="border-y bg-muted/30 px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-sm font-semibold text-primary">FEATURES</p>
            <h2 className="text-3xl font-black md:text-5xl">هر آنچه برای کنترل سالن نیاز دارید.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              نه یک نرم‌افزار پیچیده حسابداری یا اداری؛ یک فضای کاملاً متمرکز برای اینکه بدانید صندلی‌ها در چه وضعیتی هستند و چه زمانی باید شهریه بگیرید.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1">
                <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* بخش مراحل کار (Workflow) */}
      <section id="workflow" className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div className="space-y-4">
            <p className="font-mono text-sm font-semibold text-primary">WORKFLOW</p>
            <h2 className="text-3xl font-black md:text-5xl">راه‌اندازی سیستم در ۴ قدم ساده.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              سیستم شما بلافاصله پس از ثبت‌نام آماده به کار است. کافیست پیکربندی اولیه را انجام دهید و مدیریت سالن را شروع کنید.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["۰۱", "تعریف ظرفیت سالن", "تعداد کل میزها (مثلا ۴۵ صندلی) و مبلغ شهریه ثابت ماهانه را وارد کنید."],
              ["۰۲", "ثبت اعضا و دانش‌آموزان", "نام و شماره تماس کاربران سالن را برای سیستم تعریف کنید."],
              ["۰۳", "تخصیص صندلی", "میز مدنظر را انتخاب کرده و تاریخ شروع قرارداد دانش‌آموز را ثبت کنید."],
              ["۰۴", "کنترل و پایش", "روزانه وضعیت صندلی‌ها را مانیتور کرده و هشدارهای تمدید را دریافت کنید."],
            ].map(([step, title, desc]) => (
              <div key={step} className="rounded-3xl border bg-card p-6">
                <span className="font-mono text-sm font-bold text-primary">{step}</span>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* بخش دعوت به اقدام (CTA) */}
      <section className="px-6 pb-16 md:px-10 md:pb-24 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border bg-primary p-8 text-primary-foreground shadow-2xl md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <h2 className="text-3xl font-black md:text-5xl">آماده‌اید نظم را به سالن مطالعه خود بیاورید؟</h2>
              <p className="max-w-2xl text-lg leading-8 text-primary-foreground/80">
                همین حالا سالن خود را ثبت کنید، صندلی‌ها را بچینید و اولین تمدید شهریه را هوشمندانه ردیابی کنید.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-background px-6 py-3 text-base font-black text-foreground shadow-lg transition-transform hover:-translate-y-0.5"
            >
              شروع رایگان مدیریت سالن
              <ArrowLeft className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}