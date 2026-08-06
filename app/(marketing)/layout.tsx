import { MarketingDock } from "@/app/(marketing)/_components/marketing-dock";
import { getSession } from "@/lib/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      {children}
      <MarketingDock />
    </>
  );
}
