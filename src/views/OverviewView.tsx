import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowUpRight, Battery, Clock, Compass, Fuel, Route, Truck, WifiOff, Zap, CarFront } from 'lucide-react';
import type { Fleet, FleetAlert, Tab } from '../types';
import FleetMap from '../components/FleetMap';
import VehicleList, { FilterChips, SearchBox } from '../components/VehicleList';
import { Detail, Metric, StatusPill, Empty } from '../components/ui';
import { filterVehicles, last24h, vehicleCounts, type VehicleFilter } from '../lib/filters';
import { useTripPoints } from '../hooks';
import { fmtDuration, fmtTime, fmtWhen, km, relTime } from '../lib/format';
import { LOW_BATTERY, LOW_FUEL, POOR_HEALTH } from '../lib/constants';

interface Props {
  fleet: Fleet;
  now: number;
  alerts: FleetAlert[];
  attention: Set<string>;
  selectedId: string | null;
  go: (tab: Tab, id?: string | null) => void;
}

export default function OverviewView({ fleet, now, alerts, attention, selectedId, go }: Props) {
  const { vehicles, trips } = fleet;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [resetKey, setResetKey] = useState(0);

  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0];
  const trip = trips.find((t) => t.vehicleId === selected?.id) ?? null; // trips are newest-first
  const { points, loading } = useTripPoints(trip?.id ?? null);
  const route = trip && points.length > 1 ? { trip, points } : null;

  const counts = useMemo(() => vehicleCounts(vehicles, attention), [vehicles, attention]);
  const listed = useMemo(() => filterVehicles(vehicles, filter, search, attention), [vehicles, filter, search, attention]);
  const stats = selected ? last24h(trips, selected.id, now) : { distance: 0, count: 0 };
  const selectedAlerts = alerts.filter((a) => a.vehicleId === selected?.id);

  if (!selected) return <Empty>No vehicles yet. Run supabase/seed.sql to load sample data.</Empty>;

  return (
    <>
      <div className="metric-grid">
        <Metric title="Total vehicles" value={String(counts.all)} detail={`${counts.moving} moving · ${counts.idle} idle · ${counts.offline} offline`} icon={<Truck />} tone="blue" />
        <Metric title="Moving" value={String(counts.moving)} detail={`${Math.round((counts.moving / Math.max(counts.all, 1)) * 100)}% of fleet on the road`} icon={<CarFront />} tone="green" />
        <Metric title="Idle" value={String(counts.idle)} detail="Stationary, connected" icon={<Clock />} tone="amber" />
        <Metric title="Needs attention" value={String(counts.attention)} detail={`${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`} icon={<AlertTriangle />} tone="red" />
      </div>

      <section className="panel map-panel">
        <div className="panel-header">
          <div>
            <h2>Fleet map</h2>
            <p>Last known positions · telemetry as of {fmtTime(new Date(now).toISOString())}</p>
          </div>
          {trip && (
            <button className="text-button" onClick={() => go('trips', trip.id)}>
              {trip.endedAt ? 'Latest trip' : 'Trip in progress'}: {trip.start} → {trip.end} <ArrowUpRight size={14} />
            </button>
          )}
        </div>
        <div className="map-layout">
          <FleetMap
            vehicles={vehicles} attention={attention} selectedId={selected.id} onSelect={(id) => go('overview', id)}
            route={route} showVehicles resetKey={resetKey} onFitFleet={() => { setResetKey((k) => k + 1); }}
          />
          <div className="vehicle-panel">
            <div className="vehicle-panel-top"><h3>Vehicles <span>{counts.all}</span></h3></div>
            <SearchBox value={search} onChange={setSearch} />
            <FilterChips filter={filter} setFilter={setFilter} counts={counts} />
            <VehicleList vehicles={listed} attention={attention} selectedId={selected.id} onSelect={(id) => go('overview', id)} now={now} />
          </div>
        </div>
        {loading && <div className="map-status">Loading route…</div>}
      </section>

      <div className="lower-grid">
        <section className="panel trip-panel">
          <div className="panel-header">
            <div><h2>Recent trips</h2><p>Latest activity across the fleet · click a trip to replay its route</p></div>
            <button className="text-button" onClick={() => go('trips')}>View all <ArrowUpRight size={14} /></button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Vehicle</th><th>Route</th><th>Distance</th><th>Duration</th><th>Events</th></tr></thead>
              <tbody>
                {trips.slice(0, 5).map((t) => (
                  <tr key={t.id} className="clickable" tabIndex={0} onClick={() => go('trips', t.id)} onKeyDown={(e) => e.key === 'Enter' && go('trips', t.id)}>
                    <td><strong>{t.vehicle}</strong><small>{t.driver}</small></td>
                    <td><div className="route-cell"><span>{t.start}</span><i /><span>{t.end}</span></div><small>{fmtWhen(t.startedAt, now)}</small></td>
                    <td>{km(t.distance)}</td>
                    <td>{fmtDuration(t.duration)}</td>
                    <td>{t.overspeed ? <span className="pill warning">{t.overspeed} overspeed</span> : !t.endedAt ? <span className="pill success">In progress</span> : <span className="pill neutral">Clean</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel attention-panel">
          <div className="panel-header">
            <div><h2>Needs attention</h2><p>Most urgent first</p></div>
            <span className="attention-total">{alerts.length}</span>
          </div>
          <div className="attention-list">
            {alerts.slice(0, 4).map((a) => (
              <button key={a.id} className="attention-item" onClick={() => go('overview', a.vehicleId)}>
                <div className={`attention-icon ${a.severity}`}>{a.kind === 'offline' ? <WifiOff size={16} /> : <AlertTriangle size={16} />}</div>
                <div className="attention-copy">
                  <strong>{a.title}</strong>
                  <small>{a.vehicle} · {a.plate}</small>
                  <small>{a.detail}</small>
                </div>
                <ArrowUpRight size={15} className="muted-icon" />
              </button>
            ))}
            {!alerts.length && <Empty>All vehicles look good.</Empty>}
            {alerts.length > 4 && <button className="text-button more" onClick={() => go('alerts')}>View all {alerts.length} alerts <ArrowUpRight size={14} /></button>}
          </div>
        </section>
      </div>

      <section className="panel selected-vehicle">
        <div className="panel-header">
          <div><h2>Selected vehicle</h2><p>Operational snapshot · {selected.driver}</p></div>
          <StatusPill status={selected.status} />
        </div>
        <div className="selected-info">
          <div className="selected-name">
            <div className={`vehicle-icon ${selected.status}`}><Truck size={20} /></div>
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.plate} · last seen {relTime(selected.lastSeen, now)}</p>
            </div>
            {selectedAlerts.length > 0 && <div className="selected-alerts">{selectedAlerts.map((a) => <span key={a.id} className={`pill ${a.severity === 'critical' ? 'danger' : 'warning'}`}>{a.title}</span>)}</div>}
          </div>
          <div className="detail-metrics">
            <Detail label="Distance (24 h)" value={km(stats.distance)} icon={<Route />} />
            <Detail label="Trips (24 h)" value={String(stats.count)} icon={<Compass />} />
            <Detail label="Fuel" value={`${selected.fuel}%`} icon={<Fuel />} tone={selected.fuel < LOW_FUEL ? 'bad' : undefined} />
            <Detail label="Battery" value={`${selected.battery}%`} icon={<Battery />} tone={selected.battery < LOW_BATTERY ? 'bad' : undefined} />
            <Detail label="Health" value={`${selected.health}/100`} icon={<Activity />} tone={selected.health < POOR_HEALTH ? 'bad' : undefined} />
            <Detail label="Ignition" value={selected.ignition ? 'On' : 'Off'} icon={<Zap />} />
          </div>
        </div>
      </section>
    </>
  );
}
