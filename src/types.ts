export type VehicleStatus = 'moving' | 'idle' | 'offline';
export type VehicleType = 'van' | 'truck';

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: VehicleType;
  driver: string;
  status: VehicleStatus;
  /** ISO time the vehicle entered its current status. */
  statusSince: string;
  lat: number;
  lng: number;
  speed: number;
  fuel: number;
  battery: number;
  ignition: boolean;
  health: number;
  /** ISO time of the last telemetry ping. */
  lastSeen: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  driver: string;
  start: string;
  end: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startedAt: string;
  /** null while the trip is still in progress. */
  endedAt: string | null;
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  halts: number;
  idleMinutes: number;
  overspeed: number;
}

export interface TripPoint {
  seq: number;
  t: string;
  lat: number;
  lng: number;
  speed: number;
}

export type AlertSeverity = 'critical' | 'warning';
export type AlertKind = 'offline' | 'low_fuel' | 'low_battery' | 'poor_health' | 'long_idle' | 'overspeed';

export interface FleetAlert {
  id: string;
  vehicleId: string;
  vehicle: string;
  plate: string;
  kind: AlertKind;
  severity: AlertSeverity;
  title: string;
  detail: string;
  /** ISO time the condition was observed. */
  at: string;
  tripId?: string;
}

export interface Fleet {
  vehicles: Vehicle[];
  trips: Trip[];
}

export type Tab = 'overview' | 'vehicles' | 'trips' | 'alerts' | 'settings';
