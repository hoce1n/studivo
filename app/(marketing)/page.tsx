import Link from "next/link";
import { CheckCircle2, Clock, HelpCircle } from "lucide-react";

export default function Home() {
  const donePages = [
    { name: "ورود", href: "/login" },
    { name: "ثبت نام", href: "/signup" },
    { name: "داشبورد", href: "/dashboard" },
  ];

  const inProgress = [
    { title: "پیاده سازی فرم ورود", desc: "درج اعتبارسنجی و مدیریت خطا" },
    { title: "پیاده سازی فرم ثبت نام", desc: "تایید رمز عبور و ورود خودکار" },
  ];

  const todoItems = [
    { title: "درک عمیق next-themes", desc: "پیاده سازی کامپوننت تغییر تم" },
    { title: "صفحه پروفایل", desc: "نمایش اطلاعات کاربر و دکمه خروج" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-background to-muted/20 p-4">
      <main className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold"></h1>
          <p className="text-muted-foreground"></p>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">صحفه های پیاده سازی شده</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {donePages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 hover:shadow-md transition-shadow"
              >
                <p className="font-medium text-green-900 dark:text-green-300">
                  {page.name}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">در حال کار</h2>
          </div>
          <div className="space-y-3">
            {inProgress.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800"
              >
                <p className="font-medium text-blue-900 dark:text-blue-300">
                  {item.title}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold">برای فردا</h2>
          </div>
          <div className="space-y-3">
            {todoItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800"
              >
                <p className="font-medium text-orange-900 dark:text-orange-300">
                  {item.title}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 p-6 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-purple-600 mt-1 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-2">
                سوال اصلی
              </h3>
              <p className="text-purple-800 dark:text-purple-400">
                این پروژه قراره برای چه هدفی باشه؟
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-500 mt-2">
                تعریف هدف اصلی پروژه برای شروع توسعه ویژگی های اصلی ضروری است.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center text-sm text-muted-foreground border-t pt-6">
          <p>
            برای تغییرات بیشتر{" "}
            <code className="text-xs bg-muted px-2 py-1 rounded">
              PROJECT_STATUS.md
            </code>{" "}
            را چک کنید
          </p>
        </div>
      </main>
    </div>
  );
}
