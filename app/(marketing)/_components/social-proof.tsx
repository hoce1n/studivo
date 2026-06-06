import { Quote, Star } from "lucide-react";

const logos = ["کانون فرهنگی", "سالن ققنوس", "کتابخانه مهر", "پانسیون کنکور آریا", "سالن مطالعه نور"];

const testimonials = [
  {
    quote:
      "قبلاً با دفتر و اکسل میزها را مدیریت می‌کردم و همیشه چند تمدید را فراموش می‌کردم. حالا استودیوو خودش هشدار می‌دهد و دیگر هیچ شهریه‌ای از دست نمی‌رود.",
    name: "مریم صادقی",
    role: "مدیر سالن مطالعه ققنوس",
  },
  {
    quote:
      "نقشه گرافیکی صندلی‌ها واقعاً کار را عوض کرد؛ با یک نگاه می‌فهمم کدام میز خالی است و کدام نیاز به تمدید دارد.",
    name: "حسین رحیمی",
    role: "موسس پانسیون کنکور آریا",
  },
  {
    quote:
      "راه‌اندازی‌اش کمتر از ده دقیقه طول کشید. همکارانم بدون آموزش خاصی توانستند پذیرش دانش‌آموز را انجام دهند.",
    name: "نگار محمدی",
    role: "مسئول کتابخانه مهر",
  },
];

export function SocialProof() {
  return (
    <section className="border-y bg-muted/30 px-6 py-16 md:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-sm text-muted-foreground">
          مورد اعتماد بیش از ۲۰۰ سالن مطالعه و کتابخانه در سراسر کشور
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
          {logos.map((logo) => (
            <span key={logo} className="text-base font-bold text-muted-foreground">
              {logo}
            </span>
          ))}
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-3xl border bg-card p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <Quote className="size-6 text-primary/30" />
              <blockquote className="mt-3 flex-1 leading-8 text-foreground/90">{t.quote}</blockquote>
              <figcaption className="mt-5 border-t pt-4">
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
