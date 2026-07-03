export type LegalDocumentSlug =
  | "privacy-policy"
  | "term-of-service"
  | "refund-policy";

export type LegalHeading = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
};

export type LegalDocumentMeta = {
  slug: LegalDocumentSlug;
  title: string;
  description: string;
  version: string;
  effectiveDate: string;
  lastUpdated: string;
  readingTimeMinutes: number;
};

export type LegalDocument = LegalDocumentMeta & {
  content: string;
  headings: LegalHeading[];
};

export type RelatedLegalDocument = {
  slug: LegalDocumentSlug;
  href: string;
  title: string;
  description: string;
};
