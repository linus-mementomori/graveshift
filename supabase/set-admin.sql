-- ============================================================================
--  PROJECT REMUS — grant yourself admin access
--
--  Run this in: Supabase dashboard → SQL Editor → New query → Run.
--
--  ⚠ CHANGE THE EMAIL BELOW to the address you actually sign in with.
--    It must match your Supabase auth user's email exactly (case doesn't
--    matter — it's lower-cased on both sides).
--
--  Add more admins by adding more quoted emails, comma-separated:
--      'you@example.com',
--      'cohost@example.com'
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'wispjelly@gmail.com'        -- ←←← CHANGE THIS to your sign-in email
  );
$$;


-- ── Verify it worked ────────────────────────────────────────────────────────
-- Run this SECOND, and read the note below about the result.
select
  auth.jwt() ->> 'email'  as sql_editor_identity,
  public.is_admin()       as am_i_admin;

-- NOTE: in the SQL Editor you are usually the `postgres` role with no JWT, so
-- `sql_editor_identity` will be NULL and `am_i_admin` will be FALSE. That is
-- expected and does NOT mean it failed — the function reads the *caller's*
-- token, and the real test is signing in to the app and opening /admin.
