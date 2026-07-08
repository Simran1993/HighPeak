/**
 * Live flight tracking via the free OpenSky Network API (no key required).
 * https://openskynetwork.github.io/opensky-api/rest.html
 *
 * - Look up a flight by number (e.g. "AI302", "UA84") or raw callsign ("AIC302").
 * - Last successful result is cached in localStorage, so if you lose
 *   connectivity the tracker still shows the last known position.
 *
 * Anonymous access is rate-limited (~400 credits/day); we poll gently.
 */

export interface FlightState {
  icao24: string;
  callsign: string;
  originCountry: string;
  longitude: number;
  latitude: number;
  baroAltitude: number | null; // meters
  onGround: boolean;
  velocity: number | null; // m/s
  heading: number | null; // degrees clockwise from north
  verticalRate: number | null; // m/s
  lastContact: number; // unix seconds
}

export interface TrackResult {
  query: string;
  fetchedAt: number; // unix ms
  matches: FlightState[];
  /** true when served from the offline cache */
  fromCache?: boolean;
}

/** IATA airline code → ICAO callsign prefix (common carriers). */
const IATA_TO_ICAO: Record<string, string> = {
  AI: 'AIC', IX: 'AXB', '6E': 'IGO', SG: 'SEJ', UK: 'VTI', QP: 'AKJ',
  UA: 'UAL', AA: 'AAL', DL: 'DAL', WN: 'SWA', B6: 'JBU', AS: 'ASA',
  F9: 'FFT', NK: 'NKS', HA: 'HAL', AC: 'ACA', WS: 'WJA', AM: 'AMX',
  BA: 'BAW', LH: 'DLH', AF: 'AFR', KL: 'KLM', IB: 'IBE', AZ: 'ITY',
  LX: 'SWR', OS: 'AUA', SK: 'SAS', AY: 'FIN', VS: 'VIR', TP: 'TAP',
  EI: 'EIN', U2: 'EZY', FR: 'RYR', W6: 'WZZ', TK: 'THY', LO: 'LOT',
  EK: 'UAE', QR: 'QTR', EY: 'ETD', SV: 'SVA', MS: 'MSR', ET: 'ETH',
  SA: 'SAA', KQ: 'KQA', SQ: 'SIA', CX: 'CPA', NH: 'ANA', JL: 'JAL',
  KE: 'KAL', OZ: 'AAR', TG: 'THA', MH: 'MAS', GA: 'GIA', VN: 'HVN',
  PR: 'PAL', CI: 'CAL', BR: 'EVA', CA: 'CCA', MU: 'CES', CZ: 'CSN',
  HU: 'CHH', QF: 'QFA', NZ: 'ANZ', VA: 'VOZ', LA: 'LAN', AV: 'AVA',
  CM: 'CMP', AR: 'ARG', G3: 'GLO', AD: 'AZU',
};

const CACHE_KEY = 'highpeak-flight-cache-v1';

function loadCache(): Record<string, TrackResult> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveToCache(result: TrackResult) {
  try {
    const cache = loadCache();
    cache[result.query] = result;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* just a cache */
  }
}

export function getCached(query: string): TrackResult | null {
  const hit = loadCache()[normalizeQuery(query)];
  return hit ? { ...hit, fromCache: true } : null;
}

export function normalizeQuery(q: string) {
  return q.replace(/\s+/g, '').toUpperCase();
}

/** All plausible callsigns for a user-typed flight number. */
function candidateCallsigns(query: string): string[] {
  const q = normalizeQuery(query);
  const candidates = new Set<string>([q]);
  const m = q.match(/^([A-Z0-9]{2})(\d{1,4})([A-Z]?)$/);
  if (m) {
    const [, airline, num, suffix] = m;
    const icao = IATA_TO_ICAO[airline];
    if (icao) {
      candidates.add(`${icao}${num}${suffix}`);
      candidates.add(`${icao}${Number(num)}${suffix}`); // strip leading zeros
    }
  }
  return [...candidates];
}

// OpenSky state vector array indices
type RawState = [
  string, string | null, string, number | null, number,
  number | null, number | null, number | null, boolean,
  number | null, number | null, number | null, ...unknown[],
];

/**
 * Fetch all live aircraft and filter by callsign. Returns cached data
 * (marked fromCache) if the network is unreachable.
 */
export async function trackFlight(query: string): Promise<TrackResult> {
  const normalized = normalizeQuery(query);
  const candidates = candidateCallsigns(normalized);

  let data: { time: number; states: RawState[] | null };
  try {
    const res = await fetch('https://opensky-network.org/api/states/all', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`OpenSky returned ${res.status}`);
    data = await res.json();
  } catch (err) {
    const cached = getCached(normalized);
    if (cached) return cached;
    throw err;
  }

  const matches: FlightState[] = (data.states ?? [])
    .filter((s) => {
      const cs = (s[1] ?? '').replace(/\s+/g, '').toUpperCase();
      return cs && candidates.includes(cs) && s[5] != null && s[6] != null;
    })
    .map((s) => ({
      icao24: s[0],
      callsign: (s[1] ?? '').trim(),
      originCountry: s[2],
      longitude: s[5]!,
      latitude: s[6]!,
      baroAltitude: s[7],
      onGround: s[8],
      velocity: s[9],
      heading: s[10],
      verticalRate: s[11] as number | null,
      lastContact: s[4],
    }));

  const result: TrackResult = { query: normalized, fetchedAt: Date.now(), matches };
  if (matches.length) saveToCache(result);
  return result;
}

// Display helpers
export const mToFt = (m: number) => Math.round(m * 3.28084);
export const msToKmh = (ms: number) => Math.round(ms * 3.6);
export const msToKts = (ms: number) => Math.round(ms * 1.94384);
