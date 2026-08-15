-- backfill-narration.sql
--
-- OPTIONAL. Nothing breaks if you never run this.
--
-- August 2026 added two narration beats: `opening` (where we are, read before
-- the first night) and `intro` (the cue for round-the-table introductions).
-- Custom themes saved before that have neither.
--
-- The app already handles this: validateTheme() treats these two keys as
-- optional and fills them in, reusing the theme's own tagline for the opening.
-- So every saved theme keeps working untouched. That fallback is deliberate,
-- because rejecting a theme would make safeTheme() hand the author the base
-- theme instead, and their world would look like it had vanished.
--
-- What this script buys you is only that the values become REAL DATA rather
-- than a runtime fallback, which means:
--   * the author sees them prefilled when they next open the editor
--   * they can edit them like any other line
--
-- Run in: Supabase dashboard -> SQL Editor. Safe to run more than once.

begin;

-- ── opening: reuse the theme's own tagline ─────────────────────────────────
-- It is the one line every author already wrote to set a mood, so it is the
-- closest thing to their intent that we can infer. Falls back to a neutral
-- line for a theme with no tagline.
update public.custom_themes
   set data = jsonb_set(
         data,
         '{narration,opening}',
         to_jsonb(
           coalesce(nullif(trim(data ->> 'tagline'), ''),
                    'Look around. This is ' ||
                    coalesce(nullif(trim(data ->> 'place'), ''), 'here') ||
                    ', and something here is wrong.')
         ),
         true
       )
 where data ? 'narration'
   and coalesce(trim(data #>> '{narration,opening}'), '') = '';

-- ── intro: a neutral prompt the author can rewrite ─────────────────────────
update public.custom_themes
   set data = jsonb_set(
         data,
         '{narration,intro}',
         to_jsonb('Go round the table. Your name, and one true thing about yourself. Keep it short.'::text),
         true
       )
 where data ? 'narration'
   and coalesce(trim(data #>> '{narration,intro}'), '') = '';

commit;


-- ── Verify: both counts should be 0 ────────────────────────────────────────
select 'missing opening' as gap, count(*) as rows
  from public.custom_themes
 where coalesce(trim(data #>> '{narration,opening}'), '') = ''
union all
select 'missing intro', count(*)
  from public.custom_themes
 where coalesce(trim(data #>> '{narration,intro}'), '') = '';
