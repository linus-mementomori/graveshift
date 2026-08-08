-- ============================================================================
--  PROJECT REMUS — feedback
--
--  Run in: Supabase dashboard → SQL Editor → New query → Run.
--  Safe to re-run. Replaces any earlier version of this file.
--
--  Requires public.is_admin() and public.custom_themes to already exist
--  (supabase/schema.sql). Run that one first if you haven't.
-- ============================================================================

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,

  -- What the message is ABOUT. Drives triage, so it's a constrained set rather
  -- than free text — see the check below.
  kind        text not null default 'idea',

  message     text not null,

  -- Set only when kind = 'theme': the custom theme they're putting forward for
  -- everyone. Lets you open the actual thing instead of asking them to paste it.
  -- ON DELETE SET NULL so deleting a theme never destroys the conversation.
  custom_theme_id uuid references public.custom_themes on delete set null,

  -- Which screen they were on. Saves you asking "where were you?" every time.
  page        text,

  status      text not null default 'new',
  admin_note  text,
  created_at  timestamptz not null default now(),

  constraint feedback_kind check (kind in (
    'bug',        -- something broke
    'idea',       -- new feature or request
    'theme',      -- submitting a theme to ship globally
    'rules',      -- a ruling or balance disagreement
    'praise',     -- what worked, and why
    'complaint',  -- what didn't, and why
    'other'
  )),
  constraint feedback_status check (status in ('new','read','done','wontfix')),
  constraint feedback_len    check (char_length(message) between 4 and 2000)
);

-- Re-runnable widening: if an older, narrower version of this table already
-- exists, bring its constraint and column up to date instead of failing.
alter table public.feedback
  add column if not exists custom_theme_id uuid references public.custom_themes on delete set null;

alter table public.feedback drop constraint if exists feedback_kind;
alter table public.feedback add constraint feedback_kind check (kind in (
  'bug','idea','theme','rules','praise','complaint','other'
));

create index if not exists feedback_created_idx on public.feedback (created_at desc);
create index if not exists feedback_user_idx    on public.feedback (user_id, created_at desc);
create index if not exists feedback_status_idx  on public.feedback (status);
create index if not exists feedback_kind_idx    on public.feedback (kind);

alter table public.feedback enable row level security;

-- Anyone signed in may send feedback, but only as themselves.
drop policy if exists "feedback_insert" on public.feedback;
create policy "feedback_insert" on public.feedback
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- You can read your own. Admins read everything.
drop policy if exists "feedback_select" on public.feedback;
create policy "feedback_select" on public.feedback
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ONLY admins may update — those are the triage fields. There is deliberately
-- no self-update policy: letting someone edit a report after you've read it is
-- how you end up arguing about what it originally said.
drop policy if exists "feedback_update" on public.feedback;
create policy "feedback_update" on public.feedback
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "feedback_delete" on public.feedback;
create policy "feedback_delete" on public.feedback
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- ------------------------------------------------------------ admin view ---
-- Feedback joined to who sent it and, for theme submissions, the theme itself.
-- ⚠ security_invoker = true keeps RLS applied. Without it this view runs as its
--   owner and hands every row to every visitor.
create or replace view public.admin_feedback
with (security_invoker = true) as
  select f.id,
         f.user_id,
         p.display_name,
         f.kind,
         f.message,
         f.custom_theme_id,
         ct.name     as theme_name,
         ct.category as theme_category,
         ct.data     as theme_data,
         f.page,
         f.status,
         f.admin_note,
         f.created_at
  from public.feedback f
  left join public.profiles p       on p.id = f.user_id
  left join public.custom_themes ct on ct.id = f.custom_theme_id
  order by f.created_at desc;

grant select, insert, update, delete on public.feedback to authenticated;
grant select on public.admin_feedback to authenticated;
