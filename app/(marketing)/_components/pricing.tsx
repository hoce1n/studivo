import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

const plans = [
  {
    name: "رایگان",
    price: "۰",
    period: "همیشه رایگان",
    description: "برای سالن‌های کوچک و شروع کار.",
    features: ["تا ۱۵ صندلی", "نقشه زنده صندلی‌ها", "مدیریت اعضا", "هشدار تمدید شهریه"],
    cta: "شروع رایگان",
    highlighted: false,
  },
  {
    name: "حرفه‌ای",
    price: "۲۹۰",
    period: "هزار تومان ماهانه",
    description: "برای سالن‌های فعال با چند همکار.",
    features: [
      "صندلی نامحدود",
      "مدیریت کارکنان و سطح دسترسی",
      "گزارش مالی و درآمد",
      "ارسال پیامک یادآوری",
      "پشتیبانی اولویت‌دار",
    ],
    cta: "انتخاب پلن حرفه‌ای",
    highlighted: true,
  },
  {
    name: "سازمانی",
    price: "تماس بگیرید",
    period: "متناسب با نیاز شما",
    description: "برای مجموعه‌های چندشعبه‌ای.",
    features: ["چند شعبه", "داشبورد یکپارچه", "API اختصاصی", "مدیر حساب اختصاصی"],
    cta: "گفتگو با تیم فروش",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-16 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="font-mono text-sm font-semibold text-primary">PRICING</p>
          <h2 className="text-3xl font-black md:text-5xl">تعرفه‌ای ساده و شفاف</h2>
          <p className="text-lg leading-8 text-muted-foreground">
            بدون قرارداد پیچیده و هزینه‌های پنهان. هر زمان خواستید پلن خود را تغییر دهید.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-7 shadow-sm ${
                plan.highlighted
                  ? "border-primary bg-card ring-2 ring-primary"
                  : "bg-card"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 right-7 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  محبوب‌ترین
                </span>
              )}
              <h3 className="text-lg font-black">{plan.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-7 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-transform hover:-translate-y-0.5 ${
                  plan.highlighted
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border bg-background hover:bg-muted"
                }`}
              >
                {plan.cta}
                <ArrowLeft className="size-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
