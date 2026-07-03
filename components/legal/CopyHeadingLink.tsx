"use client";

import { useCallback, useState } from "react";
import { CheckIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type CopyHeadingLinkProps = {
  id: string;
  className?: string;
};

function CopyHeadingLink({ id, className }: CopyHeadingLinkProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = useCallback(async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.hash = id;
    }
  }, [id]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={copied ? "لینک کپی شد" : "کپی لینک این بخش"}
          className={cn(
            "ms-2 inline-flex shrink-0 opacity-0 transition-opacity group-hover/heading:opacity-100 focus-visible:opacity-100",
            className
          )}
          onClick={copyLink}
        >
          {copied ? (
            <CheckIcon className="text-primary" />
          ) : (
            <LinkIcon />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {copied ? "لینک کپی شد" : "کپی لینک"}
      </TooltipContent>
    </Tooltip>
  );
}

export { CopyHeadingLink };
