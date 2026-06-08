# PWA Features Implementation Guide

## Overview

Your Studivo app now has full Progressive Web App (PWA) capabilities including:

- Service Worker for offline support and caching
- Push notifications
- Install-to-homescreen functionality
- Proper manifest configuration

## What's Included

### 1. **Service Worker** (`public/sw.js`)

- **Install**: Caches essential assets on first visit
- **Fetch**: Network-first strategy with cache fallback for offline support
- **Push Notifications**: Handles push notification events
- **Activation**: Cleans up old cache versions

### 2. **Manifest** (`app/manifest.json`)

- App name, description, and icons
- Start URL and scope configuration
- Theme and background colors
- Shortcuts and screenshots for app stores
- Proper `maskable` icon support for adaptive icons

### 3. **Layout Enhancements** (`app/layout.tsx`)

- PWA meta tags for iOS and Android
- Apple Web App metadata
- Viewport settings optimized for PWA
- Service Worker registration component

### 4. **PWA Hook** (`hooks/usePWA.ts`)

- `isInstallable`: Check if app can be installed
- `installApp()`: Trigger install prompt
- `requestNotificationPermission()`: Request notification access
- `subscribeToPushNotifications()`: Subscribe to push notifications
- `notificationPermission`: Current notification permission status

## Usage Examples

### Request Installation Prompt

```tsx
"use client";

import { usePWA } from "@/hooks/usePWA";

export function InstallButton() {
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable) return null;

  return <button onClick={installApp}>Install App</button>;
}
```

### Enable Push Notifications

```tsx
"use client";

import { usePWA } from "@/hooks/usePWA";

export function NotificationButton() {
  const { requestNotificationPermission } = usePWA();

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      console.log("Notifications enabled!");
    }
  };

  return <button onClick={handleEnable}>Enable Notifications</button>;
}
```

### Subscribe to Push Notifications

```tsx
const { subscribeToPushNotifications } = usePWA();

async function subscribeUser() {
  try {
    const subscription = await subscribeToPushNotifications(
      process.env.NEXT_PUBLIC_VAPID_KEY!,
    );

    // Send subscription to backend
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch (error) {
    console.error("Subscription failed:", error);
  }
}
```

## Setup for Push Notifications

### 1. Generate VAPID Keys

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### 2. Store VAPID Keys

Add to `.env.local`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:your-email@example.com
```

### 3. Create Push API Endpoints

```tsx
// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const subscription = await request.json();

  // Save subscription to database
  // Example: await db.subscriptions.create({ subscription })

  return NextResponse.json({ success: true });
}

// app/api/push/send/route.ts
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(request: NextRequest) {
  const { title, body, subscription } = await request.json();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title,
        body,
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
```

## Testing

### Desktop Chrome/Edge

- Open DevTools (F12) → Application → Service Workers
- Check "Offline" to test offline functionality
- Go to Application → Manifest to verify setup

### Mobile (Android)

- Open app in Chrome
- Should see install prompt
- Add to homescreen will create app shortcut

### Mobile (iOS)

- Add to Home Screen via Safari menu
- Has limited PWA support but works with meta tags

## Caching Strategy

The service worker uses a **Network-First strategy**:

1. Try to fetch from network
2. If successful, cache for future use
3. If network fails, use cached version
4. This ensures fresh data when online, offline support when not

### Customizing Cache

Edit `public/sw.js` to change:

- `CACHE_NAME`: Version your cache (e.g., `studivo-v2`)
- `ASSETS_TO_CACHE`: Essential assets to cache on install
- Fetch strategy: Change to cache-first if preferred

## Browser Support

| Feature               | Chrome | Firefox | Safari | Edge |
| --------------------- | ------ | ------- | ------ | ---- |
| Service Workers       | ✓      | ✓       | ✓      | ✓    |
| Web App Manifest      | ✓      | ✓       | ~      | ✓    |
| Push Notifications    | ✓      | ✓       | ✗      | ✓    |
| Install to Homescreen | ✓      | ✓       | ~      | ✓    |

## Troubleshooting

### Service Worker not registering?

- Check browser console for errors
- Verify `public/sw.js` exists
- Clear browser cache and restart

### Push notifications not working?

- Ensure `Notification.permission === 'granted'`
- Check VAPID keys are correct
- Verify subscription endpoint implementation

### App not installable?

- Need HTTPS (localhost works for testing)
- Manifest must be valid JSON
- Icons must be accessible
- Install prompt requires 2+ minute engagement

## Next Steps

1. ✅ Basic PWA setup complete
2. Add push notification endpoints
3. Implement notification preferences UI
4. Create offline-first pages
5. Monitor service worker performance
6. Test on real devices
