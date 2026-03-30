import { useEffect, useState } from 'react';
import type { IconifyInfo } from '@iconify/types';
import { getIconSetByPrefixes } from '../libs/iconifyApi';
import { filterByAllowedPrefixes, type IconSetCollections } from '../libs/iconSetUtils';

let cachedCollections: IconSetCollections | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function isCacheValid(): boolean {
  return cachedCollections !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

type UseIconCollectionsReturn = {
  collections: IconSetCollections | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to fetch and cache Iconify icon set collections.
 * Fetches all collections once, caches for 30 minutes, then filters
 * client-side by allowedPrefixes if provided.
 */
export function useIconCollections(allowedPrefixes?: string[]): UseIconCollectionsReturn {
  const [allCollections, setAllCollections] = useState<IconSetCollections | null>(cachedCollections);
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isCacheValid()) {
      setAllCollections(cachedCollections);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getIconSetByPrefixes().then((response) => {
      if (cancelled) return;

      if (response.success && response.data) {
        cachedCollections = response.data;
        cacheTimestamp = Date.now();
        setAllCollections(response.data);
        setError(null);
      } else {
        setError(response.error?.message || 'Failed to fetch icon collections');
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const collections = allCollections
    ? filterByAllowedPrefixes(allCollections, allowedPrefixes)
    : null;

  return { collections, isLoading, error };
}
