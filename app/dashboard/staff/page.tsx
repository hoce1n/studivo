import { requireScopedUser } from "@/app/actions/auth/verify-role";
import {
  getStaffList,
  getShifts,
  calculateStaffHoursMap,
} from "@/app/actions/staff/queries";
import { StaffTabs } from "./_components/staff-tabs";
import { Badge } from "@/components/ui/badge";
import { formatJalaliMonthName, getJalaliMonthRange } from "@/lib/date";

export default async function StaffPage() {
  const user = await requireScopedUser();
  const isOwner = user.role === "OWNER";

  const [staff, shifts] = await Promise.all([getStaffList(), getShifts()]);

  // Use Jalali month (e.g. مرداد), not Gregorian August
  const { start, endExclusive } = getJalaliMonthRange();
  const currentMonthLabel = formatJalaliMonthName();

  const hoursByAssignment = await calculateStaffHoursMap(
    staff.map((member) => member.id),
    start,
    endExclusive,
  );

  const staffWithHours = staff.map((member) => ({
    ...member,
    totalHoursThisMonth: hoursByAssignment[member.id] ?? 0,
  }));

  const currentStaffId = staff.find((s) => s.user.id === user.id)?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold md:text-2xl">مدیریت کارکنان</h1>
          <p className="text-sm text-muted-foreground">
            لیست همکاران، نقش‌ها و گزارش شیفت‌های کاری
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted">
            {isOwner ? "مدیر سالن" : "مراقب سالن"}
          </Badge>
        </div>
      </div>

      <StaffTabs
        staff={staffWithHours}
        shifts={shifts}
        isOwner={isOwner}
        currentStaffId={currentStaffId}
        currentMonthLabel={currentMonthLabel}
      />
    </div>
  );
}
