import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./providers/ThemeProvider";
import { DirectionProvider } from "@/components/ui/direction";
import CommandPalette from "@/components/command-palette";
import { prisma } from "@/lib/db";

const estedaad = localFont({
  src: "./fonts/Estedad[wght].woff2",
  variable: "--font-estedaad",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studivo",
  description: "a tools for managing your studyhall",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Studivo",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seats = await prisma.seat.findMany({
    take: 200,
    orderBy: { seatNumber: "asc" },
    select: { id: true, seatNumber: true },
  });
  const membersData = await prisma.user.findMany({
    where: { role: "member" },
    take: 200,
    select: { id: true, name: true, phoneNumber: true },
  });
  const members = membersData.map((m) => ({
    ...m,
    phoneNumber: m.phoneNumber ?? undefined,
  }));

  return (
    <html
      suppressHydrationWarning
      lang="fa"
      dir="rtl"
      className={cn("antialiased", estedaad.variable, "font-sans")}
    >
      <head>
        <meta name="apple-mobile-web-app-title" content="Studivo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <DirectionProvider dir="rtl">
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <CommandPalette initialSeats={seats} initialMembers={members} />
            </TooltipProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                className: "font-sans",
              }}
            />
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
