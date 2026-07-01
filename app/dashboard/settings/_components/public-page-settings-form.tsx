"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Globe, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { updatePublicPageSettings } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type PublicPageSettingsData = {
  slug: string | null;
  publicPageEnabled: boolean;
  heroImage: string | null;
  galleryImages: string[];
};

// ---------------------------------------------------------------------------
// Image upload helper — calls the API route and returns the public blob URL
// ---------------------------------------------------------------------------
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/upload/image", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در آپلود تصویر.");
  }
  const { url } = await res.json();
  return url as string;
}

// ---------------------------------------------------------------------------
// Small reusable image picker
// ---------------------------------------------------------------------------
function ImagePicker({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  description?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در آپلود.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <div className="relative overflow-hidden rounded-2xl border bg-muted/20">
        {value ? (
          <div className="group relative aspect-video w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt={label}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="size-4" data-icon="inline-start" />
                تعویض
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => onChange(null)}
                disabled={uploading}
              >
                <Trash2 className="size-4" data-icon="inline-start" />
                حذف
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImageIcon className="size-6" />
            )}
            <span className="text-xs">
              {uploading ? "در حال آپلود..." : "کلیک کنید یا فایل را بکشید"}
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        aria-label={label}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function PublicPageSettingsForm({
  studyHall,
  studyhallId,
}: {
  studyHall: PublicPageSettingsData;
  studyhallId: string;
}) {
  const router = useRouter();

  const [enabled, setEnabled] = React.useState(studyHall.publicPageEnabled);
  const [heroImage, setHeroImage] = React.useState<string | null>(
    studyHall.heroImage
  );
  const [galleryImages, setGalleryImages] = React.useState<string[]>(
    studyHall.galleryImages
  );
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const [galleryUploading, setGalleryUploading] = React.useState(false);
  const [galleryError, setGalleryError] = React.useState<string | null>(null);

  async function handleGalleryAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (galleryImages.length + files.length > 8) {
      setGalleryError("حداکثر ۸ تصویر در گالری مجاز است.");
      return;
    }
    setGalleryError(null);
    setGalleryUploading(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setGalleryImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setGalleryError(err instanceof Error ? err.message : "خطا در آپلود.");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removeGalleryImage(url: string) {
    setGalleryImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleSubmit(formData: FormData) {
    // Inject derived state that can't live in uncontrolled inputs
    if (heroImage) formData.set("heroImage", heroImage);
    formData.set("galleryImages", JSON.stringify(galleryImages));
    return updatePublicPageSettings(formData);
  }

  const publicUrl = studyHall.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${studyHall.slug}`
    : null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Globe className="size-5" />
            </span>
            <div>
              <CardTitle className="text-xl font-black">صفحه عمومی سالن</CardTitle>
              <CardDescription className="mt-1 leading-6">
                یک صفحه معرفی عمومی برای سالن خود بسازید تا مراجعه‌کنندگان بتوانند سالن شما را ببینند.
              </CardDescription>
            </div>
          </div>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "فعال" : "غیرفعال"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <ActionForm
          action={handleSubmit}
          successMessage="تنظیمات صفحه عمومی با موفقیت ذخیره شد."
          onSuccess={() => router.refresh()}
          className="flex flex-col gap-6"
        >
          {(pending) => (
            <>
              {/* Enable toggle */}
              <div className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/20 p-4">
                <div className="space-y-1">
                  <Label htmlFor="public-page-enabled" className="font-bold">
                    فعال‌سازی صفحه عمومی
                  </Label>
                  <p className="text-xs leading-5 text-muted-foreground">
                    پس از فعال‌سازی، صفحه سالن با آدرس انتخابی شما در دسترس عموم قرار می‌گیرد.
                  </p>
                </div>
                <Switch
                  id="public-page-enabled"
                  name="publicPageEnabled"
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              {/* Slug */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="slug" className="font-bold">
                  آدرس عمومی سالن
                </Label>
                <p className="text-xs text-muted-foreground">
                  فقط حروف انگلیسی کوچک، اعداد و خط تیره. مثال: <span dir="ltr" className="font-mono">my-study-hall</span>
                </p>
                <div className="flex items-center gap-2 rounded-2xl border bg-muted/10 px-3 py-2">
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : "https://studivo.ir"}
                    /
                  </span>
                  <Input
                    id="slug"
                    name="slug"
                    dir="ltr"
                    defaultValue={studyHall.slug ?? ""}
                    placeholder="my-study-hall"
                    minLength={3}
                    maxLength={60}
                    pattern="[a-z0-9-]+"
                    className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                {publicUrl && (
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs text-primary hover:underline"
                    dir="ltr"
                  >
                    {publicUrl}
                  </a>
                )}
              </div>

              {/* Hero image */}
              <ImagePicker
                label="تصویر اصلی (Hero)"
                value={heroImage}
                onChange={setHeroImage}
                description="این تصویر در بالای صفحه عمومی سالن نمایش داده می‌شود. حداکثر ۵ مگابایت، فرمت JPEG، PNG یا WebP."
              />

              {/* Gallery */}
              <div className="flex flex-col gap-3">
                <Label className="font-bold">گالری تصاویر</Label>
                <p className="text-xs text-muted-foreground">
                  حداکثر ۸ تصویر. تصاویر در صفحه عمومی سالن نمایش داده می‌شوند.
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {galleryImages.map((url) => (
                    <div
                      key={url}
                      className="group relative aspect-square overflow-hidden rounded-xl border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt="تصویر گالری"
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(url)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="حذف تصویر"
                      >
                        <Trash2 className="size-5 text-white" />
                      </button>
                    </div>
                  ))}
                  {galleryImages.length < 8 && (
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={galleryUploading}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed"
                    >
                      {galleryUploading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <Upload className="size-5" />
                      )}
                      <span className="text-xs">افزودن</span>
                    </button>
                  )}
                </div>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleGalleryAdd}
                  aria-label="افزودن تصویر به گالری"
                />
                {galleryError && (
                  <p className="text-xs text-destructive">{galleryError}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={pending} className="min-w-48">
                  {pending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "ذخیره تنظیمات صفحه عمومی"
                  )}
                </Button>
              </div>
            </>
          )}
        </ActionForm>
      </CardContent>
    </Card>
  );
}
