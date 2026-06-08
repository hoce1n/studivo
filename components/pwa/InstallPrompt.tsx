'use client'
import { useEffect, useState } from "react"
import { Download, Info } from "lucide-react"

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )

    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false)
    }
    
    setDeferredPrompt(null)
  }

  // Don't show if already installed
  if (isStandalone) {
    return null
  }

  // Show Android/Chrome install prompt
  if (showInstallPrompt && deferredPrompt) {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold">Install Studivo</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Get quick access on your device. Install the app to your home screen.
            </p>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
        >
          Install App
        </button>
      </div>
    )
  }

  // Show iOS manual installation instructions
  if (isIOS) {
    return (
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Install on iOS</h3>
            <div className="text-sm text-blue-800 mt-2 space-y-1">
              <p>1. Tap the Share button <span className="inline-block">⎋</span></p>
              <p>2. Select "Add to Home Screen" <span className="inline-block">➕</span></p>
              <p>3. Name it "Studivo" and tap "Add"</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}