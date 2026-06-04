import { redirect } from "next/navigation";
import { Armchair, CalendarClock, CheckCircle2, CircleDollarSign, UsersRound } from "lucide-react";

import { createStaff, releaseSeat, reserveSeat } from "@/app/actions";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";
import { cn } from "@/lib/utils";

const dayInMs = 24 * 60 * 60 * 1000;

type SeatStatus = "available" | "reserved" | "renewal" | "expired";

function getSeatStatus(endDate?: Date): SeatStatus {
  if (!endDate) {
    return "available";
  }

  const diffDays = Math.ceil((endDate.getTime() - Date.now()) / dayInMs);

  if (diffDays < 0) {
    return "expired";
  }

  if (diffDays <= 3) {
    return "renewal";
  }

  return "reserved";
}

const statusCopy: Record<SeatStatus, { label: string; className: string; badge: "success" | "warning" | "destructive" | "muted" }> = {
  available: {
    label: "خالی",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    badge: "success",
  },
  reserved: {
    label: "رزرو فعال",
    className: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    badge: "destructive",
  },
  renewal: {
    label: "نیازمند تمدید",
    className: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    badge: "warning",
  },
  expired: {
    label: "منقضی",
    className: "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    badge: "muted",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

function defaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export default async function Page() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      role: true,
      studyhallId: true,
      studyhall: {
        select: {
          id: true,
          name: true,
          totalSeats: true,
          monthlyFee: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (!user.studyhallId || !user.studyhall) {
    redirect("/onboarding");
  }

  const [seats, staff, membersCount] = await Promise.all([
    prisma.seat.findMany({
      where: { studyhallId: user.studyhallId },
      orderBy: { seatNumber: "asc" },
      include: {
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            user: {
              select: {
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { studyhallId: user.studyhallId, role: "staff" },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.count({ where: { studyhallId: user.studyhallId, role: "member" } }),
  ]);

  const seatView = seats.map((seat) => {
    const subscription = seat.subscriptions[0];
    return {
      ...seat,
      subscription,
      status: getSeatStatus(subscription?.endDate),
    };
  });

  const stats = {
    available: seatView.filter((seat) => seat.status === "available").length,
    reserved: seatView.filter((seat) => seat.status === "reserved").length,
    renewal: seatView.filter((seat) => seat.status === "renewal").length,
    expired: seatView.filter((seat) => seat.status === "expired").length,
  };

  const isAdmin = user.role === "admin";

  return (
    <SidebarProvider>
      <AppSidebar side="right" userRole={user.role} studyhallName={user.studyhall.name} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ms-1" />
            <Separator orientation="vertical" className="me-2 data-vertical:h-4 data-vertical:self-auto" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{user.studyhall.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4">
          <section className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">کل صندلی‌ها</CardTitle>
                <Armchair className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{seats.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">خالی</CardTitle>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.available}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">هشدار تمدید</CardTitle>
                <CalendarClock className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stats.renewal + stats.expired}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">اعضا</CardTitle>
                <UsersRound className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{membersCount}</div></CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>نقشه زنده صندلی‌ها</CardTitle>
                    <CardDescription>هر کوئری فقط با where: studyhallId سالن فعلی اجرا می‌شود.</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCopy).map(([key, copy]) => (
                      <Badge key={key} variant={copy.badge}>{copy.label}</Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-6 2xl:grid-cols-8">
                  {seatView.map((seat) => {
                    const copy = statusCopy[seat.status];
                    const release = seat.subscription ? releaseSeat.bind(null, seat.subscription.id) : undefined;

                    return (
                      <div key={seat.id} className={cn("rounded-3xl border p-3 transition", copy.className)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold">صندلی {seat.seatNumber}</span>
                          <span className="text-xs">{copy.label}</span>
                        </div>
                        {seat.subscription ? (
                          <div className="mt-3 space-y-1 text-xs leading-6">
                            <p>{seat.subscription.user.name}</p>
                            <p>{seat.subscription.user.phoneNumber}</p>
                            <p>تا {formatDate(seat.subscription.endDate)}</p>
                            <form action={release}>
                              <Button type="submit" variant="outline" size="xs" className="mt-2 w-full bg-background/70">
                                تخلیه دستی
                              </Button>
                            </form>
                          </div>
                        ) : (
                          <p className="mt-3 text-xs leading-6 opacity-80">برای پذیرش، شماره این صندلی را در فرم وارد کنید.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>پذیرش و رزرو صندلی</CardTitle>
                  <CardDescription>برای دانش‌آموز یک User عضو و یک Subscription فعال ساخته می‌شود.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={reserveSeat}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="seatNumber">شماره صندلی</FieldLabel>
                        <Input id="seatNumber" name="seatNumber" type="number" min="1" max={seats.length} placeholder="12" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="memberName">نام دانش‌آموز</FieldLabel>
                        <Input id="memberName" name="memberName" placeholder="نام و نام خانوادگی" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="phoneNumber">شماره تلفن</FieldLabel>
                        <Input id="phoneNumber" name="phoneNumber" inputMode="tel" placeholder="09123456789" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="endDate">تاریخ پایان اشتراک</FieldLabel>
                        <Input id="endDate" name="endDate" type="date" defaultValue={defaultEndDate()} required />
                      </Field>
                      <Button type="submit">ثبت رزرو</Button>
                    </FieldGroup>
                  </form>
                </CardContent>
              </Card>

              {isAdmin ? (
                <Card>
                  <CardHeader>
                    <CardTitle>مدیریت کارکنان</CardTitle>
                    <CardDescription>همکار با role=staff و studyhallId همین سالن ساخته می‌شود.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form action={createStaff}>
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="staffName">نام همکار</FieldLabel>
                          <Input id="staffName" name="name" placeholder="نام مراقب" required />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="staffEmail">ایمیل همکار</FieldLabel>
                          <Input id="staffEmail" name="email" type="email" placeholder="staff@example.com" required />
                          <FieldDescription>این بخش فقط برای مدیر نمایش داده می‌شود.</FieldDescription>
                        </Field>
                        <Button type="submit" variant="secondary">افزودن همکار</Button>
                      </FieldGroup>
                    </form>
                    <Separator />
                    <div className="space-y-2">
                      {staff.length ? staff.map((member) => (
                        <div key={member.id} className="rounded-2xl bg-muted/50 p-3 text-sm">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-muted-foreground">{member.email}</div>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">هنوز همکاری تعریف نشده است.</p>}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>دسترسی همکار</CardTitle>
                    <CardDescription>شما می‌توانید نقشه و پذیرش صندلی‌ها را مدیریت کنید، اما بخش تنظیمات و مالی برای نقش staff مخفی است.</CardDescription>
                  </CardHeader>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><CircleDollarSign className="size-4" /> مرزبندی داده</CardTitle>
                  <CardDescription>شناسه سالن: {user.studyhall.id}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  هر عملیات ایجاد همکار، عضو، صندلی و اشتراک با studyhallId همین سالن ذخیره و خوانده می‌شود.
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}