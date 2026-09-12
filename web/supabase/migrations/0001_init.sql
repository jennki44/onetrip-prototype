-- OneTRIP schema. Every table belongs to a trip; row-level security allows only members of that trip.
-- Money is stored as integer minor units (cents) in the trip's base currency.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type member_role as enum ('owner', 'admin', 'traveller', 'viewer');
create type item_status as enum ('idea', 'proposed', 'voting', 'confirmed', 'cancelled', 'completed');
create type booking_state as enum ('none', 'needed', 'booked');
create type decision_status as enum ('open', 'almost', 'confirmed');
create type reaction as enum ('love', 'good', 'maybe', 'no');
create type split_type as enum ('equal', 'amounts', 'percent', 'shares', 'itemised');
create type place_type as enum ('hotel', 'restaurant', 'activity', 'transport', 'shopping', 'saved');

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  initials text not null,
  color text not null default '#0F766E',
  locale text not null default 'en',
  reporting_currency text,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare n text;
begin
  n := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  insert into profiles (id, name, initials) values (new.id, n, upper(left(n, 2)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ---------- trips & members ----------
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  emoji text not null default '🧳',
  start_date date not null,
  end_date date not null,
  base_currency text not null default 'AUD',
  home_currency text not null default 'HKD',
  budget_minor bigint,                       -- in home currency minor units
  budget_categories jsonb not null default '{}'::jsonb,  -- {"Food": 650000, ...} minor units of home currency
  styles text[] not null default '{}',
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  cover_url text,
  status text not null default 'active',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table trip_members (
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'traveller',
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);
create index on trip_members (user_id);

create table trip_days (
  trip_id uuid not null references trips(id) on delete cascade,
  day int not null,
  theme text,
  stay text,
  drive text,
  banner_url text,
  caption text,
  rule text,
  primary key (trip_id, day)
);

-- ---------- places ----------
create table places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  type place_type not null default 'activity',
  area text,
  address text,
  lat double precision,
  lng double precision,
  map_x real, map_y real,                    -- schematic map position (prototype-style map)
  rating real,
  price_level text,
  est_pp_minor int,
  hours text,
  emoji text not null default '📍',
  photo_url text,
  from_hotel_min int,
  saved boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on places (trip_id);

-- ---------- bookings & documents ----------
create table documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  category text not null default 'Other',   -- Flights, Hotels, Transport, Activities, Insurance, Receipts, Other
  storage_path text,
  size_bytes bigint,
  linked_type text,                          -- booking | expense | item | place
  linked_id uuid,
  added_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on documents (trip_id);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null default 'activity',     -- flight | hotel | activity | transport
  title text not null,
  reference text,
  provider text,
  date date,
  status text not null default 'confirmed',  -- confirmed | pending
  cost_minor bigint,
  paid_minor bigint,
  cost_home_minor bigint,                    -- for things paid before the trip in home currency
  details jsonb not null default '{}'::jsonb,
  document_id uuid references documents(id) on delete set null,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on bookings (trip_id);

-- ---------- decisions ----------
create table decisions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  title text not null,
  question text,
  status decision_status not null default 'open',
  deadline date,
  day int,
  slot time,
  category text not null default 'Food',
  confirmed_option_id uuid,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on decisions (trip_id);

create table decision_options (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  place_id uuid references places(id) on delete set null,
  label text,
  sub text,
  est_pp_minor int not null default 0,
  sort int not null default 0
);
create index on decision_options (decision_id);
alter table decisions add constraint decisions_confirmed_fk foreign key (confirmed_option_id) references decision_options(id) on delete set null;

create table votes (
  option_id uuid not null references decision_options(id) on delete cascade,
  decision_id uuid not null references decisions(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  reaction reaction not null,
  created_at timestamptz not null default now(),
  primary key (option_id, user_id)
);
create index on votes (decision_id);

-- ---------- itinerary ----------
create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day int not null,
  start_time time not null,
  end_time time,
  title text not null,
  place_id uuid references places(id) on delete set null,
  emoji text not null default '📍',
  category text not null default 'activity', -- food | activity | transport | stay | shopping | free
  status item_status not null default 'proposed',
  booking booking_state not null default 'none',
  booking_id uuid references bookings(id) on delete set null,
  decision_id uuid references decisions(id) on delete set null,
  cost_minor bigint,
  travel_min int,
  address text,
  note text,
  flag text,
  photo_url text,
  participant_ids uuid[] not null default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on itinerary_items (trip_id, day, start_time);

-- ---------- money ----------
create table receipts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  merchant text,
  date date,
  subtotal_minor bigint,
  tax_minor bigint not null default 0,
  gst_included_minor bigint,
  total_minor bigint,
  currency text not null,
  image_path text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  amount_minor bigint not null,
  user_ids uuid[] not null default '{}',
  sort int not null default 0
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  merchant text not null,
  place_id uuid references places(id) on delete set null,
  item_id uuid references itinerary_items(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  receipt_id uuid references receipts(id) on delete set null,
  document_id uuid references documents(id) on delete set null,
  category text not null default 'Other',
  amount_minor bigint not null,              -- as paid, in `currency`
  currency text not null,
  base_minor bigint not null,                -- converted to the trip base currency at `rate`
  rate numeric(14,6) not null default 1,     -- base units per 1 unit of `currency`, snapshot at entry
  date date not null,
  time time,
  payer_id uuid not null references profiles(id),
  split split_type not null default 'equal',
  note text,
  emoji text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on expenses (trip_id, date);

create table expense_shares (
  expense_id uuid not null references expenses(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  share_minor bigint not null,
  primary key (expense_id, user_id)
);
create index on expense_shares (trip_id, user_id);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  from_user uuid not null references profiles(id),
  to_user uuid not null references profiles(id),
  amount_minor bigint not null,
  date date not null default current_date,
  note text,
  status text not null default 'paid',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
create index on settlements (trip_id);

-- ---------- activity, notifications, notes ----------
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid references profiles(id),
  text text not null,
  created_at timestamptz not null default now()
);
create index on activity_log (trip_id, created_at desc);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  icon text,
  text text not null,
  link jsonb,
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on notifications (trip_id, created_at desc);

create table notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid references profiles(id),
  item_id uuid references itinerary_items(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

-- ---------- helpers ----------
create or replace function is_trip_member(t uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid());
$$;

create or replace function trip_role(t uuid) returns member_role language sql stable security definer set search_path = public as $$
  select role from trip_members where trip_id = t and user_id = auth.uid();
$$;

create or replace function can_edit(t uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(trip_role(t) in ('owner', 'admin', 'traveller'), false);
$$;

create or replace function can_manage(t uuid) returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(trip_role(t) in ('owner', 'admin'), false);
$$;

-- Create a trip and make the caller its owner in one step.
create or replace function create_trip(p_name text, p_destination text, p_emoji text, p_start date, p_end date, p_base text, p_home text, p_budget_minor bigint, p_styles text[])
returns uuid language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into trips (name, destination, emoji, start_date, end_date, base_currency, home_currency, budget_minor, styles, created_by)
  values (p_name, p_destination, coalesce(p_emoji, '🧳'), p_start, p_end, p_base, p_home, p_budget_minor, coalesce(p_styles, '{}'), auth.uid()) returning id into tid;
  insert into trip_members (trip_id, user_id, role) values (tid, auth.uid(), 'owner');
  insert into activity_log (trip_id, user_id, text) values (tid, auth.uid(), 'Created the trip.');
  return tid;
end $$;

-- Join by invite code. Returns the trip id.
create or replace function join_trip(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare tid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select id into tid from trips where invite_code = upper(replace(p_code, '-', ''));
  if tid is null then raise exception 'unknown code'; end if;
  insert into trip_members (trip_id, user_id, role) values (tid, auth.uid(), 'traveller') on conflict do nothing;
  insert into activity_log (trip_id, user_id, text) values (tid, auth.uid(), 'Joined the trip.');
  return tid;
end $$;

-- Preview a trip by code without joining (name, dates, member count). Safe to expose.
create or replace function preview_trip(p_code text) returns table (id uuid, name text, destination text, emoji text, start_date date, end_date date, members int, plans int)
language sql security definer set search_path = public as $$
  select t.id, t.name, t.destination, t.emoji, t.start_date, t.end_date,
    (select count(*)::int from trip_members m where m.trip_id = t.id),
    (select count(*)::int from itinerary_items i where i.trip_id = t.id)
  from trips t where t.invite_code = upper(replace(p_code, '-', ''));
$$;

-- ---------- row-level security ----------
alter table profiles enable row level security;
create policy "profiles: read members of shared trips" on profiles for select using (
  id = auth.uid() or exists (select 1 from trip_members a join trip_members b on a.trip_id = b.trip_id where a.user_id = auth.uid() and b.user_id = profiles.id)
);
create policy "profiles: update own" on profiles for update using (id = auth.uid());

alter table trips enable row level security;
create policy "trips: members read" on trips for select using (is_trip_member(id));
create policy "trips: managers update" on trips for update using (can_manage(id));
create policy "trips: owner delete" on trips for delete using (trip_role(id) = 'owner');

alter table trip_members enable row level security;
create policy "members: members read" on trip_members for select using (is_trip_member(trip_id));
create policy "members: managers change" on trip_members for update using (can_manage(trip_id));
create policy "members: managers remove or self leave" on trip_members for delete using (can_manage(trip_id) or user_id = auth.uid());

-- Generic policies for trip-scoped tables
do $$
declare t text;
begin
  foreach t in array array['trip_days','places','documents','bookings','decisions','decision_options','itinerary_items','receipts','receipt_items','expenses','expense_shares','settlements','activity_log','notifications','notes']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "%s: members read" on %I for select using (is_trip_member(trip_id))', t, t);
    execute format('create policy "%s: editors insert" on %I for insert with check (can_edit(trip_id))', t, t);
    execute format('create policy "%s: editors update" on %I for update using (can_edit(trip_id))', t, t);
    execute format('create policy "%s: editors delete" on %I for delete using (can_edit(trip_id))', t, t);
  end loop;
end $$;

-- Bookings: only admins/owners may change them (traveller role cannot, matching the permissions grid)
drop policy "bookings: editors insert" on bookings; drop policy "bookings: editors update" on bookings; drop policy "bookings: editors delete" on bookings;
create policy "bookings: managers insert" on bookings for insert with check (can_manage(trip_id));
create policy "bookings: managers update" on bookings for update using (can_manage(trip_id));
create policy "bookings: managers delete" on bookings for delete using (can_manage(trip_id));

-- Votes: every member including viewers may vote, only for themselves
alter table votes enable row level security;
create policy "votes: members read" on votes for select using (is_trip_member(trip_id));
create policy "votes: self insert" on votes for insert with check (is_trip_member(trip_id) and user_id = auth.uid());
create policy "votes: self update" on votes for update using (user_id = auth.uid());
create policy "votes: self delete" on votes for delete using (user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table itinerary_items, decisions, decision_options, votes, expenses, expense_shares, settlements, notifications, activity_log;

-- Storage buckets (private; access via signed URLs)
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false), ('documents', 'documents', false), ('photos', 'photos', true) on conflict do nothing;
create policy "storage: members read receipts" on storage.objects for select using (bucket_id in ('receipts','documents') and is_trip_member((storage.foldername(name))[1]::uuid));
create policy "storage: editors upload receipts" on storage.objects for insert with check (bucket_id in ('receipts','documents','photos') and can_edit((storage.foldername(name))[1]::uuid));
create policy "storage: photos public read" on storage.objects for select using (bucket_id = 'photos');
