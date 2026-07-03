"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { LegalDocumentMeta } from "@/lib/legal/types";
import { cn } from "@/lib/utils";

type LegalHeaderProps = {
  document: LegalDocumentMeta;
  className?: string;
};

function formatMetaDate(value: string) {
  return value;
}

function LegalHeader({ document, className }: LegalHeaderProps) {
  const [copied, setCopied] = useState(false);

  const copyPageUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return (
    <header className={cn("space-y-6", className)}>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">خانه</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/term-of-service">اسناد حقوقی</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{document.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">نسخه {document.version}</Badge>
            <Badge variant="outline">
              {document.readingTimeMinutes} دقیقه مطالعه
            </Badge>
          </div>
          <h1
            id="legal-page-title"
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            {document.title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-muted-foreground">
            {document.description}
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={copied ? "آدرس صفحه کپی شد" : "کپی آدرس صفحه"}
              onClick={copyPageUrl}
              className="shrink-0 print:hidden"
            >
              {copied ? (
                <CheckIcon className="text-primary" />
              ) : (
                <CopyIcon />
              )}
              {copied ? "کپی شد" : "کپی لینک صفحه"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>کپی URL این سند</TooltipContent>
        </Tooltip>
      </div>

      <dl className="grid gap-4 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">
            تاریخ اجرا
          </dt>
          <dd className="text-sm font-medium">
            {formatMetaDate(document.effectiveDate)}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs font-medium text-muted-foreground">
            آخرین بروزرسانی
          </dt>
          <dd className="text-sm font-medium">
            {formatMetaDate(document.lastUpdated)}
          </dd>
        </div>
        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
          <dt className="text-xs font-medium text-muted-foreground">
            شناسه سند
          </dt>
          <dd className="font-mono text-sm">{document.slug}</dd>
        </div>
      </dl>

      <Separator />
    </header>
  );
}

export { LegalHeader };
