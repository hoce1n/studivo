import { requireScopedUser } from "@/app/actions/auth/verify-role";
import { getAuditLogs, getAuditLogActors } from "@/app/actions/audit/queries";
import { LogTable } from "./_components/log-table";
import { LogFilters } from "./_components/log-filters";
import { LogPagination } from "./_components/log-pagination";
import { BookOpenText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { AuditAction, AuditEntity } from "@prisma/client";

interface LogsPageProps {
  searchParams: Promise<{
    page?: string;
    startDate?: string;
    endDate?: string;
    action?: string;
    entityType?: string;
    actorId?: string;
    search?: string;
  }>;
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const user = await requireScopedUser();
  if (user.role !== "OWNER") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [logsData, actors] = await Promise.all([
    getAuditLogs({
      page,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      action: params.action,
      entityType: params.entityType,
      actorId: params.actorId,
      search: params.search,
    }),
    getAuditLogActors(),
  ]);

  const auditActions: AuditAction[] = ["CREATE", "UPDATE", "DELETE", "VOID", "CHECK_IN", "CHECK_OUT"];
  const auditEntities: AuditEntity[] = [
    "STUDYHALL", "USER", "MEMBERSHIP_PLAN", "MEMBERSHIP", 
    "PAYMENT", "SEAT", "SEAT_ASSIGNMENT", "ATTENDANCE", 
    "STAFF_ASSIGNMENT", "SHIFT", "EXPENSE", "NOTIFICATION"
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpenText className="size-6 text-primary" />
            <h1 className="text-xl font-bold md:text-2xl">لاگ‌های سیستم</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            تاریخچه تمامی فعالیت‌ها و تغییرات انجام شده در سالن مطالعه
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="size-4" />
          خروجی CSV
        </Button>
      </div>

      <LogFilters 
        actors={actors} 
        actions={auditActions} 
        entities={auditEntities} 
      />

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          نمایش {logsData.logs.length} مورد از مجموع {logsData.totalCount} رویداد
        </div>
        
        <LogTable logs={logsData.logs as any} />
        
        <LogPagination 
          currentPage={logsData.currentPage} 
          totalPages={logsData.totalPages} 
        />
      </div>
    </div>
  );
}
