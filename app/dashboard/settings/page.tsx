import { redirect } from "next/navigation";
import { Building2, Settings2 } from "lucide-react";

import { SettingsTabs } from "@/app/dashboard/settings/_components/settings-tabs";
import { prisma } from "@/lib/db";

type HallSeatReader = {
  findMany(args: {
    where: { studyHallId: string; sectionId: null };
    orderBy: { number: "asc" };
    select: { id: true; number: true; isActive: true; sectionId: true };
  }): Promise<{ id: string; number: string; isActive: boolean; sectionId: string | null }[]>;
};
import { getSession } from "@/lib/server";

export default async function HallSettingsPage() {
  const session = await getSession();

  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      staffAssignments: {
        where: { isActive: true },
        select: { role: true, studyHallId: true },
        take: 1,
      },
    },
  });

  const assignment = user?.staffAssignments[0];
  if (!user || !assignment) redirect("/onboarding");
  if (assignment.role !== "OWNER") redirect("/dashboard");

  const [studyHall, sections, unassignedSeats, plans, staff] = await Promise.all([
    prisma.studyHall.findUnique({
      where: { id: assignment.studyHallId },
      select: {
        name: true,
        gender: true,
        phoneNumber: true,
        address: true,
        description: true,
        publicPageEnabled: true,
        slug: true,
        heroImage: true,
        galleryImages: true,
      },
    }),
    prisma.section.findMany({
      where: { studyHallId: assignment.studyHallId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        _count: { select: { seats: true } },
        seats: { orderBy: { number: "asc" }, select: { id: true, number: true, isActive: true, sectionId: true } },
      },
    }),
    (prisma.seat as unknown as HallSeatReader).findMany({
      where: { studyHallId: assignment.studyHallId, sectionId: null },
      orderBy: { number: "asc" },
      select: { id: true, number: true, isActive: true, sectionId: true },
    }),
    prisma.membershipPlan.findMany({
      where: { studyHallId: assignment.studyHallId },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: { id: true, name: true, durationDays: true, price: true, hasFixedSeat: true, description: true, isActive: true },
    }),
    prisma.staffAssignment.findMany({
      where: { studyHallId: assignment.studyHallId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        role: true,
        startDate: true,
        endDate: true,
        isActive: true,
        user: { select: { name: true, email: true, phoneNumber: true } },
      },
    }),
  ]);

  if (!studyHall) redirect("/onboarding");

  const normalizedPlans = plans.map((plan: (typeof plans)[number]) => ({ ...plan, price: Number(plan.price) }));
  const normalizedStaff = staff.map((item: (typeof staff)[number]) => ({
    ...item,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate?.toISOString() ?? null,
  }));

  return (
    <section className="flex flex-1 flex-col gap-6" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm md:p-8">
        <div className="absolute -left-20 -top-20 size-48 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-bold text-muted-foreground">
              <Settings2 className="size-4 text-primary" />
              مرکز مدیریت سالن
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-4xl">
                <Building2 className="size-7 text-primary" />
                تنظیمات سالن
              </h1>
              <p className="mt-3 max-w-2xl leading-8 text-muted-foreground">
                مشخصات عمومی، بخش‌ها، صندلی‌های فعال و خارج از سرویس، پلن‌های عضویت و همکاران سالن را از یک فضای تب‌بندی‌شده مدیریت کنید.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-background px-4 py-3 text-sm font-bold text-muted-foreground">
            {studyHall.name}
          </div>
        </div>
      </section>

      <SettingsTabs hall={studyHall} sections={sections} unassignedSeats={unassignedSeats} plans={normalizedPlans} staff={normalizedStaff} />
    </section>
  );
}
