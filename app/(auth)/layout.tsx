import { getSession } from "@/lib/server";
import { getTenantContext } from "@/lib/tenant-context";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session?.user?.id) {
    const context = await getTenantContext(session.user.id);
    if (context) {
      redirect("/dashboard");
    }
  }

  return children;
}