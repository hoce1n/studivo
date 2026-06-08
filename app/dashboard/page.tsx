import { redirect } from "next/navigation";

import {
  Armchair,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Map,
  UsersRound,
} from "lucide-react";

import { createStaff } from "@/app/actions/actions";

import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
import { ReserveForm } from "@/components/reserve-form";
import { ActionForm } from "@/components/action-form";
import { SeatCard } from "@/components/seat-card";

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

const statusCopy: Record<
  SeatStatus,
  {
    label: string;
    className: string;
    dot: string;
    badge: "success" | "warning" | "destructive" | "muted";
  }
> = {
  available: {
    label: "خالی",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    dot: "bg-emerald-500",
    badge: "success",
  },
  reserved: {
    label: "رزرو فعال",
    className:
      "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    dot: "bg-red-500",
    badge: "destructive",
  },
  renewal: {
    label: "نیازمند تمدید",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    dot: "bg-amber-500",
    badge: "warning",
  },
  expired: {
    label: "منقضی",
    className:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
    dot: "bg-slate-400",
    badge: "muted",
  },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
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
    prisma.user.count({
      where: { studyhallId: user.studyhallId, role: "member" },
    }),
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

  const occupied = stats.reserved + stats.renewal;
  const occupancyRate = seats.length
    ? Math.round((occupied / seats.length) * 100)
    : 0;
  const monthlyRevenue = occupied * (user.studyhall.monthlyFee ?? 0);

  const isAdmin = user.role === "admin";
  const roleLabel = isAdmin ? "مدیر" : "مراقب";

  const summaryCards = [
    {
      title: "کل صندلی‌ها",
      value: formatNumber(seats.length),
      hint: `${formatNumber(occupied)} صندلی اشغال شده`,
      icon: Map,
      iconClass: "text-muted-foreground",
    },
    {
      title: "صندلی خالی",
      value: formatNumber(stats.available),
      hint: "آماده پذیرش",
      icon: CheckCircle2,
      iconClass: "text-emerald-600",
    },
    {
      title: "هشدار تمدید",
      value: formatNumber(stats.renewal + stats.expired),
      hint: `${formatNumber(stats.renewal)} نزدیک پایان · ${formatNumber(stats.expired)} منقضی`,
      icon: CalendarClock,
      iconClass: "text-amber-600",
    },
    {
      title: "اعضا",
      value: formatNumber(membersCount),
      hint: `${formatNumber(staff.length)} همکار فعال`,
      icon: UsersRound,
      iconClass: "text-muted-foreground",
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar
        side="right"
        userRole={user.role}
        studyhallName={user.studyhall.name}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ms-1" />
            <Separator
              orientation="vertical"
              className="me-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>{user.studyhall.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-bold md:text-2xl">
                سلام {user.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                نمای کلی سالن مطالعه و وضعیت لحظه‌ای صندلی‌ها
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="muted">{roleLabel}</Badge>
              <Badge variant="outline" className="gap-1.5">
                <span
                  className="inline-block size-1.5 rounded-full bg-emerald-500"
                  aria-hidden
                />
                اشغال {formatNumber(occupancyRate)}٪
              </Badge>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <Card key={card.title} className="gap-2">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className={cn("size-4", card.iconClass)} />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </div>
                  <p className="text-xs text-muted-foreground">{card.hint}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
            <Card className="gap-4">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle>نقشه زنده صندلی‌ها</CardTitle>
                    <CardDescription>
                      وضعیت هر صندلی بر اساس تاریخ پایان اشتراک به‌روز می‌شود.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCopy).map(([key, copy]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
                      >
                        <span
                          className={cn("size-2 rounded-full", copy.dot)}
                          aria-hidden
                        />
                        {copy.label}
                        <span className="font-semibold">
                          {formatNumber(stats[key as SeatStatus])}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {seatView.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                    {seatView.map((seat) => {
                      const copy = statusCopy[seat.status];

                      return (
                        <SeatCard
                          key={seat.id}
                          seatNumber={formatNumber(seat.seatNumber)}
                          statusLabel={copy.label}
                          className={copy.className}
                          dotClass={copy.dot}
                          subscription={
                            seat.subscription
                              ? {
                                  id: seat.subscription.id,
                                  memberName:
                                    seat.subscription.user.name ?? "بدون نام",
                                  phoneNumber:
                                    seat.subscription.user.phoneNumber ?? "—",
                                  endDate: formatDate(
                                    seat.subscription.endDate,
                                  ),
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-12 text-center">
                    <Armchair className="size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      هنوز صندلی‌ای ثبت نشده است.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      از بخش تنظیمات، تعداد صندلی‌ها را مشخص کنید.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {isAdmin && (
              <Card className="gap-2 bg-primary text-primary-foreground">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium text-primary-foreground/80">
                    درآمد ماهانه تخمینی
                  </CardTitle>
                  <CircleDollarSign className="size-4 text-primary-foreground/70" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-2xl font-bold tracking-tight">
                    {formatNumber(monthlyRevenue)}{" "}
                    <span className="text-base font-normal text-primary-foreground/70">
                      تومان
                    </span>
                  </div>
                  <p className="text-xs text-primary-foreground/70">
                    بر اساس {formatNumber(occupied)} صندلی اشغال‌شده ×{" "}
                    {formatNumber(user.studyhall.monthlyFee ?? 0)} تومان
                  </p>
                </CardContent>
              </Card>
              )}

              <ReserveForm maxSeats={seats.length} />

              {isAdmin ? (
                <Card>
                  <CardHeader>
                    <CardTitle>مدیریت کارکنان</CardTitle>
                    <CardDescription>
                      همکار با role=staff و studyhallId همین سالن ساخته می‌شود.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ActionForm
                      action={createStaff}
                      successMessage="همکار جدید با موفقیت اضافه شد."
                      resetOnSuccess
                    >
                      {(pending) => (
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor="staffName">نام همکار</FieldLabel>
                          <Input
                            id="staffName"
                            name="name"
                            placeholder="نام مراقب"
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="staffEmail">
                            ایمیل همکار
                          </FieldLabel>
                          <Input
                            id="staffEmail"
                            name="email"
                            type="email"
                            placeholder="staff@example.com"
                            required
                          />
                          <FieldDescription>
                            این بخش فقط برای مدیر نمایش داده می‌شود.
                          </FieldDescription>
                        </Field>
                        <Field>
                          <FieldLabel>رمز عبور</FieldLabel>
                          <Input
                            id="staffPassword"
                            name="password"
                            type="password"
                            required
                          />
                          <FieldDescription>
                            مراقب پس از ورود میتواند رمزش را عوض کند.
                          </FieldDescription>
                        </Field>
                        <Button type="submit" variant="secondary" disabled={pending}>
                          افزودن همکار
                        </Button>
                      </FieldGroup>
                      )}
                    </ActionForm>
                    <Separator />
                    <div className="space-y-2">
                      {staff.length ? (
                        staff.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3 text-sm"
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold">
                              {member.name?.slice(0, 2) ?? "؟"}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {member.name}
                              </div>
                              <div className="truncate text-muted-foreground">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                          هنوز همکاری تعریف نشده است.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>دسترسی همکار</CardTitle>
                    <CardDescription>
                      شما به عنوان مراقب سالن، دسترسی کامل به نقشه زنده، ثبت نام دانش‌آموز جدید و تمدید یا تخلیه صندلی‌ها را دارید.                    
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="size-4" /> مرزبندی داده
                  </CardTitle>
                  <CardDescription>
                    شناسه سالن: {user.studyhall.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-muted-foreground">
                  تمام اطلاعات ثبت‌شده (شامل لیست همکاران، اعضا، صندلی‌ها و تاریخچه‌ی اشتراک‌ها) کاملاً رمزگذاری شده و منحصراً متعلق به این سالن مطالعه است. هیچ کاربر یا سالن دیگری به این داده‌ها دسترسی ندارد.
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
