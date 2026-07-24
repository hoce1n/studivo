"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LogPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function LogPagination({ currentPage, totalPages }: LogPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-sm text-muted-foreground">
        صفحه {currentPage} از {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-2"
        >
          <ChevronRight className="size-4" />
          قبلی
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-2"
        >
          بعدی
          <ChevronLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
