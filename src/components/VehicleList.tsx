import { Clock, Compass, WifiOff } from 'lucide-react';
import { Search } from 'lucide-react';
import type { Vehicle } from '../types';
import { VEHICLE_FILTERS, vehicleCounts, type VehicleFilter } from '../lib/filters';
import { relTime } from '../lib/format';

export function FilterChips({ filter, setFilter, counts }: { filter: VehicleFilter; setFilter: (f: VehicleFilter) => void; counts: Record<VehicleFilter, number> }) {
  return (
    <div className="filter-row" role="group" aria-label="Filter vehicles">
      {VEHICLE_FILTERS.map((f) => (
        <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? 'filter-active' : ''} aria-pressed={filter === f.key}>
          {f.label} <span className="chip-count">{counts[f.key]}</span>
        </button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="search-box">
      <Search size={15} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search name, plate or driver…" aria-label="Search vehicles" />
    </label>
  );
}

interface Props {
  vehicles: Vehicle[];
  attention: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number;
}

export default function VehicleList({ vehicles, attention, selectedId, onSelect, now }: Props) {
  if (!vehicles.length) return <div className="empty">No vehicles match.</div>;
  return (
    <div className="vehicle-list">
      {vehicles.map((v) => (
        <button key={v.id} className={`vehicle-row ${selectedId === v.id ? 'selected' : ''}`} onClick={() => onSelect(v.id)} aria-current={selectedId === v.id}>
          <div className={`vehicle-icon ${v.status}`}>{v.status === 'offline' ? <WifiOff size={16} /> : v.status === 'idle' ? <Clock size={16} /> : <Compass size={16} />}</div>
          <div className="vehicle-row-info">
            <div className="vehicle-name">{v.name}{attention.has(v.id) && <span className="att-badge">Needs attention</span>}</div>
            <div className="vehicle-sub">{v.plate} · {v.driver}</div>
            <div className="vehicle-row-meta">
              <span>{v.status === 'moving' ? `${v.speed} km/h` : v.status === 'idle' ? 'Idle' : 'Offline'}</span>
              <span>{relTime(v.lastSeen, now)}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export { vehicleCounts };
