import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { VehicleStatus } from '../types';

export function Metric({ title, value, detail, icon, tone }: { title: string; value: string; detail: string; icon: ReactNode; tone: 'blue' | 'green' | 'amber' | 'red' }) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{title}</span><div className={`metric-icon ${tone}`}>{icon}</div></div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
    </div>
  );
}

export function Detail({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone?: 'bad' }) {
  return (
    <div className="detail-item">
      <div className="detail-icon">{icon}</div>
      <div><small>{label}</small><strong className={tone === 'bad' ? 'bad' : undefined}>{value}</strong></div>
    </div>
  );
}

const STATUS_LABEL: Record<VehicleStatus, string> = { moving: 'Moving', idle: 'Idle', offline: 'Offline' };
const STATUS_PILL: Record<VehicleStatus, string> = { moving: 'success', idle: 'amber', offline: 'neutral' };

export function StatusPill({ status }: { status: VehicleStatus }) {
  return <span className={`pill ${STATUS_PILL[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Gauge({ value, low }: { value: number; low: boolean }) {
  return (
    <span className="gauge" title={`${value}%`}>
      <span className="gauge-track"><span className={`gauge-fill ${low ? 'low' : ''}`} style={{ width: `${value}%` }} /></span>
      <span className={low ? 'bad' : undefined}>{value}%</span>
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="panel state-panel" role="alert">
      <AlertTriangle size={22} />
      <h2>Couldn't load fleet data</h2>
      <p>{message}</p>
      <p className="muted">Check that schema.sql and seed.sql were run and that your .env values are correct.</p>
      <button className="primary" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function Loading({ label = 'Loading fleet data…' }: { label?: string }) {
  return <div className="panel state-panel" aria-busy="true"><div className="spinner" /><p>{label}</p></div>;
}
