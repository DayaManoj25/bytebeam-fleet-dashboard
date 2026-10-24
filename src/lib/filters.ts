import type { Trip, Vehicle } from '../types';

export type VehicleFilter = 'all' | 'moving' | 'idle' | 'offline' | 'attention';
export const VEHICLE_FILTERS: { key: VehicleFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'moving', label: 'Moving' },
  { key: 'idle', label: 'Idle' },
  { key: 'offline', label: 'Offline' },
];

export function vehicleCounts(vehicles: Vehicle[], attention: Set<string>): Record<VehicleFilter, number> {
  return {
    all: vehicles.length,
    moving: vehicles.filter((v) => v.status === 'moving').length,
    idle: vehicles.filter((v) => v.status === 'idle').length,
    offline: vehicles.filter((v) => v.status === 'offline').length,
    attention: vehicles.filter((v) => attention.has(v.id)).length,
  };
}

export function filterVehicles(vehicles: Vehicle[], filter: VehicleFilter, search: string, attention: Set<string>): Vehicle[] {
  const q = search.trim().toLowerCase();
  return vehicles.filter((v) => {
    const okFilter = filter === 'all' || (filter === 'attention' ? attention.has(v.id) : v.status === filter);
    return okFilter && (!q || `${v.name} ${v.plate} ${v.driver}`.toLowerCase().includes(q));
  });
}

/** Distance and trip count for a vehicle in the 24 h before the data snapshot. */
export function last24h(trips: Trip[], vehicleId: string, now: number) {
  const mine = trips.filter((t) => t.vehicleId === vehicleId && now - new Date(t.startedAt).getTime() <= 86400000);
  return { distance: mine.reduce((s, t) => s + t.distance, 0), count: mine.length };
}
