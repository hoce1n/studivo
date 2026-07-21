import type { LegalDocumentSlug, RelatedLegalDocument } from "./types";
import { STATIC_LEGAL_DOCUMENTS } from "./content";

export const LEGAL_DOCUMENTS: Record<
  LegalDocumentSlug,
  Omit<RelatedLegalDocument, "href"> & { path: string }
> = STATIC_LEGAL_DOCUMENTS.reduce((acc, doc) => {
  acc[doc.slug] = {
    slug: doc.slug,
    path: `/${doc.slug}`,
    title: doc.title,
    description: doc.description,
  };
  return acc;
}, {} as Record<LegalDocumentSlug, Omit<RelatedLegalDocument, "href"> & { path: string }>);

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
