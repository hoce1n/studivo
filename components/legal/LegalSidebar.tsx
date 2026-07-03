import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type LegalSidebarProps = {
  children: React.ReactNode;
  className?: string;
  label?: string;
};

function LegalSidebar({
  children,
  className,
  label = "ناوبری جانبی",
}: LegalSidebarProps) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "sticky top-24 hidden h-[calc(100dvh-7rem)] shrink-0 self-start lg:block lg:w-56 xl:w-60 print:hidden",
        className
      )}
    >
      <ScrollArea className="h-full pe-3">
        <div className="pb-8">{children}</div>
      </ScrollArea>
    </aside>
  );
}

export { LegalSidebar };
