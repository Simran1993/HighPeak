import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useQueries } from '@tanstack/react-query';
import { geocode } from '@/lib/geocode';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';

// Fix default marker icons under bundlers (Leaflet's asset paths break in Vite)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export interface MapPin {
  /** free-text location that will be geocoded */
  query: string;
  label: string;
  sublabel?: string;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

interface TripMapProps {
  /** primary destination — used as fallback center */
  destination?: string | null;
  pins?: MapPin[];
  className?: string;
  interactive?: boolean;
}

/**
 * Leaflet + OpenStreetMap map. Geocodes the destination and every pin
 * via Nominatim (cached). Renders as a background/hero map or an
 * interactive itinerary map depending on `interactive`.
 */
export function TripMap({ destination, pins = [], className, interactive = true }: TripMapProps) {
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.geocode(destination ?? ''),
        queryFn: () => geocode(destination!),
        enabled: !!destination,
        staleTime: Infinity,
        retry: false,
      },
      ...pins.map((pin) => ({
        queryKey: queryKeys.geocode(`${pin.query}|${destination ?? ''}`),
        queryFn: () => geocode(pin.query.includes(',') ? pin.query : `${pin.query}, ${destination ?? ''}`),
        enabled: !!pin.query,
        staleTime: Infinity,
        retry: false,
      })),
    ],
  });

  const destPoint = queries[0]?.data ?? null;
  const pinPoints = useMemo(
    () =>
      pins
        .map((pin, i) => ({ pin, point: queries[i + 1]?.data }))
        .filter((p): p is { pin: MapPin; point: NonNullable<typeof p.point> } => !!p.point),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pins, queries.map((q) => q.data).join('|')],
  );

  const allCoords: [number, number][] = pinPoints.length
    ? pinPoints.map(({ point }) => [point.lat, point.lon])
    : destPoint
      ? [[destPoint.lat, destPoint.lon]]
      : [];

  const center: [number, number] = allCoords[0] ?? [20, 0];

  return (
    <MapContainer
      center={center}
      zoom={allCoords.length ? 11 : 2}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      attributionControl
      className={cn('h-full w-full', className)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={allCoords} />
      {pinPoints.map(({ pin, point }, i) => (
        <Marker key={`${pin.query}-${i}`} position={[point.lat, point.lon]}>
          <Popup>
            <strong>{pin.label}</strong>
            {pin.sublabel && (
              <>
                <br />
                <span className="text-gray-500">{pin.sublabel}</span>
              </>
            )}
          </Popup>
        </Marker>
      ))}
      {pinPoints.length === 0 && destPoint && (
        <Marker position={[destPoint.lat, destPoint.lon]}>
          <Popup>{destination}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
