import { requirePlatformUser } from "@/app/actions/auth/verify-role";
import { Separator } from "@/components/ui/separator";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard: session must belong to a platform user (SALES or SUPER_ADMIN).
  // requirePlatformUser redirects to /login (no session) or /dashboard
  // (authenticated but not a platform user). See ADR-015.
  const user = await requirePlatformUser();

  const roleLabel =
    user.platformRole === "SUPER_ADMIN" ? "مدیر" : "کارشناس فروش";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b bg-background px-6">
        <div className="flex flex-1 items-center justify-between gap-4">
          {/* Logo + context label */}
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold tracking-tight">
              Studivo
            </span>
            <Separator orientation="vertical" className="h-4 data-vertical:h-4 data-vertical:self-auto" />
            <span className="text-sm text-muted-foreground">
              مدیریت فروش و سالن‌ها
            </span>
          </div>

          {/* User identity */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{user.name}</span>
            <Separator orientation="vertical" className="h-3 data-vertical:h-3 data-vertical:self-auto" />
            <span className="text-xs">{roleLabel}</span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6">
        {children}
      </main>
    </div>
  );
}
