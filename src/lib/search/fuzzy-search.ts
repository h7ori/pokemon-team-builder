// Fuzzy search setup using Fuse.js

import Fuse, { type IFuseOptions } from 'fuse.js';

export interface SearchableItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

export function createFuzzySearch<T extends SearchableItem>(
  items: T[],
  keys: string[] = ['name'],
  options: Partial<IFuseOptions<T>> = {}
): Fuse<T> {
  return new Fuse(items, {
    keys,
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 1,
    includeScore: true,
    ...options,
  });
}

export function searchItems<T extends SearchableItem>(
  fuse: Fuse<T>,
  query: string,
  limit: number = 50
): T[] {
  if (!query.trim()) return [];
  return fuse.search(query, { limit }).map((result) => result.item);
}
