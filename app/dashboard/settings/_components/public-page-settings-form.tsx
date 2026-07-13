"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Globe, Loader2 } from "lucide-react";

import { updatePublicPageSettings } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
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

export type PublicPageSettingsData = {
  slug: string | null;
};

export function PublicPageSettingsForm({
  studyHall,
  studyhallId,
}: {
  studyHall: PublicPageSettingsData;
  studyhallId: string;
}) {
  const router = useRouter();

  const publicUrl = studyHall.slug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://studivo.ir"}/${studyHall.slug}`
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
                یک آدرس عمومی برای سالن خود تعیین کنید تا مراجعه‌کنندگان بتوانند سالن شما را پیدا کنند.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <ActionForm
          action={updatePublicPageSettings}
          successMessage="آدرس عمومی سالن با موفقیت ذخیره شد."
          onSuccess={() => router.refresh()}
          className="flex flex-col gap-6"
        >
          {(pending) => (
            <>
              {/* Slug */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="slug" className="font-bold">
                  آدرس عمومی سالن
                </Label>
                <p className="text-xs text-muted-foreground">
                  فقط حروف انگلیسی کوچک، اعداد و خط تیره. مثال:{" "}
                  <span dir="ltr" className="font-mono">
                    my-study-hall
                  </span>
                </p>
                <div className="flex items-center gap-2 rounded-2xl border bg-muted/10 px-3 py-2">
                  <span className="shrink-0 text-xs text-muted-foreground" dir="ltr">
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

              <div className="flex justify-end">
                <Button type="submit" disabled={pending} className="min-w-48">
                  {pending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "ذخیره آدرس عمومی"
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
