import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import type { Fleet, Tab } from '../types';
import FleetMap from '../components/FleetMap';
import TripDetail from '../components/TripDetail';
import { Empty } from '../components/ui';
import { useTripPoints } from '../hooks';
import { downloadCsv } from '../lib/export';
import { fmtDuration, fmtWhen, km } from '../lib/format';

type Period = 'all' | 'today' | '24h';
interface Props { fleet: Fleet; now: number; attention: Set<string>; selectedTripId: string | null; go: (tab: Tab, id?: string | null) => void }

export default function TripsView({ fleet, now, attention, selectedTripId, go }: Props) {
  const [vehicleId, setVehicleId] = useState('all');
  const [period, setPeriod] = useState<Period>('all');
  const [overOnly, setOverOnly] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);

  const trips = useMemo(() => {
    const dayStart = new Date(now).setHours(0, 0, 0, 0);
    return fleet.trips.filter((t) => {
      const s = new Date(t.startedAt).getTime();
      return (vehicleId === 'all' || t.vehicleId === vehicleId)
        && (period === 'all' || (period === 'today' ? s >= dayStart : now - s <= 86400000))
        && (!overOnly || t.overspeed > 0);
    });
  }, [fleet.trips, vehicleId, period, overOnly, now]);

  const trip = fleet.trips.find((t) => t.id === selectedTripId) ?? trips[0] ?? null;
  const { points, loading, error } = useTripPoints(trip?.id ?? null);
  useEffect(() => { setCursor(null); }, [trip?.id]);

  const totals = useMemo(() => ({
    distance: trips.reduce((s, t) => s + t.distance, 0),
    over: trips.reduce((s, t) => s + t.overspeed, 0),
  }), [trips]);

  const exportCsv = () => downloadCsv('bytebeam-trips.csv', trips.map((t) => ({
    vehicle: t.vehicle, driver: t.driver, from: t.start, to: t.end, started_at: t.startedAt, ended_at: t.endedAt ?? '',
    distance_km: t.distance, duration_min: t.duration, avg_speed_kph: t.avgSpeed, max_speed_kph: t.maxSpeed,
    halts: t.halts, idle_min: t.idleMinutes, overspeed_events: t.overspeed,
  })));

  return (
    <>
      <div className="filter-bar panel">
        <label>Vehicle
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="all">All vehicles</option>
            {fleet.vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>
        <label>Period
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
            <option value="all">All trips</option>
            <option value="today">Today</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={overOnly} onChange={(e) => setOverOnly(e.target.checked)} /> Overspeed only</label>
        <div className="filter-summary">{trips.length} trips · {km(totals.distance)} · {totals.over} overspeed events</div>
        <button className="secondary" onClick={exportCsv}><Download size={15} /> Export CSV</button>
      </div>

      <div className="trips-layout">
        <section className="panel trip-list-panel">
          <div className="panel-header"><div><h2>Trip history</h2><p>Select a trip to see its route</p></div></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Vehicle</th><th>Route</th><th>Distance · time</th><th>Avg / max</th><th>Events</th></tr></thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className={`clickable ${trip?.id === t.id ? 'selected-row' : ''}`} tabIndex={0} aria-selected={trip?.id === t.id}
                    onClick={() => go('trips', t.id)} onKeyDown={(e) => e.key === 'Enter' && go('trips', t.id)}>
                    <td><strong>{t.vehicle}</strong><small>{t.driver}</small></td>
                    <td><div className="route-cell"><span>{t.start}</span><i /><span>{t.end}</span></div><small>{fmtWhen(t.startedAt, now)}</small></td>
                    <td>{km(t.distance)}<small>{fmtDuration(t.duration)}</small></td>
                    <td>{t.avgSpeed.toFixed(0)} / <span className={t.maxSpeed > 60 ? 'bad' : undefined}>{t.maxSpeed}</span> km/h</td>
                    <td>
                      {!t.endedAt && <span className="pill success">In progress</span>}{' '}
                      {t.overspeed > 0 && <span className="pill warning">{t.overspeed} overspeed</span>}
                      {t.endedAt && t.overspeed === 0 && <span className="muted-inline">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!trips.length && <Empty>No trips match these filters.</Empty>}
          </div>
        </section>

        <aside className="trip-side">
          <section className="panel">
            {trip ? (
              <>
                <FleetMap
                  vehicles={fleet.vehicles} attention={attention} selectedId={null} showVehicles={false} height={330}
                  route={points.length > 1 ? { trip, points } : null} cursor={cursor}
                />
                <TripDetail trip={trip} points={points} loading={loading} error={error} cursor={cursor} setCursor={setCursor} now={now} />
              </>
            ) : <Empty>Select a trip to see its route.</Empty>}
          </section>
        </aside>
      </div>
    </>
  );
}
