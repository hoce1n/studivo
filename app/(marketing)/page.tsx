import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  LayoutGrid,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import { SiteHeader } from "./_components/site-header";
import { DashboardPreview } from "./_components/dashboard-preview";
import { SocialProof } from "./_components/social-proof";
import { Pricing } from "./_components/pricing";
import { Faq } from "./_components/faq";
import { SiteFooter } from "./_components/site-footer";
import PushNotificationManager from "@/components/pwa/PushNotificationManager";

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

const heroStats = [
  { label: "میزهای اشغال‌شده", value: "۳۲/۴۵" },
  { label: "تمدیدهای رو به اتمام", value: "۴ میز" },
  { label: "شهریه‌های معوقه", value: "۳ مورد" },
];

const workflowSteps = [
  ["۰۱", "تعریف ظرفیت سالن", "تعداد کل میزها (مثلاً ۴۵ صندلی) و مبلغ شهریه ثابت ماهانه را وارد کنید."],
  ["۰۲", "ثبت اعضا و دانش‌آموزان", "نام و شماره تماس کاربران سالن را برای سیستم تعریف کنید."],
  ["۰۳", "تخصیص صندلی", "میز مدنظر را انتخاب کرده و تاریخ شروع قرارداد دانش‌آموز را ثبت کنید."],
  ["۰۴", "کنترل و پایش", "روزانه وضعیت صندلی‌ها را مانیتور کرده و هشدارهای تمدید را دریافت کنید."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />

      <section className="relative isolate px-6 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20 lg:px-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_45%)]" />
        <div className="mx-auto max-w-3xl space-y-7 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            ویژه مدیران سالن‌های مطالعه، کتابخانه‌ها و پانسیون‌های کنکور
          </div>
          <h1 className="text-balance text-4xl font-black leading-tight tracking-tight md:text-6xl">
            مدیریت میزها و شهریه‌ها، به سادگی یک نگاه
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
            Studivo یک داشبورد مینیمال برای پایش وضعیت صندلی‌ها، مدیریت تمدید شهریه ماهانه و
            ساماندهی اعضای سالن مطالعه شماست؛ بدون شلوغی و پیچیدگی سیستم‌های قدیمی.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
        </div>

        {/* پیش‌نمایش داشبورد */}
        <div id="preview" className="relative mx-auto mt-14 max-w-5xl">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-primary/10 blur-3xl" />
          <DashboardPreview />
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SocialProof />

      {/* بخش ویژگی‌ها */}
      <section id="features" className="px-6 py-16 md:px-10 md:py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl space-y-3">
            <p className="font-mono text-sm font-semibold text-primary">FEATURES</p>
            <h2 className="text-3xl font-black md:text-5xl text-balance">
              هر آنچه برای کنترل سالن نیاز دارید.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              نه یک نرم‌افزار پیچیده حسابداری؛ یک فضای کاملاً متمرکز برای اینکه بدانید صندلی‌ها در چه
              وضعیتی هستند و چه زمانی باید شهریه بگیرید.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1"
              >
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

      {/* بخش مراحل کار */}
      <section id="workflow" className="border-t bg-muted/30 px-6 py-16 md:px-10 md:py-24 lg:px-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1fr]">
          <div className="space-y-4">
            <p className="font-mono text-sm font-semibold text-primary">WORKFLOW</p>
            <h2 className="text-3xl font-black md:text-5xl text-balance">
              راه‌اندازی سیستم در ۴ قدم ساده.
            </h2>
            <p className="text-lg leading-8 text-muted-foreground">
              سیستم شما بلافاصله پس از ثبت‌نام آماده به کار است. کافیست پیکربندی اولیه را انجام دهید و
              مدیریت سالن را شروع کنید.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {workflowSteps.map(([step, title, desc]) => (
              <div key={step} className="rounded-3xl border bg-card p-6">
                <span className="font-mono text-sm font-bold text-primary">{step}</span>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Pricing />
      <Faq />

      {/* بخش دعوت به اقدام */}
      <section className="px-6 py-16 md:px-10 md:py-24 lg:px-16">
        <div className="mx-auto max-w-7xl rounded-[2rem] border bg-primary p-8 text-primary-foreground shadow-2xl md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <h2 className="text-3xl font-black md:text-5xl text-balance">
                آماده‌اید نظم را به سالن مطالعه خود بیاورید؟
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-primary-foreground/80">
                همین حالا سالن خود را ثبت کنید، صندلی‌ها را بچینید و اولین تمدید شهریه را هوشمندانه
                ردیابی کنید.
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

      <SiteFooter />
      <PushNotificationManager />
    </main>
  );
}
