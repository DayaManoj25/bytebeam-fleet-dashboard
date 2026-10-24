# Bytebeam Fleet Dashboard

An operations dashboard for a small fleet (6 vehicles around Kochi): where vehicles are, what they did, and what needs attention first. React + TypeScript + Vite, Supabase (Auth + Postgres), React-Leaflet (OpenStreetMap).

## Live demo

- **URL:** `PASTE_VERCEL_URL_HERE`
- **Reviewer login:** `PASTE_EMAIL_HERE` / `PASTE_PASSWORD_HERE`

No Supabase access is needed to review the app: on the login page, click **Use the reviewer account** (or type the credentials above) to sign in. The reviewer account is read-only.

A short walkthrough video is optional; if included, the link is: `ADD_LINK_OR_DELETE_THIS_LINE`

## What I built and why

**Intended workflow of an operations user**

1. Open **Overview**. It opens on the vehicle that most needs attention (here: Truck 02, overspeeding with low fuel), with its current trip drawn on the map.
2. Scan the four KPI cards, then the **Needs attention** list, which is ordered by severity.
3. Click a vehicle or alert to see where it is and what it did on its latest trip.
4. Go to **Trips** to filter (vehicle, period, overspeed only), select a trip and replay its route.
5. **Vehicles** is the fleet table (search, status filters, fuel/battery gauges); **Alerts** lists every active alert with "View on map" / "View trip" jumps.

**Main product decisions**

- *Attention first.* "Needs attention" is derived, not stored (`src/lib/alerts.ts`): offline, low fuel, low battery, poor health, long idle with engine on, and overspeeding (now or in the last 6 h). Thresholds live in `src/lib/constants.ts` and are shown on the Settings page. Every number on the dashboard (KPI card, sidebar badge, list chips) comes from that one function.
- *A route is useful, not decorative.* Each trip's path is coloured by speed (≤30 / 30–60 / over limit), with start/end pins, **halt** markers and **overspeed** markers with tooltips. A speed-over-time chart and a scrubber/play button replay the trip, and clicking an event jumps to it.
- *Few, chosen metrics.* Per trip: distance, duration, avg/max speed, halts + idle minutes, overspeed events. Per vehicle: status, speed, fuel, battery, health, ignition, last seen, 24 h distance and trips.
- *Deep links.* `#/trips/<id>` and `#/overview/<vehicleId>` are linkable and survive refresh.
- *Honest data states.* Loading, error (with retry) and empty states. Relative times ("12 min ago") are measured against the newest telemetry ping, so the app still reads correctly if seeded data is a few days old; the header says "Data as of …".
- *Offline demo mode (dev only).* With `npm run dev` and no Supabase env vars, the app runs on the same data bundled as `src/demo/fleet.json`. In production builds this is disabled unless `VITE_ALLOW_DEMO=true`, so a misconfigured deployment can never expose the dashboard without login.
- *Stretch feature.* The derived alerts engine (severity-ranked alerts with "View on map" / "View trip" jumps) is the extension I chose, since it directly answers "does anything need attention?".

## Local setup

```bash
npm install
cp .env.example .env      # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
npm run build             # type-check + production build
```

Environment variables (see `.env.example`):

| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anon (public) key |
| `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD` | no | Enables the one-click "Use the reviewer account" button |
| `VITE_ALLOW_DEMO` | no | `true` allows no-login offline demo mode in a production build |

Without a `.env` file, `npm run dev` starts in offline demo mode (sample data, no login). Production builds only allow this if `VITE_ALLOW_DEMO=true`, so a deployment with missing keys shows an error instead of an open dashboard.

### Deploying (Vercel)

1. Import the project into Vercel (framework preset: Vite; build command `npm run build`; output `dist`).
2. Add the environment variables above in **Project Settings → Environment Variables**, then redeploy.
3. Add the Vercel URL under Supabase **Authentication → URL Configuration**.
4. Create the reviewer user in Supabase (**Authentication → Users → Add user**, "Auto Confirm User" ticked) with the same email and password as `VITE_DEMO_EMAIL` / `VITE_DEMO_PASSWORD`.

## Supabase setup

1. Create a project at supabase.com.
2. **SQL Editor** → run `supabase/schema.sql` (it drops and recreates the demo tables, so use a scratch project), then `supabase/seed.sql`. Both are safe to paste as-is.
3. **Authentication → Providers → Email**: enable. For an easy reviewer experience turn **Confirm email** off, or create a user manually under **Authentication → Users** with "Auto Confirm User" ticked.
4. **Authentication → URL Configuration**: add your local and deployed URLs.
5. Copy **Project URL** and **anon key** (Project Settings → API) into `.env` (and into Vercel env vars when deploying).

### Data model

```
drivers 1─∞ vehicles 1─∞ trips 1─∞ trip_points
              └── driver_id        └── vehicle_id, driver_id
```

| Table | Purpose |
|---|---|
| `drivers` | Name, phone. |
| `vehicles` | One row per vehicle: last known position, status (`moving` / `idle` / `offline`), `status_since`, speed, fuel, battery, ignition, health, `last_seen`. |
| `trips` | One row per trip with stored aggregates (distance, duration, avg/max speed, halts, idle minutes, overspeed events). `ended_at` is null while in progress. |
| `trip_points` | Movement history: one GPS ping per minute per trip (`seq`, time, lat, lng, speed). Loaded lazily, only for the selected trip. |

Row Level Security is on for every table: signed-in users can `select`, nobody can write from the browser.

### Seed data

`supabase/seed.sql` holds 6 drivers, 6 vehicles, 40 trips over ~3 days and ~960 route points. It is **generated** by `npm run seed:generate` (`scripts/generate-seed.mjs`, deterministic). Trip aggregates are computed from the generated points, so the trip table and the map always agree. Timestamps are relative to `now()` at the time you run the script. Route shapes are hand-placed waypoints on real Kochi corridors smoothed with a spline; they are not snapped to roads.

## Technical decisions and tradeoffs

- **React-Leaflet + OpenStreetMap**: no API key or billing, enough for markers, polylines and tooltips. Tradeoff: no vector styling or traffic layer.
- **Aggregates stored on `trips`, points in a separate table**: the list view never touches the large table. Tradeoff: aggregates could drift from points in a real system; the seed generator guarantees consistency here, and a real ingest job would compute them on trip close.
- **No `distance_today` / `trips_today` columns on `vehicles`**: they are derived from trips (last 24 h) to avoid denormalised values going stale.
- **Alerts computed client-side**: simple, and thresholds can change without a migration. Tradeoff: no alert history or acknowledgement. With more time this would become an `alerts` table written by a Postgres function or edge function.
- **Hash routing instead of React Router**: five views and two ids, zero extra dependency, works on any static host without rewrite rules.
- **Read-only RLS, workspace-wide**: fine for a single-tenant prototype. A production version needs `organization_id` on each table and membership-based policies.
- **Assumptions**: speed limit is a single fleet-wide value (see `src/lib/constants.ts`); one GPS ping per minute is enough to show halts and overspeed; seeded timestamps are relative to when `seed.sql` is run, so the app measures "time ago" against the newest ping.
- **Not done**: live updates (Supabase Realtime would be the next step), vehicle/driver editing, map clustering, route comparison.

## AI usage

- **Tools:** ChatGPT (initial scaffold, first schema, styling), Claude (code review and the second iteration described below).
- **Where they helped:** project structure, SQL, seed-data generation, Leaflet integration, alert rules, README drafting.
- **What I reviewed, overrode or changed:**
  - The first version drew a hard-coded dashed line offset from each vehicle's position as the "route". It ran into the sea and was not real data. I replaced it with a `trip_points` table and rendered the actual path per trip.
  - The first version stored "Attention" as a vehicle status, which made the KPI cards, list and badges disagree. I changed status to `moving/idle/offline` and derive "needs attention" from one function.
  - AI-generated code silently fell back to sample data when a Supabase query failed while still showing "Connected". I replaced that with explicit loading and error states.
  - A broken CSS grid declaration and 8–10 px type were fixed by hand-testing at several widths.
- Chat logs / share links are in `ai-logs/AI_CHAT_LOGS.md`.
- The one-click reviewer button uses a throwaway read-only account; its credentials are public in the bundle by design.

## Project structure

```
src/
  App.tsx              auth gate, shell, routing
  hooks.ts             useAuth, useFleet, useTripPoints, useRoute
  lib/                 api (Supabase/demo), alerts, constants, formatting, route analysis, CSV export
  components/          FleetMap (markers, route layer), TripDetail, VehicleList, Login, ui
  views/               Overview, Vehicles, Trips, Alerts, Settings
  demo/fleet.json      offline demo data (generated)
supabase/              schema.sql, seed.sql (generated)
scripts/               generate-seed.mjs
```