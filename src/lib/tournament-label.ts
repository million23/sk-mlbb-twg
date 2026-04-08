import { humanizeSlug } from "@/lib/humanize-slug";
import type { Collections } from "@/types/pocketbase-types";

/**
 * Prefer a real title; if title is missing or identical to slug (common when
 * people paste the slug into title), show a readable name instead of raw slug.
 */
export function tournamentLabel(t: Collections["tournaments"]): string {
  const title = t.title?.trim();
  const slug = t.slug?.trim();
  if (title && slug && title.toLowerCase() === slug.toLowerCase()) {
    return humanizeSlug(slug);
  }
  if (title) return title;
  if (slug) return humanizeSlug(slug);
  return "Untitled tournament";
}
