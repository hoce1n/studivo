import { requirePlatformUser } from "@/app/actions/auth";
import { getLeads, getPlatformStats } from "@/app/actions/platform";
import { StatsHeader } from "@/app/platform/_components/stats-header";
import { LeadsTable } from "@/app/platform/_components/leads-table";

export const metadata = {
  title: "صندوق لیدها | پلتفرم Studivo",
};

export default async function PlatformPage() {
  const user = await requirePlatformUser();
  const isSuperAdmin = user.platformRole === "SUPER_ADMIN";

  const [stats, leads] = await Promise.all([
    getPlatformStats(),
    getLeads(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold md:text-2xl">صندوق لیدها</h1>
          <p className="text-sm text-muted-foreground">
            لیست تمام لیدهای ورودی از کانال‌های بازاریابی
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatsHeader stats={stats} />

      {/* Leads table with client-side filters */}
      <LeadsTable leads={leads} isSuperAdmin={isSuperAdmin} />
    </div>
  );
}
