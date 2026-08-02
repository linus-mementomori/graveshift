-- ============================================================================
--  Nightfall — schema + Row Level Security
--  Run in Supabase dashboard → SQL Editor → New query → Run.
--  Re-runnable: every statement is `if not exists` / `or replace` / `drop … if exists`.
--
--  IMPORTANT: the policies below are the ACTUAL security boundary. Any check in
--  the React app is a UX gate only — the publishable/anon key is public and the
--  /admin route's JavaScript ships to every visitor. Postgres enforces these on
--  every request regardless of what the client claims.
--
--  See docs/CLOUD_PLAN.md for the rationale behind each choice.
-- ============================================================================

-- ------------------------------------------------------------------ admin ---
-- Single source of truth for who may see cross-user data. EDIT THIS LIST.
--
-- Deliberately NOT `security definer`: it reads only the caller's own JWT and
-- touches no table, so it needs no elevated privilege. Postgres grants EXECUTE
-- to PUBLIC on every new function, which means a SECURITY DEFINER function in
-- `public` is a public API endpoint — every one you don't create is a
-- privilege-escalation bug you can't have.
--
-- `search_path = ''` prevents search-path injection; auth.jwt() is qualified.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'REPLACE-WITH-YOUR-EMAIL@example.com'
  );
$$;

-- --------------------------------------------------------------- profiles ---
create table if not exists public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- You see yourself. Admins see everyone.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- USING and WITH CHECK both required: without WITH CHECK a user could reassign
-- the row to someone else's id.
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Profile rows are created by trigger, never by the client — so there is
-- deliberately no INSERT policy.
--
-- This one genuinely needs `security definer`: it writes to public.profiles
-- from a trigger on auth.users. Everything it touches is fully qualified and
-- search_path is empty, so it can't be redirected at a schema it didn't mean.
--
-- NOTE: raw_user_meta_data is USER-EDITABLE. It is safe to read here because
-- display_name is presentation only — never use it for an authorization
-- decision (that's what is_admin() and app_metadata are for).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------- custom_themes ---
-- A "modified prompt" and a "custom theme" are the same object (CLOUD_PLAN §4).
create table if not exists public.custom_themes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  base_theme_id  text,                    -- null = authored from scratch
  name           text not null,
  tagline        text not null default '',
  category       text not null,
  data           jsonb not null,          -- Theme-shaped; validated app-side (D11)
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint custom_themes_name_len    check (char_length(name) between 1 and 60),
  constraint custom_themes_tagline_len check (char_length(tagline) <= 140),
  constraint custom_themes_data_size   check (pg_column_size(data) < 64000),
  constraint custom_themes_category    check (category in
    ('horror','crime','anime','myth','scifi','history','fantasy'))
);

-- Indexes on every column used in an RLS policy.
create index if not exists custom_themes_user_idx
  on public.custom_themes (user_id, updated_at desc);
create index if not exists custom_themes_public_idx
  on public.custom_themes (is_public) where is_public = true;

alter table public.custom_themes enable row level security;

drop policy if exists "custom_themes_select" on public.custom_themes;
create policy "custom_themes_select" on public.custom_themes
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or is_public = true
    or (select public.is_admin())
  );

drop policy if exists "custom_themes_insert" on public.custom_themes;
create policy "custom_themes_insert" on public.custom_themes
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "custom_themes_update" on public.custom_themes;
create policy "custom_themes_update" on public.custom_themes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "custom_themes_delete" on public.custom_themes;
create policy "custom_themes_delete" on public.custom_themes
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ------------------------------------------------------------------ games ---
-- One row per hosted game. Written at start, updated at end (CLOUD_PLAN §7).
--
-- final_state holds a GameState snapshot with SEAT NAMES STRIPPED — those are
-- the real names of party guests who never signed up for anything. See §14.2.
create table if not exists public.games (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  theme_id         text,
  custom_theme_id  uuid references public.custom_themes on delete set null,
  player_count     int not null,
  composition      jsonb not null,
  settings         jsonb not null,
  seed             text not null,
  status           text not null default 'in_progress',
  winner_faction   text,
  night_count      int,
  final_state      jsonb,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  updated_at       timestamptz not null default now(),

  constraint games_player_count check (player_count between 5 and 20),
  constraint games_status       check (status in ('in_progress','complete','abandoned')),
  constraint games_winner       check (winner_faction is null
                                  or winner_faction in ('village','mafia','neutral'))
);

create index if not exists games_user_idx    on public.games (user_id, started_at desc);
create index if not exists games_started_idx on public.games (started_at desc);

alter table public.games enable row level security;

drop policy if exists "games_select" on public.games;
create policy "games_select" on public.games
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "games_insert" on public.games;
create policy "games_insert" on public.games
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "games_update" on public.games;
create policy "games_update" on public.games
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "games_delete" on public.games;
create policy "games_delete" on public.games
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ------------------------------------------------------------ admin views ---
-- ⚠ security_invoker = true is REQUIRED. Without it a view runs as its OWNER
--   and SILENTLY BYPASSES RLS — every visitor would read every row.
create or replace view public.admin_recent_games
with (security_invoker = true) as
  select g.id, g.user_id, p.display_name, g.theme_id, g.custom_theme_id,
         g.player_count, g.status, g.winner_faction, g.night_count,
         g.started_at, g.ended_at
  from public.games g
  left join public.profiles p on p.id = g.user_id
  order by g.started_at desc;

-- ----------------------------------------------------------- data api grants ---
-- Depending on your project's Data API settings, tables created via SQL are not
-- always exposed automatically. These grants are explicit so the REST API can
-- see them. RLS above still decides which ROWS come back.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles      to authenticated;
grant select, insert, update, delete on public.custom_themes to authenticated;
grant select, insert, update, delete on public.games         to authenticated;
grant select on public.admin_recent_games to authenticated;
