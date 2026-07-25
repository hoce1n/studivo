import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatJalaliNumericDateTime } from "@/lib/date";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Transaction {
  id: string;
  type: 'PAYMENT' | 'EXPENSE';
  amount: number;
  date: Date;
  title: string;
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>نوع</TableHead>
            <TableHead>عنوان / شخص</TableHead>
            <TableHead>تاریخ</TableHead>
            <TableHead className="text-left">مبلغ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {t.type === 'PAYMENT' ? (
                    <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30">
                      <ArrowUpRight className="size-4" />
                    </div>
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <ArrowDownRight className="size-4" />
                    </div>
                  )}
                  <span className="text-xs font-bold">
                    {t.type === 'PAYMENT' ? 'دریافتی' : 'هزینه'}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium">{t.title}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatJalaliNumericDateTime(t.date)}
              </TableCell>
              <TableCell className={`text-left font-bold ${t.type === 'PAYMENT' ? 'text-emerald-600' : 'text-destructive'}`}>
                {t.type === 'EXPENSE' ? '-' : '+'}
                {t.amount.toLocaleString("fa-IR")}
              </TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                تراکنشی یافت نشد.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
