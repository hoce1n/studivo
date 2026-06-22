"use client"

import { SignupForm } from "@/app/(auth)/signup/_components/signup-form"
import { Logo } from "@/app/(marketing)/_components/navbar/logo"
import Image from "next/image"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium font-mono">
              <Logo />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          alt="تصویر پس‌زمینه Studivo"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          priority
        />
      </div>
    </div>
  )
}
