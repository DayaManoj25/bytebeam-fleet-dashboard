import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, ChevronDown, LayoutDashboard, LogOut, Route, Settings, Truck } from 'lucide-react';
import type { Tab } from './types';

import { demoAllowed, isConfigured, supabase } from './supabase';
import { useAuth, useFleet, useRoute } from './hooks';
import { attentionIds, deriveAlerts } from './lib/alerts';
import { fmtLongDate, fmtTime } from './lib/format';
import Login from './components/Login';
import { ErrorPanel, Loading } from './components/ui';
import OverviewView from './views/OverviewView';
import VehiclesView from './views/VehiclesView';
import TripsView from './views/TripsView';
import AlertsView from './views/AlertsView';
import SettingsView from './views/SettingsView';

const META: Record<Tab, { title: string; sub: string }> = {
  overview: { title: 'Fleet overview', sub: 'Where every vehicle is, and what needs your attention first.' },
  vehicles: { title: 'Vehicles', sub: 'Status, fuel, battery and health for the whole fleet.' },
  trips: { title: 'Trips', sub: 'Review routes, halts and overspeeding for recent trips.' },
  alerts: { title: 'Alerts', sub: 'Conditions that need an operator, most urgent first.' },
  settings: { title: 'Settings', sub: 'Account, backend connection and alert thresholds.' },
};

const DEMO_KEY = 'bytebeam-demo';
const readDemo = () => { try { return sessionStorage.getItem(DEMO_KEY) === '1'; } catch { return false; } };

export default function App() {
  const { user, ready } = useAuth();
  const [demo, setDemo] = useState(() => !isConfigured && demoAllowed && readDemo());
  const signedIn = Boolean(user) || demo;
  const { fleet, error, reload, ref: now } = useFleet(signedIn);
  const { tab, id, go } = useRoute();

  const alerts = useMemo(() => (fleet ? deriveAlerts(fleet.vehicles, fleet.trips, now) : []), [fleet, now]);
  const attention = useMemo(() => attentionIds(alerts), [alerts]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setDemo(false);
    try { sessionStorage.removeItem(DEMO_KEY); } catch { /* storage unavailable */ }
    window.location.hash = '';
  };

  if (!ready) return <div className="login-page"><Loading label="Checking session…" /></div>;
  if (!signedIn) return <Login onDemo={() => { setDemo(true); try { sessionStorage.setItem(DEMO_KEY, '1'); } catch { /* ignore */ } }} />;

  const nav: { tab: Tab; label: string; Icon: typeof Truck }[] = [
    { tab: 'overview', label: 'Overview', Icon: LayoutDashboard },
    { tab: 'vehicles', label: 'Vehicles', Icon: Truck },
    { tab: 'trips', label: 'Trips', Icon: Route },
  ];
  const critical = alerts.filter((a) => a.severity === 'critical').length;
  const email = user?.email ?? 'demo@bytebeam.io';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Activity size={21} /></div><span>bytebeam<span className="brand-muted"> / fleet</span></span></div>
        <div className="workspace">
          <div className="workspace-icon">B</div>
          <div><strong>Bytebeam Logistics</strong><small>Operations workspace</small></div>
          <ChevronDown size={15} />
        </div>
        <nav aria-label="Main">
          <div className="nav-label">WORKSPACE</div>
          {nav.map(({ tab: t, label, Icon }) => (
            <button key={t} className={`nav-item ${tab === t ? 'active' : ''}`} onClick={() => go(t)} aria-current={tab === t ? 'page' : undefined}>
              <Icon size={17} />{label}{t === 'vehicles' && fleet && <span className="nav-count">{fleet.vehicles.length}</span>}
            </button>
          ))}
          <div className="nav-label second">MANAGE</div>
          <button className={`nav-item ${tab === 'alerts' ? 'active' : ''}`} onClick={() => go('alerts')} aria-current={tab === 'alerts' ? 'page' : undefined}>
            <AlertTriangle size={17} />Alerts{alerts.length > 0 && <span className={`alert-count ${critical ? '' : 'warn'}`}>{alerts.length}</span>}
          </button>
          <button className={`nav-item ${tab === 'settings' ? 'active' : ''}`} onClick={() => go('settings')} aria-current={tab === 'settings' ? 'page' : undefined}>
            <Settings size={17} />Settings
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="profile">
            <div className="avatar">OP</div>
            <div className="profile-info"><strong>Operations Admin</strong><small>{email}</small></div>
            <button className="icon-button" onClick={() => void signOut()} title="Sign out" aria-label="Sign out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{META[tab].title}</strong></div>
          <div className="top-actions">
            <span className="demo-badge">{isConfigured ? 'SUPABASE' : 'DEMO DATA'}</span>
            <div className="avatar small">OP</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">{fmtLongDate(now).toUpperCase()}{fleet && ` · DATA AS OF ${fmtTime(new Date(now).toISOString())}`}</div>
              <h1>{META[tab].title}</h1>
              <p>{META[tab].sub}</p>
            </div>
          </div>

          {error ? <ErrorPanel message={error} onRetry={() => void reload()} />
            : !fleet ? <Loading />
            : tab === 'overview' ? <OverviewView fleet={fleet} now={now} alerts={alerts} attention={attention} selectedId={id ?? alerts[0]?.vehicleId ?? null} go={go} />
            : tab === 'vehicles' ? <VehiclesView fleet={fleet} now={now} alerts={alerts} attention={attention} go={go} />
            : tab === 'trips' ? <TripsView fleet={fleet} now={now} attention={attention} selectedTripId={id} go={go} />
            : tab === 'alerts' ? <AlertsView alerts={alerts} now={now} go={go} />
            : <SettingsView user={user} now={now} onSignOut={() => void signOut()} />}

          <footer>© 2026 Bytebeam Fleet <span>Seeded sample telemetry · {isConfigured ? 'Supabase connected' : 'offline demo'}</span></footer>
        </div>
      </main>
    </div>
  );
}
