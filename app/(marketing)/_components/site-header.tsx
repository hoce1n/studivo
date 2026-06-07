import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";

const navLinks = [
  { href: "#features", label: "امکانات" },
  { href: "#preview", label: "پیش‌نمایش داشبورد" },
  { href: "#workflow", label: "مراحل راه‌اندازی" },
  { href: "#pricing", label: "تعرفه‌ها" },
  { href: "#faq", label: "سوالات متداول" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border bg-background/70 px-4 py-3 shadow-sm backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Library className="size-5" />
          </span>
          <span className="text-base">Studivo</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            ورود به پنل
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5"
          >
            ثبت‌نام سالن
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
