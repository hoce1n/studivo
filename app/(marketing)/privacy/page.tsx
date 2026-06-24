import { Navbar } from "../_components/navbar";
import { StackedCircularFooter } from "../_components/stacked-circular-footer";

const items = [
  "داده‌های عملیاتی سالن، اطلاعات کارکنان، شماره موبایل اعضا، وضعیت صندلی‌ها و تاریخچه اشتراک‌ها فقط برای ارائه خدمت مدیریت سالن پردازش می‌شود.",
  "استادیو اطلاعات اعضا، شماره تلفن دانش‌آموزان، آمار کارکنان و داده‌های درآمدی سالن را به اشخاص ثالث نمی‌فروشد و بدون الزام قانونی یا درخواست صریح مالک مجاز، در اختیار دیگران قرار نمی‌دهد.",
  "دسترسی به داده‌ها بر اساس حساب کاربری، نقش و محدوده همان سالن کنترل می‌شود و هر سالن از نظر منطقی از سالن‌های دیگر تفکیک شده است.",
  "کاربران مدیر باید دسترسی کارکنان را فقط به افراد مجاز بدهند و در صورت پایان همکاری، حساب کاربری آن فرد را غیرفعال یا محدود کنند.",
  "در صورت نیاز به اتصال پیامک، فقط داده لازم برای ارسال پیام عملیاتی مانند یادآوری تمدید به ارائه‌دهنده پیامک منتخب منتقل می‌شود و مالک سالن مسئول اخذ رضایت‌های لازم از اعضای خود است.",
];

export default function PrivacyPage() {
  return <><Navbar /><main className="mx-auto w-full max-w-(--breakpoint-lg) px-6 py-16 text-right"><h1 className="text-4xl font-semibold tracking-tight">حریم خصوصی و حفاظت از داده‌ها</h1><p className="mt-4 leading-8 text-muted-foreground">اعتماد سالن‌های مطالعه برای استادیو حیاتی است. ما داده‌های کسب‌وکار شما را دارایی عملیاتی محرمانه می‌دانیم.</p><div className="mt-10 space-y-4">{items.map((item) => <p key={item} className="rounded-3xl border bg-card p-6 leading-8 text-muted-foreground">{item}</p>)}</div></main><StackedCircularFooter /></>;
}
