# EMAIL_SETUP.md: Custom SMTP

How to enable custom SMTP so the email templates become editable.

---

## 0 · Do you actually need this?

Worth two minutes before you spend twenty.

Supabase sends transactional email in exactly these situations:

| Email | Sent when | Needed if you use… |
|---|---|---|
| Confirm sign up | Someone registers with email + password | Email/password auth |
| Reset password | Someone forgets their password | Email/password auth |
| Magic link / OTP | Passwordless sign-in | Magic links |
| Invite user | You invite someone from the dashboard | Manual invites |
| Change email | Someone changes their address | Either |
| Reauthentication | Sensitive operation confirmation | Either |

**Google OAuth sends none of these.** Google handles the whole identity flow, so
a Google-only app never triggers a confirmation or a password reset.

So:

- **Google sign-in only** → you can skip SMTP entirely. Turn off "Confirm email"
  and you're done. The templates stay on defaults and nobody ever sees them.
- **Email + password sign-in** → you need SMTP before launch. Supabase's built-in
  sender is capped at a handful of messages per hour, is explicitly not for
  production, and can't be customised.

The sign-in screen currently offers **both**, so if you keep it as-is, do this.

---

## 1 · Pick a provider

Any SMTP service works. [Resend](https://resend.com) is the least painful:
generous free tier (3,000/month), clean dashboard, five-minute setup.
Postmark and Amazon SES are also solid; SES is cheapest at volume and the most
tedious to configure.

The rest of this doc uses Resend.

---

## 2 · The domain question

This determines how much work step 3 is.

**Option A, you own a domain** (you do: `1stplaybook.com`).
Verify it with Resend and you can send from `no-reply@1stplaybook.com` to anyone.
This is what you want before launch.

Consider a **subdomain** like `mail.1stplaybook.com` rather than the root. If a
Graveshift email ever gets marked as spam, the damage is contained to the subdomain's
reputation instead of your main domain's, which also carries your portfolio
mail.

**Option B. No domain / just testing.**
Resend gives you `onboarding@resend.dev` with zero setup, but with a hard limit:
**it only delivers to the email address you signed up with.** Fine for testing
your own flows, useless the moment a second person registers.

---

## 3 · Set up Resend

1. Sign up at [resend.com](https://resend.com)

2. **Domains → Add Domain** → enter `mail.1stplaybook.com` (or your root domain)

3. Resend shows you DNS records. Typically three:

   | Type | Purpose |
   |---|---|
   | `MX` | Receives bounce notifications |
   | `TXT` (SPF) | Authorises Resend to send as you |
   | `TXT` (DKIM) | Cryptographically signs your mail |

   Add them wherever your DNS lives (Cloudflare, Namecheap, Vercel…). Copy the
   values exactly, a trailing dot or a wrapped line will silently fail.

4. Wait for verification. Usually a few minutes; DNS can take up to an hour.
   Resend's dashboard shows the status.

5. **API Keys → Create API Key** → give it Send access → **copy it now**, it's
   shown once.

---

## 4 · Enter it in Supabase

Your dashboard already has the shortcut: the **Set up SMTP** button in the
banner on the Emails page. Otherwise:

**Authentication → Emails → SMTP Settings** (the tab next to Templates)

Enable custom SMTP and fill in:

| Field | Value |
|---|---|
| Sender email | `no-reply@mail.1stplaybook.com` (must be on your verified domain) |
| Sender name | `Graveshift` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (literally the word) |
| Password | your Resend API key |
| Minimum interval | `60` seconds is a sane default |

Save.

> **Port note:** `465` is implicit TLS and is the safe default. If your host
> blocks it, `587` (STARTTLS) also works. `25` will be blocked almost everywhere.

---

## 5 · Now the templates are editable

Go back to **Authentication → Emails → Templates**. The banner is gone and the
subject/body fields are editable.

Paste in the six files from [`supabase/email-templates/`](../supabase/email-templates/),
mapping and suggested subject lines are in that folder's README.

---

## 6 · Test it end to end

1. `npm run dev`
2. Go to http://localhost:3000/auth/sign-up
3. Register with a real address you can check
4. Confirm the email arrives, looks right, and the link works

Then check delivery quality. **Resend → Logs** shows accepted/delivered/bounced
per message. If something never arrives, the answer is almost always there
rather than in Supabase.

---

## Gotchas

| Symptom | Cause |
|---|---|
| Templates still read-only after saving SMTP | Settings didn't save, or a required field is blank. Reload the page and confirm the banner is gone. |
| Emails go to spam | Domain not fully verified, or you're sending from a domain with no sending history. Warm up gradually; check SPF/DKIM show verified in Resend. |
| "Only your own email" errors | You're on `onboarding@resend.dev`. Verify a real domain (§2, Option A). |
| Nothing arrives, no error | Check Resend → Logs first. A wrong API key shows as an auth failure there. |
| Confirmation link 404s | Unrelated to SMTP, that's the redirect-URL trailing slash. See `docs/GOOGLE_AUTH.md` §3. |
| Works locally, not in production | Supabase SMTP is server-side, so it's environment-independent. If it works in one it works in both. A production-only failure is almost always the Site URL / Redirect URLs, not SMTP. |

---

## While you're testing

Turn **off** "Confirm email" under Authentication → Providers → Email during
development, so you aren't checking an inbox on every test signup. Turn it back
on before launch. Without it, anyone can register with an address they don't
own.
