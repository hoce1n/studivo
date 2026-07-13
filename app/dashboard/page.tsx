import { redirect } from "next/navigation";

import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Map,
  UsersRound,
} from "lucide-react";

import { createStaff, requireTenantContext } from "@/app/actions/auth";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { StudyHallSeatsMap } from "@/app/dashboard/_components/study-hall-seats-map";
import { CreateStaffForm } from "@/app/dashboard/_components/create-staff-form";
import { isTenantOwner } from "@/lib/tenant-context";

const dayInMs = 24 * 60 * 60 * 1000;

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

type SeatStatus = "available" | "reserved" | "renewal" | "expired";

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
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined}>;
}

type ReturningMember = { id: string; name: string; phoneNumber: string } | null;

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const sortBy = resolvedSearchParams?.sortBy;
  const returningMemberId = typeof resolvedSearchParams?.memberId === "string" ? resolvedSearchParams.memberId : undefined;

  // Use requireTenantContext which handles authentication and tenant scoping.
  const user = await requireTenantContext();

  const [seats, staff, membersCount, returningMember] = await Promise.all([
    prisma.seat.findMany({
      where: { section: { studyHallId: user.studyHallId } },
      orderBy: { number: "asc" },
      include: {
        assignments: {
          orderBy: { startsAt: "desc" },
          include: {
            membership: {
              include: {
                user: {
                  select: {
                    name: true,
                    phoneNumber: true,
                  },
                },
                payments: {
                    where: { status: "COMPLETED" },
                    take: 1
                }
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
          staffAssignments: {
              some: { studyHallId: user.studyHallId, isActive: true }
          }
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.user.count({
      where: {
          memberships: {
              some: { studyHallId: user.studyHallId, status: "ACTIVE" }
          }
      },
    }),
    returningMemberId
      ? prisma.user.findFirst({
          where: {
              id: returningMemberId,
              memberships: {
                  some: { studyHallId: user.studyHallId }
              }
          },
          select: { id: true, name: true, phoneNumber: true },
        })
      : Promise.resolve(null satisfies ReturningMember),
  ]);

  const initialSeatView = seats.map((seat) => {
    const activeAssignment = seat.assignments.find((item) => item.membership.status === "ACTIVE" && item.endsAt === null);

    return {
      ...seat,
      activeAssignment,
      status: getSeatStatus(activeAssignment?.membership.endsAt),
    };
  });

  const shouldSortByRenewal = sortBy === "renewal";

  const seatView = shouldSortByRenewal
    ? [...initialSeatView].sort((a, b) => {
        const timeA = a.activeAssignment ? new Date(a.activeAssignment.membership.endsAt).getTime() : Infinity;
        const timeB = b.activeAssignment ? new Date(b.activeAssignment.membership.endsAt).getTime() : Infinity;

        if (timeA !== timeB) return timeA - timeB;
        return a.number.localeCompare(b.number, undefined, { numeric: true });
      })
    : initialSeatView;

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
  const activeRevenue = stats.reserved * (user.studyHall.monthlyFee ?? 0);
  const atRiskRevenue = stats.renewal * (user.studyHall.monthlyFee ?? 0);
  const lostRevenue = stats.available * (user.studyHall.monthlyFee ?? 0);
  const monthlyRevenue = occupied * (user.studyHall.monthlyFee ?? 0);

  const isAdmin = isTenantOwner(user);
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
    <>
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

      <section id="map" className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <StudyHallSeatsMap
          seats={seatView.map((seat) => ({
            id: seat.id,
            seatNumber: formatNumber(Number(seat.number)),
            reserveSeatNumber: Number(seat.number),
            status: seat.status,
              subscription: seat.activeAssignment
              ? {
                  id: seat.activeAssignment.membership.id,
                  memberName: seat.activeAssignment.membership.user.name ?? "بدون نام",
                  phoneNumber: seat.activeAssignment.membership.user.phoneNumber ?? "—",
                  endDate: formatDate(seat.activeAssignment.membership.endsAt),
                  startDateISO: seat.activeAssignment.membership.startsAt.toISOString(),
                  endDateISO: seat.activeAssignment.membership.endsAt.toISOString(),
                  planPrice: Number(seat.activeAssignment.membership.planPrice),
                  paymentStatus: seat.activeAssignment.membership.payments.length > 0 ? "paid" : "unpaid",
                }
              : undefined,
            history: seat.assignments
              .filter((item) => !(item.membership.status === "ACTIVE" && item.endsAt === null))
              .slice(0, 8)
              .map((item) => ({
                id: item.membership.id,
                memberName: item.membership.user.name ?? "بدون نام",
                phoneNumber: item.membership.user.phoneNumber ?? "—",
                startDate: formatDate(item.membership.startsAt),
                endDate: formatDate(item.membership.endsAt),
                status: item.membership.status === "ACTIVE" ? "active" : item.membership.status === "EXPIRED" ? "expired" : "cancelled",
                paymentStatus: item.membership.payments.length > 0 ? "paid" : "unpaid",
              })),
          }))}
          shouldSortByRenewal={shouldSortByRenewal}
          statusCopy={statusCopy}
          studyHallName={user.studyHall.name}
          returningMember={returningMember}
          stats={{
            available: formatNumber(stats.available),
            reserved: formatNumber(stats.reserved),
            renewal: formatNumber(stats.renewal),
            expired: formatNumber(stats.expired),
          }}
        />

        <div className="space-y-6">
          {isAdmin && (
            <Card className="gap-2 bg-primary text-primary-foreground relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />

              <CardHeader className="flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium text-primary-foreground/80">
                  درآمد ماهانه تخمینی
                </CardTitle>
                <CircleDollarSign className="size-4 text-primary-foreground/70" />
              </CardHeader>

              <CardContent className="space-y-2">
                <div className="text-2xl font-bold tracking-tight">
                  {formatNumber(monthlyRevenue)}{" "}
                  <span className="text-base font-normal text-primary-foreground/70">
                    تومان
                  </span>
                </div>

                <p className="text-xs text-primary-foreground/70 border-b border-primary-foreground/10 pb-2">
                  بر اساس {formatNumber(occupied)} صندلی اشغال‌شده ×{" "}
                  {formatNumber(user.studyHall.monthlyFee ?? 0)} تومان
                </p>

                <div className="pt-1 grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-primary-foreground/60">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span>وصول شده: {formatNumber(activeRevenue)}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    <span>در آستانه انقضا: {formatNumber(atRiskRevenue)}</span>
                  </div>
                  {lostRevenue > 0 && (
                    <div className="flex items-center gap-1 col-span-2 mt-0.5 text-primary-foreground/50 border-t border-dashed border-primary-foreground/5 pt-1">
                      <span>ظرفیت درآمدی خالی سالن:</span>
                      <span className="font-medium text-primary-foreground/70 dir-ltr inline-block">
                        {formatNumber(lostRevenue)} - تومان
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {isAdmin ? (
            <Card id="staff">
              <CardHeader>
                <CardTitle>مدیریت کارکنان</CardTitle>
                <CardDescription>
                  اضافه کردن همکار جدید با دسترسی مراقب به این سالن.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CreateStaffForm createStaff={createStaff} />
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
                      هنوز همکاری ثبت نشده است.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>دسترسی محدود</CardTitle>
                <CardDescription>
                  شما به عنوان مراقب وارد شده‌اید. بخش مدیریت مالی و کارکنان فقط
                  برای مدیر سالن در دسترس است.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>
    </>
  );
}
