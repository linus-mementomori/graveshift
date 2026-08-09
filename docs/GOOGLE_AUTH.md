# GOOGLE_AUTH.md — Sign in with Google

How to let people create an account and sign in with Google.

**The app code is already done.** `/auth/sign-in` has a "Continue with Google"
button, `/auth/callback/` exists as a real exported page, and `src/lib/supabase.ts`
sets the redirect. Everything below is configuration in two dashboards — nothing
to write.

Budget about 15 minutes. Google's console is the fiddly half.

---

## 1 · Create the Google OAuth client

**Google Cloud Console → https://console.cloud.google.com**

1. Top-left project dropdown → **New Project** → name it `Graveshift` → Create.
   (An existing project is fine too.)

2. **APIs & Services → OAuth consent screen**
   - User type: **External** → Create
   - App name: `Graveshift`
   - User support email: yours
   - Developer contact email: yours
   - Save and continue through Scopes and Test users — the defaults are fine.
     You do **not** need any extra scopes; email and profile are included.

3. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Graveshift web`
   - **Authorised redirect URIs** → Add URI, and paste exactly this:

     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```

     Your `<your-project-ref>` is the subdomain in `NEXT_PUBLIC_SUPABASE_URL`
     in `.env` — e.g. if that's `https://abcdefghijkl.supabase.co`, the URI is
     `https://abcdefghijkl.supabase.co/auth/v1/callback`.

   - Create. Copy the **Client ID** and **Client secret**.

> **This redirect URI points at Supabase, not at your site.** That trips
> everyone up. Google hands the user to Supabase, Supabase then hands them to
> your app. Putting your own domain here is the single most common mistake.

---

## 2 · Give the credentials to Supabase

**Supabase dashboard → Authentication → Providers → Google**

1. Toggle **Enable Sign in with Google**
2. Paste the **Client ID** and **Client Secret** from step 1
3. Save

---

## 3 · Set the redirect URLs (the step that actually breaks things)

**Supabase dashboard → Authentication → URL Configuration**

- **Site URL** — where users land by default:
  - development: `http://localhost:3000`
  - production: `https://your-domain.com`

- **Redirect URLs** — add **both**, and note the **trailing slash**:

  ```
  http://localhost:3000/auth/callback/
  https://your-domain.com/auth/callback/
  ```

> ### The trailing slash is not optional
> `next.config.ts` sets `trailingSlash: true`, so the exported page really lives
> at `/auth/callback/`. Register it without the slash and you get the classic
> symptom: **Google login succeeds, then you land on a 404.** If that happens,
> this is why — nothing is wrong with your credentials.

---

## 4 · Test it

```bash
npm run dev
```

Go to http://localhost:3000/auth/sign-in and click **Continue with Google**.

Expected flow:

1. Google account chooser
2. Back to `/auth/callback/` for a moment ("Signing you in…")
3. Land on `/account` with your email shown

Then check **Supabase → Authentication → Users** — your Google account is there,
and **Table Editor → profiles** has a matching row (created automatically by the
`handle_new_user` trigger, with `display_name` taken from your Google name).

---

## 5 · Before you ship

Two things that only matter in production:

- **Publishing the consent screen.** While it's in *Testing*, only accounts you
  added as Test users can sign in, and there's a scary "unverified app" warning.
  Google Cloud → OAuth consent screen → **Publish app**. For the basic
  email/profile scopes this app uses, no Google review is required.

- **Env vars on the host.** `NEXT_PUBLIC_*` values are inlined at **build**
  time, not read at runtime. Set both in Vercel's project settings and
  **redeploy** — changing them without a rebuild does nothing.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `redirect_uri_mismatch` from Google | The URI in Google Console doesn't exactly match `https://<ref>.supabase.co/auth/v1/callback`. No trailing slash on this one, and it must be `https`. |
| Login works, then 404 | Missing trailing slash in Supabase's **Redirect URLs**. See §3. |
| Login works, then bounced back to sign-in | The callback page loaded but no session was found. Usually the Site URL is wrong, or a stale service worker served a cached page — hard-reload once. |
| "Access blocked: app not verified" | Consent screen still in Testing. Add yourself as a Test user, or publish it (§5). |
| Works locally, not in production | Env vars missing at build time on the host, or the production URL isn't in Redirect URLs. |
| Signed in, but `/admin` says no access | Unrelated to Google — run `supabase/set-admin.sql` with your email. |

---

## What Google gives us, and what we keep

The scopes are the default `email` and `profile`. Supabase stores the account in
`auth.users`, and the `handle_new_user` trigger copies **only** the display name
into `public.profiles`.

Worth knowing: `raw_user_meta_data` (where the Google name and avatar URL land)
is **user-editable**, so it is presentation only. It is never used for an
authorization decision anywhere in this codebase — that's what `is_admin()` and
the RLS policies are for. Don't start reading it in a policy later.
