import { supabase } from '../supabase';
import type { Fleet, Trip, TripPoint, Vehicle } from '../types';
import demo from '../demo/fleet.json';

type Row = Record<string, any>;

const mapVehicle = (x: Row): Vehicle => ({
  id: x.id, name: x.name, plate: x.plate, type: x.vehicle_type ?? 'van', driver: x.drivers?.name ?? 'Unassigned',
  status: x.status, statusSince: x.status_since ?? x.last_seen, lat: x.latitude, lng: x.longitude, speed: Number(x.speed_kph),
  fuel: x.fuel_percent, battery: x.battery_percent, ignition: x.ignition, health: x.health_score, lastSeen: x.last_seen,
});

const mapTrip = (x: Row): Trip => ({
  id: x.id, vehicleId: x.vehicle_id, vehicle: x.vehicles?.name ?? 'Vehicle', plate: x.vehicles?.plate ?? '', driver: x.drivers?.name ?? 'Unassigned',
  start: x.start_location, end: x.end_location, startLat: x.start_lat, startLng: x.start_lng, endLat: x.end_lat, endLng: x.end_lng,
  startedAt: x.started_at, endedAt: x.ended_at, distance: Number(x.distance_km), duration: x.duration_minutes,
  avgSpeed: Number(x.avg_speed_kph), maxSpeed: Number(x.max_speed_kph), halts: x.halt_count, idleMinutes: x.idle_minutes, overspeed: x.overspeed_events,
});

export async function loadFleet(): Promise<Fleet> {
  if (!supabase) return { vehicles: demo.vehicles as Vehicle[], trips: demo.trips as Trip[] };
  const [v, t] = await Promise.all([
    supabase.from('vehicles').select('*, drivers(name)').order('name'),
    supabase.from('trips').select('*, vehicles(name, plate), drivers(name)').order('started_at', { ascending: false }).limit(200),
  ]);
  if (v.error) throw v.error;
  if (t.error) throw t.error;
  return { vehicles: (v.data ?? []).map(mapVehicle), trips: (t.data ?? []).map(mapTrip) };
}

const pointCache = new Map<string, TripPoint[]>();

export async function loadTripPoints(tripId: string): Promise<TripPoint[]> {
  const hit = pointCache.get(tripId);
  if (hit) return hit;
  let pts: TripPoint[];
  if (!supabase) {
    const raw = (demo.points as unknown as Record<string, [number, string, number, number, number][]>)[tripId] ?? [];
    pts = raw.map(([seq, t, lat, lng, speed]) => ({ seq, t, lat, lng, speed }));
  } else {
    const { data, error } = await supabase.from('trip_points').select('seq, recorded_at, latitude, longitude, speed_kph').eq('trip_id', tripId).order('seq');
    if (error) throw error;
    pts = (data ?? []).map((p) => ({ seq: p.seq, t: p.recorded_at, lat: p.latitude, lng: p.longitude, speed: Number(p.speed_kph) }));
  }
  pointCache.set(tripId, pts);
  return pts;
}
