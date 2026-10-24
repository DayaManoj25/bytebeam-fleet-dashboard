import { useMemo, useState } from 'react';
import { Download, MapPin } from 'lucide-react';
import type { Fleet, FleetAlert, Tab } from '../types';
import { FilterChips, SearchBox } from '../components/VehicleList';
import { Empty, Gauge, StatusPill } from '../components/ui';
import { filterVehicles, vehicleCounts, type VehicleFilter } from '../lib/filters';
import { relTime } from '../lib/format';
import { downloadCsv } from '../lib/export';
import { LOW_BATTERY, LOW_FUEL, POOR_HEALTH } from '../lib/constants';

interface Props { fleet: Fleet; now: number; alerts: FleetAlert[]; attention: Set<string>; go: (tab: Tab, id?: string | null) => void }

export default function VehiclesView({ fleet, now, alerts, attention, go }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VehicleFilter>('all');
  const counts = useMemo(() => vehicleCounts(fleet.vehicles, attention), [fleet.vehicles, attention]);
  const rows = useMemo(() => filterVehicles(fleet.vehicles, filter, search, attention), [fleet.vehicles, filter, search, attention]);
  const alertCount = (id: string) => alerts.filter((a) => a.vehicleId === id).length;

  const exportCsv = () => downloadCsv('bytebeam-vehicles.csv', rows.map((v) => ({
    name: v.name, plate: v.plate, driver: v.driver, status: v.status, speed_kph: v.speed, fuel_percent: v.fuel,
    battery_percent: v.battery, health_score: v.health, ignition: v.ignition, last_seen: v.lastSeen, alerts: alertCount(v.id),
  })));

  return (
    <section className="panel">
      <div className="panel-header">
        <div><h2>Vehicle management</h2><p>Every vehicle, its driver and current condition</p></div>
        <button className="secondary" onClick={exportCsv}><Download size={15} /> Export CSV</button>
      </div>
      <SearchBox value={search} onChange={setSearch} />
      <FilterChips filter={filter} setFilter={setFilter} counts={counts} />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Vehicle</th><th>Driver</th><th>Status</th><th>Speed</th><th>Fuel</th><th>Battery</th><th>Health</th><th>Last seen</th><th>Alerts</th><th /></tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="clickable" tabIndex={0} onClick={() => go('overview', v.id)} onKeyDown={(e) => e.key === 'Enter' && go('overview', v.id)}>
                <td><strong>{v.name}</strong><small>{v.plate}</small></td>
                <td>{v.driver}</td>
                <td><StatusPill status={v.status} /></td>
                <td>{v.status === 'moving' ? `${v.speed} km/h` : '—'}</td>
                <td><Gauge value={v.fuel} low={v.fuel < LOW_FUEL} /></td>
                <td><Gauge value={v.battery} low={v.battery < LOW_BATTERY} /></td>
                <td><span className={v.health < POOR_HEALTH ? 'bad' : undefined}>{v.health}/100</span></td>
                <td>{relTime(v.lastSeen, now)}</td>
                <td>{alertCount(v.id) ? <span className="pill danger">{alertCount(v.id)}</span> : <span className="muted-inline">—</span>}</td>
                <td><span className="row-link"><MapPin size={13} /> Map</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty>No vehicles match your filters.</Empty>}
      </div>
    </section>
  );
}
