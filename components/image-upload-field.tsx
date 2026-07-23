"use client";

import * as React from "react";
import { ImageIcon, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  description?: string;
};

export function ImageUploadField({ label, value, onChange, description }: ImageUploadFieldProps) {
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const payload = new FormData();
    payload.set("file", file);
    setUploading(true);
    try {
      const response = await fetch("/api/upload/image", { method: "POST", body: payload });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "آپلود تصویر ناموفق بود.");
      onChange(json.url);
      toast.success("تصویر بارگذاری شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "آپلود تصویر ناموفق بود.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {value ? <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}><Trash2 className="size-4" /> حذف</Button> : null}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void upload(file); }}
        className={cn("relative min-h-44 overflow-hidden rounded-3xl border border-dashed bg-muted/25 p-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", dragging && "border-primary bg-primary/10")}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="mx-auto h-44 w-full rounded-2xl object-cover" />
        ) : <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-muted-foreground"><UploadCloud className="size-7" /><span className="text-sm font-bold">فایل را اینجا رها کنید یا کلیک کنید</span><span className="text-xs">JPEG، PNG یا WebP تا ۵ مگابایت</span></div>}
        {uploading ? <span className="absolute inset-0 flex items-center justify-center bg-background/70"><Loader2 className="size-6 animate-spin" /></span> : null}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) void upload(file); event.currentTarget.value = ""; }} />
      {value ? <p className="flex items-center gap-1 break-all text-xs text-muted-foreground" dir="ltr"><ImageIcon className="size-3" />{value}</p> : description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}
