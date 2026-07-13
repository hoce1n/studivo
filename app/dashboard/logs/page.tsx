import { BookOpenText, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { AuditEntity } from "@/lib/generated/prisma/client";
import { requireOwnerUser } from "@/app/actions/auth";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

// Schema v2 AuditAction enum
const actionLabels: Record<string, string> = {
  CREATE: "ایجاد",
  UPDATE: "ویرایش",
  DELETE: "حذف",
  VOID: "ابطال",
  CHECK_IN: "ورود",
  CHECK_OUT: "خروج",
};

// Schema v2 AuditEntity enum
const entityLabels: Record<string, string> = {
  STUDYHALL: "سالن",
  USER: "کاربر",
  MEMBERSHIP_PLAN: "طرح اشتراک",
  MEMBERSHIP: "اشتراک",
  PAYMENT: "پرداخت",
  SEAT: "صندلی",
  SEAT_ASSIGNMENT: "تخصیص صندلی",
  ATTENDANCE: "حضور",
  STAFF_ASSIGNMENT: "همکار",
  SHIFT: "شیفت",
  EXPENSE: "هزینه",
  NOTIFICATION: "اعلان",
};

const ALL_ENTITIES = Object.keys(entityLabels);

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const entity = ALL_ENTITIES.includes(params.entity ?? "") ? params.entity : undefined;
  const take = 25;

  const user = await requireOwnerUser();

  const where = {
    studyHallId: user.studyHallId,
    ...(entity ? { entityType: entity as AuditEntity } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
      include: {
        actor: {
          select: { name: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const hasMore = page * take < total;

  function buildUrl(nextPage: number, nextEntity?: string) {
    const p = new URLSearchParams();
    if (nextPage > 1) p.set("page", String(nextPage));
    if (nextEntity) p.set("entity", nextEntity);
    const qs = p.toString();
    return `/dashboard/logs${qs ? `?${qs}` : ""}`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpenText className="size-5" />
          گزارش عملکرد روزانه
        </CardTitle>
        <CardDescription>
          ثبت غیرقابل‌حذف عملیات مهم برای اعتماد مدیریتی. مجموع {total.toLocaleString("fa-IR")} رویداد.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Entity filter */}
        <form method="GET" action="/dashboard/logs" className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Filter className="size-3.5" />
            فیلتر موجودیت:
          </span>
          <a
            href={buildUrl(1, undefined)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${!entity ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted/60"}`}
          >
            همه
          </a>
          {ALL_ENTITIES.map((e) => (
            <a
              key={e}
              href={buildUrl(1, e)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${entity === e ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 hover:bg-muted/60"}`}
            >
              {entityLabels[e]}
            </a>
          ))}
        </form>

        {logs.length ? (
          <>
            <div className="space-y-3">
              {logs.map((log) => {
                const metadata =
                  typeof log.metadata === "object" &&
                  log.metadata !== null &&
                  "message" in log.metadata
                    ? String((log.metadata as { message: unknown }).message)
                    : null;
                const actorName = log.actor?.name ?? "سیستم";

                return (
                  <div key={log.id} className="rounded-2xl border p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {actionLabels[log.action] ?? log.action}
                        </Badge>
                        {log.entityType && (
                          <Badge variant="secondary">
                            {entityLabels[log.entityType] ?? log.entityType}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    {metadata && (
                      <p className="mt-2 font-medium">{metadata}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      ثبت‌کننده: {actorName}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-2 pt-2 text-sm">
              {page > 1 ? (
                <a
                  href={buildUrl(page - 1, entity)}
                  className="rounded-xl border bg-muted/30 px-4 py-2 text-xs hover:bg-muted/60 transition-colors"
                >
                  صفحه قبل
                </a>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                صفحه {page.toLocaleString("fa-IR")}
              </span>
              {hasMore ? (
                <a
                  href={buildUrl(page + 1, entity)}
                  className="rounded-xl border bg-muted/30 px-4 py-2 text-xs hover:bg-muted/60 transition-colors"
                >
                  صفحه بعد
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">پایان لیست</span>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            هنوز رویدادی ثبت نشده است.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
