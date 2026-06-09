'use client';

import { useState } from "react"
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeClosed, Loader } from "lucide-react";

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"


function validatePasswordStrength(password: string) {
  if (password.length < 8) return "ضعیف";

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (hasLetter && hasNumber) return "قویی";
  return "معمولی";
}

function validatePasswordMatch(password: string, confirm: string) {
  return password === confirm;
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [confirmTouched, setConfirmTouched] = useState(false);

  const router = useRouter();

  const passwordsMatch =
    validatePasswordMatch(password, confirmPassword);

  const passwordStrong =
    validatePasswordStrength(password);

  const canSubmit =
    name &&
    email &&
    password &&
    passwordsMatch &&
    passwordStrong === "قویی" &&
    !loading;

  const handleSignup = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passwordsMatch) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند.");
      return;
    }

    setLoading(true);
    try {
      await authClient.signUp.email({
        email,
        password,
        name,
        fetchOptions: {
          onRequest: () => {
            
          },
          onSuccess: () => {
            router.push("/dashboard");
            
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          }
        }
      })
    } finally {
      setLoading(false);
    }

  }
  return (
    <form 
      onSubmit={handleSignup} 
      className={cn("flex flex-col gap-6", className)} {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">ساخت حساب کاربری</h1>
          <p className="text-sm text-balance text-muted-foreground">
            اطلاعات لازم برای ساخت حساب کاربری خود را وارد کنید.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="name">نام و نام خانوادگی</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            placeholder="حسین دانش"
            required
            className="bg-background"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="email">ایمیل</FieldLabel>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="m@example.com"
            required
            className="bg-background"
          />
          <FieldDescription>
            ما ازش برای ارتباط باهات استفاده میکنیم و جاش پیش ما امنه.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">پسورد</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => {setPassword(e.target.value)}}
              type={showPassword ? "text" : "password"}
              required
              className={cn("bg-background",
                passwordStrong === "قویی" && "border-green-600! border focus-visible:ring-green-600/30 ",
                passwordStrong === "ضعیف" && "border-destructive! border focus-visible:ring-destructive/30",
                passwordStrong === "معمولی" && "border-secondary! border"
              )}
            />
            <Button
              type="button"
              variant={'ghost'}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 left-0"
            >
              {showPassword ? <EyeClosed /> : <Eye />}
            </Button>
          </div>
          <FieldDescription>
            
            امنیت رمز: 
            <span className={cn("mr-1",
              passwordStrong === "قویی" && "text-green-500",
              passwordStrong === "معمولی" && "text-secondary-foreground",
              passwordStrong === "ضعیف" && "text-destructive"
            )}>{" "}
              {passwordStrong}
            </span>
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">تایید رمز عبور</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => {setConfirmPassword(e.target.value)}}
              onBlur={() => setConfirmTouched(true)}
              type={showConfirm ? "text" : "password"}
              required
              className="bg-background"
            />
            <Button
              type="button"
              variant={'ghost'}
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute inset-y-0 left-0"
            >
              {showConfirm ? <EyeClosed /> : <Eye />}
            </Button>
          </div>
          {!passwordsMatch && confirmTouched && (
            <FieldDescription className="text-destructive">
              رمز عبور و تایید آن یکسان نیستند.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <Button 
            type="submit"
            disabled={!canSubmit}
          >
            {loading ? <Loader className="animate-spin" /> : "ساخت حساب"}
          </Button>
        </Field>
        <FieldSeparator>میتونی ادامه بدی با</FieldSeparator>
        <Field className="grid grid-cols-2">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {toast.info("هنوز پیاده سازی نشده است.")}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            <span className="sr-only">ثبت نام با گیت هاب</span>
          </Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {toast.info("هنوز پیاده سازی نشده است.")}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            <span className="sr-only">ثبت نام با گوگل</span>
          </Button>
        </Field>
          <FieldDescription className="px-6 text-center">
            اگه قبلا ثبت‌نام کردی <a href="/login">وارد شو</a>.
          </FieldDescription>
      </FieldGroup>
    </form>
  )
}
