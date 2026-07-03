import type { LegalDocument, LegalDocumentSlug } from "./types";
import { getLegalDocument } from "./content";

export async function loadLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument> {
  const document = getLegalDocument(slug);

  if (!document) {
    throw new Error(`Legal document not found: ${slug}`);
  }

  return document;
}
