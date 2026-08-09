# Email templates: Project Remus

Six HTML templates matching the app's look: near-black background, italic serif
display, monospace body, themed red accent.

---

## ⚠ Read this first: you cannot edit templates without custom SMTP

Your dashboard is currently showing:

> **Set up custom SMTP to edit templates**. Emails will be sent using the
> default templates. Set up custom SMTP to edit their subject and body.

That banner is a hard gate, not a suggestion. Until you connect your own SMTP
provider, the subject/body fields are read-only and Supabase sends its plain
default emails. **Pasting these templates is step 2. Step 1 is SMTP.**

There's a second reason to do it anyway: Supabase's built-in email sender is
rate-limited to a handful of messages per hour and is explicitly *not* for
production. A real signup flow will hit that limit fast.

### Setting up SMTP

Any provider works. [Resend](https://resend.com) is the least painful and has a
free tier; Postmark and SES are also fine.

1. Create an account, verify the domain you'll send from (or use their sandbox
   domain to test)
2. Generate an SMTP credential, you want **host, port, username, password**
3. Supabase → **Project Settings → Authentication → SMTP Settings**
4. Enable custom SMTP and fill in:

   | Field | Typical value (Resend) |
   |---|---|
   | Host | `smtp.resend.com` |
   | Port | `465` (SSL) or `587` (STARTTLS) |
   | Username | `resend` |
   | Password | your API key |
   | Sender email | `no-reply@yourdomain.com` |
   | Sender name | `Project Remus` |

5. Save. The Templates tab becomes editable.

---

## Applying a template

Supabase → **Authentication → Emails → Templates** → pick the template → paste
the file contents into the **Message body** field → Save.

| Dashboard template | File | Suggested subject |
|---|---|---|
| Confirm sign up | `confirm-signup.html` | Confirm your Project Remus account |
| Invite user | `invite-user.html` | You've been invited to Project Remus |
| Magic link or OTP | `magic-link.html` | Your Project Remus sign-in link |
| Change email address | `change-email.html` | Confirm your new email address |
| Reset password | `reset-password.html` | Reset your Project Remus password |
| Reauthentication | `reauthentication.html` | Your Project Remus verification code |

---

## Template variables

Supabase substitutes these Go-template tokens. Each template only has access to
some of them. Using one that isn't available renders empty.

| Variable | Available in | What it is |
|---|---|---|
| `{{ .ConfirmationURL }}` | all except Reauthentication | The full action link |
| `{{ .Token }}` | signup, magic link, recovery, email change, reauth | 6-digit code |
| `{{ .Email }}` | most | The user's current address |
| `{{ .NewEmail }}` | Change email address | The address being switched to |
| `{{ .SiteURL }}` | all | Your configured Site URL |

**Reauthentication has no `{{ .ConfirmationURL }}`**, it is code-only. That's
why that template has no button.

---

## Why these are built the way they are

Email clients are roughly fifteen years behind browsers, so these deliberately
avoid everything the app itself uses:

- **Tables for layout**, not flexbox or grid. Outlook renders neither.
- **Every style inlined.** Gmail strips `<style>` blocks in some contexts.
- **Web-safe fonts only** (Georgia, Courier New). No `next/font`, no web fonts,
  most clients block remote font loading, so the app's Libre Baskerville and
  Courier Prime degrade to their nearest built-in equivalents on purpose.
- **No images.** Nothing to block, nothing to slow down, nothing to break the
  layout when images are off by default.
- **Bulletproof buttons**, the call to action is a padded table cell with a
  background colour, not a styled `<a>`, so it survives Outlook.
- **The raw link is printed under every button**, because a meaningful share of
  clients will mangle or strip the button entirely.

### One caveat on dark backgrounds

These use the app's near-black palette. Some clients (notably Gmail on Android,
and Outlook's dark mode) forcibly invert or recolour dark emails, which can make
them look washed out. The templates stay legible either way (text colours were
chosen to keep contrast when inverted) but if you want guaranteed fidelity
everywhere, a light background is the safer choice. That's a genuine trade-off,
not an oversight.
