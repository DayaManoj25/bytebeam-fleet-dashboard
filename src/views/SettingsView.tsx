import { LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { isConfigured } from '../supabase';
import { CRITICAL_FUEL, LONG_IDLE_MIN, LOW_BATTERY, LOW_FUEL, POOR_HEALTH, SPEED_LIMIT } from '../lib/constants';
import { fmtTime } from '../lib/format';

export default function SettingsView({ user, now, onSignOut }: { user: User | null; now: number; onSignOut: () => void }) {
  const rows: [string, string][] = [
    ['Speed limit', `${SPEED_LIMIT} km/h`],
    ['Low fuel', `below ${LOW_FUEL}% (critical below ${CRITICAL_FUEL}%)`],
    ['Low battery', `below ${LOW_BATTERY}%`],
    ['Poor health', `score below ${POOR_HEALTH}`],
    ['Long idle', `${LONG_IDLE_MIN}+ min stationary with ignition on`],
  ];
  return (
    <section className="settings-grid">
      <section className="panel settings-panel">
        <div className="panel-header"><div><h2>Account &amp; connection</h2><p>Signed-in user and backend status</p></div></div>
        <div className="settings-list">
          <div className="settings-row"><div><strong>Account email</strong><small>Currently signed-in user</small></div><span>{user?.email ?? 'Demo user'}</span></div>
          <div className="settings-row"><div><strong>Backend</strong><small>Database and authentication</small></div><span className={`pill ${isConfigured ? 'success' : 'neutral'}`}>{isConfigured ? 'Supabase connected' : 'Offline demo data'}</span></div>
          <div className="settings-row"><div><strong>Telemetry snapshot</strong><small>Newest ping in the dataset</small></div><span>{new Date(now).toLocaleDateString()} {fmtTime(new Date(now).toISOString())}</span></div>
        </div>
        <div className="settings-actions"><button className="secondary" onClick={onSignOut}><LogOut size={15} /> Sign out</button></div>
      </section>
      <section className="panel settings-panel">
        <div className="panel-header"><div><h2>Alert thresholds</h2><p>Defined in src/lib/constants.ts</p></div></div>
        <div className="settings-list">
          {rows.map(([k, v]) => <div className="settings-row" key={k}><div><strong>{k}</strong></div><span>{v}</span></div>)}
        </div>
      </section>
    </section>
  );
}
