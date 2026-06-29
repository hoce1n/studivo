import { requirePlatformUser } from "@/app/actions/auth";
import { getLeads, getPlatformStats, getVenues } from "@/app/actions/platform";
import { StatsHeader } from "@/app/platform/_components/stats-header";
import { LeadsTable } from "@/app/platform/_components/leads-table";
import { VenuesTable } from "@/app/platform/_components/venues-table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const metadata = {
  title: "پلتفرم داخلی | Studivo",
};

export default async function PlatformPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requirePlatformUser();
  const isSuperAdmin = user.platformRole === "SUPER_ADMIN";

  const { tab } = await searchParams;
  const activeTab = tab === "venues" ? "venues" : "leads";

  const [stats, leads, venues] = await Promise.all([
    getPlatformStats(),
    getLeads(),
    getVenues(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-bold md:text-2xl">پلتفرم داخلی</h1>
          <p className="text-sm text-muted-foreground">
            مدیریت لیدها و سالن‌های مطالعه
          </p>
        </div>
      </div>

      <StatsHeader stats={stats} />

      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="leads">
            لیدها
            <span className="ms-1.5 tabular-nums text-xs text-muted-foreground">
              ({new Intl.NumberFormat("fa-IR").format(leads.length)})
            </span>
          </TabsTrigger>
          <TabsTrigger value="venues">
            سالن‌ها
            <span className="ms-1.5 tabular-nums text-xs text-muted-foreground">
              ({new Intl.NumberFormat("fa-IR").format(venues.length)})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <LeadsTable leads={leads} isSuperAdmin={isSuperAdmin} />
        </TabsContent>

        <TabsContent value="venues">
          <VenuesTable venues={venues} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
