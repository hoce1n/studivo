import Link from "next/link";
import { Library } from "lucide-react";

const columns = [
  {
    title: "محصول",
    links: [
      { href: "#features", label: "امکانات" },
      { href: "#preview", label: "پیش‌نمایش داشبورد" },
      { href: "#pricing", label: "تعرفه‌ها" },
      { href: "#workflow", label: "مراحل راه‌اندازی" },
    ],
  },
  {
    title: "پشتیبانی",
    links: [
      { href: "#faq", label: "سوالات متداول" },
      { href: "/login", label: "ورود به پنل" },
      { href: "/signup", label: "ثبت‌نام سالن" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-background px-6 py-12 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Library className="size-5" />
            </span>
            <span className="text-base">استودیوو</span>
          </Link>
          <p className="max-w-sm leading-7 text-muted-foreground">
            داشبورد مینیمال مدیریت میزها و شهریه‌ی سالن‌های مطالعه، کتابخانه‌ها و پانسیون‌های کنکور.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-bold">{col.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Studivo. تمامی حقوق محفوظ است.</p>
        <p>ساخته‌شده برای مدیران سالن‌های مطالعه</p>
      </div>
    </footer>
  );
}
