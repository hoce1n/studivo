import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { getStaffList, getShifts, calculateTotalHours } from "@/app/actions/staff/queries";
import { StaffTabs } from "./_components/staff-tabs";
import { Badge } from "@/components/ui/badge";

export default async function StaffPage() {
  const user = await requireScopedUser();
  const isOwner = user.role === "OWNER";

  const [staff, shifts] = await Promise.all([
    getStaffList(),
    getShifts(),
  ]);

  // Calculate hours for current month for each staff member
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const staffWithHours = await Promise.all(
    staff.map(async (member) => {
      const hours = await calculateTotalHours(member.id, startOfMonth, endOfMonth);
      return {
        ...member,
        totalHoursThisMonth: hours,
      };
    })
  );

  const currentStaffId = staff.find(s => s.user.id === user.id)?.id;

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
          <Badge variant="muted">{isOwner ? "مدیر سالن" : "مراقب سالن"}</Badge>
        </div>
      </div>

      <StaffTabs 
        staff={staffWithHours} 
        shifts={shifts} 
        isOwner={isOwner} 
        currentStaffId={currentStaffId}
      />
    </div>
  );
}
