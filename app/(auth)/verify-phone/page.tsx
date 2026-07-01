import Image from "next/image";
import { redirect } from "next/navigation";

import { Logo } from "@/app/(marketing)/_components/navbar/logo";
import { VerifyPhoneForm } from "@/app/(auth)/verify-phone/_components/verify-phone-form";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/server";

export default async function VerifyPhonePage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneNumber: true, studyhallId: true },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.phoneNumber) {
    redirect(user.studyhallId ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2" dir="rtl">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <VerifyPhoneForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <Image
          src="/placeholder.png"
          alt="تصویر پس‌زمینه Studivo"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
