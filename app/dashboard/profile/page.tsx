import { ShieldAlert, User } from "lucide-react";

import { ProfileSettings } from "./_components/profile-settings";
import { requireUser } from "@/app/actions/actions";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <section className="flex flex-1 flex-col gap-6 p-4 md:p-6" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
        <div className="absolute -left-20 -top-20 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-bold text-muted-foreground">
              <ShieldAlert className="size-4 text-primary" />
              مرکز کنترل حساب کاربری
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-4xl">
                <User className="size-7 text-primary" />
                پروفایل و امنیت
              </h1>
              <p className="mt-3 max-w-2xl leading-8 text-muted-foreground">
                اطلاعات هویتی، سطح دسترسی و رمز عبور خود را در یک فضای امن و ساده مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-background px-4 py-3 text-sm font-bold text-muted-foreground">
            {user.studyhall?.name ?? ""}
          </div>
        </div>
      </section>

      <ProfileSettings user={user} />
    </section>
  );
}
