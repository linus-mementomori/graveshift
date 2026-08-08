# DONATIONS.md — Ko-fi

How donations work in Project Remus. Live at
**[ko-fi.com/projectremus](https://ko-fi.com/projectremus)**.

> **Switched from Buy Me a Coffee, August 2026.** This originally planned for
> BMC. Ko-fi is the better deal and the earlier comparison said so: **0% on
> one-off tips** on the free tier, against BMC's 5% platform cut. The app-side
> work was identical either way — only the URL and the widget snippet changed.

---

## 1 · The money

| Layer | Ko-fi (free tier) | Buy Me a Coffee, for comparison |
|---|---|---|
| Platform fee, one-off tips | **0%** | 5% |
| Payment processing | Stripe/PayPal standard (~2.9% + $0.30) | same |
| Monthly subscription | $0 | $0 |
| Memberships / recurring | Ko-fi Gold only | included free |

On a NZ$5 tip you keep roughly **NZ$4.55** with Ko-fi versus **NZ$4.30** with
BMC. The flat processing fee still dominates at small amounts, so a NZ$3 tip
loses ~13% either way — nudging people toward $5 matters more than the platform
choice does.

The one thing Ko-fi's free tier doesn't include is **recurring memberships**.
If you ever want monthly supporters, that's Ko-fi Gold (a fixed monthly fee) —
worth revisiting only once one-off tips are actually arriving.

---

## 2 · What's built

**`<SupportLink/>`** — `src/components/SupportLink.tsx`

A themed link to your Ko-fi page, used on `/account`.

It does **not** rely on `target="_blank"` alone, because that silently does
nothing in three situations this app is regularly in — and that was a real bug,
not a hypothetical one:

- installed as a PWA (`display: standalone`), where iOS in particular swallows it
- inside an in-app browser (Instagram, Slack, a preview pane)
- behind a popup blocker

So it tries `window.open`, and if that returns `null` — exactly what a blocked
popup looks like — it navigates the current tab instead. Modified clicks
(⌘-click, middle-click, long-press) are passed straight through, and the real
`href` stays on the element so crawlers still see a link.

**`<SupportWidget/>`** — `src/components/SupportWidget.tsx`

Ko-fi's floating overlay widget, themed to the live accent colour.

- Ko-fi takes its colours as arguments to `kofiWidgetOverlay.draw()`, so a theme
  change is just another draw call — no script re-injection needed.
- The label colour is computed from the accent's luminance, so it flips to dark
  text on the gold themes instead of being unreadable white-on-yellow.
- The accent is read from a throwaway `<div data-theme>` rather than from
  `<html>`. `ThemeRoot` sets `data-theme` in its own effect and React runs child
  effects *before* parent ones, so reading off the document returns the previous
  theme's colour.
- CSS in `globals.css` lifts the launcher clear of the floating nav dock, which
  otherwise occupies exactly the same corner.
- **Hidden on `/setup`, `/play` and `/auth`.** A donation prompt while someone is
  mid-night with eleven people waiting is the worst possible ask.

**Config** — `NEXT_PUBLIC_KOFI_USERNAME`, defaulting to `projectremus`.

---

## 3 · The trade-off you accepted

The widget is a **third-party script from `storage.ko-fi.com`**. I'd originally
recommended a plain link instead, on the grounds that it would be the only
external script in an app whose docs say it has no trackers, and it can't work
offline.

That's still true, and it's a reasonable call to make anyway — the widget is far
more visible than a buried link. Both paths exist: if the CDN is blocked, the
script fails silently and the `/account` link still works.

---

## 4 · Bio draft

Edit freely — it should sound like you.

> I build **Project Remus**, a free game master for Werewolf and Mafia. It deals
> the roles, runs the night order, settles the rules arguments, and tells you
> exactly what to say — so whoever's hosting can actually enjoy it.
>
> It's free, has no ads, and doesn't sell anything. If it's saved your game
> night an argument, a coffee keeps it going.

---

## 5 · Still yours to do

- **Tax.** Donations are usually taxable income and Ko-fi withholds nothing.
  Keep the payout records.
- **Payouts.** Ko-fi pays via PayPal or Stripe — make sure one is connected, or
  money arrives nowhere.
- **Placement.** Currently the widget is on every non-game screen, plus a link
  on `/account`. If you want it quieter (account only) or louder (a line on the
  End screen after a finished game), say which and I'll move it. The End screen
  is the single most honest moment to ask — the game just worked and nobody's
  mid-task.
