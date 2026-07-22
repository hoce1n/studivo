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
import {
  statusCopy,
  formatDate,
  formatNumber,
  processSeatData,
} from "@/app/dashboard/_lib/dashboard-utils";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const shouldSortByRenewal = resolvedSearchParams?.sortBy === "renewal";
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

  const { studyHall, studyHallId, role } = {
    studyHall: assignment.studyHall,
    studyHallId: assignment.studyHallId,
    role: assignment.role,
  };


  const [seats, membershipPlans, staffAssignments, membersCount, returningMember] =
    await Promise.all([
      prisma.seat.findMany({
        where: { section: { studyHallId } },
        orderBy: { number: "asc" },
        include: {
          assignments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            include: {
              membership: {
                include: {
                  user: {
                    select: { name: true, phoneNumber: true },
                  },
                  payments: { where: { status: "COMPLETED" }, select: { id: true }, take: 1 },
                },
              },
            },
          },
        },
      }),
      prisma.membershipPlan.findMany({
        where: { studyHallId, isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, durationDays: true, price: true },
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

  const { seatView, stats, activeRevenue, atRiskRevenue } = processSeatData(
    seats,
    shouldSortByRenewal
  );

  const occupied = stats.reserved + stats.renewal;
  const occupancyRate = seats.length
    ? Math.round((occupied / seats.length) * 100)
    : 0;

  const isOwner = role === "OWNER";

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
          <Badge variant="muted">
            {isOwner ? "مدیر سالن" : "مراقب سالن"}
          </Badge>
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
          seats={seats}
          membershipPlans={membershipPlans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            durationDays: plan.durationDays,
            price: Number(plan.price),
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
              monthlyRevenue={activeRevenue + atRiskRevenue}
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
