import { addCollection } from '@iconify/react';
import type { IconifyInfo, IconifyJSON } from '@iconify/types';
export type IconifyIconSetList = Record<string, IconifyInfo>;

import axios from 'axios';
const API_URL = 'https://api.iconify.design'

interface IconifyAPIResponse<T> {
  data?: T;
  success: boolean;
  error?: {
    message: string;
  }
}

type CollectionResponse = IconifyAPIResponse<{
  prefix: string;
  total: number;
  title?: string;
  info?: IconifyInfo;
  uncategorized?: string[];
  categories?: Record<string, string[]>;
  aliases?: Record<string, string>;
  hidden?: string[];
  themes?: Record<string, string>;
  prefixes?: Record<string, string>;
  suffixes?: Record<string, string>;
}>;

export type IconifySearchOptions = {
  category?: string;
  palette?: 'all' | 'mono' | 'multicolor';
  style?: 'any' | 'fill' | 'stroke';
};

const collectionCache = new Map<string, NonNullable<CollectionResponse['data']>>();
const collectionIconNamesRequests = new Map<string, Promise<CollectionResponse>>();
const iconDataCache = new Map<string, Set<string>>();
const iconDataRequests = new Map<string, Promise<void>>();

type SearchIconResponse = IconifyAPIResponse<{
  /** List of icons, including prefixes */
  icons: string[];
  /** Number of results. If same as `limit`, more results are available */
  total: number;
  /** Number of results shown */
  limit: number;
  /** Index of first result */
  start: number;
  /** Info about icon sets */
  collections: Record<string, IconifyInfo>;
  /** Copy of request, values are string */
  request: Record<keyof SearchIconResponse, string>;
}>;

export const searchIcon = async (
  query: string,
  start: number = 0,
  limit: number = 50,
  prefixes?: string[],
  options?: IconifySearchOptions
): Promise<SearchIconResponse> => {
  const endpoint = `${API_URL}/search`;
  const queryParts = [query.trim()];

  if (options?.palette === 'mono') {
    queryParts.push('palette=false');
  }
  if (options?.palette === 'multicolor') {
    queryParts.push('palette=true');
  }
  if (options?.style && options.style !== 'any') {
    queryParts.push(`style=${options.style}`);
  }

  const params: Record<string, any> = {
    query: queryParts.join(' ').trim(),
    pretty: 1,
    limit,
    start,
  };
  if (prefixes && prefixes.length > 0) {
    params.prefixes = prefixes.join(',');
  }
  if (options?.category) {
    params.category = options.category;
  }
  try {
    const response = await axios.get(endpoint, { params });
    return {
      data: response.data,
      success: true,
    }
  } catch (error) {
    console.error(`[Iconify API - searchIcon] Catch Error: `, error);
    return {
      success: false,
      error: {
        message: "Unexpected error occurred while searching icons. View console logs for more details.",
      }
    }
  }
}


type GetIconResponse = IconifyAPIResponse<IconifyIconSetList>
export const getIconSetByPrefixes = async (prefixes?: string): Promise<GetIconResponse> => {
  const endpoint = `${API_URL}/collections`;

  const params = {
    prefixes,
    pretty: 1,
  }

  try {
    const response = await axios.get(endpoint, { params });
    return {
      data: response.data,
      success: true,
    }
  } catch (error) {
    console.error(`[Iconify API - getIconSetByPrefixes] Catch Error: `, error);

    return {
      success: false,
      error: {
        message: "Unexpected error occurred while fetching icon set. View console logs for more details.",
      }
    }
  }
}

export const getIconsInCollection = async (prefix: string): Promise<CollectionResponse> => {
  const cachedCollection = collectionCache.get(prefix);
  if (cachedCollection) {
    return {
      success: true,
      data: cachedCollection,
    };
  }

  const endpoint = `${API_URL}/collection`;

  try {
    const pendingRequest = collectionIconNamesRequests.get(prefix) ?? axios.get(endpoint, {
      params: {
        prefix,
        pretty: 1,
      },
    }).then((response) => {
      const data = response.data as CollectionResponse['data'];
      const iconNames = [
        ...(data?.uncategorized ?? []),
        ...Object.values(data?.categories ?? {}).flat(),
        ...Object.keys(data?.aliases ?? {}),
      ];
      const uniqueIcons = Array.from(new Set(iconNames));
      const normalizedCollection = {
        prefix,
        total: data?.total ?? uniqueIcons.length,
        title: data?.title,
        info: data?.info,
        uncategorized: uniqueIcons,
        categories: data?.categories,
        aliases: data?.aliases,
        hidden: data?.hidden,
        themes: data?.themes,
        prefixes: data?.prefixes,
        suffixes: data?.suffixes,
      } satisfies NonNullable<CollectionResponse['data']>;
      collectionCache.set(prefix, normalizedCollection);

      return {
        success: true,
        data: normalizedCollection,
      } satisfies CollectionResponse;
    }).finally(() => {
      collectionIconNamesRequests.delete(prefix);
    });

    collectionIconNamesRequests.set(prefix, pendingRequest);

    const response = await pendingRequest;

    return response;
  } catch (error) {
    console.error(`[Iconify API - getIconsInCollection] Catch Error: `, error);

    return {
      success: false,
      error: {
        message: "Unexpected error occurred while fetching collection icons. View console logs for more details.",
      }
    }
  }
}

const ICON_DATA_BATCH_SIZE = 80;

const chunkIcons = (icons: string[], chunkSize: number) => {
  const chunks: string[][] = [];
  for (let index = 0; index < icons.length; index += chunkSize) {
    chunks.push(icons.slice(index, index + chunkSize));
  }
  return chunks;
};

export const preloadCollectionIcons = async (prefix: string, icons: string[]): Promise<void> => {
  const normalizedIcons = Array.from(
    new Set(
      icons
        .map((icon) => icon.trim())
        .filter(Boolean)
    )
  );

  if (normalizedIcons.length === 0) {
    return;
  }

  const cachedIcons = iconDataCache.get(prefix) ?? new Set<string>();
  iconDataCache.set(prefix, cachedIcons);

  const missingIcons = normalizedIcons.filter((icon) => !cachedIcons.has(icon));
  if (missingIcons.length === 0) {
    return;
  }

  const batches = chunkIcons(missingIcons, ICON_DATA_BATCH_SIZE);

  await Promise.all(
    batches.map((batch) => {
      const requestKey = `${prefix}:${batch.join(',')}`;
      const existingRequest = iconDataRequests.get(requestKey);
      if (existingRequest) {
        return existingRequest;
      }

      const request = axios
        .get<IconifyJSON>(`${API_URL}/${prefix}.json`, {
          params: {
            icons: batch.join(','),
          },
        })
        .then((response) => {
          addCollection(response.data);
          batch.forEach((icon) => {
            cachedIcons.add(icon);
          });
        })
        .finally(() => {
          iconDataRequests.delete(requestKey);
        });

      iconDataRequests.set(requestKey, request);
      return request;
    })
  );
};
