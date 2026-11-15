-- Placeholder schema: a generic impermanence core. The chosen concept extends it.
-- Target: Postgres (Supabase, Neon or yours). Decay is computed, not stored. Expired rows are hard-deleted by a cron sweep.
create extension if not exists pgcrypto;

create table if not exists specimens (          -- anything that will disappear
  id          uuid primary key default gen_random_uuid(),
  kind        text not null,                     -- concept-specific type
  payload     jsonb not null default '{}',       -- content, discarded at death
  born_at     timestamptz not null default now(),
  model       text not null default 'halflife' check (model in ('halflife','weibull','logistic','retention')),
  params      jsonb not null default '{"t_half": 86400}',
  dies_at     timestamptz,                       -- hard deadline (optional)
  fossil      jsonb                              -- what survives the death (summary, counts)
);

create table if not exists decay_events (        -- the ending as a witnessed event
  id          bigserial primary key,
  specimen_id uuid references specimens(id) on delete set null,
  event       text not null check (event in ('born','touched','transformed','died')),
  at          timestamptz not null default now(),
  meta        jsonb default '{}'
);

create table if not exists public_counters (     -- differentially private aggregates only
  name text primary key, value double precision not null default 0, updated_at timestamptz default now()
);

-- life(t) for the half-life model; other models are mirrored in demo/engine/decay.js
create or replace function life(s specimens, at timestamptz default now()) returns double precision
language sql stable as $$
  select power(2, - extract(epoch from (at - s.born_at)) / coalesce((s.params->>'t_half')::float, 86400))
$$;

-- Sweep: run every minute with pg_cron:  select cron.schedule('sweep','* * * * *','select sweep()');
create or replace function sweep() returns int language plpgsql as $$
declare n int; begin
  insert into decay_events(specimen_id,event) select id,'died' from specimens
   where (dies_at is not null and dies_at < now()) or life(specimens) < 0.01;
  with d as (delete from specimens where (dies_at is not null and dies_at < now()) or life(specimens) < 0.01 returning 1)
  select count(*) into n from d; return n; end $$;
