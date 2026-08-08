# SEO.md — Getting found in search

What's already built, what **you** have to do, and an honest read on what will
and won't work.

---

## Read this before anything else

You asked to "index trendy words so the website can easily be found." I've built
the technical SEO properly, but I want to be straight with you about that part,
because doing it the way it sounds would actively hurt you:

**1 · The `keywords` meta tag does nothing on Google.** They stopped using it in
2009 and [said so publicly](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag).
I've included it anyway (Bing reads it, it costs nothing), but no amount of
words in there moves you.

**2 · Stuffing broad or trendy terms is a penalty, not a boost.** Keyword
stuffing has been an explicit spam violation since the 2011 Panda update. Adding
unrelated trending words gets you either nothing or a manual action.

**3 · Irrelevant traffic makes rankings worse.** If someone searches a trendy
term, lands here, and leaves in two seconds because it wasn't what they wanted,
that teaches the ranking system the page is a bad result.

**4 · You will not rank for "werewolf".** That term belongs to films and
Wikipedia, and competing for it is a waste. But nobody searching "werewolf"
wants a moderator app anyway.

**What actually works for a tool like this is specific intent.** People with the
exact problem you solve type things like:

- "werewolf game moderator app"
- "mafia night order"
- "how to host werewolf"
- "werewolf role generator"
- "werewolf app for large groups"

These have low competition and high conversion — someone typing them wants
precisely this. That's what the site is now optimised for.

---

## What's already done

| Thing | Where | What it does |
|---|---|---|
| Rich metadata | `src/app/layout.tsx` | Title template, description, canonical, robots directives |
| Open Graph + Twitter cards | `src/app/layout.tsx` | Proper preview when shared |
| Auto-generated OG image | `src/app/opengraph-image.tsx` | 1200×630 card, built at compile time |
| `robots.txt` | `src/app/robots.ts` | Allows public pages, blocks `/admin`, `/account`, `/auth`, `/play` |
| `sitemap.xml` | `src/app/sitemap.ts` | Lists the four genuinely indexable pages |
| **Structured data (JSON-LD)** | `src/lib/seo.ts` | `SoftwareApplication` + `FAQPage` — this is the real win |
| **On-page content** | `src/app/page.tsx` | ~400 words of actual copy below the fold |
| Per-page titles | `src/app/guide/layout.tsx` | The guide gets its own title and description |

### The two that matter most

**On-page content.** Before this, the homepage was a wordmark, a tagline and two
buttons — nothing for a crawler to rank. There's now a section under the CTAs
explaining what the app does, how a game runs, the roles and themes, and four
FAQs. It sits below the fold so it never costs a host a tap in a dark room.

**JSON-LD.** Unlike meta keywords, Google documents and uses this. The `FAQPage`
block is what can turn your result from a plain blue link into one with an
expandable Q&A — which takes up more space and gets more clicks. The visible
FAQs deliberately match the structured data, because Google penalises FAQ markup
with no on-page equivalent.

---

## What you need to do

### 1 · Set your real domain (required — do this first)

Everything currently points at `https://projectremus.vercel.app`. If that's not
your final URL, the sitemap and canonicals are all wrong.

Add to `.env` **and** to Vercel's environment variables:

```
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
```

Then redeploy. `NEXT_PUBLIC_*` is inlined at build time, so it does nothing
until you rebuild.

**A custom domain is worth buying.** `*.vercel.app` subdomains rank poorly —
they inherit nothing, and search engines treat free-hosting subdomains with
suspicion. Something like `projectremus.com` is ~£10/year and will outperform
the free subdomain within months.

### 2 · Google Search Console (the single highest-value 10 minutes)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. **Add property** → **URL prefix** → your domain
3. Verify — easiest is the **HTML tag** method: copy the `content` value, then
   add to `src/app/layout.tsx` inside `metadata`:

   ```ts
   verification: { google: 'PASTE_THE_CONTENT_VALUE_HERE' },
   ```

   Redeploy, then click Verify.
4. **Sitemaps** → submit `sitemap.xml`
5. **URL Inspection** → paste your homepage → **Request indexing**

Without this you're waiting for Google to stumble across you, which can take
weeks. With it, usually days.

### 3 · Bing Webmaster Tools (5 minutes)

[bing.com/webmasters](https://www.bing.com/webmasters) — you can import directly
from Search Console. Bing is ~3% of search but also powers ChatGPT's browsing
and DuckDuckGo, which increasingly matters.

### 4 · Get some inbound links

This is the uncomfortable one: **backlinks remain the strongest ranking factor,
and no amount of on-page work substitutes for them.** Realistic places for a
free party-game tool:

- **Reddit** — r/boardgames, r/werewolf, r/partygames, r/webdev "I made a thing".
  Read each subreddit's self-promotion rules first; blatant promo gets removed
  and can get you banned.
- **Hacker News** — Show HN. Post it yourself, honestly, with what it does and
  what it doesn't.
- **BoardGameGeek** — the Werewolf/Mafia forums have exactly your audience.
- **Product Hunt** — one launch, worth a spike and a permanent backlink.
- **itch.io** — free tools list well there.

Five genuine links from relevant communities beat a hundred from directories.

### 5 · Give it time

Realistic expectations: indexed in days, ranking movement over 2–3 months,
meaningful traffic at 6+ months. Anyone promising faster is selling something.

---

## If you want to go further

The highest-leverage next step is **more real content**, because right now you
have one page worth indexing. Each of these could rank on its own:

- `/guide/werewolf-rules` — the complete rules
- `/guide/night-order` — the night order explained (people search this exact phrase)
- `/guide/roles` — one section per role
- `/guide/how-many-players` — the player-count question
- `/guide/mafia-vs-werewolf` — the difference

Ten pages of genuinely useful writing will beat any amount of meta-tag tuning.
Your `docs/GAME_DESIGN.md` already contains most of the raw material.

---

## Verifying it works

After deploying:

```bash
curl -s https://your-domain.com/robots.txt
curl -s https://your-domain.com/sitemap.xml
```

Then run these:

| Tool | Checks |
|---|---|
| [Rich Results Test](https://search.google.com/test/rich-results) | Your JSON-LD parses and is eligible for rich results |
| [PageSpeed Insights](https://pagespeed.web.dev/) | Core Web Vitals — a real ranking factor |
| [OpenGraph.xyz](https://www.opengraph.xyz/) | Your social preview card renders |
| Search Console → Coverage | Which pages Google has actually indexed |

---

## One trade-off you should know about

This app is a PWA with an aggressive cache-first service worker, and it's a
single-page client app. Neither is ideal for SEO:

- Content renders client-side, so crawlers rely on JavaScript execution.
  Google handles this fine; Bing and most social scrapers are worse at it.
- The static export does pre-render HTML, which mitigates most of it.

If organic search ever becomes the main growth channel, the right fix is to make
the marketing content genuinely server-rendered — split the landing page from
the app, so `/` is static HTML and the app lives at `/play`. That's a real
restructure, not a tweak, and it isn't worth doing until search is actually
delivering traffic worth protecting.
