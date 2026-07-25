"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatJalaliNumericDateTimeWithSeconds } from "@/lib/date";
import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditActionLabels, auditEntityLabels, actionVariants } from "../_lib/log-utils";
import { AuditAction, AuditEntity } from "@/lib/generated/prisma/client";

interface LogEntry {
  id: string;
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string;
  metadata: any;
  createdAt: Date;
  actor: {
    name: string;
    email: string;
  } | null;
}

interface LogTableProps {
  logs: LogEntry[];
}

export function LogTable({ logs }: LogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">زمان</TableHead>
            <TableHead>ثبت‌کننده</TableHead>
            <TableHead>عملیات</TableHead>
            <TableHead>موجودیت</TableHead>
            <TableHead>شناسه</TableHead>
            <TableHead className="text-left">جزئیات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <Fragment key={log.id}>
              <TableRow className={expandedId === log.id ? "border-b-0 bg-muted/30" : ""}>
                <TableCell className="text-xs font-mono">
                  {formatJalaliNumericDateTimeWithSeconds(log.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{log.actor?.name ?? "سیستم"}</div>
                  <div className="text-xs text-muted-foreground">{log.actor?.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={actionVariants[log.action] || "outline"}>
                    {auditActionLabels[log.action] || log.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {auditEntityLabels[log.entityType] || log.entityType}
                  </span>
                </TableCell>
                <TableCell className="max-w-[120px] truncate text-xs font-mono">
                  {log.entityId}
                </TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <Eye className="size-4" />
                    مشاهده
                    {expandedId === log.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                  </Button>
                </TableCell>
              </TableRow>
              {expandedId === log.id && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={6} className="p-4 pt-0">
                    <div className="rounded-xl bg-background border p-4">
                      <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">Metadata (JSON)</h4>
                      <pre className="text-xs font-mono overflow-auto max-h-[200px] p-2 bg-muted/50 rounded-lg">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                هیچ رویدادی یافت نشد.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

import * as React from "react";
