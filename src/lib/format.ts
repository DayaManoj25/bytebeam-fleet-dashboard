/** All "relative" times are measured against the data snapshot time (`ref`), not the wall clock,
 *  so a reviewer opening the app days after the seed ran still sees a coherent picture. */
export const relTime = (iso: string, ref: number): string => {
  const sec = Math.max(0, Math.round((ref - new Date(iso).getTime()) / 1000));
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
};

export const fmtDuration = (min: number): string =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;

export const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "Today, 9:41 PM" / "Yesterday, 4:10 PM" / "Thu 22 Oct, 8:05 AM" */
export const fmtWhen = (iso: string, ref: number): string => {
  const d = new Date(iso);
  const r = new Date(ref);
  const y = new Date(ref - 86400000);
  const time = fmtTime(iso);
  if (dayKey(d) === dayKey(r)) return `Today, ${time}`;
  if (dayKey(d) === dayKey(y)) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`;
};

export const fmtLongDate = (ms: number): string =>
  new Date(ms).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const km = (n: number): string => `${n.toFixed(1)} km`;
