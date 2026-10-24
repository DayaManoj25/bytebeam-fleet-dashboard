import type { TripPoint } from '../types';
import { SPEED_LIMIT } from './constants';

export interface Halt { seq: number; lat: number; lng: number; minutes: number; at: string }
export interface Overspeed { seq: number; lat: number; lng: number; speed: number; at: string }

/** Same definitions as scripts/generate-seed.mjs: a halt is >=2 consecutive zero-speed pings;
 *  an overspeed event is a run of pings above SPEED_LIMIT (reported at its peak). */
export function analyzeRoute(points: TripPoint[]): { halts: Halt[]; overspeed: Overspeed[] } {
  const halts: Halt[] = [];
  const overspeed: Overspeed[] = [];
  for (let i = 0; i < points.length;) {
    if (points[i].speed === 0) {
      let j = i;
      while (j < points.length && points[j].speed === 0) j++;
      if (j - i >= 2) halts.push({ seq: points[i].seq, lat: points[i].lat, lng: points[i].lng, minutes: j - i - 1, at: points[i].t });
      i = j;
    } else i++;
  }
  for (let i = 0; i < points.length;) {
    if (points[i].speed > SPEED_LIMIT) {
      let j = i, peak = points[i];
      while (j < points.length && points[j].speed > SPEED_LIMIT) { if (points[j].speed > peak.speed) peak = points[j]; j++; }
      overspeed.push({ seq: peak.seq, lat: peak.lat, lng: peak.lng, speed: peak.speed, at: peak.t });
      i = j;
    } else i++;
  }
  return { halts, overspeed };
}
