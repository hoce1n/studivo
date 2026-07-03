import { Children, type ComponentPropsWithoutRef, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type LegalContentProps = {
  content: string;
  className?: string;
};

function getTextContent(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string") return child;
      if (typeof child === "number") return String(child);
      if (child && typeof child === "object" && "props" in child) {
        return getTextContent(
          (child as { props?: { children?: ReactNode } }).props?.children,
        );
      }
      return "";
    })
    .join(" ");
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "section"
  );
}

function Heading({
  level,
  children,
  ...props
}: ComponentPropsWithoutRef<"h2"> & { level: 2 | 3 | 4 }) {
  const id = slugify(getTextContent(children));
  const Component = `h${level}` as "h2" | "h3" | "h4";

  return (
    <Component id={id} {...props}>
      {children}
    </Component>
  );
}

function LegalContent({ content, className }: LegalContentProps) {
  if (!content.trim()) {
    return (
      <div
        className={cn(
          "flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center",
          className,
        )}
      >
        <p className="text-base font-medium">محتوایی برای نمایش وجود ندارد</p>
        <p className="mt-2 text-sm text-muted-foreground">
          این سند هنوز تکمیل نشده یا فایل markdown آن در دسترس نیست.
        </p>
      </div>
    );
  }

  return (
    <article id="legal-article" className={cn("legal-prose", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children, ...props }) => (
            <Heading level={2} {...props}>
              {children}
            </Heading>
          ),
          h3: ({ children, ...props }) => (
            <Heading level={3} {...props}>
              {children}
            </Heading>
          ),
          h4: ({ children, ...props }) => (
            <Heading level={4} {...props}>
              {children}
            </Heading>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

export { LegalContent };
