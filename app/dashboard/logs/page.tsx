import { redirect } from "next/navigation";
import { BookOpenText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { requireScopedUser } from "@/app/actions/auth/verify-role";

function formatDateTime(date: Date) { return new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(date); }
const actionLabels: Record<string, string> = { CREATE: "ایجاد", UPDATE: "به‌روزرسانی", DELETE: "حذف", VOID: "ابطال", CHECK_IN: "ورود", CHECK_OUT: "خروج" };
function metadataMessage(metadata: unknown) { return typeof metadata === "object" && metadata !== null && "actionType" in metadata ? String((metadata as { actionType?: unknown }).actionType) : "رویداد عملیاتی ثبت شد."; }
export default async function LogsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const user = await requireScopedUser();
  if (user.role !== "OWNER") redirect("/dashboard");
  const logs = await prisma.auditLog.findMany({ where: { studyHallId: user.studyHallId }, orderBy: { createdAt: "desc" }, skip: (page - 1) * 25, take: 25, include: { actor: { select: { name: true } } } });
  return <Card><CardHeader><CardTitle className="flex items-center gap-2"><BookOpenText className="size-5" />گزارش عملکرد روزانه</CardTitle><CardDescription>ثبت غیرقابل‌حذف عملیات مهم پذیرش، تمدید، انتقال و تخلیه صندلی‌ها.</CardDescription></CardHeader><CardContent className="space-y-3">{logs.length ? logs.map((log) => <div key={log.id} className="rounded-2xl border p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">{actionLabels[log.action] ?? log.action}</Badge><span className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</span></div><p className="mt-2 font-medium">{metadataMessage(log.metadata)}</p><p className="mt-1 text-xs text-muted-foreground">ثبت‌کننده: {log.actor?.name ?? "سیستم"}</p></div>) : <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">هنوز رویدادی ثبت نشده است.</div>}</CardContent></Card>;
}
