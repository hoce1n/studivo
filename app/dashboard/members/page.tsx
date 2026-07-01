import Link from "next/link";
import { redirect } from "next/navigation";
import { Archive, Armchair, CalendarClock, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(date);
}

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ status?: string; memberId?: string }> }) {
  const params = await searchParams;
  const filter = params.status === "inactive" ? "inactive" : "active";
  
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, role: true, studyhallId: true, studyhall: { select: { name: true } } } });
  if (!user) redirect("/login");
  if (!user.studyhallId || !user.studyhall) redirect("/onboarding");

  const [members, selectedMember] = await Promise.all([
    prisma.user.findMany({
      where: {
        studyhallId: user.studyhallId,
        role: "member",
        subscriptions: filter === "active" ? { some: { status: "active" } } : { none: { status: "active" } },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, phoneNumber: true, subscriptions: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, endDate: true, paymentStatus: true, seat: { select: { seatNumber: true } } } } },
    }),
    params.memberId
      ? prisma.user.findFirst({
          where: { id: params.memberId, studyhallId: user.studyhallId, role: "member" },
          select: { id: true, name: true, phoneNumber: true, subscriptions: { orderBy: { createdAt: "desc" }, include: { seat: { select: { seatNumber: true } } } } },
        })
      : Promise.resolve(null),
  ]);

  return (
    <section className="grid gap-6 p-4 md:grid-cols-[0.9fr_1.1fr] md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Archive className="size-5" />پروفایل ماندگار اعضا</CardTitle>
          <CardDescription>عضوهای منقضی یا تخلیه‌شده حذف نمی‌شوند و برای بررسی مالی یا رزرو مجدد در دسترس می‌مانند.</CardDescription>
          <div className="flex gap-2 pt-2">
            <Button asChild variant={filter === "active" ? "default" : "outline"} size="sm"><Link href="/dashboard/members?status=active">فعال</Link></Button>
            <Button asChild variant={filter === "inactive" ? "default" : "outline"} size="sm"><Link href="/dashboard/members?status=inactive">آرشیوی</Link></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((member) => {
            const latest = member.subscriptions[0];
            return <Link key={member.id} href={`/dashboard/members?status=${filter}&memberId=${member.id}`} className="block rounded-2xl border p-3 transition-colors hover:bg-muted/60">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{member.name}</div>
                  {latest?.paymentStatus === "unpaid" && latest?.status === "active" && (
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" title="تسویه نشده" />
                  )}
                </div>
                <Badge variant={latest?.status === "active" ? "success" : "muted"}>{latest?.status === "active" ? "فعال" : "آرشیوی"}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><Phone className="size-3.5" />{member.phoneNumber ?? "بدون تلفن"}</div>
              {latest ? <div className="mt-1 text-xs text-muted-foreground">آخرین صندلی: {latest.seat.seatNumber} · تا {formatDate(latest.endDate)}</div> : null}
            </Link>;
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound className="size-5" />جزئیات پروفایل و سوابق پرداخت</CardTitle>
          <CardDescription>تمام اشتراک‌ها و وضعیت پرداخت عضو در همین سالن نمایش داده می‌شود.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedMember ? <div className="space-y-4">
            <div className="rounded-2xl bg-muted/50 p-4"><div className="font-semibold">{selectedMember.name}</div><div className="text-sm text-muted-foreground" dir="ltr">{selectedMember.phoneNumber}</div></div>
            <Button asChild className="w-full"><Link href={`/dashboard?memberId=${selectedMember.id}`}><Armchair className="size-4" />رزرو مجدد بدون ورود دوباره اطلاعات</Link></Button>
            <div className="space-y-3">
              {selectedMember.subscriptions.map((subscription) => <div key={subscription.id} className="rounded-2xl border p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="font-medium">صندلی {subscription.seat.seatNumber}</span><Badge variant={subscription.status === "active" ? "success" : "muted"}>{subscription.status === "active" ? "فعال" : subscription.status === "expired" ? "منقضی" : "لغوشده"}</Badge></div>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground"><CalendarClock className="size-4" />{formatDate(subscription.startDate)} تا {formatDate(subscription.endDate)}</div>
                <div className="mt-1 text-muted-foreground">وضعیت پرداخت: {subscription.paymentStatus === "paid" ? "پرداخت‌شده" : "پرداخت‌نشده"}</div>
              </div>)}
            </div>
          </div> : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">برای مشاهده سابقه کامل، روی نام یک عضو کلیک کنید.</div>}
        </CardContent>
      </Card>
    </section>
  );
}
