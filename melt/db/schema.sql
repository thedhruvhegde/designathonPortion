-- Melt on Postgres (Supabase / Neon / your own). Prices are computed, never stored.
create extension if not exists pgcrypto;

create table dorms (id text primary key, name text not null, x real not null, y real not null);

create table listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null,
  name        text not null,
  category    text not null,
  glyph       text,
  p0          numeric(8,2) not null check (p0 > 0),
  k           real not null default 0.025,            -- melt temperament
  t_deadline  timestamptz not null,                   -- hard $0 time (move-out)
  listed_at   timestamptz not null default now(),
  kg real, ft3 real, condition text, blurb text,
  dorm_id     text references dorms(id),
  status      text not null default 'melting' check (status in ('melting','sold','kindness','free','claimed','donation','picked')),
  sold_price  numeric(8,2), buyer_id uuid, zero_at timestamptz
);
create index on listings (status, t_deadline);

create table heat_events (            -- watches, views and bids: the Hawkes heat source
  listing_id uuid references listings(id) on delete cascade,
  kind text not null check (kind in ('watch','view','bid')),
  at timestamptz not null default now()
);
create index on heat_events (listing_id, at);

create table claimants (              -- opt-in need flags, private; never shown to sellers
  id uuid primary key default gen_random_uuid(), alias text, flags text[] not null default '{}',
  needs text[] not null default '{}', dorm_id text references dorms(id)
);

create table kindness_matches (listing_id uuid references listings(id), claimant_id uuid references claimants(id), matched_at timestamptz default now(), primary key (listing_id));

create table pickups (                -- donation routes from Clarke–Wright + 2-opt
  id bigserial primary key, run_at timestamptz default now(), route jsonb not null, length real, capacity real
);

-- deadline-normalised melt price at effective time s (hours); heat is applied in the app layer
create or replace function melt_price(p0 numeric, k real, t_total real, s real) returns numeric language sql immutable as $$
  select case when s <= 0 then p0 when s >= t_total then 0
              else round(p0 * (exp(-k*s) - exp(-k*t_total)) / (1 - exp(-k*t_total)), 2) end
$$;

-- move items past their deadline into the Kindness Window, then free, then donation (pg_cron every minute)
create or replace function melt_sweep() returns void language sql as $$
  update listings set status='kindness', zero_at=now() where status='melting' and t_deadline <= now();
  update listings set status='free' where status='kindness' and zero_at <= now() - interval '2 hours';
  update listings set status='donation' where status='free' and zero_at <= now() - interval '6 hours';
$$;
-- select cron.schedule('melt-sweep', '* * * * *', 'select melt_sweep()');
