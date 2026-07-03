import type { LegalDocumentSlug, RelatedLegalDocument } from "./types";

export const LEGAL_DOCUMENTS: Record<
  LegalDocumentSlug,
  Omit<RelatedLegalDocument, "href"> & { path: string }
> = {
  "term-of-service": {
    slug: "term-of-service",
    path: "/term-of-service",
    title: "شرایط استفاده",
    description: "قوانین و ضوابط استفاده از خدمات استادیو",
  },
  "privacy-policy": {
    slug: "privacy-policy",
    path: "/privacy-policy",
    title: "سیاست حفظ حریم خصوصی",
    description: "نحوه جمع‌آوری، استفاده و حفاظت از اطلاعات کاربران",
  },
  "refund-policy": {
    slug: "refund-policy",
    path: "/refund-policy",
    title: "سیاست بازپرداخت",
    description: "شرایط بازپرداخت اشتراک و موارد استثنا",
  },
};

export function getRelatedDocuments(
  currentSlug: LegalDocumentSlug
): RelatedLegalDocument[] {
  return Object.values(LEGAL_DOCUMENTS)
    .filter((doc) => doc.slug !== currentSlug)
    .map(({ path, ...doc }) => ({ ...doc, href: path }));
}

export function getLegalDocumentPath(slug: LegalDocumentSlug): string {
  return LEGAL_DOCUMENTS[slug].path;
}
