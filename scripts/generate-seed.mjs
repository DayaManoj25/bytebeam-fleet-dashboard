// Generates deterministic, plausible Kochi fleet data.
//   node scripts/generate-seed.mjs
// Writes:
//   supabase/seed.sql      (relative to now(), run once in the Supabase SQL editor)
//   src/demo/fleet.json    (offline demo mode, absolute timestamps)
//
// Route geometry is hand-placed waypoints smoothed with a Catmull-Rom spline (not
// road-snapped). Per-trip stats are computed FROM the generated points so the trip
// table and the map always agree.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEED_LIMIT = 60; // km/h, keep in sync with src/lib/constants.ts
const STEP_S = 60; // one telemetry point per minute
const SUB = 10; // spline samples per waypoint segment

let s = 20261024;
const rnd = () => {
  s |= 0; s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => a + (b - a) * rnd();
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const hav = (a, b) => {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// ---- Routes: [lat, lng, stopMinutes?] ----------------------------------------------
const ROUTES = {
  R1: { from: 'Kakkanad Hub', to: 'Fort Kochi', fast: false, wp: [
    [10.0159, 76.3419], [10.0085, 76.3375], [9.9990, 76.3330], [9.9875, 76.3262, 3], [9.9677, 76.3199],
    [9.9672, 76.3085], [9.9690, 76.2990, 4], [9.9690, 76.2890], [9.9660, 76.2760], [9.9628, 76.2634],
    [9.9575, 76.2590], [9.9610, 76.2490], [9.9658, 76.2421]] },
  R2: { from: 'Aluva Depot', to: 'Edappally', fast: true, wp: [
    [10.1004, 76.3570], [10.0870, 76.3470], [10.0750, 76.3340], [10.0640, 76.3250], [10.0535, 76.3187, 3],
    [10.0400, 76.3130], [10.0261, 76.3085]] },
  R3: { from: 'Kakkanad Hub', to: 'Thrippunithura', fast: false, wp: [
    [10.0159, 76.3419], [10.0050, 76.3380], [9.9950, 76.3330], [9.9800, 76.3260, 3], [9.9677, 76.3199],
    [9.9620, 76.3300], [9.9560, 76.3420], [9.9494, 76.3503]] },
  R4: { from: 'Vyttila', to: 'Kalamassery', fast: true, wp: [
    [9.9677, 76.3199], [9.9800, 76.3120], [9.9940, 76.3050], [10.0042, 76.3069, 3], [10.0150, 76.3080],
    [10.0261, 76.3085], [10.0400, 76.3130], [10.0535, 76.3187]] },
  R5: { from: 'Kakkanad Hub', to: 'Aluva Depot', fast: true, wp: [
    [10.0159, 76.3419], [10.0260, 76.3380], [10.0400, 76.3300], [10.0480, 76.3225, 3], [10.0640, 76.3250],
    [10.0750, 76.3340], [10.0870, 76.3470], [10.1004, 76.3570]] },
  R6: { from: 'Edappally', to: 'Fort Kochi', fast: false, wp: [
    [10.0261, 76.3085], [10.0150, 76.3040], [10.0042, 76.3000], [9.9941, 76.2960, 3], [9.9840, 76.2900],
    [9.9740, 76.2850], [9.9660, 76.2760], [9.9628, 76.2634], [9.9575, 76.2590], [9.9610, 76.2490],
    [9.9658, 76.2421]] },
};

function buildPath(route, reverse) {
  let wp = route.wp.map((w) => ({ p: [w[0], w[1]], stop: w[2] || 0 }));
  if (reverse) wp = wp.slice().reverse();
  const P = wp.map((w) => w.p);
  const at = (i) => P[clamp(i, 0, P.length - 1)];
  const dense = [];
  for (let i = 0; i < P.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      dense.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  dense.push(P[P.length - 1]);
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + hav(dense[i - 1], dense[i]));
  const stops = wp.map((w, i) => ({ d: cum[i * SUB], mins: w.stop })).filter((x) => x.mins > 0);
  return { dense, cum, stops, length: cum[cum.length - 1], from: reverse ? route.to : route.from, to: reverse ? route.from : route.to, fast: route.fast, start: P[0], end: P[P.length - 1] };
}

function posAt(path, d) {
  const { dense, cum } = path;
  if (d >= path.length) return dense[dense.length - 1];
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
  const f = (d - cum[lo]) / Math.max(cum[hi] - cum[lo], 1e-9);
  return [dense[lo][0] + (dense[hi][0] - dense[lo][0]) * f, dense[lo][1] + (dense[hi][1] - dense[lo][1]) * f];
}

function simulate(path, { cruise, speeder, maxSteps }) {
  const pts = [{ p: path.dense[0], v: 0 }];
  let d = 0, v = 0, hold = 0, burst = 0, lightDone = false;
  const stops = path.stops.map((x) => ({ ...x, done: false }));
  for (let step = 1; step < 400; step++) {
    if (maxSteps && step > maxSteps) break;
    const prev = d;
    if (hold > 0) { hold--; v = 0; }
    else {
      const frac = d / path.length;
      let target = cruise * between(0.8, 1.2);
      if (path.fast && frac > 0.12 && frac < 0.88) target *= 1.3;
      if (frac < 0.04 || frac > 0.96) target *= 0.55;
      target = Math.min(target, 57);
      if (speeder && path.fast && frac > 0.12 && frac < 0.88) {
        if (burst > 0) { burst--; target = between(65, 80); }
        else if (speeder === 'heavy' && rnd() < 0.25) { burst = Math.floor(between(1, 3)); target = between(65, 80); }
        else if (speeder === 'light' && !lightDone && frac > 0.2) { burst = 1; lightDone = true; target = between(64, 70); }
      }
      v = v + clamp(target - v, -20, 24);
      d += (v * STEP_S) / 3600;
      const stop = stops.find((x) => !x.done && prev < x.d && d >= x.d);
      if (stop) { stop.done = true; d = stop.d; v = 0; hold = stop.mins; }
    }
    if (d >= path.length) { pts.push({ p: path.end, v: 0 }); return { pts, done: true }; }
    pts.push({ p: posAt(path, d), v: Math.round(v) });
  }
  return { pts, done: false };
}

function stats(pts) {
  let dist = 0, max = 0, idle = 0, halts = 0, over = 0;
  for (let i = 1; i < pts.length; i++) dist += hav(pts[i - 1].p, pts[i].p);
  for (const x of pts) max = Math.max(max, x.v);
  for (let i = 0; i < pts.length;) {
    if (pts[i].v === 0) { let j = i; while (j < pts.length && pts[j].v === 0) j++; if (j - i >= 2) { halts++; idle += j - i - 1; } i = j; } else i++;
  }
  for (let i = 0; i < pts.length;) {
    if (pts[i].v > SPEED_LIMIT) { let j = i; while (j < pts.length && pts[j].v > SPEED_LIMIT) j++; over++; i = j; } else i++;
  }
  const dur = ((pts.length - 1) * STEP_S) / 60;
  return { distance: +dist.toFixed(1), duration: Math.round(dur), avg: +(dist / (dur / 60)).toFixed(1), max, halts, idle, over };
}

// ---- Fleet -----------------------------------------------------------------------
const DRIVERS = [
  ['Arun Kumar', '+91-90000-10001'], ['Rahul S', '+91-90000-10002'], ['Meera Nair', '+91-90000-10003'],
  ['Sanjay P', '+91-90000-10004'], ['Anjali R', '+91-90000-10005'], ['Faisal M', '+91-90000-10006'],
];
const VEHICLES = [
  { n: 'Van 01', plate: 'KL-07-BX-2401', type: 'van', status: 'moving', fuel: 72, battery: 96, health: 94, cruise: 38 },
  { n: 'Truck 02', plate: 'KL-07-BX-2402', type: 'truck', status: 'moving', fuel: 18, battery: 83, health: 61, cruise: 44 },
  { n: 'Van 03', plate: 'KL-07-BX-2403', type: 'van', status: 'idle', fuel: 54, battery: 91, health: 88, cruise: 34, ignitionIdle: true },
  { n: 'Truck 04', plate: 'KL-07-BX-2404', type: 'truck', status: 'moving', fuel: 63, battery: 77, health: 90, cruise: 40 },
  { n: 'Van 05', plate: 'KL-07-BX-2405', type: 'van', status: 'offline', fuel: 31, battery: 22, health: 45, cruise: 36, offlineAgoMin: 125 },
  { n: 'Truck 06', plate: 'KL-07-BX-2406', type: 'truck', status: 'moving', fuel: 81, battery: 88, health: 92, cruise: 42 },
];
// [vehicleIdx, route, reverse, spec, speeder]
const SCHEDULE = [
  [0, 'R1', 0, { elapsed: 30 }], [0, 'R1', 1, { endsAgo: 100 }], [0, 'R3', 0, { endsAgo: 250 }], [0, 'R3', 1, { endsAgo: 340 }],
  [0, 'R5', 0, { endsAgo: 1560 }], [0, 'R5', 1, { endsAgo: 1440 }], [0, 'R1', 0, { endsAgo: 2950 }], [0, 'R1', 1, { endsAgo: 2800 }],
  [1, 'R2', 0, { elapsed: 10, endSpeed: 71 }, 'heavy'], [1, 'R2', 1, { endsAgo: 55 }, 'heavy'], [1, 'R4', 0, { endsAgo: 170 }, 'heavy'],
  [1, 'R2', 0, { endsAgo: 300 }], [1, 'R4', 1, { endsAgo: 1500 }, 'heavy'], [1, 'R5', 0, { endsAgo: 1640 }], [1, 'R2', 0, { endsAgo: 2900 }, 'heavy'], [1, 'R2', 1, { endsAgo: 2780 }],
  [2, 'R1', 0, { endsAgo: 22 }], [2, 'R1', 1, { endsAgo: 140 }], [2, 'R6', 0, { endsAgo: 300 }], [2, 'R6', 1, { endsAgo: 380 }],
  [2, 'R3', 0, { endsAgo: 1480 }], [2, 'R3', 1, { endsAgo: 1380 }],
  [3, 'R3', 0, { elapsed: 14 }], [3, 'R3', 1, { endsAgo: 80 }], [3, 'R5', 0, { endsAgo: 230 }], [3, 'R5', 1, { endsAgo: 330 }],
  [3, 'R1', 0, { endsAgo: 1400 }], [3, 'R1', 1, { endsAgo: 1300 }], [3, 'R6', 0, { endsAgo: 2850 }],
  [4, 'R2', 0, { endsAgo: 125 }], [4, 'R2', 1, { endsAgo: 210 }], [4, 'R6', 0, { endsAgo: 300 }], [4, 'R6', 1, { endsAgo: 390 }], [4, 'R3', 0, { endsAgo: 1450 }],
  [5, 'R4', 0, { elapsed: 11 }], [5, 'R4', 1, { endsAgo: 70 }, 'light'], [5, 'R5', 1, { endsAgo: 190 }], [5, 'R5', 0, { endsAgo: 280 }],
  [5, 'R1', 0, { endsAgo: 1500 }], [5, 'R1', 1, { endsAgo: 1390 }],
];

const id = (prefix, n) => `${prefix}0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const driverIds = DRIVERS.map((_, i) => id('1', i + 1));
const vehicleIds = VEHICLES.map((_, i) => id('2', i + 1));
const T0 = new Date(); T0.setSeconds(0, 0);
const iso = (minAgo, extraSec = 0) => new Date(T0.getTime() - minAgo * 60000 - extraSec * 1000).toISOString();
const r5 = (x) => +x.toFixed(5);

const trips = []; // { ...tripRow, points }
const lastByVehicle = {};
SCHEDULE.forEach(([vi, rk, rev, spec, speeder], i) => {
  const v = VEHICLES[vi];
  const path = buildPath(ROUTES[rk], !!rev);
  let sim = simulate(path, { cruise: v.cruise, speeder, maxSteps: spec.elapsed });
  // A vehicle shown as "moving" must not be mid-stop: extend the elapsed window until it is rolling.
  for (let extra = 1; spec.elapsed && sim.pts[sim.pts.length - 1].v === 0 && extra < 8; extra++) sim = simulate(path, { cruise: v.cruise, speeder, maxSteps: spec.elapsed + extra });
  if (spec.endSpeed) sim.pts[sim.pts.length - 1].v = spec.endSpeed;
  const stepsN = sim.pts.length - 1;
  const gap = spec.elapsed ? Math.round(between(8, 40)) : 0; // seconds since last ping
  const startAgoSec = spec.elapsed ? stepsN * 60 + gap : (spec.endsAgo * 60 + stepsN * 60);
  const st = stats(sim.pts);
  const inProgress = !!spec.elapsed;
  if (inProgress && sim.done) throw new Error(`in-progress trip ${i} already finished; lower elapsed`);
  if (inProgress && sim.pts[sim.pts.length - 1].v === 0) throw new Error(`in-progress trip ${i} ends on a stop; change elapsed`);
  const tripId = id('3', i + 1);
  const t = {
    id: tripId, vehicleId: vehicleIds[vi], vehicle: v.n, plate: v.plate, driver: DRIVERS[vi][0],
    start: path.from, end: path.to,
    startLat: r5(path.start[0]), startLng: r5(path.start[1]), endLat: r5(path.end[0]), endLng: r5(path.end[1]),
    startAgoSec, endAgoSec: inProgress ? null : startAgoSec - stepsN * 60,
    distance: st.distance, duration: st.duration, avgSpeed: st.avg, maxSpeed: st.max, halts: st.halts, idleMinutes: st.idle, overspeed: st.over,
    points: sim.pts.map((x, k) => [k, k * STEP_S, r5(x.p[0]), r5(x.p[1]), x.v]),
    vi, inProgress,
  };
  trips.push(t);
  if (!lastByVehicle[vi] || t.startAgoSec < lastByVehicle[vi].startAgoSec) lastByVehicle[vi] = t;
});

// overlap check per vehicle (oldest first: a trip must end before the next one starts)
for (let vi = 0; vi < VEHICLES.length; vi++) {
  const ts = trips.filter((t) => t.vi === vi).sort((a, b) => b.startAgoSec - a.startAgoSec);
  for (let k = 1; k < ts.length; k++) {
    if (ts[k - 1].endAgoSec !== null && ts[k - 1].endAgoSec < ts[k].startAgoSec) {
      throw new Error(`Overlap for ${VEHICLES[vi].n}: trip starting ${Math.round(ts[k].startAgoSec / 60)}m ago starts before the previous one ended (${Math.round(ts[k - 1].endAgoSec / 60)}m ago)`);
    }
  }
}

// vehicles current state
const vehicles = VEHICLES.map((v, vi) => {
  const lt = lastByVehicle[vi];
  const lp = lt.points[lt.points.length - 1];
  let lastSeenAgoSec, speed = lp[4], ignition = true;
  if (v.status === 'moving') { lastSeenAgoSec = lt.startAgoSec - lp[1]; }
  else if (v.status === 'idle') { lastSeenAgoSec = 40; speed = 0; ignition = !!v.ignitionIdle; }
  else { lastSeenAgoSec = v.offlineAgoMin * 60; speed = 0; ignition = false; }
  const sinceAgoSec = v.status === 'moving' ? lt.startAgoSec : (lt.endAgoSec ?? lastSeenAgoSec);
  return {
    id: vehicleIds[vi], driverId: driverIds[vi], name: v.n, plate: v.plate, type: v.type, driver: DRIVERS[vi][0], status: v.status,
    statusSince: new Date(T0.getTime() - sinceAgoSec * 1000).toISOString(),
    lat: lp[2], lng: lp[3], speed, fuel: v.fuel, battery: v.battery, ignition, health: v.health,
    lastSeen: new Date(T0.getTime() - lastSeenAgoSec * 1000).toISOString(),
    _statusSinceAgoSec: sinceAgoSec, _lastSeenAgoSec: lastSeenAgoSec,
  };
});

// ---- Outputs ---------------------------------------------------------------------
const esc = (x) => String(x).replace(/'/g, "''");
const ago = (sec) => `date_trunc('minute', now()) - interval '${sec} seconds'`;
let sql = `-- GENERATED by scripts/generate-seed.mjs -- do not edit by hand.\n-- Run after schema.sql. Timestamps are relative to now() at execution time.\n-- Safe to re-run: rows use fixed ids and "on conflict do nothing".\n\n`;
sql += `insert into public.drivers(id,name,phone) values\n${DRIVERS.map((d, i) => `('${driverIds[i]}','${esc(d[0])}','${d[1]}')`).join(',\n')}\non conflict do nothing;\n\n`;
sql += `insert into public.vehicles(id,name,plate,vehicle_type,driver_id,status,status_since,latitude,longitude,speed_kph,fuel_percent,battery_percent,ignition,last_seen,health_score) values\n`;
sql += vehicles.map((v) => `('${v.id}','${esc(v.name)}','${v.plate}','${v.type}','${v.driverId}','${v.status}',${ago(v._statusSinceAgoSec)},${v.lat},${v.lng},${v.speed},${v.fuel},${v.battery},${v.ignition},${ago(v._lastSeenAgoSec)},${v.health})`).join(',\n');
sql += `\non conflict do nothing;\n\n`;
sql += `insert into public.trips(id,vehicle_id,driver_id,start_location,end_location,start_lat,start_lng,end_lat,end_lng,started_at,ended_at,distance_km,duration_minutes,avg_speed_kph,max_speed_kph,halt_count,idle_minutes,overspeed_events) values\n`;
sql += trips.map((t) => `('${t.id}','${t.vehicleId}','${driverIds[t.vi]}','${esc(t.start)}','${esc(t.end)}',${t.startLat},${t.startLng},${t.endLat},${t.endLng},${ago(t.startAgoSec)},${t.endAgoSec === null ? 'null' : ago(t.endAgoSec)},${t.distance},${t.duration},${t.avgSpeed},${t.maxSpeed},${t.halts},${t.idleMinutes},${t.overspeed})`).join(',\n');
sql += `\non conflict do nothing;\n\n-- Route points: one telemetry ping per minute per trip (seq, seconds from trip start, lat, lng, speed)\n`;
for (const t of trips) {
  sql += `insert into public.trip_points(trip_id,seq,recorded_at,latitude,longitude,speed_kph)\nselect t.id, v.seq, t.started_at + make_interval(secs => v.off), v.lat, v.lng, v.spd\nfrom public.trips t, (values ${t.points.map((p) => `(${p[0]},${p[1]},${p[2]},${p[3]},${p[4]})`).join(',')}) as v(seq,off,lat,lng,spd)\nwhere t.id = '${t.id}'\non conflict do nothing;\n`;
}
fs.writeFileSync(path.join(ROOT, 'supabase/seed.sql'), sql);

const demo = {
  generatedAt: T0.toISOString(),
  vehicles: vehicles.map(({ driverId, _statusSinceAgoSec, _lastSeenAgoSec, ...v }) => v),
  trips: trips.map((t) => ({
    id: t.id, vehicleId: t.vehicleId, vehicle: t.vehicle, plate: t.plate, driver: t.driver, start: t.start, end: t.end,
    startLat: t.startLat, startLng: t.startLng, endLat: t.endLat, endLng: t.endLng,
    startedAt: iso(0, t.startAgoSec), endedAt: t.endAgoSec === null ? null : iso(0, t.endAgoSec),
    distance: t.distance, duration: t.duration, avgSpeed: t.avgSpeed, maxSpeed: t.maxSpeed, halts: t.halts, idleMinutes: t.idleMinutes, overspeed: t.overspeed,
  })).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)),
  points: Object.fromEntries(trips.map((t) => [t.id, t.points.map((p) => [p[0], new Date(T0.getTime() - t.startAgoSec * 1000 + p[1] * 1000).toISOString(), p[2], p[3], p[4]])])),
};
fs.writeFileSync(path.join(ROOT, 'src/demo/fleet.json'), JSON.stringify(demo));

console.log(`trips: ${trips.length}, points: ${trips.reduce((n, t) => n + t.points.length, 0)}`);
for (const t of trips.slice().sort((a, b) => a.vi - b.vi || a.startAgoSec - b.startAgoSec)) {
  console.log(`${VEHICLES[t.vi].n.padEnd(9)} ${t.start.padEnd(13)}→ ${t.end.padEnd(14)} ${String(t.distance).padStart(5)}km ${String(t.duration).padStart(3)}min avg ${String(t.avgSpeed).padStart(4)} max ${String(t.maxSpeed).padStart(2)} halts ${t.halts} idle ${t.idleMinutes} over ${t.overspeed} startAgo ${Math.round(t.startAgoSec / 60)}m${t.inProgress ? ' [in progress]' : ''}`);
}
console.log(vehicles.map((v) => `${v.name}: ${v.status} ${v.speed}km/h @${v.lat},${v.lng} lastSeen ${Math.round(v._lastSeenAgoSec / 60)}m`).join('\n'));
