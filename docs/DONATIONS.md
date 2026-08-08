# DONATIONS.md — Buy Me a Coffee

A plan for accepting donations, split into **what only you can do** and **what I
can do**. Researched August 2026.

---

## 1 · How it actually works

Buy Me a Coffee is a hosted donation page. Supporters buy notional "coffees"
(you set the unit price, typically $3–$5) either one-off or as a monthly
membership. You never touch card details — that is the entire point of using it
rather than rolling your own.

### The money

| Layer | Cost |
|---|---|
| Buy Me a Coffee platform fee | **5%** per transaction |
| Stripe processing | **2.9% + $0.30** per transaction |
| Stripe payout fee | **0.5%** |
| Monthly subscription | **$0** — no fixed cost |

So a $5 coffee nets you roughly **$4.30**. On small amounts the flat $0.30 hurts
proportionally: a $3 coffee loses ~13% to fees, a $10 one loses ~8.4%. If you
nudge a default amount, $5 is the sweet spot.

### The bits that surprise people

- **Payouts run through Stripe Standard Connect.** You will complete Stripe's
  identity verification — legal name, address, DOB, bank details. There is no
  way around it; it's KYC, not bureaucracy for its own sake.
- **Your page is not live until payouts are connected.** Don't link to it from
  the app before that step or visitors hit a dead page.
- **You must be in a Stripe-supported country.** If Stripe doesn't pay out
  where you are, you cannot withdraw. Check this *first* — it's the one thing
  that can invalidate the whole plan.
- **First payout can take up to two weeks** while the account is reviewed.
  Minimum threshold is $10. Later payouts are fast, with instant available for
  another 0.5%.

---

## 2 · Is it the right choice here?

Briefly, since switching later is annoying:

| Option | Fee | Verdict |
|---|---|---|
| **Buy Me a Coffee** | 5% + Stripe | **Recommended.** Zero setup, handles tax/receipts, recognisable, supports one-off *and* monthly |
| Ko-fi | 0% on one-off (free tier) | Cheaper, genuinely. Less recognisable, and the free tier lacks memberships |
| GitHub Sponsors | 0% | Best rate, but only really works if your audience is developers. Yours are party hosts |
| Stripe Payment Links | 2.9% + $0.30 | Cheapest with no platform cut, but you build and maintain the page, and handle your own receipts |

If minimising fees matters more than polish, **Ko-fi is the better deal** — it
takes 0% on one-off tips. I'd still pick Buy Me a Coffee for name recognition:
"buy me a coffee" is understood instantly in a way "Ko-fi" isn't. Your call, and
the app-side work below is identical either way — only the URL changes.

---

## 3 · What YOU do

I cannot do any of these. They need your identity, your bank, your accounts.

**① Check Stripe supports payouts in your country** — 5 minutes
[stripe.com/global](https://stripe.com/global). If not, stop here and use a
local alternative; nothing else in this plan will work.

**② Create the account** — 10 minutes
[buymeacoffee.com](https://buymeacoffee.com) → sign up → claim your username.
Pick carefully, it's your public URL. `buymeacoffee.com/projectremus` or
`/molinalim`. **Tell me which one** — I need it for the app.

**③ Connect payouts** — 15 minutes, plus verification wait
Dashboard → **Payouts** → *Set up payouts* → Stripe onboarding. Have ready:
legal name and address, DOB, bank account or debit card, and possibly a photo
ID. Expect up to two weeks for the first payout to clear review.

**④ Set up the page** — 20 minutes
- Coffee price: **$5** (best fee ratio)
- Profile photo, and a cover image if you have one
- Bio — a first draft is in §5 below, edit it to sound like you
- Turn on **Memberships** only if you'll actually offer something recurring.
  An empty membership tier looks worse than none

**⑤ Decide the tone** — this one's a judgement call, not a task
How visible should the ask be? See §4. Tell me which and I'll build it.

**⑥ Tax** — boring, real
Donations are usually taxable income. Buy Me a Coffee does not withhold
anything. Keep the payout records; talk to whoever does your taxes.

---

## 4 · What I do

All app-side, once you give me the username. Roughly an hour total.

**A · A `<SupportLink/>` component**
Reads the URL from `NEXT_PUBLIC_BMC_USERNAME`, so the link isn't hard-coded and
the whole feature disappears cleanly if the env var is unset — same nullable
pattern as Supabase.

**B · Placement.** Pick a level:

| Level | Where | Feel |
|---|---|---|
| **Quiet** *(recommended)* | Account page + guide footer only | Invisible unless you go looking |
| **Standard** | Above, plus a line on the End screen after a finished game | Asks once, at the only moment they're pleased with you |
| **Prominent** | Above, plus a home-screen button | Hard to miss. Also hard to miss |

I'd take **Standard**. The End screen is the single honest moment to ask — the
game just worked, the table said "again", and nobody's mid-task. Asking on the
home screen taxes people who haven't used it yet, and asking during setup or
play is unforgivable: the host is holding a phone in a dark room with eleven
people waiting.

**C · Never during a game.** Whatever level you choose, no donation UI on
`/setup/*` or `/play`. I'll enforce that in the component itself, not by
remembering.

**D · Open in a new tab** with `rel="noopener noreferrer"` — a donation flow
should never navigate away from a game in progress.

**E · No tracking pixel.** Buy Me a Coffee offers an embeddable widget with a
third-party script. I'd skip it: it's a script tag from another origin on a page
with a strict offline story, and it would be the only tracker in an app whose
docs say there are none. A plain link does the same job.

**F · Docs + `.env.example`** updated so the setting is discoverable.

---

## 5 · Draft bio

Edit freely — it should sound like you, not me.

> I build **Project Remus**, a free game master for Werewolf and Mafia. It deals
> the roles, runs the night order, settles the rules arguments, and tells you
> exactly what to say — so whoever's hosting can actually enjoy it.
>
> It's free, has no ads, and doesn't sell anything. If it's saved your game
> night an argument, a coffee keeps it going.

---

## 6 · What happens next

1. You do ①–⑤ above
2. Send me the username and your chosen placement level
3. I add the component, wire the env var, and deploy

Until then, nothing changes in the app — there's no half-built donation UI
sitting around.

---

**Sources:** [Buy Me a Coffee — payouts](https://help.buymeacoffee.com/en/articles/10025793-how-do-you-set-up-payouts-on-your-buy-me-a-coffee-page) ·
[Buy Me a Coffee — fee calculation](https://help.buymeacoffee.com/en/articles/8105744-how-to-calculate-charges-on-your-payment) ·
[Buy Me a Coffee — how it works](https://help.buymeacoffee.com/en/articles/10182730-what-is-buy-me-a-coffee-and-how-does-it-work) ·
[SchoolMaker — 2026 pricing comparison](https://www.schoolmaker.com/blog/buy-me-a-coffee-pricing)
