import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { loadFleet, loadTripPoints } from './lib/api';
import type { Fleet, Tab, TripPoint } from './types';


export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setReady(true);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;

        if (error) {
          console.error("Session error:", error.message);
          setUser(null);
        } else {
          setUser(data.session?.user ?? null);
        }

        setReady(true);
      })
      .catch((error) => {
        if (!mounted) return;

        console.error("Session check failed:", error);
        setUser(null);
        setReady(true);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, ready };
}


export function useFleet(enabled: boolean) {
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFleet(await loadFleet());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load fleet data.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { if (enabled) void load(); }, [enabled, load]);
  /** Snapshot time = newest telemetry ping. All relative times are measured against it. */
  const ref = useMemo(() => (fleet && fleet.vehicles.length ? Math.max(...fleet.vehicles.map((v) => new Date(v.lastSeen).getTime())) : Date.now()), [fleet]);
  return { fleet, error, loading, reload: load, ref };
}

/** Lazily loads route points for one trip. `points` belong to `loadedId`; ignore them if it differs. */
export function useTripPoints(tripId: string | null) {
  const [state, setState] = useState<{ loadedId: string | null; points: TripPoint[]; error: string | null }>({ loadedId: null, points: [], error: null });
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    loadTripPoints(tripId)
      .then((points) => { if (!cancelled) setState({ loadedId: tripId, points, error: null }); })
      .catch((e) => { if (!cancelled) setState({ loadedId: tripId, points: [], error: e instanceof Error ? e.message : 'Could not load route.' }); });
    return () => { cancelled = true; };
  }, [tripId]);
  const ready = state.loadedId === tripId;
  return { points: ready ? state.points : [], loading: !!tripId && !ready, error: ready ? state.error : null };
}

const TABS: Tab[] = ['overview', 'vehicles', 'trips', 'alerts', 'settings'];
const parse = () => {
  const [t, id] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { tab: (TABS.includes(t as Tab) ? t : 'overview') as Tab, id: id || null };
};

/** Tiny hash router: #/trips/<tripId>, #/overview/<vehicleId>. Makes every view linkable and refresh-safe. */
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((tab: Tab, id?: string | null) => { window.location.hash = `/${tab}${id ? `/${id}` : ''}`; }, []);
  return { ...route, go };
}
