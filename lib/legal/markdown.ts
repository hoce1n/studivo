import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { LegalDocument, LegalDocumentSlug, LegalHeading } from "./types";
import { estimateReadingTimeMinutes } from "./reading-time";
import { LEGAL_DOCUMENTS } from "./config";

type Frontmatter = {
  title?: string;
  description?: string;
  version?: string;
  effectiveDate?: string;
  lastUpdated?: string;
};

function stripMarkdownFormatting(value: string): string {
  return value
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .trim();
}

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return base || "section";
}

function extractHeadings(content: string): LegalHeading[] {
  const headings: LegalHeading[] = [];
  const seen = new Map<string, number>();

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^(#{2,4})\s+(.*)$/);
    if (!match) continue;

    const level = match[1].length as 2 | 3 | 4;
    const text = stripMarkdownFormatting(match[2]);
    if (!text) continue;

    const baseId = slugify(text);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    const id = count > 0 ? `${baseId}-${count}` : baseId;

    headings.push({ id, text, level });
  }

  return headings;
}

export async function loadLegalDocument(
  slug: LegalDocumentSlug,
): Promise<LegalDocument> {
  const filePath = path.join(
    process.cwd(),
    "app",
    "(legal)",
    slug,
    `${slug}.md`,
  );

  const source = await fs.readFile(filePath, "utf8");
  const { content, data } = matter(source);
  const frontmatter = data as Frontmatter;
  const config = LEGAL_DOCUMENTS[slug];

  const readingTimeMinutes = estimateReadingTimeMinutes(content);

  return {
    slug,
    title: frontmatter.title ?? config.title,
    description: frontmatter.description ?? config.description,
    version: frontmatter.version ?? "1.0",
    effectiveDate: frontmatter.effectiveDate ?? "۱۴۰۴/۰۱/۰۱",
    lastUpdated: frontmatter.lastUpdated ?? "۱۴۰۴/۰۴/۰۱",
    readingTimeMinutes,
    content,
    headings: extractHeadings(content),
  };
}
