'use client'
import { useEffect, useState } from "react"
import { sendNotification, subscribeUser, unsubscribeUser } from "@/app/actions/pwa"
import { Bell, BellOff, Send } from "lucide-react"

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      const sub = await registration.pushManager.getSubscription()
      setSubscription(sub)
    } catch (err) {
      setError('Failed to register service worker')
      console.error(err)
    }
  }

  async function subscribeToPush() {
    try {
      setIsLoading(true)
      setError('')
      
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      
      setSubscription(sub)
      const serializedSub = JSON.parse(JSON.stringify(sub))
      await subscribeUser(serializedSub)
    } catch (err) {
      setError('Failed to subscribe to notifications')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribeFromPush() {
    try {
      setIsLoading(true)
      setError('')
      
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeUser()
    } catch (err) {
      setError('Failed to unsubscribe')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function sendTestNotification() {
    if (!subscription || !message.trim()) return
    
    try {
      setIsLoading(true)
      setError('')
      
      await sendNotification(message)
      setMessage('')
    } catch (err) {
      setError('Failed to send notification')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        {subscription ? (
          <Bell className="w-5 h-5 text-green-600" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}
        <h3 className="font-semibold">Push Notifications</h3>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}

      {subscription ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">✓ Notifications enabled</p>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Test message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTestNotification()}
              className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
              disabled={isLoading}
            />
            <button
              onClick={sendTestNotification}
              disabled={isLoading || !message.trim()}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>

          <button
            onClick={unsubscribeFromPush}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50"
          >
            Disable Notifications
          </button>
        </div>
      ) : (
        <button
          onClick={subscribeToPush}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? 'Enabling...' : 'Enable Notifications'}
        </button>
      )}
    </div>
  )
}