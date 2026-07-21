import { redirect } from "next/navigation";
import { CircleDollarSign } from "lucide-react";

import { createStaff } from "@/app/actions/members/mutations";
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
import { getSession } from "@/lib/server";
import { StudyHallSeatsMap } from "@/app/dashboard/_components/study-hall-seats-map";
import { CreateStaffForm } from "@/app/dashboard/_components/create-staff-form";
import { DashboardStats } from "@/app/dashboard/_components/dashboard-stats";
import { RevenueCard } from "@/app/dashboard/_components/revenue-card";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

type SeatStatus = "available" | "reserved" | "renewal" | "expired";

function getSeatStatus(endsAt?: Date): SeatStatus {
  if (!endsAt) return "available";

  const diffDays = Math.ceil((endsAt.getTime() - Date.now()) / DAY_IN_MS);
  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "renewal";
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

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const sortBy = resolvedSearchParams?.sortBy;
  const returningMemberId =
    typeof resolvedSearchParams?.memberId === "string"
      ? resolvedSearchParams.memberId
      : undefined;

  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      staffAssignments: {
        where: { isActive: true },
        select: {
          role: true,
          studyHallId: true,
          studyHall: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  const assignment = user?.staffAssignments[0];
  if (!user || !assignment || !assignment.studyHall) {
    redirect("/onboarding");
  }

  const studyHall = assignment.studyHall;
  const studyHallId = assignment.studyHallId;
  const role = assignment.role;

  const [seats, staffAssignments, membersCount, returningMember] =
    await Promise.all([
      prisma.seat.findMany({
        where: { section: { studyHallId } },
        orderBy: { number: "asc" },
        include: {
          assignments: {
            where: { endsAt: null },
            include: {
              membership: {
                include: {
                  user: {
                    select: { name: true, phoneNumber: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.staffAssignment.findMany({
        where: { studyHallId, isActive: true },
        orderBy: { createdAt: "desc" },
        select: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.membership.count({
        where: { studyHallId, status: "ACTIVE" },
      }),
      returningMemberId
        ? prisma.user.findFirst({
            where: { id: returningMemberId },
            select: { id: true, name: true, phoneNumber: true },
          })
        : Promise.resolve(null),
    ]);

  const staff = staffAssignments.map((s) => s.user);

  const initialSeatView = seats.map((seat) => {
    const currentAssignment = seat.assignments[0];
    const membership = currentAssignment?.membership;
    const seatNum = parseInt(seat.number, 10) || 0;
    return {
      ...seat,
      seatNumber: seatNum,
      membership,
      status: getSeatStatus(membership?.endsAt),
    };
  });

  const shouldSortByRenewal = sortBy === "renewal";

  const seatView = shouldSortByRenewal
    ? [...initialSeatView].sort((a, b) => {
        const timeA = a.membership
          ? new Date(a.membership.endsAt).getTime()
          : Infinity;
        const timeB = b.membership
          ? new Date(b.membership.endsAt).getTime()
          : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return a.seatNumber - b.seatNumber;
      })
    : initialSeatView;

  const stats = {
    available: seatView.filter((s) => s.status === "available").length,
    reserved: seatView.filter((s) => s.status === "reserved").length,
    renewal: seatView.filter((s) => s.status === "renewal").length,
    expired: seatView.filter((s) => s.status === "expired").length,
  };

  const occupied = stats.reserved + stats.renewal;
  const occupancyRate = seats.length
    ? Math.round((occupied / seats.length) * 100)
    : 0;

  // Calculate revenue from active memberships planPrice (Decimal to Number)
  let activeRevenue = 0;
  let atRiskRevenue = 0;

  seatView.forEach((s) => {
    if (s.membership) {
      const price = Number(s.membership.planPrice) || 0;
      if (s.status === "reserved") activeRevenue += price;
      if (s.status === "renewal") atRiskRevenue += price;
    }
  });

  const monthlyRevenue = activeRevenue + atRiskRevenue;

  const isOwner = role === "OWNER";
  const roleLabel = isOwner ? "مدیر سالن" : "مراقب سالن";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold md:text-2xl">سلام {user.name}</h1>
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

      <DashboardStats
        seatsCount={seats.length}
        occupiedCount={occupied}
        availableCount={stats.available}
        renewalCount={stats.renewal}
        expiredCount={stats.expired}
        membersCount={membersCount}
        staffCount={staff.length}
      />

      <section id="map" className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <StudyHallSeatsMap
          seats={seatView.map((seat) => ({
            id: seat.id,
            seatAssignmentId: seat.assignments[0]?.id,
            seatNumber: seat.number,
            reserveSeatNumber: seat.seatNumber,
            status: seat.status,
            membership: seat.membership
              ? {
                  id: seat.membership.id,
                  memberName: seat.membership.user.name ?? "بدون نام",
                  phoneNumber: seat.membership.user.phoneNumber ?? "—",
                  endDate: formatDate(seat.membership.endsAt),
                  startDateISO: seat.membership.startsAt.toISOString(),
                  endDateISO: seat.membership.endsAt.toISOString(),
                  planPrice: seat.membership.planPrice as unknown as number,
                  paymentStatus: "PAID",
                }
              : undefined,
            history: [],
          }))}
          shouldSortByRenewal={shouldSortByRenewal}
          statusCopy={statusCopy}
          studyHallName={studyHall.name}
          returningMember={returningMember}
          stats={{
            available: formatNumber(stats.available),
            reserved: formatNumber(stats.reserved),
            renewal: formatNumber(stats.renewal),
            expired: formatNumber(stats.expired),
          }}
        />

        <div className="space-y-6">
          {isOwner && (
            <RevenueCard
              monthlyRevenue={monthlyRevenue}
              occupiedCount={occupied}
              activeRevenue={activeRevenue}
              atRiskRevenue={atRiskRevenue}
            />
          )}

          {isOwner ? (
            <Card id="staff">
              <CardHeader>
                <CardTitle>مدیریت کارکنان</CardTitle>
                <CardDescription>
                  همکار جدید با نقش STAFF برای این سالن ثبت می‌شود.
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
                  شما به عنوان مراقب سالن، دسترسی کامل به نقشه زنده، ثبت نام
                  دانش‌آموز جدید و تمدید یا تخلیه صندلی‌ها را دارید.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="size-4" /> مرزبندی داده
              </CardTitle>
              <CardDescription>شناسه سالن: {studyHall.id}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              تمام اطلاعات ثبت‌شده (شامل لیست همکاران، اعضا، صندلی‌ها و
              تاریخچه‌ی اشتراک‌ها) کاملاً منحصراً متعلق به این سالن مطالعه است.
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
