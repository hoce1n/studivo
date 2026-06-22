'use client'

import { useEffect, useState } from "react"
import { Download, Info } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type NavigatorWithMSStream = Navigator & {
  MSStream?: unknown
}

function getIsIOS() {
  if (typeof window === "undefined") return false

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(navigator as NavigatorWithMSStream).MSStream
  )
}

function getIsStandalone() {
  if (typeof window === "undefined") return false

  return window.matchMedia("(display-mode: standalone)").matches
}

export default function InstallPrompt() {
  const [isIOS] = useState(getIsIOS)
  const [isStandalone] = useState(getIsStandalone)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setShowInstallPrompt(false)
    }

    setDeferredPrompt(null)
  }

  if (isStandalone) {
    return null
  }

  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold">نصب Studivo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              برای دسترسی سریع‌تر، Studivo را روی صفحه اصلی دستگاه خود نصب کنید.
            </p>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
        >
          نصب برنامه
        </button>
      </div>
    )
  }

  if (isIOS) {
    return (
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">نصب روی iOS</h3>
            <div className="text-sm text-blue-800 mt-2 space-y-1">
              <p>۱. دکمه اشتراک‌گذاری را لمس کنید <span className="inline-block">⎋</span></p>
              <p>۲. گزینه افزودن به صفحه اصلی را انتخاب کنید <span className="inline-block">➕</span></p>
              <p>۳. نام Studivo را تأیید کنید و روی افزودن بزنید</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
