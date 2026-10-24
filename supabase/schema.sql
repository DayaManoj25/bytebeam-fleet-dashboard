-- Bytebeam Fleet Dashboard schema. Run in the Supabase SQL Editor, then run seed.sql.
-- NOTE: this file starts by dropping the demo tables so it can be re-run safely on a
-- scratch project. Do not run it against a project that holds data you want to keep.

drop table if exists public.trip_points cascade;
drop table if exists public.trips cascade;
drop table if exists public.telemetry cascade; -- legacy table from the first version
drop table if exists public.vehicles cascade;
drop table if exists public.drivers cascade;

create extension if not exists pgcrypto;

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- Current state of each vehicle (last known position + health). One row per vehicle.
-- "Needs attention" is NOT stored: it is derived in the UI from fuel, battery, health,
-- connectivity and recent trips (see src/lib/alerts.ts), so thresholds can change
-- without a data migration.
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plate text not null unique,
  vehicle_type text not null default 'van' check (vehicle_type in ('van', 'truck')),
  driver_id uuid references public.drivers(id) on delete set null,
  status text not null check (status in ('moving', 'idle', 'offline')),
  status_since timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  speed_kph numeric not null default 0,
  fuel_percent integer not null default 100 check (fuel_percent between 0 and 100),
  battery_percent integer not null default 100 check (battery_percent between 0 and 100),
  ignition boolean not null default false,
  last_seen timestamptz not null default now(),
  health_score integer not null default 100 check (health_score between 0 and 100),
  created_at timestamptz not null default now()
);

-- One row per trip. Aggregates are stored so the trip list does not have to scan points.
-- ended_at is null while a trip is in progress.
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  driver_id uuid references public.drivers(id) on delete set null,
  start_location text not null,
  end_location text not null,
  start_lat double precision,
  start_lng double precision,
  end_lat double precision,
  end_lng double precision,
  started_at timestamptz not null,
  ended_at timestamptz,
  distance_km numeric not null default 0,
  duration_minutes integer not null default 0,
  avg_speed_kph numeric not null default 0,
  max_speed_kph numeric not null default 0,
  halt_count integer not null default 0,
  idle_minutes integer not null default 0,
  overspeed_events integer not null default 0,
  created_at timestamptz not null default now()
);

-- Movement history: ordered GPS pings for a trip. Fetched lazily, only for the selected trip.
create table public.trip_points (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  seq integer not null,
  recorded_at timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  speed_kph numeric not null default 0,
  unique (trip_id, seq)
);

create index trips_vehicle_started_idx on public.trips (vehicle_id, started_at desc);
create index trips_started_idx on public.trips (started_at desc);
create index trip_points_trip_seq_idx on public.trip_points (trip_id, seq);

-- Row level security: signed-in users can read fleet data; nobody can write from the browser.
alter table public.drivers enable row level security;
alter table public.vehicles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_points enable row level security;

create policy "authenticated read drivers" on public.drivers for select to authenticated using (true);
create policy "authenticated read vehicles" on public.vehicles for select to authenticated using (true);
create policy "authenticated read trips" on public.trips for select to authenticated using (true);
create policy "authenticated read trip_points" on public.trip_points for select to authenticated using (true);

-- Production note: add an organization_id to every table and scope these policies to
-- membership (e.g. using an org_members table) instead of workspace-wide reads.
