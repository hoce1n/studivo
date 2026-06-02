import type { Metadata } from "next";
import localFont from "next/font/local"
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./providers/ThemeProvider";

const estedaad = localFont({
  src: './fonts/Estedad[wght].woff2',
  variable: "--font-estedaad",
  display: "swap"
});

export const metadata: Metadata = {
  title: "hocein",
  description: "the one who loves coding...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      lang="fa"
      dir="rtl"
      className={cn(
        "antialiased", estedaad.variable, "font-sans",
      )}
    >
      <body>
        <ThemeProvider>
        <TooltipProvider>
        {children}
        </TooltipProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'font-sans',
          }}
        />
        </ThemeProvider>
      </body>
    </html>
  );
}
