import { Banknote, CalendarDays, CircleDollarSign, TrendingUp, UsersRound } from "lucide-react";
import { fetchOccupancyRevenueStats, fetchOverduePayments, fetchRevenueReport } from "@/app/actions/finance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });

type FinanceSearchParams = Promise<{ startDate?: string | string[]; endDate?: string | string[] }>;

function formatNumber(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("fa-IR");
}

function formatMoney(value: number | null | undefined) {
  return `${formatNumber(value)} ریال`;
}

function formatDate(date: Date | null | undefined) {
  return date ? dateFormatter.format(new Date(date)) : "ثبت نشده";
}

function isoDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDateParam(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function errorText(...messages: Array<string | undefined>) {
  return messages.filter(Boolean).join(" ");
}

export default async function FinancePage({ searchParams }: { searchParams: FinanceSearchParams }) {
  const resolvedSearchParams = await searchParams;
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = parseDateParam(resolvedSearchParams.startDate) ?? defaultStartDate;
  const endDate = parseDateParam(resolvedSearchParams.endDate) ?? now;

  const [statsResult, overdueResult, revenueResult] = await Promise.all([
    fetchOccupancyRevenueStats(),
    fetchOverduePayments(),
    fetchRevenueReport(startDate, endDate),
  ]);

  const stats = statsResult.success ? statsResult.data : undefined;
  const overdue = overdueResult.success ? overdueResult.data : undefined;
  const revenue = revenueResult.success ? revenueResult.data : undefined;
  const pageError = errorText(statsResult.error, overdueResult.error, revenueResult.error);

  const statCards = [
    {
      title: "کل درآمد",
      value: formatMoney(stats?.totalRevenue),
      hint: "تمام پرداخت‌های ثبت‌شده برای این سالن",
      icon: CircleDollarSign,
    },
    {
      title: "درآمد ماه جاری",
      value: formatMoney(stats?.monthlyRevenue),
      hint: "پرداخت‌های ثبت‌شده از ابتدای ماه",
      icon: TrendingUp,
    },
    {
      title: "درآمد فعال",
      value: formatMoney(stats?.activeRevenue),
      hint: `${formatNumber(stats?.paidActiveSubscriptions)} اشتراک فعال پرداخت‌شده`,
      icon: Banknote,
    },
    {
      title: "نرخ اشغال",
      value: `${formatNumber(stats?.occupancyRate)}٪`,
      hint: `${formatNumber(stats?.activeSubscriptions)} از ${formatNumber(stats?.totalSeats)} صندلی فعال`,
      icon: UsersRound,
    },
  ];

  return (
    <main className="space-y-6" dir="rtl">
      <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-muted/60 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit gap-2 bg-background/80">
              <CircleDollarSign className="size-4" />
              گزارش مالی فاز ۱
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">پرداخت‌ها و گزارش درآمد</h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                نمای مالی سبک و امن برای پیگیری درآمد، پرداخت‌های معوقه و ظرفیت اشغال سالن مطالعه.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            بازه گزارش: <span className="font-medium text-foreground">{formatDate(startDate)}</span> تا{" "}
            <span className="font-medium text-foreground">{formatDate(endDate)}</span>
          </div>
        </div>
        {pageError ? (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {pageError}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="shadow-sm" id="overdue">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>پرداخت‌های معوقه</CardTitle>
                <CardDescription className="mt-1">اشتراک‌های فعال منقضی‌شده که هنوز پرداخت نشده‌اند.</CardDescription>
              </div>
              <Badge variant="destructive" className="shrink-0">
                {formatMoney(overdue?.totalOverdueAmount)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {overdueResult.success ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عضو</TableHead>
                    <TableHead className="text-right">صندلی</TableHead>
                    <TableHead className="text-right">شروع</TableHead>
                    <TableHead className="text-right">پایان</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdue?.overdueSubscriptions.length ? (
                    overdue.overdueSubscriptions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.user.name}</div>
                          <div className="text-xs text-muted-foreground">{item.user.phoneNumber ?? "بدون شماره"}</div>
                        </TableCell>
                        <TableCell>{formatNumber(item.seat.seatNumber)}</TableCell>
                        <TableCell>{formatDate(item.startDate)}</TableCell>
                        <TableCell>{formatDate(item.endDate)}</TableCell>
                        <TableCell className="font-medium">{formatMoney(item.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        پرداخت معوقه‌ای برای پیگیری وجود ندارد.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-destructive">{overdueResult.error}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>گزارش درآمد</CardTitle>
            <CardDescription>پرداخت‌های ثبت‌شده در بازه انتخابی.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-[1fr_1fr_auto]" action="/dashboard/finance">
              <div className="space-y-2">
                <Label htmlFor="startDate">از تاریخ</Label>
                <Input id="startDate" name="startDate" type="date" defaultValue={isoDateInputValue(startDate)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">تا تاریخ</Label>
                <Input id="endDate" name="endDate" type="date" defaultValue={isoDateInputValue(endDate)} />
              </div>
              <Button type="submit" className="self-end gap-2">
                <CalendarDays className="size-4" />
                اعمال
              </Button>
            </form>

            <Separator />

            {revenueResult.success ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">جمع درآمد بازه</p>
                  <p className="mt-1 text-3xl font-bold text-primary">{formatMoney(revenue?.totalRevenue)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(revenue?.transactions.length)} پرداخت در این بازه پیدا شد.
                  </p>
                </div>

                <div className="space-y-2">
                  {(revenue?.transactions ?? []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border bg-background p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          صندلی {formatNumber(item.seat.seatNumber)} · {formatDate(item.paymentDate ?? item.fallbackDate)}
                        </p>
                      </div>
                      <span className="font-semibold">{formatMoney(item.amount)}</span>
                    </div>
                  ))}
                  {!revenue?.transactions.length ? (
                    <p className="rounded-2xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                      در این بازه پرداختی ثبت نشده است.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive">{revenueResult.error}</p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
