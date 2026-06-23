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
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Eye, EyeClosed, Loader } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { ForgotPasswordPopover } from "./forgot-password-popover"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit =
    Boolean(email) &&
    Boolean(password) &&
    !loading;

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
        rememberMe: rememberMe,
      },
    {
      onRequest: () => {
        setLoading(true);
      },
      onSuccess: () => {
        toast.success("خوش اومدی...")
      },
      onError: (ctx) => {
        toast.error(ctx.error.message);
      }
    })
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignin} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">خوش برگشتی! (:</h1>
          <p className="text-sm text-balance text-muted-foreground">
            ایمیلت رو همراه با پسورد وارد کن تا وارد شی.
          </p>
        </div>
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
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">پسورد</FieldLabel>
            <ForgotPasswordPopover email={email} />
          </div>
          <div className="relative">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              required
              className="bg-background"
            />
            <Button
              type="button"
              variant={'ghost'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 left-0"
            >
              {showPassword ? <EyeClosed /> : <Eye />}
            </Button>
          </div>
        </Field>
        <Field>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              className="size-4"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <FieldLabel htmlFor="remember">مرا به خاطر بسپار</FieldLabel>
          </div>
        </Field>
        <Field>
          <Button 
            type="submit"
            disabled={!canSubmit}
          >
            {loading ? <Loader className="animate-spin" /> : "ورود"}
          </Button>
        </Field>
        <FieldSeparator>یا</FieldSeparator>
        <Field className="grid grid-cols-2">
          <Button variant="outline" type="button">
            <span className="sr-only">ورود با گیت‌هاب</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
          </Button>
          <Button variant="outline" type="button">
            <span className="sr-only">ورود با گوگل</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
          </Button>

        </Field>
        <FieldDescription className="col-span-1 text-center">
          تا حالا وارد نشدی؟{" "}
          <Link href="/signup" className="underline underline-offset-4">
            ثبت نام
          </Link>
          .
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
