import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal";
import { loadLegalDocument } from "@/lib/legal/markdown";

export const metadata: Metadata = {
  title: "سیاست بازپرداخت | استادیو",
  description: "شرایط بازپرداخت اشتراک و موارد استثنا در استادیو",
};

export default async function RefundPolicyPage() {
  const document = await loadLegalDocument("refund-policy");

  return <LegalLayout document={document} />;
}
