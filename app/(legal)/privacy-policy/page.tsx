import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal";
import { loadLegalDocument } from "@/lib/legal/markdown";

export const metadata: Metadata = {
  title: "سیاست حفظ حریم خصوصی | استادیو",
  description: "نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات کاربران در استادیو",
};

export default async function PrivacyPolicyPage() {
  const document = await loadLegalDocument("privacy-policy");

  return <LegalLayout document={document} />;
}
