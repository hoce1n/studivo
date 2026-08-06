import Link from "next/link";
import { Archive, Armchair, CalendarClock, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { formatTehranDate } from "@/lib/date";

function formatDate(date: Date) {
  return formatTehranDate(date);
}

function statusLabel(status: string) {
  if (status === "ACTIVE") return "فعال";
  if (status === "EXPIRED") return "منقضی";
  if (status === "CANCELLED") return "لغوشده";
  return "در انتظار";
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; memberId?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status === "inactive" ? "inactive" : "active";
  const user = await requireScopedUser();
  const { studyHallId } = user;

  const membershipWhere = {
    studyHallId,
    ...(filter === "active"
      ? { status: "ACTIVE" as const }
      : { status: { not: "ACTIVE" as const } }),
  };

  const [memberships, selectedMember] = await Promise.all([
    prisma.membership.findMany({
      where: membershipWhere,
      orderBy: { updatedAt: "desc" },
      distinct: ["userId"],
      include: {
        user: {
          select: { id: true, name: true, phoneNumber: true },
        },
        seatAssignments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            seat: { select: { number: true } },
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          take: 1,
        },
      },
    }),
    params.memberId
      ? prisma.user.findFirst({
          where: {
            id: params.memberId,
            memberships: { some: { studyHallId } },
          },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            memberships: {
              where: { studyHallId },
              orderBy: { createdAt: "desc" },
              include: {
                seatAssignments: {
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  include: {
                    seat: { select: { number: true } },
                  },
                },
                payments: {
                  where: { status: "COMPLETED" },
                  take: 1,
                },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <section className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="size-5" />
            پروفایل ماندگار اعضا
          </CardTitle>
          <CardDescription>
            عضوهای منقضی یا تخلیه‌شده حذف نمی‌شوند.
          </CardDescription>
          <div className="flex gap-2 pt-2">
            <Button
              asChild
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/members?status=active">فعال</Link>
            </Button>
            <Button
              asChild
              variant={filter === "inactive" ? "default" : "outline"}
              size="sm"
            >
              <Link href="/dashboard/members?status=inactive">آرشیوی</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {memberships.map((membership) => {
            const seat = membership.seatAssignments[0]?.seat.number ?? "—";
            const paid = membership.payments.length > 0;

            return (
              <Link
                key={membership.id}
                href={`/dashboard/members?status=${filter}&memberId=${membership.user.id}`}
                className="block rounded-2xl border p-3 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{membership.user.name}</div>
                    {!paid && membership.status === "ACTIVE" ? (
                      <span
                        className="size-1.5 animate-pulse rounded-full bg-amber-500"
                        title="تسویه نشده"
                      />
                    ) : null}
                  </div>
                  <Badge
                    variant={
                      membership.status === "ACTIVE" ? "success" : "muted"
                    }
                  >
                    {membership.status === "ACTIVE" ? "فعال" : "آرشیوی"}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="size-3.5" />
                  {membership.user.phoneNumber ?? "بدون تلفن"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  آخرین صندلی: {seat} · تا {formatDate(membership.endsAt)}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5" />
            جزئیات پروفایل و سوابق پرداخت
          </CardTitle>
          <CardDescription>
            تمام عضویت‌ها و وضعیت پرداخت عضو در همین سالن نمایش داده می‌شود.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedMember ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/50 p-4">
                <div className="font-semibold">{selectedMember.name}</div>
                <div className="text-sm text-muted-foreground" dir="ltr">
                  {selectedMember.phoneNumber}
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href={`/dashboard?memberId=${selectedMember.id}`}>
                  <Armchair className="size-4" />
                  رزرو مجدد بدون ورود دوباره اطلاعات
                </Link>
              </Button>

              <div className="space-y-3">
                {selectedMember.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="rounded-2xl border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        صندلی{" "}
                        {membership.seatAssignments[0]?.seat.number ?? "—"}
                      </span>
                      <Badge
                        variant={
                          membership.status === "ACTIVE" ? "success" : "muted"
                        }
                      >
                        {statusLabel(membership.status)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <CalendarClock className="size-4" />
                      {formatDate(membership.startsAt)} تا{" "}
                      {formatDate(membership.endsAt)}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      وضعیت پرداخت:{" "}
                      {membership.payments.length
                        ? "پرداخت‌شده"
                        : "پرداخت‌نشده"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              برای مشاهده سابقه کامل، روی نام یک عضو کلیک کنید.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
