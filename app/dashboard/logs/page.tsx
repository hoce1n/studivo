import { BookOpenText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireOwnerUser } from "@/app/actions/auth";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const actionLabels: Record<string, string> = {
  RESERVE_SEAT: "رزرو صندلی",
  SWAP_SEAT: "انتقال صندلی",
  RENEW_SUBSCRIPTION: "تمدید اشتراک",
  RELEASE_SEAT: "تخلیه صندلی"
};

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const take = 25;

  // Use requireOwnerUser which handles authentication, tenant scoping, and owner role check.
  const user = await requireOwnerUser();

  const logs = await prisma.auditLog.findMany({
    where: { studyhallId: user.studyHallId },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
    include: {
      user: {
        select: {
          name: true,
          // Note: In Schema v2, user.role is legacy.
          // For display purposes in audit logs, we might need to resolve their role in the studyhall
          // or just show the legacy role if it's still populated.
          // Since we are not changing the DB yet, we keep it but acknowledge it's legacy.
          role: true
        }
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenText className="size-5" />
          گزارش عملکرد روزانه
        </CardTitle>
        <CardDescription>
          ثبت غیرقابل‌حذف عملیات مهم پذیرش، تمدید، انتقال و تخلیه صندلی‌ها برای اعتماد مدیریتی.
        </CardDescription>
      </CardHeader>
      <CardContent
        className="space-y-3"
      >
        {logs.length ? logs.map((log) => {
          const details = typeof log.details === "object" && log.details !== null && "message" in log.details ? String(log.details.message) : actionLabels[log.action] ?? log.action;
          return <div key={log.id} className="rounded-2xl border p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline">
                {actionLabels[log.action] ?? log.action}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(log.createdAt)}
              </span>
            </div>
            <p className="mt-2 font-medium">{details}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ثبت‌کننده: {log.user.name} · {log.user.role === "admin" ? "مدیر" : "مراقب"}
            </p>
          </div>;
        }) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">هنوز رویدادی ثبت نشده است.</div>}
      </CardContent>
    </Card>
  )
}
