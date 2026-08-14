# CLOUD_PLAN.md: Graveshift accounts, sync & admin

> **Status: proposal, not yet accepted.** This is the re-plan that CONTEXT.md §4 demands before
> a locked decision changes. Read §1 first, it asks you to reverse three of them.
>
> Nothing in `src/` changes until you say go.

**Contents**
1. The decision this asks you to make
2. Principles for the cloud layer
3. Amended decisions
4. Feature → data model map
5. The schema (the real security boundary)
6. Auth
7. Sync: local-first, cloud-second
8. Custom themes & prompt editing
9. PDF export
10. Admin dashboard
11. **What you do in Supabase**. Step-by-step
12. App-side file plan
13. Sequencing (and why one feature has to wait)
14. Risks, sharp edges, and the two I'd fix first
15. What I need from you

---

## 1. The decision this asks you to make

This feature set contradicts the project's own locked decisions. Quoting CONTEXT.md:

| ID | Current decision | This plan |
|---|---|---|
| **D1** | "Single device, host-only. **No player phones, no room codes, no accounts, no server.**" | Adds accounts and a server. |
| **D6** | "**No analytics, no tracking, no network calls at runtime.**" | Adds analytics and runtime network calls. |
| **§5 Non-goals** | "❌ Player accounts, profiles, ELO, leaderboards" | Adds accounts and profiles. |
| **ROADMAP §Explicitly rejected** | "online play, room codes, **accounts** … If one of these starts to look necessary, that's a signal to **re-read CONTEXT.md, not to open a PR**." | This is that re-read. |

CONTEXT.md §4 says: *"These are settled. Changing one is a re-plan, not a tweak."* So, this document.

**My read:** the reversal is worth making, but only in a specific shape. D1's real value was never
"no accounts" as an end in itself; it was **the host must be able to run a whole game with a dead
signal and zero setup friction**. That's what protects success criteria §6.1 (90 seconds to "Night
falls") and §6 ("works in a basement").

You can keep 100% of that and still ship everything you asked for, *if the account is optional and
the cloud is never in the critical path of a game*. That is the central constraint of this plan.
Every design choice below falls out of it.

What genuinely does get given up, and can't be bought back:

- **Privacy-by-architecture.** "Nothing to send" becomes "we choose not to send." Different promise.
- **The zero-ops deployment story.** ARCHITECTURE §10: "No env vars. No secrets." Not true after this.
- **The engine's isolation stays intact**, `src/engine/**` still imports nothing. Cloud code lives
  entirely outside it. This one is non-negotiable and the plan preserves it.

---

## 2. Principles for the cloud layer

Six rules. Everything downstream is an application of one of them.

**P1 · The account is optional, forever.**
Anonymous local play is the default path and never degrades. No screen blocks on a session. If you
open the app and hit New Game, you never see a login. Signing in *adds* history, custom themes and
sync, it is never a gate.

**P2 · Local is the source of truth during a game.**
Zustand + localStorage stays exactly as ARCHITECTURE §4 describes: synchronous write on every
action. The network is a background reconciler that can fail silently. A game that is mid-night
must survive airplane mode with no behavioural change at all.

**P3 · Never write to the network on the hot path.**
Sync happens at checkpoints (game created, game ended, theme saved). Never per beat, per tap, or
per intent. A per-action network write would burn quota, add latency to the one interaction budget
that matters (ARCHITECTURE §9: ≤100 ms), and break P2.

**P4 · RLS is the security boundary. Client checks are UX only.**
Same stance as your blog (`Portfolio website/supabase/schema.sql`). The anon key is public, the
admin route's JavaScript ships to everyone, and neither of those is a vulnerability *provided*
Postgres enforces every rule. Any check written in React is a convenience, not a control.

**P5 · The static export survives.**
`output: 'export'` stays. Supabase-js is a client library; auth, queries and RPC all work from a
static bundle. No API routes, no middleware, no server runtime, no Vercel lock-in. Deployment stays
"copy `out/` anywhere". Plus two build-time env vars.

**P6 · Third-party PII does not leave the device by default.**
See §14. This is the sharpest edge in the whole plan and it deserves its own line up here.

---

## 3. Amended decisions

Proposed replacements. If you accept this plan, these get merged into CONTEXT.md §4 and the
"Explicitly rejected" list in ROADMAP.md gets updated, so the docs stop contradicting the code.

| ID | Amended decision |
|---|---|
| **D1′** | **Single device, host-only, at the table.** No player phones, no room codes, no realtime, no lobbies. An **optional** host account adds cross-device history, custom themes and admin insight. Play is never blocked on auth or on a network. |
| **D6′** | **No third-party analytics or trackers. First-party telemetry only, in our own Postgres, only for signed-in hosts, and only the fields listed in §5.** No pixels, no SaaS, no session recording. |
| **D9** | **Local-first.** The device is authoritative during a game. The cloud is an eventually-consistent mirror. Any sync failure is silent and recoverable; no sync failure ever interrupts hosting. |
| **D10** | **The engine stays pure and offline.** `src/engine/**` gains no imports, no I/O, no awareness that a cloud exists. Sync code lives in `src/lib/cloud/**`. The ESLint import boundary is extended, not relaxed. |
| **D11** | **User-authored content is untrusted input.** Custom themes are validated against a schema on write *and* on read, with hard length caps. A malformed or hostile theme fails closed to the built-in default rather than reaching the play screen. |

---

## 4. Feature → data model map

Your seven asks, mapped:

| You asked for | Lands as | Notes |
|---|---|---|
| Create an account, log in | Supabase Auth + `profiles` | Email/password + Google. §6 |
| Start a game | Unchanged locally; a `games` row on start | §7 |
| Save game data | `games` row updated at end | Needs Phase 1 engine first, §13 |
| Modify the prompt | A `custom_themes` row derived from a base theme | §8 |
| Create their own theme | Same table, `base_theme_id = null` | §8 |
| Export the prompt to PDF | Client-side print route, zero deps | §9 |
| Admin: user counts, who played this week | RLS-gated reads + one view | §10 |

**The unifying idea:** "modify the prompt" and "create a theme" are *the same feature*. A theme is
already pure data (D4) whose narration lines *are* the prompt. Editing a line produces a custom
theme derived from a base. One table, one editor, one validator, one PDF exporter. Instead of two
parallel systems that drift apart.

---

## 5. The schema

Proposed DDL. On implementation this becomes `supabase/schema.sql`, run once in the dashboard,
same workflow as your blog. Read it as the specification: **these policies are the security
boundary**, not the React code.

```sql
-- ============================================================================
--  Graveshift — schema + Row Level Security
--  Run in Supabase dashboard → SQL Editor → New query → Run.
--
--  IMPORTANT: the policies below are the ACTUAL security boundary. Any check
--  in the React app is a UX gate only — the anon key is public and the admin
--  route's JavaScript ships to every visitor. Postgres enforces these on every
--  request regardless of what the client claims.
-- ============================================================================

-- ------------------------------------------------------------------ admin ---
-- Single source of truth for who may see cross-user data. Edit this list.
--
-- NOTE: deliberately NOT `security definer`. This function reads only the
-- caller's own JWT and touches no table, so it needs no elevated privilege —
-- and every SECURITY DEFINER you don't create is a privilege-escalation bug you
-- can't have. (Your blog's is_author() is `security definer` for the same
-- table-free check; it doesn't need to be either.)
-- `search_path = ''` prevents search-path injection; auth.jwt() is fully qualified.
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
  for select using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = (select auth.uid()))
          with check (id = (select auth.uid()));

-- Profile row is created by trigger, never by the client.
-- This one genuinely needs `security definer` — it writes to public.profiles
-- from a trigger on auth.users. Everything it touches is fully qualified and
-- search_path is empty, so it can't be redirected at a schema it didn't mean.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------- custom_themes ---
-- A "modified prompt" and a "custom theme" are the same object (§4).
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

create index if not exists custom_themes_user_idx
  on public.custom_themes (user_id, updated_at desc);

alter table public.custom_themes enable row level security;

drop policy if exists "custom_themes_select" on public.custom_themes;
create policy "custom_themes_select" on public.custom_themes
  for select using (user_id = (select auth.uid())
                    or is_public = true
                    or (select public.is_admin()));

drop policy if exists "custom_themes_insert" on public.custom_themes;
create policy "custom_themes_insert" on public.custom_themes
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "custom_themes_update" on public.custom_themes;
create policy "custom_themes_update" on public.custom_themes
  for update using (user_id = (select auth.uid()))
          with check (user_id = (select auth.uid()));

drop policy if exists "custom_themes_delete" on public.custom_themes;
create policy "custom_themes_delete" on public.custom_themes
  for delete using (user_id = (select auth.uid()));

-- ------------------------------------------------------------------ games ---
-- One row per hosted game. Written at start, updated at end (P3).
create table if not exists public.games (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  theme_id         text,                  -- built-in theme
  custom_theme_id  uuid references public.custom_themes on delete set null,
  player_count     int not null,
  composition      jsonb not null,        -- role counts
  settings         jsonb not null,        -- nightZero, revealRoleOnDeath, …
  seed             text not null,         -- replayable with intents (ARCH §3.2)
  status           text not null default 'in_progress',
  winner_faction   text,
  night_count      int,
  final_state      jsonb,                 -- GameState snapshot, seat names stripped (§14)
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
  for select using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "games_insert" on public.games;
create policy "games_insert" on public.games
  for insert with check (user_id = (select auth.uid()));

drop policy if exists "games_update" on public.games;
create policy "games_update" on public.games
  for update using (user_id = (select auth.uid()))
          with check (user_id = (select auth.uid()));

drop policy if exists "games_delete" on public.games;
create policy "games_delete" on public.games
  for delete using (user_id = (select auth.uid()));

-- ------------------------------------------------------------ admin views ---
-- ⚠ security_invoker = on is REQUIRED. Without it a view runs as its OWNER and
--    SILENTLY BYPASSES RLS — every visitor would read every row.
create or replace view public.admin_recent_games
with (security_invoker = on) as
  select g.id, g.user_id, p.display_name, g.theme_id, g.custom_theme_id,
         g.player_count, g.status, g.winner_faction, g.night_count,
         g.started_at, g.ended_at
  from public.games g
  left join public.profiles p on p.id = g.user_id
  order by g.started_at desc;
```

Notes on choices:

- **`final_state jsonb`, not a normalized event log.** The engine is already replayable from
  `{ seed, intents[] }` (ARCHITECTURE §3.2), so a snapshot plus the seed is enough to reconstruct or
  audit a game. A per-event table would be 50–200 rows per game for no benefit we can currently name.
- **No `game_seats` table.** Seat names are third-party PII (§14) and shouldn't be there at all.
- **Denormalized columns beside the blob** (`player_count`, `status`, `winner_faction`) so admin
  queries and history lists never parse JSON.
- **`is_admin()` as an email allowlist in the DB**, matching your blog's `is_author()`. Portable,
  auditable in one place, and it survives a token refresh. No custom claims plumbing needed.

**Two patterns above are deliberate and easy to get wrong** (both per Supabase's own
`supabase-postgres-best-practices` skill, installed in `.agents/skills/`):

- **`(select auth.uid())`, never bare `auth.uid()`.** Written bare, Postgres re-evaluates the
  function *once per row* scanned; wrapped in a scalar subquery it's evaluated once and cached.
  Supabase measures this as a 5–10× difference on large tables. Cheap now, invisible later.
- **`security definer` only where it's actually required.** `is_admin()` reads the caller's own JWT
  and touches no table, so it doesn't need elevated privilege at all, and a definer function that
  forgets its own identity check is the standard way Supabase projects leak their whole database.
  Only `handle_new_user()` keeps it, because a trigger on `auth.users` genuinely must.
- **Every column used in an RLS policy is indexed**, `games (user_id, …)` and
  `custom_themes (user_id, …)` above; `profiles.id` is the primary key.

---

## 6. Auth

**Providers:** email/password + Google. Google because you've already done the OAuth dance for the
blog; email/password because a host signing up at a party will not want an OAuth redirect.

**Consider Supabase anonymous sign-in. I'd skip it.** It would give every device a user row and
make sync uniform, but it manufactures a user record for people who never asked for an account, it
complicates the "upgrade to a real account" path, and it quietly violates P1's spirit. Local
storage already does this job for free.

**Session handling** mirrors your blog exactly: `persistSession`, `autoRefreshToken`,
`detectSessionInUrl`, and a nullable client so the app renders fine before env vars exist.

**The static-export catch:** OAuth needs a callback page that actually exists in `out/`. With
`trailingSlash: true` the redirect URL must be `https://yoursite/auth/callback/` (trailing slash),
backed by a real `src/app/auth/callback/page.tsx`. Get this wrong and you get a 404 after a
successful Google login, the classic symptom.

**Local→cloud adoption.** On first successful sign-in, if localStorage holds finished games or
draft themes, offer once: *"Save your 3 local games to your account?"* Explicit, dismissible, never
automatic. Silently uploading data someone created while logged out is exactly the surprise this
project's privacy posture should avoid.

---

## 7. Sync: local-first, cloud-second

```
tap → store action → engine (pure) → new state → render
                            ↓
              localStorage  (sync, every action — unchanged)
                            ↓
              outbox        (checkpoints only)
                            ↓  flush when online + signed in
                        Supabase
```

**Checkpoints that write** (three, total):

| When | Write |
|---|---|
| Roles dealt / game begins | `insert into games`. Status `in_progress` |
| Game reaches a winner | `update games`. Status `complete`, winner, night count, snapshot |
| Host abandons or starts a new game over an unfinished one | `update games`. Status `abandoned` |

**The outbox.** Pending mutations queue in `localStorage['graveshift:outbox']` and flush on app
open, on `online`, and after sign-in. Every write is idempotent. Client-generated UUID as the
primary key, so a retry upserts rather than duplicating. A game hosted entirely offline syncs whole
the next time the app opens with a signal.

**Conflicts.** Effectively impossible by construction: a game row is written by the one device that
hosted it, and rows are never co-edited. Custom themes *can* be edited on two devices. Last write
wins on `updated_at`, which is the right tradeoff for a single-author document.

**Failure is silent.** No toast, no retry spinner, no error state in the play UI. A failed sync
leaves the outbox intact and tries later. The host is mid-game; there is nothing useful they could
do with the information.

---

## 8. Custom themes & prompt editing

**One editor, two entry points:** "Edit this theme's script" (prefills from a base theme) and
"Create a theme" (starts blank). Both produce a `custom_themes` row.

**What's editable:** everything in the `Theme` interface, `name`, `tagline`, `place`,
`factionNames`, `roleSkins` (name + flavour per role), all nine `narration` lines, `deathFlavour`,
`cueOverrides`, `victory`. What is **not** editable: anything rule-shaped. D4 holds, a theme is a
costume. There is no path from this editor to changing what a role does.

**The prerequisite nobody has noticed yet:** ARCHITECTURE §2 lists `src/themes/schema.ts` as the
runtime validator, and §5 says *"a theme with a narration line over 35 words fails the build."*
**That file does not exist.** Today it doesn't matter. Themes are hand-written by you and checked
by TypeScript. The moment themes arrive as `jsonb` from a database, it matters enormously: it is
the difference between a typo and a broken play screen mid-party.

So `themes/schema.ts` is **blocking work for this feature**, not a nice-to-have. It must:

- validate shape and required keys, filling missing `roleSkins` from the canonical fallback
- enforce the GAME_DESIGN §8.4 word caps (≤35 words per narration line), the cap that keeps the
  read-aloud text inside DESIGN §4.3's "never truncated, never scrolling" rule
- enforce string length ceilings matching the DB `check` constraints
- **fail closed**: an invalid custom theme falls back to its base (or Remus Vale) with a quiet
  notice, never a crash and never a half-rendered beat

**Bundle cost.** Zod is ~13 kB gzipped against a ≤120 kB first-load budget (ARCHITECTURE §9). Two
options: (a) hand-roll the validator, it's ~80 lines of boring checks for a known shape, zero
bytes of dependency; (b) use Zod but only in the editor route and the custom-theme loader, both
dynamically imported. **I'd hand-roll it.** The shape is fixed, the rules are ours, and the budget
is one of the few hard numbers this project committed to.

**Public sharing. Recommend deferring.** The schema supports `is_public` and the RLS policy is
written, but shipping a public gallery means shipping moderation: user-authored text rendered to
other people's screens, no report flow, no takedown path, one bad actor away from an incident. Ship
private-only in v1; the column is there when you want it.

---

## 9. PDF export

**Recommendation: a dedicated print route, not a PDF library.**

`/script/print` renders the complete host script for the selected theme (every narration line in
night order, role skins, cue text, victory copy) styled with `@media print`. The host hits Export,
the browser's print dialog opens, "Save as PDF" produces the file.

| | Print route | jsPDF / pdf-lib |
|---|---|---|
| Bundle cost | **0 kB** | ~90–120 kB gzipped |
| Works offline | Yes | Yes |
| Typography | The real fonts, real layout, reflows properly | Hand-positioned, fiddly |
| Output | User picks Save as PDF | Direct download |
| Effort | One route + a stylesheet | Layout code per section |

Against a ≤120 kB budget, a PDF library would roughly *double* the app's JavaScript to save one
click in a dialog. If you later decide the one-click download is worth it, `pdf-lib` behind a
dynamic import on that route only, so the play path never pays for it.

Worth having regardless of accounts: this is genuinely useful for a host who wants a paper backup,
and it works for built-in themes too.

---

## 10. Admin dashboard

`/admin`, client-rendered, and (per P4) **its JavaScript is public**. That's fine. Every query it
issues is subject to the RLS policies in §5; a non-admin who opens the route sees an empty dashboard
because Postgres returns them nothing. No secrets ship in the bundle.

**What it answers:**

| Question | Source |
|---|---|
| How many registered hosts? | `count(*) from profiles` |
| Signups over time | `profiles.created_at` bucketed |
| Who played this week? | `admin_recent_games` filtered on `started_at > now() - 7d` |
| Games hosted, and how many finished | `games.status` breakdown |
| Most-used themes | `group by theme_id` |
| Typical table size / game length | `avg(player_count)`, `ended_at - started_at` |
| Custom themes authored | `count(*) from custom_themes` |

**Aggregates first, names second.** Default the dashboard to counts and charts; put the per-host
list behind an explicit "Show hosts" toggle. It's the same data either way, but it sets the tone
that this is a health dashboard, not a surveillance panel, and it keeps casual shoulder-surfing
from exposing your users' emails.

**Do not** reach for `security definer` RPCs to compute these. The RLS policies already grant
admins full read; a definer function that forgets its own `is_admin()` guard is the single most
common way Supabase projects leak their entire database. The `security_invoker = on` view in §5 is
the safe shape, and the loud comment on it is deliberate.

---

## 11. What you do in Supabase

Do these in order. Steps 1–5 are needed before any code runs; 6–8 before deploying.

**1 · Create the project**
supabase.com → New project. Pick the region closest to your users. **Save the database password**
in your password manager, it is shown once and is not the same thing as the API keys.

**2 · Copy the API credentials**
Project Settings → API. You need:
- `Project URL`
- `anon` / `public` key

Ignore the `service_role` key entirely. It bypasses RLS. It must never appear in this repo, in
`.env.local`, or in any client bundle. Same rule as the portfolio's AGENTS.md.

**3 · Create `.env.local`** in the graveshift project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Confirm `.env.local` is gitignored. (Graveshift has no `.gitignore` yet and isn't a git repo. Worth
fixing before the first commit.)

**4 · Run the schema**
Dashboard → SQL Editor → New query. Paste §5, **edit the email in `is_admin()` to yours**, Run.
Re-runnable: every statement is `if not exists` / `or replace` / `drop policy if exists`.

**5 · Turn on Email auth**
Authentication → Providers → Email → enable. For development, turn **off** "Confirm email" so you
aren't checking an inbox on every test signup. Turn it back on before launch.

**6 · Turn on Google auth**
- Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web application)
- Authorised redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
- Copy the Client ID and Secret into Supabase → Authentication → Providers → Google

**7 · Set the URL configuration**, this is the step that bites people
Authentication → URL Configuration:
- **Site URL:** `http://localhost:3000` in dev; your real domain in production
- **Redirect URLs**, both entries, both with the trailing slash:
  - `http://localhost:3000/auth/callback/`
  - `https://yourdomain.com/auth/callback/`

The trailing slash is required because `next.config.ts` sets `trailingSlash: true`. A missing slash
gives you a successful Google login followed by a 404.

**8 · Set the env vars on your host**
`NEXT_PUBLIC_*` values are **inlined at build time**, not read at runtime. Whatever builds the site
needs both variables in its environment or you ship a bundle with `undefined` baked in. Rebuild
after any change.

**Optional · Email deliverability.** Supabase's built-in SMTP is heavily rate-limited and is for
development only. If you ship password resets or email confirmation to real users, configure your
own SMTP (Resend, Postmark, SES) under Project Settings → Auth.

**Not needed:** Storage buckets (no user uploads in this plan), Realtime (D1′. No live sync),
Edge Functions (nothing needs a server).

---

## 12. App-side file plan

```
src/
  lib/
    supabase.ts              ← nullable client, mirrors the portfolio's pattern
    useAuth.ts               ← session hook, same shape as the blog's
    cloud/
      games.ts               ← start/finish/abandon + history queries
      themes.ts              ← CRUD for custom_themes
      outbox.ts              ← offline queue, idempotent flush
      admin.ts               ← dashboard queries
  themes/
    schema.ts                ← ⚠ NEW, BLOCKING (§8) — validate + fail closed
    custom.ts                ← merge a custom theme over its base
  app/
    auth/
      callback/page.tsx      ← must exist as a static page (§6)
      sign-in/page.tsx
    account/page.tsx         ← profile, game history, my themes
    themes/
      editor/page.tsx        ← the prompt/theme editor (§8)
    script/print/page.tsx    ← print-to-PDF route (§9)
    admin/page.tsx           ← §10
supabase/
  schema.sql                 ← §5, verbatim
```

**Untouched:** `src/engine/**` (D10), `src/store/gameStore.ts`'s local behaviour, the offline
service worker's shell caching, every existing play screen.

**One existing file must change. See §14.**

---

## 13. Sequencing

**The blocker you should know about before committing to a date: there is no game yet.**

ROADMAP Phase 1 is unstarted. `src/engine/` has `types.ts`, `roles.ts`, `nightOrder.ts` and
`balance.ts`, but no `deal.ts`, no `resolve.ts`, no `winCheck.ts`, no `machine.ts`. Both
`/play` and `/setup/deal` are explicitly labelled `PHASE 1 STUB` in their own source comments. The
app cannot currently deal roles, resolve a night, or reach a winner.

So "save your game data" and "who played this week" have nothing to save or report. **Those two
features are blocked on Phase 1**, not on Supabase.

What is *not* blocked: themes are already real, complete data. Accounts, the theme/prompt editor,
and PDF export can all ship against what exists today.

| Stage | Work | Depends on |
|---|---|---|
| **C0** | `themes/schema.ts` validator + fail-closed loading | nothing. Do this first regardless |
| **C1** | Supabase project, client, auth, `profiles`, sign-in/callback/account routes | C0 |
| **C2** | Theme + prompt editor, `custom_themes` CRUD, custom theme selectable in setup | C1 |
| **C3** | PDF/print export | C2 (works standalone for built-in themes) |
| **C4** | `games` sync + outbox + history | **ROADMAP Phase 1** |
| **C5** | Admin dashboard | C4 (meaningful data) |

C0–C3 are shippable now and deliver most of what you described. C4–C5 want a finished Phase 1
underneath them. My recommendation: **do C0, then finish Phase 1, then C1–C5**, or accept that the
admin dashboard sits empty until the engine lands.

---

## 14. Risks, sharp edges, and the two I'd fix first

**⚠ 1 · The service worker will break auth and data. Fix before C1.**

`public/sw.js` is cache-first for **every** GET, including cross-origin ones:

```js
if (request.method !== 'GET') return
event.respondWith(caches.match(request).then((hit) => { if (hit) return hit; ... }))
```

Point that at Supabase and it will cache REST responses and token endpoints and then serve them
forever. Stale sessions, stale game lists, logins that appear to succeed against a cached reply.
Worse, the fallback `.catch(() => caches.match('/'))` returns the **HTML shell** for a failed API
call, so client code trying to parse JSON gets `<!doctype html>`.

The fix is small. Restrict the handler to same-origin navigations and assets:

```js
const url = new URL(request.url)
if (url.origin !== self.location.origin) return   // never touch Supabase
```

This was harmless while D6 held ("no network calls at runtime"). It stops being harmless the moment
this plan lands.

**⚠ 2 · Seat names are other people's personal data.**

`GameState.seats[].name` holds the real first names of 6–20 people who are at a party, are not
users of your app, never signed up, and never consented to anything. Syncing `final_state`
verbatim uploads all of them.

That is a materially different privacy posture from "the host has an account," and it's the kind of
thing that is trivial to prevent now and awkward to unwind later. **Recommendation: strip seat
names before upload**. Replace with `Seat 1…n`, keeping roles, alive/dead and outcomes, which is
everything the history view and the admin stats actually need. If you later want named history,
make it explicit opt-in per game with copy that says what it means.

Everything else, in descending order of how much it should worry you:

| Risk | Mitigation |
|---|---|
| Hostile/malformed custom theme reaches the play screen | §8 validator, fail closed to base theme, DB `check` constraints as a second wall |
| Sync latency creeps onto the hot path | P3. Checkpoints only; never `await` a network call inside a store action |
| Bundle blows the ≤120 kB budget | Hand-rolled validator over Zod; print route over a PDF lib; admin route code-split |
| Someone opens `/admin` | Expected and harmless, RLS returns nothing. Do **not** rely on hiding the route |
| `security definer` footgun | §10. Use RLS + `security_invoker` views, never an ungated definer function |
| Public theme gallery becomes a moderation problem | §8. Ship private-only; `is_public` stays dormant |
| Env vars missing at build → broken prod bundle | Nullable client renders a clear "cloud not configured" state instead of crashing |
| Anonymous local games silently uploaded on sign-in | §6: one-time explicit prompt, never automatic |
| Docs drift from reality | §3. Amend CONTEXT.md and ROADMAP.md in the same commit as C1 |

---

## 15. What I need from you

Four answers unblock implementation. My recommendation is on each, so "all your defaults" is a
valid reply.

1. **Do you accept the D1′/D6′ reversal in §3?** This is the real decision; everything else is
   mechanics. *(No default, it's yours to make.)*
2. **Seat names: strip before upload?** *(Recommend: yes, strip. §14.2)*
3. **Public theme gallery in v1?** *(Recommend: no. Build the table for it, ship it private. §8)*
4. **Sequencing: C0 → Phase 1 engine → C1–C5, or C0–C3 first and accept an empty admin
   dashboard until the engine lands?** *(Recommend: the former, but the latter gets you a demo
   sooner, and it's a reasonable call if you want something to show. §13)*

On approval I'd start with **C0** (`themes/schema.ts`) because it's blocking, it's useful even if
you never ship a single cloud feature, and it's the file ARCHITECTURE.md has been claiming exists
since Phase 0.
