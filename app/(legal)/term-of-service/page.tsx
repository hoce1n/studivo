import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal";
import { loadLegalDocument } from "@/lib/legal/markdown";

export const metadata: Metadata = {
  title: "شرایط استفاده",
  description: "قوانین و ضوابط استفاده از خدمات استادیو",
};

export default async function TermsOfServicePage() {
  const document = await loadLegalDocument("term-of-service");

  return <LegalLayout document={document} />;
}
