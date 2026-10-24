import { useState } from 'react';
import { AlertTriangle, ArrowUpRight, Battery, Clock, Fuel, Gauge, WifiOff, Activity, CheckCircle2 } from 'lucide-react';
import type { AlertKind, AlertSeverity, FleetAlert, Tab } from '../types';
import { Empty } from '../components/ui';
import { relTime } from '../lib/format';

const ICONS: Record<AlertKind, typeof Fuel> = { offline: WifiOff, low_fuel: Fuel, low_battery: Battery, poor_health: Activity, long_idle: Clock, overspeed: Gauge };

export default function AlertsView({ alerts, now, go }: { alerts: FleetAlert[]; now: number; go: (tab: Tab, id?: string | null) => void }) {
  const [sev, setSev] = useState<'all' | AlertSeverity>('all');
  const crit = alerts.filter((a) => a.severity === 'critical').length;
  const list = alerts.filter((a) => sev === 'all' || a.severity === sev);
  return (
    <section className="panel">
      <div className="panel-header">
        <div><h2>Fleet alerts</h2><p>Computed from live vehicle state and recent trips · thresholds are listed under Settings</p></div>
        <div className="filter-row compact" role="group" aria-label="Filter by severity">
          {([['all', `All ${alerts.length}`], ['critical', `Critical ${crit}`], ['warning', `Warning ${alerts.length - crit}`]] as const).map(([k, label]) => (
            <button key={k} className={sev === k ? 'filter-active' : ''} onClick={() => setSev(k)} aria-pressed={sev === k}>{label}</button>
          ))}
        </div>
      </div>
      {list.map((a) => {
        const Icon = ICONS[a.kind] ?? AlertTriangle;
        return (
          <div className="alert-row" key={a.id}>
            <div className={`attention-icon ${a.severity}`}><Icon size={17} /></div>
            <div className="attention-copy">
              <strong>{a.title} <span className={`pill ${a.severity === 'critical' ? 'danger' : 'warning'}`}>{a.severity}</span></strong>
              <small>{a.vehicle} · {a.plate}</small>
              <small>{a.detail}</small>
            </div>
            <span className="alert-time">{relTime(a.at, now)}</span>
            <div className="alert-actions">
              <button className="secondary small" onClick={() => go('overview', a.vehicleId)}>View on map <ArrowUpRight size={13} /></button>
              {a.tripId && <button className="secondary small" onClick={() => go('trips', a.tripId)}>View trip <ArrowUpRight size={13} /></button>}
            </div>
          </div>
        );
      })}
      {!list.length && <Empty><CheckCircle2 size={16} className="ok-icon" /> No {sev === 'all' ? '' : `${sev} `}alerts. Every vehicle is within thresholds.</Empty>}
    </section>
  );
}
