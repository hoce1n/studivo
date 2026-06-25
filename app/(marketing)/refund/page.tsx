import { Navbar } from "../_components/navbar";
import { StackedCircularFooter } from "../_components/stacked-circular-footer";

const policies = [
  ["ماهیت خدمت", "استادیو یک سرویس اشتراک دیجیتال است و دسترسی به امکانات نرم‌افزار بلافاصله پس از فعال‌سازی پلن فراهم می‌شود. به همین دلیل بازگشت وجه برای دوره استفاده‌شده یا روزهای سپری‌شده از اشتراک انجام نمی‌شود، مگر در موارد خطای پرداخت یا ناتوانی فنی مستمر سرویس که توسط تیم پشتیبانی تأیید شود."],
  ["لغو اشتراک", "مالک سالن می‌تواند تمدید دوره بعدی پلن حرفه‌ای را لغو کند. پس از لغو، دسترسی حرفه‌ای تا پایان دوره پرداخت‌شده باقی می‌ماند و سپس حساب بر اساس محدودیت‌های پلن پایه ادامه پیدا می‌کند."],
  ["ارتقا و کاهش پلن", "ارتقا از پلن پایه به حرفه‌ای پس از پرداخت ۱٬۴۹۰٬۰۰۰ تومان برای ماه جاری فعال می‌شود. کاهش از پلن حرفه‌ای به پایه از دوره بعد اعمال می‌شود تا اختلالی در عملیات جاری سالن ایجاد نشود."],
  ["پرداخت تکراری یا ناموفق", "اگر پرداخت تکراری، برداشت اشتباه یا خطای درگاه رخ دهد، کاربر باید رسید پرداخت و اطلاعات حساب کاربری را از مسیر تماس با ما ارسال کند تا پس از بررسی، اصلاح دسترسی یا بازگشت وجه طبق مقررات شبکه پرداخت انجام شود."],
];

export default function RefundPage() {
  return <><Navbar /><main className="mx-auto w-full max-w-(--breakpoint-lg) px-6 py-16 text-right"><h1 className="text-4xl font-semibold tracking-tight">سیاست بازگشت وجه و لغو اشتراک</h1><p className="mt-4 leading-8 text-muted-foreground">این صفحه شرایط مالی سرویس اشتراکی استادیو را برای شفافیت پیش از خرید توضیح می‌دهد.</p><div className="mt-10 space-y-6">{policies.map(([title, body]) => <section key={title} className="rounded-3xl border bg-card p-6"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-8 text-muted-foreground">{body}</p></section>)}</div></main><StackedCircularFooter /></>;
}
