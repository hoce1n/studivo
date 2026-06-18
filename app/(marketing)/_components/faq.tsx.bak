import { Plus } from "lucide-react";

const faqs = [
  {
    q: "برای راه‌اندازی به دانش فنی نیاز دارم؟",
    a: "خیر. کافیست ثبت‌نام کنید، تعداد صندلی‌ها و مبلغ شهریه را وارد کنید و بلافاصله شروع به مدیریت کنید. هیچ نصب یا تنظیمات پیچیده‌ای لازم نیست.",
  },
  {
    q: "هشدار تمدید شهریه چطور کار می‌کند؟",
    a: "سیستم به‌صورت خودکار تاریخ پایان اشتراک هر دانش‌آموز را رصد می‌کند و میزهایی که تا سه روز آینده به تمدید نیاز دارند را با رنگ هشدار نمایش می‌دهد.",
  },
  {
    q: "آیا می‌توانم برای همکارانم دسترسی تعریف کنم؟",
    a: "بله. در پلن حرفه‌ای می‌توانید برای مراقبان سالن حساب کاربری با نقش staff بسازید؛ آن‌ها به نقشه و پذیرش صندلی‌ها دسترسی دارند اما بخش مالی و تنظیمات مخصوص مدیر است.",
  },
  {
    q: "اطلاعات سالن من امن است؟",
    a: "تمام داده‌های هر سالن کاملاً جدا از سالن‌های دیگر ذخیره و خوانده می‌شود و دسترسی فقط برای کاربران مجاز همان سالن امکان‌پذیر است.",
  },
  {
    q: "می‌توانم پلن رایگان را امتحان کنم؟",
    a: "بله، پلن رایگان همیشه رایگان است و تا ۱۵ صندلی را پشتیبانی می‌کند. هر زمان نیاز به امکانات بیشتری داشتید می‌توانید به پلن حرفه‌ای ارتقا دهید.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="border-t bg-muted/30 px-6 py-16 md:px-10 md:py-24 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1fr]">
        <div className="space-y-3">
          <p className="font-mono text-sm font-semibold text-primary">FAQ</p>
          <h2 className="text-3xl font-black md:text-5xl text-balance">سوالات پرتکرار</h2>
          <p className="text-lg leading-8 text-muted-foreground">
            پاسخ پرسش‌های رایج را اینجا جمع کرده‌ایم. اگر سوال دیگری دارید با تیم پشتیبانی در تماس باشید.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border bg-card p-5 shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold">
                {faq.q}
                <Plus className="size-5 shrink-0 text-primary transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 leading-8 text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
