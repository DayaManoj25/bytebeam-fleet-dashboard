import { useEffect, useMemo, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Trip, TripPoint } from '../types';
import { SPEED_LIMIT } from '../lib/constants';
import { analyzeRoute } from '../lib/routeEvents';
import { fmtDuration, fmtTime, fmtWhen, km } from '../lib/format';

function SpeedChart({ points, cursor, onSeek }: { points: TripPoint[]; cursor: number | null; onSeek: (i: number) => void }) {
  const W = 400, H = 84, pad = 6;
  const n = points.length;
  const maxY = Math.max(80, Math.ceil(Math.max(...points.map((p) => p.speed)) / 10) * 10);
  const x = (i: number) => (n < 2 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - pad - (v / maxY) * (H - pad * 2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.speed).toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H - pad} L0,${H - pad} Z`;
  return (
    <svg
      className="speed-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Speed over the trip. Click to move the position marker."
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (n - 1)));
      }}
    >
      <line x1="0" x2={W} y1={y(SPEED_LIMIT)} y2={y(SPEED_LIMIT)} stroke="#f87171" strokeWidth="1" strokeDasharray="4 4" />
      <text x={W - 2} y={y(SPEED_LIMIT) - 3} textAnchor="end" fontSize="9" fill="#ef4444">limit {SPEED_LIMIT}</text>
      <path d={area} fill="#2563eb" opacity="0.12" />
      <path d={line} fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinejoin="round" />
      {points.map((p, i) => p.speed > SPEED_LIMIT && <circle key={i} cx={x(i)} cy={y(p.speed)} r="2.6" fill="#dc2626" />)}
      {cursor !== null && <line x1={x(cursor)} x2={x(cursor)} y1="0" y2={H} stroke="#0f172a" strokeWidth="1.2" />}
    </svg>
  );
}

interface Props {
  trip: Trip;
  points: TripPoint[];
  loading: boolean;
  error: string | null;
  cursor: number | null;
  setCursor: (i: number | null) => void;
  now: number;
}

export default function TripDetail({ trip, points, loading, error, cursor, setCursor, now }: Props) {
  const [playing, setPlaying] = useState(false);
  const n = points.length;
  const { halts, overspeed } = useMemo(() => analyzeRoute(points), [points]);
  const events = useMemo(
    () => [
      ...halts.map((h) => ({ seq: h.seq, kind: 'halt' as const, text: `Halt · ${h.minutes} min`, at: h.at })),
      ...overspeed.map((o) => ({ seq: o.seq, kind: 'over' as const, text: `Overspeed · ${o.speed} km/h`, at: o.at })),
    ].sort((a, b) => a.seq - b.seq),
    [halts, overspeed],
  );

  useEffect(() => { setPlaying(false); }, [trip.id]);
  useEffect(() => {
    if (!playing || n < 2) return;
    const id = window.setInterval(() => {
      setCursor((cursor ?? 0) + 1 >= n ? null : (cursor ?? 0) + 1);
    }, 350);
    return () => window.clearInterval(id);
  }, [playing, cursor, n, setCursor]);
  useEffect(() => { if (playing && cursor === null) setPlaying(false); }, [cursor, playing]);

  const cp = cursor !== null ? points[cursor] : null;
  return (
    <div className="trip-detail">
      <div className="trip-detail-head">
        <div>
          <h3>{trip.vehicle} <span className="muted-inline">· {trip.driver}</span></h3>
          <p className="route-line">{trip.start} <span aria-hidden>→</span> {trip.end}</p>
          <p className="muted-small">{fmtWhen(trip.startedAt, now)}{trip.endedAt ? ` – ${fmtTime(trip.endedAt)}` : ''}</p>
        </div>
        <span className={`pill ${trip.endedAt ? 'neutral' : 'success'}`}>{trip.endedAt ? 'Completed' : 'In progress'}</span>
      </div>

      <div className="trip-stats">
        <div><small>Distance</small><strong>{km(trip.distance)}</strong></div>
        <div><small>Duration</small><strong>{fmtDuration(trip.duration)}</strong></div>
        <div><small>Avg speed</small><strong>{trip.avgSpeed.toFixed(0)} km/h</strong></div>
        <div><small>Max speed</small><strong className={trip.maxSpeed > SPEED_LIMIT ? 'bad' : undefined}>{trip.maxSpeed} km/h</strong></div>
        <div><small>Halts</small><strong>{trip.halts}<span className="muted-inline"> · {trip.idleMinutes} min idle</span></strong></div>
        <div><small>Overspeed</small><strong className={trip.overspeed ? 'bad' : undefined}>{trip.overspeed} event{trip.overspeed === 1 ? '' : 's'}</strong></div>
      </div>

      {error && <div className="error" role="alert">Couldn't load the route: {error}</div>}
      {loading && <div className="muted-small">Loading route…</div>}
      {!loading && !error && n < 2 && <div className="muted-small">No route points recorded for this trip.</div>}
      {n >= 2 && (
        <>
          <div className="playback">
            <button className="icon-button play" onClick={() => { if (!playing && (cursor === null || cursor >= n - 1)) setCursor(0); setPlaying(!playing); }} aria-label={playing ? 'Pause playback' : 'Play route'}>
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <input
              type="range" min={0} max={n - 1} value={cursor ?? 0} aria-label="Scrub through the trip"
              onChange={(e) => { setPlaying(false); setCursor(Number(e.target.value)); }}
            />
            <span className="readout">{cp ? `${fmtTime(cp.t)} · ${cp.speed} km/h` : 'Drag to replay'}</span>
          </div>
          <SpeedChart points={points} cursor={cursor} onSeek={(i) => { setPlaying(false); setCursor(i); }} />
          <div className="events">
            <h4>Events on this trip</h4>
            {events.length === 0 && <div className="muted-small">No halts or overspeeding. Clean trip.</div>}
            {events.map((e) => (
              <button key={`${e.kind}${e.seq}`} className="event-row" onClick={() => { setPlaying(false); setCursor(e.seq); }}>
                <i className={`legend-dot ${e.kind === 'halt' ? 'amber' : 'red'}`} />
                <span>{e.text}</span>
                <small>{fmtTime(e.at)}</small>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
