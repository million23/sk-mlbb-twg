-- Run this if 20260828120000_init.sql failed because types/tables already exist.
-- Safe to re-run. Does not drop tournaments/participants/teams data.
-- Recreates public.admins if id is still text (those committee rows cannot map to Auth).

create extension if not exists "pgcrypto";

do $$ begin create type admin_role as enum ('superadmin', 'staff'); exception when duplicate_object then null; end $$;
do $$ begin create type player_lane as enum ('mid', 'gold', 'exp', 'support', 'jungle'); exception when duplicate_object then null; end $$;
do $$ begin create type address_phase as enum ('4', '9', '10'); exception when duplicate_object then null; end $$;
do $$ begin
  create type tournament_status as enum ('draft', 'upcoming', 'live', 'completed', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin create type bracket_format as enum ('single_elimination'); exception when duplicate_object then null; end $$;
do $$ begin create type team_status as enum ('forming', 'ready', 'incomplete', 'inactive'); exception when duplicate_object then null; end $$;
do $$ begin create type team_intent as enum ('open_matching', 'join_team', 'create_team'); exception when duplicate_object then null; end $$;
do $$ begin
  create type participant_status as enum ('unassigned', 'suggested', 'assigned', 'inactive');
exception when duplicate_object then null; end $$;
do $$ begin create type registration_status as enum ('pending', 'approved', 'rejected'); exception when duplicate_object then null; end $$;
do $$ begin
  create type match_status as enum ('draft', 'scheduled', 'live', 'completed', 'walkover', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin create type match_draft_status as enum ('pending', 'active', 'completed'); exception when duplicate_object then null; end $$;

create or replace function pb_id()
returns text language sql volatile as $$
  select substr(replace(gen_random_uuid()::text, '-', ''), 1, 15);
$$;

create or replace function set_updated()
returns trigger language plpgsql as $$
begin
  new.updated = now();
  return new;
end;
$$;

-- Recreate admins as uuid → auth.users when the old text-id table is still around.
do $$
declare
  r record;
  id_udt text;
begin
  if to_regclass('public.admins') is null then
    return;
  end if;

  select t.typname into id_udt
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_type t on t.oid = a.atttypid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'admins'
    and a.attname = 'id'
    and not a.attisdropped;

  if id_udt = 'uuid' then
    return;
  end if;

  for r in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where confrelid = 'public.admins'::regclass
      and contype = 'f'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;

  drop table public.admins;
end $$;

create table if not exists admins (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role admin_role not null,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists tournaments (
  id text primary key default pb_id(),
  title text not null,
  slug text unique,
  description text,
  venue text,
  start_at timestamptz,
  end_at timestamptz,
  status tournament_status not null default 'draft',
  registration_enabled boolean not null default false,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  max_teams integer,
  min_team_size integer not null default 5,
  max_team_size integer not null default 6,
  bracket_count integer not null default 4,
  bracket_format bracket_format not null default 'single_elimination',
  match_best_of integer not null default 3,
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists teams (
  id text primary key default pb_id(),
  tournament text not null references tournaments (id) on delete restrict,
  name text not null,
  captain text,
  status team_status not null default 'forming',
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists participants (
  id text primary key default pb_id(),
  tournament text not null references tournaments (id) on delete restrict,
  name text not null,
  email text not null,
  ign text not null,
  birthdate date not null,
  contact_number text,
  user_id text not null,
  server_id text not null,
  address_phase address_phase not null,
  address_package text not null,
  address_block text not null,
  address_lot text not null,
  preferred_lane player_lane[] not null default '{}',
  preferred_roles player_lane[],
  role_rankings jsonb,
  performance_basis jsonb,
  team_intent team_intent,
  preferred_team text references teams (id) on delete set null,
  preferred_team_name text,
  registration_status registration_status not null default 'pending',
  registration_reject_reason text,
  registration_status_code text,
  consent_version text,
  consent_accepted_at timestamptz,
  school_id_front text,
  school_id_back text,
  purok_endorsement text,
  status participant_status not null default 'unassigned',
  team text references teams (id) on delete set null,
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists matches (
  id text primary key default pb_id(),
  tournament text not null references tournaments (id) on delete restrict,
  team_a text references teams (id) on delete set null,
  team_b text references teams (id) on delete set null,
  winner text references teams (id) on delete set null,
  bracket text,
  round text,
  "order" integer,
  best_of integer not null default 3,
  match_label text,
  scheduled_at timestamptz,
  status match_status not null default 'draft',
  score_a integer,
  score_b integer,
  notes text,
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists match_result (
  id text primary key default pb_id(),
  match text not null references matches (id) on delete cascade,
  player text not null references participants (id) on delete restrict,
  lane player_lane,
  kills integer,
  deaths integer,
  assists integer,
  game_performance_rating numeric,
  accumulated_gold numeric,
  game_number integer,
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists match_drafts (
  id text primary key default pb_id(),
  tournament text not null references tournaments (id) on delete restrict,
  team_a text references teams (id) on delete set null,
  team_b text references teams (id) on delete set null,
  match_label text,
  game_number integer,
  first_pick_team text references teams (id) on delete set null,
  bans jsonb,
  picks jsonb,
  status match_draft_status not null default 'pending',
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists tournament_drafts (
  id text primary key default pb_id(),
  title text not null,
  format text,
  rules text,
  max_teams integer,
  scheduled_at timestamptz,
  notes text,
  publish_to_tournament text references tournaments (id) on delete set null,
  archived boolean not null default false,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key default pb_id(),
  table_name text,
  record_id text,
  key_field text,
  created_by uuid,
  updated_by uuid,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists draft_suggestions (
  id text primary key default pb_id(),
  tournament_id text references tournaments (id) on delete set null,
  tournament_title text not null,
  match_label jsonb,
  suggested_bans jsonb,
  suggested_picks jsonb,
  notes jsonb,
  status jsonb,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table if not exists team_suggestions (
  id text primary key default pb_id(),
  participant_id text references participants (id) on delete set null,
  participant_game_id text not null,
  participant_status participant_status not null,
  participant_has_team jsonb,
  suggested_team_id text references teams (id) on delete set null,
  suggested_team_name text not null,
  suggested_team_status team_status not null,
  role_fit player_lane not null,
  preferred_role_1 player_lane not null,
  preferred_role_2 player_lane,
  preferred_role_3 player_lane,
  role_data_quality jsonb,
  role_match_score jsonb,
  role_match_level jsonb,
  ranking_basis jsonb,
  game_performance_rating jsonb,
  kda jsonb,
  accumulated_gold jsonb,
  team_member_count jsonb,
  team_slots_left jsonb,
  suggestion_priority jsonb,
  sort_score jsonb,
  reason jsonb,
  status jsonb,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

-- created_by / updated_by: text leftover → uuid, then FK to admins
do $$
declare
  tbl text;
  col text;
  udt text;
  r record;
begin
  foreach tbl in array array[
    'tournaments', 'teams', 'participants', 'matches', 'match_result',
    'match_drafts', 'tournament_drafts', 'audit_log'
  ]
  loop
    if to_regclass('public.' || tbl) is null then
      continue;
    end if;
    foreach col in array array['created_by', 'updated_by']
    loop
      select c.udt_name into udt
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = tbl
        and c.column_name = col;

      if udt is null then
        execute format(
          'alter table public.%I add column %I uuid',
          tbl,
          col
        );
        udt := 'uuid';
      end if;

      if udt in ('text', 'varchar', 'bpchar') then
        for r in
          select con.conname
          from pg_constraint con
          join pg_attribute att
            on att.attrelid = con.conrelid
           and att.attnum = any (con.conkey)
          where con.conrelid = ('public.' || tbl)::regclass
            and con.contype = 'f'
            and att.attname = col
        loop
          execute format('alter table public.%I drop constraint %I', tbl, r.conname);
        end loop;

        execute format(
          $f$
          alter table public.%I
            alter column %I type uuid
            using (
              case
                when %I is null then null
                when %I::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                  then %I::uuid
                else null
              end
            )
          $f$,
          tbl, col, col, col, col
        );
      end if;

      if not exists (
        select 1
        from pg_constraint con
        join pg_attribute att
          on att.attrelid = con.conrelid
         and att.attnum = any (con.conkey)
        where con.conrelid = ('public.' || tbl)::regclass
          and con.contype = 'f'
          and att.attname = col
          and con.confrelid = 'public.admins'::regclass
      ) then
        execute format(
          'alter table public.%I add constraint %I foreign key (%I) references public.admins (id) on delete set null',
          tbl,
          tbl || '_' || col || '_fkey',
          col
        );
      end if;
    end loop;
  end loop;
end $$;

do $$ begin
  alter table teams
    add constraint teams_captain_fkey
    foreign key (captain) references participants (id) on delete set null;
exception
  when duplicate_object then null;
  when undefined_table then null;
end $$;

create index if not exists tournaments_status_idx on tournaments (status) where archived = false;
create index if not exists teams_tournament_idx on teams (tournament) where archived = false;
create unique index if not exists teams_tournament_name_idx
  on teams (tournament, lower(name)) where archived = false;
create index if not exists participants_tournament_idx
  on participants (tournament, registration_status) where archived = false;
create unique index if not exists participants_status_code_idx
  on participants (registration_status_code) where registration_status_code is not null;
create unique index if not exists participants_active_email_per_tournament_idx
  on participants (tournament, lower(email))
  where registration_status in ('pending', 'approved') and archived = false;
create unique index if not exists participants_active_mlbb_id_per_tournament_idx
  on participants (tournament, user_id, server_id)
  where registration_status in ('pending', 'approved') and archived = false;
create index if not exists matches_tournament_idx on matches (tournament) where archived = false;
create index if not exists match_result_match_idx on match_result (match) where archived = false;
create index if not exists match_drafts_tournament_idx on match_drafts (tournament) where archived = false;
create index if not exists audit_log_table_record_idx on audit_log (table_name, record_id);

drop trigger if exists admins_set_updated on admins;
create trigger admins_set_updated
before update on admins
for each row execute function set_updated();

drop trigger if exists tournaments_set_updated on tournaments;
create trigger tournaments_set_updated
before update on tournaments
for each row execute function set_updated();

drop trigger if exists teams_set_updated on teams;
create trigger teams_set_updated
before update on teams
for each row execute function set_updated();

drop trigger if exists participants_set_updated on participants;
create trigger participants_set_updated
before update on participants
for each row execute function set_updated();

drop trigger if exists matches_set_updated on matches;
create trigger matches_set_updated
before update on matches
for each row execute function set_updated();

drop trigger if exists match_result_set_updated on match_result;
create trigger match_result_set_updated
before update on match_result
for each row execute function set_updated();

drop trigger if exists match_drafts_set_updated on match_drafts;
create trigger match_drafts_set_updated
before update on match_drafts
for each row execute function set_updated();

drop trigger if exists tournament_drafts_set_updated on tournament_drafts;
create trigger tournament_drafts_set_updated
before update on tournament_drafts
for each row execute function set_updated();

drop trigger if exists audit_log_set_updated on audit_log;
create trigger audit_log_set_updated
before update on audit_log
for each row execute function set_updated();

drop trigger if exists draft_suggestions_set_updated on draft_suggestions;
create trigger draft_suggestions_set_updated
before update on draft_suggestions
for each row execute function set_updated();

drop trigger if exists team_suggestions_set_updated on team_suggestions;
create trigger team_suggestions_set_updated
before update on team_suggestions
for each row execute function set_updated();

create or replace function is_committee()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where id = auth.uid() and is_active);
$$;

create or replace function is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from admins
    where id = auth.uid() and is_active and role = 'superadmin'
  );
$$;

create or replace function tournament_is_public(p_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from tournaments
    where id = p_id and archived = false and status in ('upcoming', 'live')
  );
$$;

create or replace function admins_guard_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if is_superadmin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.email is distinct from old.email
     or new.name is distinct from old.name
     or new.role is distinct from old.role
     or new.is_active is distinct from old.is_active then
    raise exception 'staff can only update last_login_at';
  end if;
  return new;
end;
$$;

drop trigger if exists admins_guard_update on admins;
create trigger admins_guard_update
before update on admins
for each row execute function admins_guard_update();

create or replace function handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_role admin_role;
  display_name text;
begin
  if exists (select 1 from admins) then
    new_role := 'staff';
  else
    new_role := 'superadmin';
  end if;

  display_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Committee'
  );

  insert into admins (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, new.id::text || '@invalid.local'),
    display_name,
    new_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

create or replace function sync_admin_email_from_auth()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null then
    update admins
    set email = new.email
    where id = new.id
      and email is distinct from new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function sync_admin_email_from_auth();

create or replace function registration_email_available(p_tournament text, p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from participants
    where tournament = p_tournament
      and lower(email) = lower(trim(p_email))
      and registration_status in ('pending', 'approved')
      and archived = false
  );
$$;

create or replace function registration_listed_teams(p_tournament text)
returns table (id text, name text)
language sql stable security definer set search_path = public as $$
  select t.id, t.name
  from teams t
  where t.tournament = p_tournament
    and t.archived = false
    and t.status <> 'inactive'
    and not (
      t.status = 'forming'
      and not exists (
        select 1 from participants p
        where p.team = t.id and p.status = 'assigned' and p.archived = false
      )
      and exists (
        select 1 from participants p
        where p.preferred_team = t.id
          and p.team_intent = 'create_team'
          and p.registration_status in ('pending', 'approved')
          and p.archived = false
      )
    )
  order by t.name;
$$;

create or replace function registration_status_lookup(p_code text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  r participants%rowtype;
  tournament_title text := '';
  preferred_team_name text := '';
begin
  if p_code is null or p_code !~ '^\d{6}$' then
    return jsonb_build_object('found', false);
  end if;

  select * into r
  from participants
  where registration_status_code = p_code
    and archived = false
  order by created desc
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  select coalesce(t.title, '') into tournament_title
  from tournaments t
  where t.id = r.tournament;

  preferred_team_name := coalesce(nullif(trim(r.preferred_team_name), ''), '');
  if preferred_team_name = '' and r.preferred_team is not null then
    select coalesce(tm.name, '') into preferred_team_name
    from teams tm
    where tm.id = r.preferred_team;
  end if;

  return jsonb_build_object(
    'found', true,
    'receipt', jsonb_build_object(
      'registration_status', r.registration_status,
      'registration_reject_reason', coalesce(r.registration_reject_reason, ''),
      'registration_status_code', p_code,
      'tournament_title', coalesce(tournament_title, ''),
      'name', r.name,
      'email', r.email,
      'ign', r.ign,
      'birthdate', r.birthdate,
      'contact_number', coalesce(r.contact_number, ''),
      'user_id', r.user_id,
      'server_id', r.server_id,
      'address_phase', r.address_phase,
      'address_package', r.address_package,
      'address_block', r.address_block,
      'address_lot', r.address_lot,
      'preferred_lane', array_to_string(r.preferred_lane, ','),
      'team_intent', r.team_intent,
      'preferred_team_name', coalesce(preferred_team_name, ''),
      'status', r.status,
      'consent_version', coalesce(r.consent_version, ''),
      'consent_accepted_at', r.consent_accepted_at,
      'created', r.created,
      'has_purok_endorsement', coalesce(nullif(trim(r.purok_endorsement), ''), '') <> ''
    )
  );
end;
$$;

-- Backfill Auth users that were created before the trigger existed.
insert into admins (id, email, name, role)
select
  u.id,
  coalesce(u.email, u.id::text || '@invalid.local'),
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'Committee'
  ),
  'staff'::admin_role
from auth.users u
where not exists (select 1 from admins a where a.id = u.id);

update admins
set role = 'superadmin'
where id = (select id from auth.users order by created_at limit 1)
  and not exists (select 1 from admins where role = 'superadmin');

grant usage on schema public to anon, authenticated;
grant execute on function is_committee() to authenticated;
grant execute on function is_superadmin() to authenticated;
grant execute on function tournament_is_public(text) to anon, authenticated;
grant execute on function registration_email_available(text, text) to anon, authenticated;
grant execute on function registration_listed_teams(text) to anon, authenticated;
grant execute on function registration_status_lookup(text) to anon, authenticated;

grant select, insert, update, delete on
  admins, tournaments, teams, participants, matches, match_result,
  match_drafts, tournament_drafts, audit_log, draft_suggestions, team_suggestions
to authenticated;

grant select on tournaments, teams, matches to anon;
grant insert on participants to anon;

alter table admins enable row level security;
alter table tournaments enable row level security;
alter table teams enable row level security;
alter table participants enable row level security;
alter table matches enable row level security;
alter table match_result enable row level security;
alter table match_drafts enable row level security;
alter table tournament_drafts enable row level security;
alter table audit_log enable row level security;
alter table draft_suggestions enable row level security;
alter table team_suggestions enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'admins', 'tournaments', 'teams', 'participants', 'matches',
        'match_result', 'match_drafts', 'tournament_drafts', 'audit_log',
        'draft_suggestions', 'team_suggestions'
      )
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

create policy admins_select_committee on admins for select to authenticated using (is_committee());
create policy admins_insert_superadmin on admins for insert to authenticated with check (is_superadmin());
create policy admins_update_committee on admins for update to authenticated
  using (is_superadmin() or (is_committee() and id = auth.uid()))
  with check (is_superadmin() or (is_committee() and id = auth.uid()));
create policy admins_delete_superadmin on admins for delete to authenticated
  using (is_superadmin() and id <> auth.uid());

create policy tournaments_select_public on tournaments for select to anon, authenticated
  using (is_committee() or (archived = false and status in ('upcoming', 'live')));
create policy tournaments_write_superadmin on tournaments for insert to authenticated with check (is_superadmin());
create policy tournaments_update_superadmin on tournaments for update to authenticated using (is_superadmin()) with check (is_superadmin());
create policy tournaments_delete_superadmin on tournaments for delete to authenticated using (is_superadmin());

create policy teams_select on teams for select to anon, authenticated
  using (is_committee() or (archived = false and tournament_is_public(tournament)));
create policy teams_write_committee on teams for insert to authenticated with check (is_committee());
create policy teams_update_committee on teams for update to authenticated using (is_committee()) with check (is_committee());
create policy teams_delete_committee on teams for delete to authenticated using (is_committee());

create policy participants_select_committee on participants for select to authenticated using (is_committee());
create policy participants_insert_committee on participants for insert to authenticated with check (is_committee());
create policy participants_insert_public on participants for insert to anon with check (
  registration_status = 'pending'
  and archived = false
  and status = 'unassigned'
  and team is null
  and created_by is null
  and updated_by is null
  and registration_reject_reason is null
  and role_rankings is null
  and performance_basis is null
  and exists (
    select 1 from tournaments tr
    where tr.id = tournament
      and tr.archived = false
      and tr.registration_enabled
      and tr.status not in ('draft', 'archived', 'completed')
      and (tr.registration_open_at is null or tr.registration_open_at <= now())
      and (tr.registration_close_at is null or tr.registration_close_at >= now())
  )
);
create policy participants_update_committee on participants for update to authenticated using (is_committee()) with check (is_committee());
create policy participants_delete_committee on participants for delete to authenticated using (is_committee());

create policy matches_select on matches for select to anon, authenticated
  using (
    is_committee()
    or (archived = false and status <> 'draft' and tournament_is_public(tournament))
  );
create policy matches_insert_committee on matches for insert to authenticated with check (is_committee());
create policy matches_update_committee on matches for update to authenticated using (is_committee()) with check (is_committee());
create policy matches_delete_committee on matches for delete to authenticated using (is_committee());

create policy match_result_committee on match_result for all to authenticated using (is_committee()) with check (is_committee());
create policy match_drafts_committee on match_drafts for all to authenticated using (is_committee()) with check (is_committee());
create policy tournament_drafts_committee on tournament_drafts for all to authenticated using (is_committee()) with check (is_committee());
create policy draft_suggestions_committee on draft_suggestions for all to authenticated using (is_committee()) with check (is_committee());
create policy team_suggestions_committee on team_suggestions for all to authenticated using (is_committee()) with check (is_committee());

create policy audit_log_insert_committee on audit_log for insert to authenticated with check (is_committee());
create policy audit_log_select_superadmin on audit_log for select to authenticated using (is_superadmin());
create policy audit_log_update_superadmin on audit_log for update to authenticated using (is_superadmin()) with check (is_superadmin());
create policy audit_log_delete_superadmin on audit_log for delete to authenticated using (is_superadmin());
