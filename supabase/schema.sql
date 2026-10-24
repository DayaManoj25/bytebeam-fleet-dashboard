-- Bytebeam Fleet Dashboard schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.drivers (
 id uuid primary key default gen_random_uuid(), name text not null, phone text, created_at timestamptz default now()
);
create table if not exists public.vehicles (
 id uuid primary key default gen_random_uuid(), name text not null, plate text unique not null,
 driver_id uuid references public.drivers(id), status text not null check(status in ('Moving','Idle','Offline','Attention')),
 latitude double precision not null, longitude double precision not null, speed_kph numeric default 0,
 fuel_percent integer default 100 check(fuel_percent between 0 and 100),
 battery_percent integer default 100 check(battery_percent between 0 and 100),
 ignition boolean default false, last_seen timestamptz default now(),
 distance_today numeric default 0, trips_today integer default 0, health_score integer default 100,
 created_at timestamptz default now()
);
create table if not exists public.trips (
 id uuid primary key default gen_random_uuid(), vehicle_id uuid not null references public.vehicles(id) on delete cascade,
 driver_id uuid references public.drivers(id), start_location text not null, end_location text not null,
 start_lat double precision, start_lng double precision, end_lat double precision, end_lng double precision,
 started_at timestamptz not null, ended_at timestamptz, distance_km numeric not null default 0,
 duration_minutes integer default 0, avg_speed_kph numeric default 0, max_speed_kph numeric default 0,
 halt_count integer default 0, overspeed_events integer default 0, created_at timestamptz default now()
);
create table if not exists public.telemetry (
 id bigint generated always as identity primary key, vehicle_id uuid not null references public.vehicles(id) on delete cascade,
 recorded_at timestamptz not null default now(), latitude double precision not null, longitude double precision not null,
 speed_kph numeric default 0, fuel_percent integer, battery_percent integer, ignition boolean
);
create index if not exists trips_vehicle_started_idx on public.trips(vehicle_id,started_at desc);
create index if not exists telemetry_vehicle_recorded_idx on public.telemetry(vehicle_id,recorded_at desc);
alter table public.drivers enable row level security; alter table public.vehicles enable row level security;
alter table public.trips enable row level security; alter table public.telemetry enable row level security;
-- Prototype policy: authenticated workspace members can read fleet data.
create policy "authenticated read drivers" on public.drivers for select to authenticated using (true);
create policy "authenticated read vehicles" on public.vehicles for select to authenticated using (true);
create policy "authenticated read trips" on public.trips for select to authenticated using (true);
create policy "authenticated read telemetry" on public.telemetry for select to authenticated using (true);
-- For a production app, add organization_id and membership-based policies instead of workspace-wide reads.
