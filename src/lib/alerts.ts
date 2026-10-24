import type { AlertSeverity, FleetAlert, Trip, Vehicle } from '../types';
import { CRITICAL_FUEL, LONG_IDLE_MIN, LOW_BATTERY, LOW_FUEL, OVERSPEED_WINDOW_MIN, POOR_HEALTH, SPEED_LIMIT } from './constants';
import { relTime } from './format';

const rank: Record<AlertSeverity, number> = { critical: 0, warning: 1 };

/**
 * Derives operational alerts from current vehicle state and recent trips.
 * Alerts are computed (not stored) so thresholds live in one place: src/lib/constants.ts.
 */
export function deriveAlerts(vehicles: Vehicle[], trips: Trip[], ref: number): FleetAlert[] {
  const out: FleetAlert[] = [];
  const base = (v: Vehicle) => ({ vehicleId: v.id, vehicle: v.name, plate: v.plate });

  for (const v of vehicles) {
    if (v.status === 'offline') {
      out.push({
        ...base(v), id: `${v.id}:offline`, kind: 'offline', severity: 'critical', title: 'Vehicle offline',
        detail: `Last seen ${relTime(v.lastSeen, ref)} · battery ${v.battery}%`, at: v.lastSeen,
      });
    }
    if (v.fuel < LOW_FUEL) {
      out.push({
        ...base(v), id: `${v.id}:fuel`, kind: 'low_fuel', severity: v.fuel < CRITICAL_FUEL ? 'critical' : 'warning',
        title: 'Low fuel', detail: `${v.fuel}% fuel remaining`, at: v.lastSeen,
      });
    }
    if (v.battery < LOW_BATTERY) {
      out.push({
        ...base(v), id: `${v.id}:battery`, kind: 'low_battery', severity: 'warning',
        title: 'Low battery', detail: `${v.battery}% battery remaining`, at: v.lastSeen,
      });
    }
    if (v.health < POOR_HEALTH) {
      out.push({
        ...base(v), id: `${v.id}:health`, kind: 'poor_health', severity: v.health < 50 ? 'critical' : 'warning',
        title: 'Vehicle health degraded', detail: `Health score ${v.health}/100 – schedule a service check`, at: v.lastSeen,
      });
    }
    if (v.status === 'idle' && v.ignition) {
      const idleMin = Math.round((ref - new Date(v.statusSince).getTime()) / 60000);
      if (idleMin >= LONG_IDLE_MIN) {
        out.push({
          ...base(v), id: `${v.id}:idle`, kind: 'long_idle', severity: 'warning', title: 'Long idle with engine on',
          detail: `Stationary ${idleMin} min with ignition on – wasting fuel`, at: v.statusSince,
        });
      }
    }
  }

  // Overspeed: one alert per vehicle summarising recent trips.
  for (const v of vehicles) {
    const recent = trips.filter((t) => t.vehicleId === v.id && t.overspeed > 0 && ref - new Date(t.startedAt).getTime() <= OVERSPEED_WINDOW_MIN * 60000);
    const speedingNow = v.status === 'moving' && v.speed > SPEED_LIMIT;
    if (!recent.length && !speedingNow) continue;
    const events = recent.reduce((n, t) => n + t.overspeed, 0);
    const worst = recent.slice().sort((a, b) => b.maxSpeed - a.maxSpeed)[0];
    const parts = [];
    if (speedingNow) parts.push(`Now at ${v.speed} km/h (limit ${SPEED_LIMIT})`);
    if (events) parts.push(`${events} overspeed event${events > 1 ? 's' : ''} in ${recent.length} trip${recent.length > 1 ? 's' : ''}, max ${worst.maxSpeed} km/h`);
    out.push({
      ...base(v), id: `${v.id}:overspeed`, kind: 'overspeed', severity: speedingNow ? 'critical' : 'warning',
      title: speedingNow ? 'Overspeeding now' : 'Recent overspeeding', detail: parts.join(' · '),
      at: speedingNow ? v.lastSeen : worst.startedAt, tripId: worst?.id,
    });
  }

  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || new Date(b.at).getTime() - new Date(a.at).getTime());
}

export const attentionIds = (alerts: FleetAlert[]): Set<string> => new Set(alerts.map((a) => a.vehicleId));
