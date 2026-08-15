-- rename-theme-ids.sql
--
-- One-off migration for the August 2026 theme rename:
--
--   millersHollow -> remusVale
--   widowsBay     -> fortuneBay
--   hunterDemon   -> nightshift
--
-- Renamed to avoid trading on other people's names: "The Werewolves of Miller's
-- Hollow" is a published board game, and the other two leaned on a film and an
-- anime respectively.
--
-- FOUR places store a theme id, and two of them are inside jsonb. Updating only
-- the plain text columns looks like it worked and silently leaves every saved
-- game pointing at a theme that no longer exists:
--
--   1. custom_themes.base_theme_id   text
--   2. custom_themes.data            jsonb  -> 'baseThemeId'
--   3. games.theme_id                text
--   4. games.final_state             jsonb  -> 'themeId'
--
-- Safe to run more than once: every statement only touches rows that still hold
-- an old id, so a second run matches nothing.
--
-- Run in: Supabase dashboard -> SQL Editor.

begin;

create temporary table theme_rename (old_id text primary key, new_id text not null)
  on commit drop;

insert into theme_rename (old_id, new_id) values
  ('millersHollow', 'remusVale'),
  ('widowsBay',     'fortuneBay'),
  ('hunterDemon',   'nightshift');


-- ── 1 · custom_themes.base_theme_id ─────────────────────────────────────────
update public.custom_themes c
   set base_theme_id = r.new_id
  from theme_rename r
 where c.base_theme_id = r.old_id;


-- ── 2 · custom_themes.data->>'baseThemeId' ──────────────────────────────────
-- Only rows that actually carry the key, so we never invent one.
update public.custom_themes c
   set data = jsonb_set(c.data, '{baseThemeId}', to_jsonb(r.new_id), false)
  from theme_rename r
 where c.data ? 'baseThemeId'
   and c.data ->> 'baseThemeId' = r.old_id;


-- ── 3 · games.theme_id ──────────────────────────────────────────────────────
update public.games g
   set theme_id = r.new_id
  from theme_rename r
 where g.theme_id = r.old_id;


-- ── 4 · games.final_state->>'themeId' ───────────────────────────────────────
-- The stored GameState snapshot. Miss this and a finished game replays under
-- the wrong theme, or falls back to the default and loses its costume.
update public.games g
   set final_state = jsonb_set(g.final_state, '{themeId}', to_jsonb(r.new_id), false)
  from theme_rename r
 where g.final_state is not null
   and g.final_state ? 'themeId'
   and g.final_state ->> 'themeId' = r.old_id;

commit;


-- ── Verify: every count below must be 0 ─────────────────────────────────────
select 'custom_themes.base_theme_id' as location, count(*) as stale
  from public.custom_themes
 where base_theme_id in ('millersHollow', 'widowsBay', 'hunterDemon')
union all
select 'custom_themes.data.baseThemeId', count(*)
  from public.custom_themes
 where data ->> 'baseThemeId' in ('millersHollow', 'widowsBay', 'hunterDemon')
union all
select 'games.theme_id', count(*)
  from public.games
 where theme_id in ('millersHollow', 'widowsBay', 'hunterDemon')
union all
select 'games.final_state.themeId', count(*)
  from public.games
 where final_state ->> 'themeId' in ('millersHollow', 'widowsBay', 'hunterDemon');
