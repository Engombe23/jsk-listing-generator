-- TecDoc vehicle cache: stores one row per TecDoc vehicle/K-Type ID.
-- Run this in the Supabase SQL editor before starting the importer.

create table if not exists tecdoc_vehicle_cache (
  vehicle_id            bigint primary key,
  engine_id             text,
  manufacturer_name     text,
  model_name            text,
  type_engine_name      text,
  engine_codes          text[]   default '{}',
  power_kw              numeric,
  power_hp              numeric,
  capacity_cc           numeric,
  capacity_litres       numeric,
  fuel_type             text,
  body_type             text,
  number_of_cylinders   integer,
  construction_start    date,
  construction_end      date,
  raw_data              jsonb,
  first_synced_at       timestamptz not null default now(),
  last_synced_at        timestamptz not null default now()
);

create table if not exists tecdoc_import_jobs (
  id                         uuid primary key default gen_random_uuid(),
  status                     text not null default 'pending',
  current_manufacturer_id    text,
  current_manufacturer_name  text,
  current_model_id           text,
  current_model_name         text,
  manufacturers_processed    integer not null default 0,
  models_processed           integer not null default 0,
  vehicle_records_processed  integer not null default 0,
  failed_models              jsonb not null default '[]',
  started_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),
  completed_at               timestamptz,
  last_error                 text
);

-- GIN index for fast engine-code array lookups (e.g. WHERE 'N52B30A' = ANY(engine_codes))
create index if not exists idx_tecdoc_cache_engine_codes
  on tecdoc_vehicle_cache using gin(engine_codes);

-- B-tree for filtering / browsing by manufacturer
create index if not exists idx_tecdoc_cache_manufacturer
  on tecdoc_vehicle_cache(manufacturer_name);
