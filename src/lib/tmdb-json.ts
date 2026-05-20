import { constants, gunzipSync } from 'node:zlib';

const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL ?? 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface TmdbJsonOptions extends RequestInit {
  language?: string | null;
  next?: { revalidate?: number };
  revalidate?: number;
}

function appendTmdbParams(endpoint: string, language: string | null | undefined) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const params = new URLSearchParams();
  if (API_KEY) params.set('api_key', API_KEY);
  if (language) params.set('language', language);
  return `${BASE_URL}${endpoint}${separator}${params.toString()}`;
}

function decodeResponseBody(buffer: ArrayBuffer) {
  let bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    bytes = gunzipSync(bytes, { finishFlush: constants.Z_SYNC_FLUSH });
  }
  return new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
}

export async function fetchTmdbJson<T = unknown>(
  endpoint: string,
  options: TmdbJsonOptions = {},
): Promise<T | null> {
  if (!API_KEY) return null;

  const { language = 'en-US', revalidate, headers, ...fetchOptions } = options;
  const url = appendTmdbParams(endpoint, language);
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json');

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: requestHeaders,
      next: revalidate ? { revalidate } : fetchOptions.next,
    });

    if (!response.ok) {
      console.warn(`[TMDB] HTTP ${response.status} for ${endpoint}`);
      return null;
    }

    const body = decodeResponseBody(await response.arrayBuffer()).trim();
    if (!body) return null;
    return JSON.parse(body) as T;
  } catch (error) {
    console.error(`[TMDB] Failed to parse JSON for ${endpoint}:`, error);
    return null;
  }
}

export function hasTmdbKey() {
  return Boolean(API_KEY);
}
