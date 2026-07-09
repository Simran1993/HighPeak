/**
 * Free geocoding via OpenStreetMap Nominatim.
 * Usage policy: max 1 req/sec, identify the app. Results are cached
 * aggressively (React Query staleTime: Infinity + localStorage layer).
 */

export interface GeoPoint {
  lat: number;
  lon: number;
  displayName: string;
}

const CACHE_KEY = 'highpeak-geocache-v1';

function loadCache(): Record<string, GeoPoint | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, GeoPoint | null>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* storage full — fine, it's just a cache */
  }
}

let queue: Promise<unknown> = Promise.resolve();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function geocode(query: string): Promise<GeoPoint | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;

  const cache = loadCache();
  if (key in cache) return cache[key];

  // serialize requests ≥1s apart per Nominatim policy
  const result = queue.then(async () => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
      { headers: { Accept: 'application/json' } },
    );
    await delay(1100);
    if (!res.ok) return null;
    const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lon: Number(data[0].lon), displayName: data[0].display_name };
  });
  queue = result.catch(() => undefined);

  const point = await result.catch(() => null);
  const freshCache = loadCache();
  freshCache[key] = point;
  saveCache(freshCache);
  return point;
}
