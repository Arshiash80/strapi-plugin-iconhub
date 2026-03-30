import type { IconifyInfo } from '@iconify/types';

export type IconSetCollections = Record<string, IconifyInfo>;
export type GroupedCollections = Record<string, IconSetCollections>;

/**
 * Group collections by their category field.
 * Sets without a category are placed under "Uncategorized".
 */
export function groupByCategory(collections: IconSetCollections): GroupedCollections {
  const grouped: GroupedCollections = {};

  for (const [prefix, info] of Object.entries(collections)) {
    const category = (info as any).category || 'Uncategorized';
    if (!grouped[category]) {
      grouped[category] = {};
    }
    grouped[category][prefix] = info;
  }

  return grouped;
}

/**
 * Filter collections by allowed prefixes.
 * Supports partial prefix matching: a prefix ending with '-' matches any
 * collection whose prefix starts with that string (e.g. 'mdi-' matches 'mdi-light').
 * Returns all collections if allowedPrefixes is empty or undefined.
 */
export function filterByAllowedPrefixes(
  collections: IconSetCollections,
  allowedPrefixes?: string[]
): IconSetCollections {
  if (!allowedPrefixes || allowedPrefixes.length === 0) {
    return collections;
  }

  const filtered: IconSetCollections = {};

  for (const [prefix, info] of Object.entries(collections)) {
    const isAllowed = allowedPrefixes.some((allowed) => {
      if (allowed.endsWith('-')) {
        return prefix.startsWith(allowed);
      }
      return prefix === allowed;
    });

    if (isAllowed) {
      filtered[prefix] = info;
    }
  }

  return filtered;
}

/**
 * Convert a category name to a safe key for use in Strapi option names.
 * e.g. "UI 16px / 32px" → "UI_16px_32px"
 */
export function slugifyCategory(category: string): string {
  return category.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

const CATEGORY_ORDER = [
  'Material',
  'UI 24px',
  'UI 16px / 32px',
  'UI Other / Mixed Grid',
  'UI Multicolor',
  'Thematic',
  'Logos',
  'Flags / Maps',
  'Programming',
  'Emoji',
  'Uncategorized',
  'Archive / Unmaintained',
];

/**
 * Sort category names in a logical display order.
 */
export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    const orderA = indexA === -1 ? CATEGORY_ORDER.length : indexA;
    const orderB = indexB === -1 ? CATEGORY_ORDER.length : indexB;
    return orderA - orderB;
  });
}
