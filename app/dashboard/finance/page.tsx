import { AlertCircle, Banknote, CalendarDays, CircleDollarSign, UsersRound } from "lucide-react";

import { fetchOccupancyRevenueStats, fetchOverduePayments, fetchRevenueReport } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const irrFormatter = new Intl.NumberFormat("fa-IR", {
  style: "currency",
  currency: "IRR",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("fa-IR");
const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });

function formatMoney(value: number | null | undefined) {
  return irrFormatter.format(value ?? 0);
}

function formatDate(date: Date | null | undefined) {
  return date ? dateFormatter.format(date) : "—";
}

export default async function FinancePage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [statsResult, overdueResult, revenueResult] = await Promise.all([
    fetchOccupancyRevenueStats(),
    fetchOverduePayments(),
    fetchRevenueReport(monthStart, now),
  ]);

  const stats = statsResult.success ? statsResult.data : undefined;
  const overdue = overdueResult.success ? overdueResult.data : undefined;
  const revenue = revenueResult.success ? revenueResult.data : undefined;

  return (
    <main className="space-y-6" dir="rtl">
      <section className="space-y-2">
        <Badge variant="outline" className="w-fit gap-2">
          <CircleDollarSign className="size-4" />
          گزارش مالی فاز ۱
        </Badge>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">پرداخت‌ها و گزارش درآمد</h1>
          <p className="text-sm text-muted-foreground">
            نمایی ساده از اشغال صندلی‌ها، درآمد ماه جاری و پرداخت‌های معوقه سالن.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ اشغال</CardTitle>
            <UsersRound className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(stats?.occupancyRate ?? 0)}٪</div>
            <p className="text-xs text-muted-foreground">
              {numberFormatter.format(stats?.activeSubscriptions ?? 0)} از {numberFormatter.format(stats?.totalSeats ?? 0)} صندلی فعال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد وصول‌شده فعال</CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats?.currentMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">بر اساس اشتراک‌های فعال پرداخت‌شده</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ظرفیت درآمد ماهانه</CardTitle>
            <CircleDollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats?.potentialMonthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">اگر همه صندلی‌ها با شهریه فعلی پر باشند</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مبلغ معوقه</CardTitle>
            <AlertCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(overdue?.totalOverdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {numberFormatter.format(overdue?.overdueSubscriptions.length ?? 0)} اشتراک نیازمند پیگیری
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>پرداخت‌های معوقه</CardTitle>
            <CardDescription>اشتراک‌های فعال منقضی‌شده که هنوز پرداخت نشده‌اند.</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueResult.success ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عضو</TableHead>
                    <TableHead>صندلی</TableHead>
                    <TableHead>پایان اشتراک</TableHead>
                    <TableHead>مبلغ</TableHead>
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
                        <TableCell>{numberFormatter.format(item.seat.seatNumber)}</TableCell>
                        <TableCell>{formatDate(item.endDate)}</TableCell>
                        <TableCell>{formatMoney(item.monthlyFeeAtSubscription)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
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

        <Card>
          <CardHeader>
            <CardTitle>گزارش درآمد</CardTitle>
            <CardDescription>درآمد ثبت‌شده از ابتدای ماه جاری تا امروز.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <CalendarDays className="size-4" />
                انتخاب بازه تاریخ
              </div>
              <p className="mt-2">جایگاه DateRangePicker؛ در فاز بعدی به انتخابگر تاریخ متصل می‌شود.</p>
            </div>
            <Separator />
            {revenueResult.success ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">جمع درآمد بازه</p>
                  <p className="text-2xl font-bold">{formatMoney(revenue?.totalRevenue)}</p>
                </div>
                <div className="space-y-2">
                  {(revenue?.transactions ?? []).slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm">
                      <div>
                        <p className="font-medium">{item.user.name}</p>
                        <p className="text-xs text-muted-foreground">صندلی {numberFormatter.format(item.seat.seatNumber)} · {formatDate(item.paymentDate)}</p>
                      </div>
                      <span className="font-medium">{formatMoney(item.monthlyFeeAtSubscription)}</span>
                    </div>
                  ))}
                  {!revenue?.transactions.length ? <p className="text-sm text-muted-foreground">در این بازه پرداختی ثبت نشده است.</p> : null}
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
