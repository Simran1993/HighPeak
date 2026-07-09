import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowDown, ArrowUp, Compass, Gauge, Mountain, Plane, Search, WifiOff } from 'lucide-react';
import {
  getCached,
  msToKmh,
  msToKts,
  mToFt,
  normalizeQuery,
  trackFlight,
  type FlightState,
  type TrackResult,
} from '@/lib/flights';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, PageSpinner } from '@/components/ui/Spinner';
import { cn, timeAgo } from '@/lib/utils';

const REFRESH_MS = 20_000;

function planeIcon(heading: number | null) {
  return L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div style="transform: rotate(${heading ?? 0}deg); width:36px; height:36px; display:flex; align-items:center; justify-content:center; filter: drop-shadow(0 1px 2px rgb(0 0 0 / .4));">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#1b6af5" stroke="white" stroke-width="0.8">
        <path d="M12 1 L14 8 L22 13 L22 15 L14 12.5 L13.5 19 L16 21 L16 22.5 L12 21.5 L8 22.5 L8 21 L10.5 19 L10 12.5 L2 15 L2 13 L10 8 Z"/>
      </svg>
    </div>`,
  });
}

function FollowPlane({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 6), { animate: true });
  }, [map, position[0], position[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
        {icon} {label}
      </p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function FlightInfo({ flight, result }: { flight: FlightState; result: TrackResult }) {
  const trail = useRef<[number, number][]>([]);
  const pos: [number, number] = [flight.latitude, flight.longitude];

  const last = trail.current[trail.current.length - 1];
  if (!last || last[0] !== pos[0] || last[1] !== pos[1]) {
    trail.current = [...trail.current.slice(-100), pos];
  }

  return (
    <div className="space-y-4">
      {result.fromCache && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <WifiOff className="h-4 w-4 shrink-0" />
          You appear to be offline — showing the last known position from{' '}
          {timeAgo(new Date(result.fetchedAt).toISOString())}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<Mountain className="h-3.5 w-3.5" />}
          label="Altitude"
          value={
            flight.onGround
              ? 'On ground'
              : flight.baroAltitude != null
                ? `${mToFt(flight.baroAltitude).toLocaleString()} ft`
                : '—'
          }
        />
        <Stat
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Speed"
          value={flight.velocity != null ? `${msToKmh(flight.velocity)} km/h (${msToKts(flight.velocity)} kt)` : '—'}
        />
        <Stat
          icon={<Compass className="h-3.5 w-3.5" />}
          label="Heading"
          value={flight.heading != null ? `${Math.round(flight.heading)}°` : '—'}
        />
        <Stat
          icon={
            (flight.verticalRate ?? 0) < 0 ? (
              <ArrowDown className="h-3.5 w-3.5" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )
          }
          label="Vertical rate"
          value={flight.verticalRate != null ? `${Math.round(flight.verticalRate)} m/s` : 'Level'}
        />
      </div>

      <div className="h-[420px] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <MapContainer center={pos} zoom={6} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FollowPlane position={pos} />
          {trail.current.length > 1 && (
            <Polyline positions={trail.current} pathOptions={{ color: '#1b6af5', weight: 2, dashArray: '6 6' }} />
          )}
          <Marker position={pos} icon={planeIcon(flight.heading)}>
            <Popup>
              <strong>{flight.callsign || 'Unknown callsign'}</strong>
              <br />
              {flight.originCountry}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400">
        Callsign {flight.callsign || '—'} · Registered in {flight.originCountry} · Transponder{' '}
        {flight.icao24.toUpperCase()} · Last signal {timeAgo(new Date(flight.lastContact * 1000).toISOString())} ·
        Data: OpenSky Network (updates every ~{REFRESH_MS / 1000}s)
      </p>
    </div>
  );
}

export function FlightTrackerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('q') ?? '';
  const [input, setInput] = useState(active);

  useEffect(() => setInput(active), [active]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['flight-track', normalizeQuery(active)],
    queryFn: () => trackFlight(active),
    enabled: !!active,
    refetchInterval: REFRESH_MS,
    retry: 1,
    // keep showing the previous position while refetching
    placeholderData: (prev) => prev,
  });

  const cached = useMemo(() => (active && isError ? getCached(active) : null), [active, isError]);
  const result = data ?? cached;
  const flight = result?.matches.find((m) => !m.onGround) ?? result?.matches[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Flight tracker</h1>
        <p className="text-sm text-gray-500">
          Live position of any airborne flight — enter a flight number like{' '}
          <button className="font-mono text-brand-600" onClick={() => setSearchParams({ q: 'AI302' })}>
            AI302
          </button>{' '}
          or a callsign like <span className="font-mono">UAL1</span>. The last position is saved, so
          you can still check it offline.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) setSearchParams({ q: normalizeQuery(input) });
        }}
        className="mb-6 flex gap-3"
      >
        <div className="relative flex-1">
          <Plane className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10 font-mono uppercase"
            placeholder="Flight number, e.g. AI302, UA84, 6E204"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <Button type="submit">
          <Search className="h-4 w-4" /> Track
        </Button>
      </form>

      {!active ? (
        <EmptyState
          emoji="✈️"
          title="Track a flight"
          subtitle="Works for most airborne commercial flights worldwide. Tip: add your flight as a Transport activity in your itinerary and you'll get a Track button there too."
        />
      ) : isLoading && !result ? (
        <PageSpinner label="Scanning the skies…" />
      ) : !result || !flight ? (
        isError && !cached ? (
          <EmptyState
            emoji="📡"
            title="Couldn't reach the tracking service"
            subtitle={`${(error as Error)?.message ?? 'Network error'} — OpenSky may be rate-limiting anonymous requests. Try again in a minute.`}
          />
        ) : (
          <EmptyState
            emoji="🔍"
            title={`No live signal for ${active}`}
            subtitle="The flight may not be airborne yet, already landed, or outside receiver coverage. Try again closer to departure — and check the airline code (e.g. AI302, not just 302)."
          />
        )
      ) : (
        <FlightInfo flight={flight} result={result} />
      )}

      {result && result.matches.length > 1 && (
        <p className={cn('mt-3 text-xs text-gray-400')}>
          {result.matches.length} aircraft matched this callsign; showing the airborne one.
        </p>
      )}
    </div>
  );
}
