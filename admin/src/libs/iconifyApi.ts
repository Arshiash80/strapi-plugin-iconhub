import type { IconifyInfo } from '@iconify/types';
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
  limit: number = 50
): Promise<SearchIconResponse> => {
  const endpoint = `${API_URL}/search`;
  const params = {
    query,
    pretty: 1,
    limit,
    start,
  };
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