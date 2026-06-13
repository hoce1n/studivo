"use client";

import * as React from "react";
import { toast } from "sonner";
import { Building2, KeyRound, Loader2, MapPin, ShieldAlert, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateProfileDetails, updateStudyHallSettings } from "@/app/actions/actions";
import { ActionForm } from "@/components/action-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { z } from "zod";

type ProfileSettingsProps = {
  user: {
    name: string;
    email: string;
    role: string;
    phoneNumber?: string | null;
    image?: string | null;
    studyhall?: {
      name: string;
      totalSeats: number;
      monthlyFee: number;
      gender: string;
      address: string;
    } | null;
  };
};

function roleLabel(role: string) {
  if (role === "admin") return "مدیر سالن";
  if (role === "staff") return "مراقب";
  return "عضو";
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("") || "؟";
}

const studyHallSettingsClientSchema = z.object({
  name: z.string().trim().min(2, "نام سالن باید حداقل ۲ کاراکتر باشد."),
  totalSeats: z.coerce.number().int("تعداد صندلی باید عدد صحیح باشد.").min(1, "تعداد صندلی باید حداقل ۱ باشد.").max(500, "تعداد صندلی نمی‌تواند بیشتر از ۵۰۰ باشد."),
  monthlyFee: z.coerce.number().min(0, "شهریه ماهانه نمی‌تواند منفی باشد."),
  gender: z.enum(["male", "female", "mix"], { error: "نوع سالن را انتخاب کنید." }),
  address: z.string().trim().max(300, "آدرس نمی‌تواند بیشتر از ۳۰۰ کاراکتر باشد."),
});

function genderLabel(gender?: string) {
  if (gender === "male") return "آقایان";
  if (gender === "female") return "بانوان";
  if (gender === "mix") return "مختلط";
  return "تعیین نشده";
}

function getPasswordErrorMessage(message?: string) {
  if (!message) return "تغییر رمز عبور ناموفق بود.";

  const normalized = message.toLowerCase();
  if (normalized.includes("too short")) {
    return "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.";
  }
  if (normalized.includes("credential")) {
    return "برای این حساب رمز عبور قابل تغییر پیدا نشد.";
  }
  if (normalized.includes("invalid") || normalized.includes("password")) {
    return "رمز عبور فعلی درست نیست یا رمز عبور جدید شرایط لازم را ندارد.";
  }

  return message;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const canSubmitPassword =
    currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && !isLoading;
  const isAdmin = user.role === "admin";
  const studyHall = user.studyhall;

  function validateStudyHallSettings(formData: FormData) {
    const parsed = studyHallSettingsClientSchema.safeParse({
      name: formData.get("name"),
      totalSeats: formData.get("totalSeats"),
      monthlyFee: formData.get("monthlyFee"),
      gender: formData.get("gender"),
      address: formData.get("address") ?? "",
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "اطلاعات تنظیمات سالن معتبر نیست.");
    }

    return updateStudyHallSettings(formData);
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      const message = "رمز عبور جدید و تکرار آن یکسان نیستند.";
      setPasswordError(message);
      toast.error(message);
      return;
    }

    if (newPassword.length < 8) {
      const message = "رمز عبور جدید باید حداقل ۸ کاراکتر باشد.";
      setPasswordError(message);
      toast.error(message);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        throw new Error(getPasswordErrorMessage(result.error.message));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("رمز عبور شما با موفقیت تغییر یافت.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "تغییر رمز عبور ناموفق بود.";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs defaultValue="profile" className="w-full" dir="rtl">
      <TabsList>
        <TabsTrigger value="profile">
          <User />
          اطلاعات کاربری
        </TabsTrigger>
        <TabsTrigger value="security">
          <KeyRound />
          امنیت و رمز عبور
        </TabsTrigger>
        {isAdmin ? (
          <TabsTrigger value="study-hall-settings">
            <Building2 />
            تنظیمات سالن
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="profile">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-1 ring-border">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-lg font-black">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl font-black">اطلاعات کاربری</CardTitle>
                  <CardDescription className="mt-1 leading-6">
                    مشخصات حسابی که برای ورود و مدیریت سالن استفاده می‌کنید.
                  </CardDescription>
                </div>
              </div>
              <div className="rounded-2xl border bg-background px-4 py-2 text-sm font-bold text-muted-foreground">
                {roleLabel(user.role)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">شماره تلفن</p>
                <p className="mt-2 truncate font-bold">{user.phoneNumber}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">ایمیل</p>
                <p className="mt-2 truncate font-bold">{user.email}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">نقش دسترسی</p>
                <p className="mt-2 font-bold">{roleLabel(user.role)}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">سالن متصل</p>
                <p className="mt-2 truncate font-bold">{user.studyhall?.name ?? "بدون سالن"}</p>
              </div>
            </div>

            <ActionForm
              action={updateProfileDetails}
              successMessage="اطلاعات کاربری شما با موفقیت به‌روزرسانی شد."
              onSuccess={() => router.refresh()}
              className="rounded-3xl border bg-background p-4"
            >
              {(pending) => (
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">نام و نام خانوادگی</Label>
                    <Input
                      id="profile-name"
                      name="name"
                      defaultValue={user.name}
                      minLength={2}
                      placeholder="نام کامل شما"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={pending} className="md:min-w-40">
                    {pending ? <Loader2 className="animate-spin" /> : "ذخیره تغییرات"}
                  </Button>
                </div>
              )}
            </ActionForm>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <KeyRound className="size-5" />
              </span>
              <div>
                <CardTitle className="text-xl font-black">امنیت و رمز عبور</CardTitle>
                <CardDescription className="mt-1 leading-6">
                  برای محافظت از اطلاعات سالن، رمز عبور قدرتمند و اختصاصی انتخاب کنید.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword} className="mx-auto max-w-2xl space-y-5">
              {passwordError ? (
                <Alert variant="destructive">
                  <ShieldAlert />
                  <AlertTitle>تغییر رمز عبور انجام نشد</AlertTitle>
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">رمز عبور فعلی</Label>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">رمز عبور جدید</Label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" disabled={!canSubmitPassword} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="animate-spin" /> : "تغییر رمز عبور"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {isAdmin && studyHall ? (
        <TabsContent value="study-hall-settings">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <Building2 className="size-5" />
                  </span>
                  <div>
                    <CardTitle className="text-xl font-black">تنظیمات سالن</CardTitle>
                    <CardDescription className="mt-1 leading-6">
                      مشخصات عمومی، ظرفیت، شهریه و نوع پذیرش سالن مطالعه را مدیریت کنید.
                    </CardDescription>
                  </div>
                </div>
                <div className="rounded-2xl border bg-background px-4 py-2 text-sm font-bold text-muted-foreground">
                  فقط مدیر سالن
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">ظرفیت فعلی</p>
                  <p className="mt-2 font-bold">{studyHall.totalSeats.toLocaleString("fa-IR")} صندلی</p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">شهریه ماهانه</p>
                  <p className="mt-2 font-bold">{studyHall.monthlyFee.toLocaleString("fa-IR")} تومان</p>
                </div>
                <div className="rounded-2xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">نوع سالن</p>
                  <p className="mt-2 font-bold">{genderLabel(studyHall.gender)}</p>
                </div>
              </div>

              <ActionForm
                action={validateStudyHallSettings}
                successMessage="تنظیمات سالن با موفقیت به‌روزرسانی شد."
                onSuccess={() => router.refresh()}
                className="rounded-3xl border bg-background p-4"
              >
                {(pending) => (
                  <div className="grid gap-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="studyhall-name">نام سالن</Label>
                        <Input id="studyhall-name" name="name" defaultValue={studyHall.name} minLength={2} maxLength={100} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studyhall-gender">نوع پذیرش</Label>
                        <select
                          id="studyhall-gender"
                          name="gender"
                          defaultValue={studyHall.gender === "unspecified" ? "mix" : studyHall.gender}
                          className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-2xl border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="male">آقایان</option>
                          <option value="female">بانوان</option>
                          <option value="mix">مختلط</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studyhall-total-seats">تعداد کل صندلی‌ها</Label>
                        <Input id="studyhall-total-seats" name="totalSeats" type="number" min={1} max={500} defaultValue={studyHall.totalSeats} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="studyhall-monthly-fee">شهریه ماهانه</Label>
                        <Input id="studyhall-monthly-fee" name="monthlyFee" type="number" min={0} step="1000" defaultValue={studyHall.monthlyFee} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="studyhall-address">آدرس سالن</Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground" />
                        <textarea
                          id="studyhall-address"
                          name="address"
                          defaultValue={studyHall.address}
                          maxLength={300}
                          rows={4}
                          placeholder="آدرس کامل سالن مطالعه"
                          className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-28 w-full rounded-2xl border px-10 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={pending} className="min-w-40">
                        {pending ? <Loader2 className="animate-spin" /> : "ذخیره تنظیمات سالن"}
                      </Button>
                    </div>
                  </div>
                )}
              </ActionForm>
            </CardContent>
          </Card>
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
