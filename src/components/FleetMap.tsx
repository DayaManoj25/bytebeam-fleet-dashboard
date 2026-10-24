import { useEffect, useMemo, useRef } from 'react';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Maximize2 } from 'lucide-react';
import type { Trip, TripPoint, Vehicle } from '../types';
import { SPEED_LIMIT, KOCHI_CENTER } from '../lib/constants';
import { analyzeRoute } from '../lib/routeEvents';
import { fmtTime } from '../lib/format';

const STATUS_COLOR = { moving: '#2563eb', idle: '#d97706', offline: '#64748b' } as const;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const speedColor = (v: number) => (v === 0 ? '#94a3b8' : v > SPEED_LIMIT ? '#ef4444' : v <= 30 ? '#38bdf8' : '#2563eb');

const TRUCK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>';

function vehicleIcon(v: Vehicle, attention: boolean, selected: boolean) {
  const size = selected ? 38 : 32;
  return L.divIcon({
    className: 'vehicle-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div class="vm${selected ? ' sel' : ''}${attention ? ' att' : ''}" style="background:${STATUS_COLOR[v.status]}">${TRUCK_SVG}</div><span class="vm-label">${esc(v.name)}</span>`,
  });
}

const pinIcon = (label: string, bg: string) =>
  L.divIcon({ className: 'pin-marker', iconSize: [24, 24], iconAnchor: [12, 12], html: `<div style="background:${bg}">${label}</div>` });

const cursorIcon = L.divIcon({ className: 'cursor-marker', iconSize: [20, 20], iconAnchor: [10, 10], html: '<div></div>' });

function Controller({ bounds, fitKey }: { bounds: L.LatLngBounds | null; fitKey: string }) {
  const map = useMap();
  const wasRoute = useRef(false);
  useEffect(() => {
    const isRoute = fitKey.startsWith('trip:');
    // Don't zoom back out to the whole fleet while the next route is still loading.
    if (!isRoute && wasRoute.current && !fitKey.startsWith('fleet!')) return;
    wasRoute.current = isRoute;
    if (bounds && bounds.isValid()) map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);
  useEffect(() => {
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [map]);
  return null;
}

function RouteLayer({ trip, points, cursor }: { trip: Trip; points: TripPoint[]; cursor: number | null }) {
  const { halts, overspeed } = useMemo(() => analyzeRoute(points), [points]);
  const segments = useMemo(() => {
    const out: { color: string; pos: [number, number][] }[] = [];
    for (let i = 1; i < points.length; i++) {
      const color = speedColor(points[i].speed);
      const a: [number, number] = [points[i - 1].lat, points[i - 1].lng];
      const b: [number, number] = [points[i].lat, points[i].lng];
      const last = out[out.length - 1];
      if (last && last.color === color) last.pos.push(b);
      else out.push({ color, pos: [a, b] });
    }
    return out;
  }, [points]);
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const cp = cursor !== null ? points[Math.min(cursor, points.length - 1)] : null;
  return (
    <>
      <Polyline positions={points.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: '#fff', weight: 9, opacity: 0.95 }} />
      {segments.map((s, i) => <Polyline key={i} positions={s.pos} pathOptions={{ color: s.color, weight: 5, opacity: 1, lineCap: 'round' }} />)}
      <Marker position={[first.lat, first.lng]} icon={pinIcon('A', '#16a34a')} zIndexOffset={400}>
        <Tooltip direction="top" offset={[0, -10]}>Start · {trip.start} · {fmtTime(first.t)}</Tooltip>
      </Marker>
      {!trip.endedAt ? null : (
        <Marker position={[last.lat, last.lng]} icon={pinIcon('B', '#0f172a')} zIndexOffset={400}>
          <Tooltip direction="top" offset={[0, -10]}>End · {trip.end} · {fmtTime(last.t)}</Tooltip>
        </Marker>
      )}
      {halts.map((h) => (
        <CircleMarker key={`h${h.seq}`} center={[h.lat, h.lng]} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#d97706', fillOpacity: 1 }}>
          <Tooltip direction="top">Halt · {h.minutes} min · {fmtTime(h.at)}</Tooltip>
        </CircleMarker>
      ))}
      {overspeed.map((o) => (
        <CircleMarker key={`o${o.seq}`} center={[o.lat, o.lng]} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }}>
          <Tooltip direction="top">Overspeed · {o.speed} km/h (limit {SPEED_LIMIT}) · {fmtTime(o.at)}</Tooltip>
        </CircleMarker>
      ))}
      {cp && (
        <Marker position={[cp.lat, cp.lng]} icon={cursorIcon} zIndexOffset={900}>
          <Tooltip permanent direction="right" offset={[12, 0]}>{cp.speed} km/h · {fmtTime(cp.t)}</Tooltip>
        </Marker>
      )}
    </>
  );
}

export interface RouteView { trip: Trip; points: TripPoint[] }

interface Props {
  vehicles: Vehicle[];
  attention: Set<string>;
  selectedId: string | null;
  onSelect?: (id: string) => void;
  route: RouteView | null;
  showVehicles: boolean;
  cursor?: number | null;
  resetKey?: number;
  onFitFleet?: () => void;
  height?: number | string;
}

export default function FleetMap({ vehicles, attention, selectedId, onSelect, route, showVehicles, cursor = null, resetKey = 0, onFitFleet, height }: Props) {
  const bounds = useMemo(() => {
    const pts: [number, number][] = route && route.points.length > 1 ? route.points.map((p) => [p.lat, p.lng]) : vehicles.map((v) => [v.lat, v.lng]);
    return pts.length ? L.latLngBounds(pts) : null;
  }, [route, vehicles]);
  const fitKey = route && route.points.length > 1 ? `trip:${route.trip.id}` : `fleet!${resetKey}`;
  return (
    <div className="map-wrap" style={height ? { height, minHeight: 0 } : undefined}>
      <MapContainer center={KOCHI_CENTER} zoom={11} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Controller bounds={bounds} fitKey={fitKey} />
        {route && <RouteLayer trip={route.trip} points={route.points} cursor={cursor} />}
        {showVehicles && vehicles.map((v) => (
          <Marker
            key={v.id}
            position={[v.lat, v.lng]}
            icon={vehicleIcon(v, attention.has(v.id), v.id === selectedId)}
            zIndexOffset={v.id === selectedId ? 1000 : attention.has(v.id) ? 500 : 0}
            eventHandlers={{ click: () => onSelect?.(v.id) }}
          >
            <Popup><b>{v.name}</b><br />{v.plate}<br />{v.status === 'moving' ? `Moving · ${v.speed} km/h` : v.status === 'idle' ? 'Idle' : 'Offline'}</Popup>
          </Marker>
        ))}
      </MapContainer>
      {onFitFleet && (
        <button className="map-fit" onClick={onFitFleet} title="Fit all vehicles" aria-label="Fit all vehicles"><Maximize2 size={15} /></button>
      )}
      <div className="map-legend" aria-label="Map legend">
        {showVehicles && (
          <>
            <span><i className="legend-dot blue" />Moving</span>
            <span><i className="legend-dot amber" />Idle</span>
            <span><i className="legend-dot gray" />Offline</span>
            <span><i className="legend-ring" />Needs attention</span>
          </>
        )}
        {route && route.points.length > 1 && (
          <>
            <span><i className="legend-line" style={{ background: '#38bdf8' }} />≤30 km/h</span>
            <span><i className="legend-line" style={{ background: '#2563eb' }} />30–{SPEED_LIMIT}</span>
            <span><i className="legend-line" style={{ background: '#ef4444' }} />&gt;{SPEED_LIMIT}</span>
            <span><i className="legend-dot amber" />Halt</span>
            <span><i className="legend-dot red" />Overspeed</span>
          </>
        )}
      </div>
    </div>
  );
}
