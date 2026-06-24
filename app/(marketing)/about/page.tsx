import { StackedCircularFooter } from "../_components/stacked-circular-footer";
import { Navbar } from "../_components/navbar";

const values = [
  "حذف دفترهای کاغذی، فایل‌های پراکنده و پیام‌های غیرقابل پیگیری",
  "کمک به مالک برای افزایش اشغال صندلی و کاهش اختلاف‌های پذیرش",
  "ثبت امن تاریخچه اعضا، اشتراک‌ها، تمدیدها و عملیات کارکنان",
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-(--breakpoint-lg) px-6 py-16 text-right">
        <p className="text-sm font-medium text-primary">درباره استادیو</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">زیرساخت ابری برای مدیریت حرفه‌ای سالن مطالعه</h1>
        <p className="mt-6 text-lg leading-9 text-muted-foreground">
          استادیو با هدف مدرن‌سازی مدیریت سالن‌های مطالعه، کتابخانه‌های خصوصی و پانسیون‌های مطالعاتی در ایران ساخته شده است. مأموریت ما جایگزین کردن دفترهای فیزیکی، حافظه کارکنان و فایل‌های پراکنده با یک سامانه قابل اعتماد، فارسی و همیشه در دسترس است.
        </p>
        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map((value) => (
            <div key={value} className="rounded-3xl border bg-card p-6 leading-8 text-muted-foreground">{value}</div>
          ))}
        </section>
        <section className="mt-12 rounded-3xl border bg-muted/40 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">تمرکز ما روی کسب‌وکارهای واقعی سالن مطالعه است</h2>
          <p className="mt-4 leading-8 text-muted-foreground">
            استادیو یک قالب عمومی رزرو نیست. منطق محصول بر اساس نیازهای روزانه مدیران سالن طراحی شده است: کنترل تداخل صندلی، پیگیری تمدیدهای ماهانه، مشاهده ظرفیت لحظه‌ای، تعریف نقش برای کارکنان و نگهداری سوابق عملیاتی برای تصمیم‌گیری بهتر. هدف نهایی ما این است که مالک سالن بتواند با آرامش بیشتر، ظرفیت را بهینه کند و درآمد قابل پیش‌بینی‌تری داشته باشد.
          </p>
        </section>
      </main>
      <StackedCircularFooter />
    </>
  );
}
