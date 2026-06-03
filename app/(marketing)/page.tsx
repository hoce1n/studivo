import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Layers3,
  Rocket,
  Sparkles,
  Target,
} from "lucide-react";

const features = [
  {
    title: "نقشه راه MVP",
    desc: "ایده را به milestone و taskهای کوچک تبدیل کن تا هر روز بدانی قدم بعدی چیست.",
    icon: <Layers3 className="size-5" />,
  },
  {
    title: "چک‌لیست لانچ",
    desc: "از problem statement تا landing، feedback و آماده‌سازی انتشار را مرحله‌به‌مرحله جلو ببر.",
    icon: <ClipboardCheck className="size-5" />,
  },
  {
    title: "صندوق بازخورد",
    desc: "نظر کاربران اولیه را کنار پروژه نگه دار و تصمیم‌های محصول را از حدس به داده نزدیک کن.",
    icon: <Inbox className="size-5" />,
  },
  {
    title: "متریک‌های ساده",
    desc: "پیشرفت، blockerها، taskهای انجام‌شده و آمادگی لانچ را در یک نگاه ببین.",
    icon: <BarChart3 className="size-5" />,
  },
];

const checklist = [
  "مسئله و مخاطب هدف را تعریف کن",
  "ویژگی‌های نسخه اول را محدود کن",
  "متن landing و CTA را آماده کن",
  "بازخورد ۵ کاربر اولیه را ثبت کن",
];

const dashboardStats = [
  { label: "پیشرفت MVP", value: "۶۸٪" },
  { label: "تسک‌های باز", value: "۱۲" },
  { label: "آماده‌سازی لانچ", value: "۷/۱۰" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate px-6 py-6 md:px-10 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_30%),radial-gradient(circle_at_bottom_right,hsl(var(--muted-foreground)/0.12),transparent_26%)]" />
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border bg-background/70 px-4 py-3 shadow-sm backdrop-blur">
          <Link href="/" className="flex items-center gap-2 font-mono text-sm font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Rocket className="size-4" />
            </span>
            void.launch
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              امکانات
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              مسیر لانچ
            </a>
            <a href="#dashboard" className="transition-colors hover:text-foreground">
              داشبورد
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              ورود
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
            >
              شروع رایگان
              <ArrowLeft className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-8 md:px-10 md:pb-24 lg:px-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              برای سازنده‌های مستقل، فریلنسرها و تیم‌های کوچک
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl lg:text-7xl">
                لانچ MVP را از یک ایده مبهم به یک مسیر قابل اجرا تبدیل کن.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                void.launch یک داشبورد مینیمال برای تعریف پروژه، ساخت نقشه راه، مدیریت چک‌لیست لانچ و ثبت بازخورد کاربران اولیه است؛ دقیقاً همان چیزی که قبل از بزرگ‌کردن محصول لازم داری.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
              >
                اولین پروژه‌ام را بساز
                <ArrowLeft className="size-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border bg-background/70 px-6 py-3 text-base font-bold transition-colors hover:bg-muted"
              >
                دیدن داشبورد
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

          <div id="dashboard" className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />
            <div className="rounded-[2rem] border bg-card p-4 shadow-2xl">
              <div className="rounded-[1.5rem] border bg-background p-5">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">پروژه فعال</p>
                    <h2 className="mt-1 text-xl font-black">Minimal SaaS Starter</h2>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    Building
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
                      <Target className="size-5 text-primary" />
                      <h3 className="font-bold">تمرکز این هفته</h3>
                    </div>
                    <div className="space-y-3">
                      {[
                        ["Landing page واقعی", "در حال انجام"],
                        ["مدل Project در دیتابیس", "بعدی"],
                        ["چک‌لیست لانچ", "Backlog"],
                      ].map(([title, status]) => (
                        <div key={title} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                          <span className="text-sm font-medium">{title}</span>
                          <span className="text-xs text-muted-foreground">{status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardCheck className="size-5 text-primary" />
                      <h3 className="font-bold">چک‌لیست لانچ</h3>
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

      <section id="features" className="border-y bg-muted/30 px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-sm font-semibold text-primary">FEATURES</p>
            <h2 className="text-3xl font-black md:text-5xl">همه‌چیز برای رساندن ایده به نسخه اول.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              نه یک ابزار پیچیده مدیریت پروژه؛ یک فضای کوچک و دقیق برای اینکه محصولت از حالت ذهنی خارج شود و هر روز جلو برود.
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

      <section id="workflow" className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div className="space-y-4">
            <p className="font-mono text-sm font-semibold text-primary">WORKFLOW</p>
            <h2 className="text-3xl font-black md:text-5xl">از ایده تا لانچ، بدون شلوغی.</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              هر پروژه با یک مسیر ساده شروع می‌شود: تعریف مسئله، محدودکردن MVP، ساختن، گرفتن بازخورد و آماده‌شدن برای انتشار.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["۰۱", "تعریف پروژه", "نام، مخاطب هدف، مسئله و مرحله فعلی را مشخص کن."],
              ["۰۲", "شکستن به قدم‌های کوچک", "milestone و task بساز تا اجرا قابل پیگیری شود."],
              ["۰۳", "ثبت بازخورد", "نظر کاربران اولیه را کنار تصمیم‌های محصول نگه دار."],
              ["۰۴", "آماده‌سازی لانچ", "قبل از انتشار، چک‌لیست لانچ را کامل کن."],
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

      <section className="px-6 pb-16 md:px-10 md:pb-24 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border bg-primary p-8 text-primary-foreground shadow-2xl md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <h2 className="text-3xl font-black md:text-5xl">آماده‌ای اولین MVP را جدی‌تر جلو ببری؟</h2>
              <p className="max-w-2xl text-lg leading-8 text-primary-foreground/80">
                همین حالا ثبت‌نام کن، وارد داشبورد شو و اولین پروژه‌ات را به یک مسیر قابل اجرا تبدیل کن.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-background px-6 py-3 text-base font-black text-foreground shadow-lg transition-transform hover:-translate-y-0.5"
            >
              شروع کن
              <ArrowLeft className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
