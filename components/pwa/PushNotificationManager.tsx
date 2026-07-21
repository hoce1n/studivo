'use client'

import { useEffect, useState } from "react"
import { Bell, BellOff, Send } from "lucide-react"
import { toast } from "sonner"

import {
  sendNotification,
  subscribeUser,
  unsubscribeUser,
} from "@/app/actions/notifications/push"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

async function registerServiceWorker(
  setSubscription: (sub: PushSubscription | null) => void,
  setError: (err: string) => void,
) {
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  } catch (err) {
    setError("ثبت Service Worker ناموفق بود.")
    console.error(err)
  }
}

type PushNotificationManagerProps = {
  userRole: string
}

export default function PushNotificationManager({
  userRole,
}: PushNotificationManagerProps) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window

  const isOperator = userRole === "admin" || userRole === "staff"

  useEffect(() => {
    if (isSupported) {
      registerServiceWorker(setSubscription, setError)
    }
  }, [isSupported])

  async function subscribeToPush() {
    try {
      setIsLoading(true)
      setError("")

      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      })

      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      const result = await subscribeUser(serializedSub)

      if (!result.success) {
        setError(result.error ?? "فعال‌سازی اعلان‌ها ناموفق بود.")
        return
      }

      toast.success(result.message ?? "اعلان‌ها فعال شد.")
    } catch (err) {
      setError("فعال‌سازی اعلان‌های فشاری ناموفق بود.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    try {
      setIsLoading(true)
      setError("")

      const endpoint = subscription?.endpoint
      await subscription?.unsubscribe()
      setSubscription(null)

      const result = await unsubscribeUser(endpoint)
      if (!result.success) {
        setError(result.error ?? "غیرفعال‌سازی اعلان‌ها ناموفق بود.")
        return
      }

      toast.success(result.message ?? "اعلان‌ها غیرفعال شد.")
    } catch (err) {
      setError("غیرفعال‌سازی اعلان‌ها ناموفق بود.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return

    try {
      setIsLoading(true)
      setError("")

      const result = await sendNotification(message)
      if (!result.success) {
        setError(result.error ?? "ارسال اعلان آزمایشی ناموفق بود.")
        return
      }

      toast.success(result.message ?? "اعلان آزمایشی ارسال شد.")
      setMessage("")
    } catch (err) {
      setError("ارسال اعلان آزمایشی ناموفق بود.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Alert>
        <AlertDescription>
          این مرورگر از اعلان‌های فشاری پشتیبانی نمی‌کند.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {subscription ? (
          <Bell className="size-5 text-emerald-600" />
        ) : (
          <BellOff className="size-5 text-muted-foreground" />
        )}
        <div>
          <h3 className="font-bold">اعلان‌های فشاری</h3>
          <p className="text-sm text-muted-foreground">
            {isOperator
              ? "یادآوری تمدید و انقضای اشتراک‌ها را روی این دستگاه دریافت کنید."
              : "اعلان‌های عملیاتی سالن را روی این دستگاه دریافت کنید."}
          </p>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {subscription ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            اعلان‌ها برای این دستگاه فعال است.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="text"
              placeholder="متن اعلان آزمایشی..."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void sendTestNotification()
                }
              }}
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={sendTestNotification}
              disabled={isLoading || !message.trim()}
              className="sm:min-w-36"
            >
              <Send className="size-4" />
              ارسال آزمایشی
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            غیرفعال‌سازی اعلان‌ها
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onClick={subscribeToPush}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "در حال فعال‌سازی..." : "فعال‌سازی اعلان‌ها"}
        </Button>
      )}
    </div>
  )
}
