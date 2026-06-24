import { Navbar } from "../_components/navbar";
import { StackedCircularFooter } from "../_components/stacked-circular-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto grid w-full max-w-(--breakpoint-xl) gap-8 px-6 py-16 text-right lg:grid-cols-[0.9fr_1.1fr]">
        <section>
          <p className="text-sm font-medium text-primary">تماس با ما</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">برای دمو، پشتیبانی و بررسی نیازهای سالن با استادیو در ارتباط باشید</h1>
          <p className="mt-6 leading-8 text-muted-foreground">فرم زیر برای درخواست دمو، پرسش درباره تعرفه حرفه‌ای و هماهنگی راه‌اندازی اولیه در نظر گرفته شده است. پاسخ‌گویی در روزهای کاری و بر اساس ترتیب ثبت درخواست انجام می‌شود.</p>
          <div className="mt-8 space-y-4 rounded-3xl border bg-card p-6">
            <p><span className="font-semibold">ایمیل پشتیبانی:</span> support@studivo.ir</p>
            <p><span className="font-semibold">ایمیل فروش:</span> sales@studivo.ir</p>
            <p><span className="font-semibold">ساعات پاسخ‌گویی:</span> شنبه تا چهارشنبه، ۹ تا ۱۸</p>
            <p className="text-sm leading-7 text-muted-foreground">برای مکاتبات رسمی، درخواست‌های پشتیبانی از مسیر ایمیل پشتیبانی یا فرم همین صفحه ثبت و پیگیری می‌شود.</p>
          </div>
        </section>
        <form className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-5">
            <div><Label htmlFor="name">نام و نام خانوادگی</Label><Input id="name" name="name" className="mt-2" placeholder="نام مدیر یا نماینده سالن" /></div>
            <div><Label htmlFor="phone">شماره موبایل کاری</Label><Input id="phone" name="phone" inputMode="tel" className="mt-2" placeholder="مثلاً ۰۹۱۲۱۲۳۴۵۶۷" /></div>
            <div><Label htmlFor="venue">نام سالن مطالعه</Label><Input id="venue" name="venue" className="mt-2" placeholder="نام مجموعه شما" /></div>
            <div><Label htmlFor="message">موضوع درخواست</Label><Input id="message" name="message" className="mt-2" placeholder="درخواست دمو، راه‌اندازی، پشتیبانی یا پرسش تعرفه" /></div>
            <Button type="submit" size="lg" className="rounded-full">ثبت درخواست تماس</Button>
          </div>
        </form>
      </main>
      <StackedCircularFooter />
    </>
  );
}
