# SEO.md: Getting found in search

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

These have low competition and high conversion. Someone typing them wants
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
| **Structured data (JSON-LD)** | `src/lib/seo.ts` | `SoftwareApplication` + `FAQPage`, this is the real win |
| **On-page content** | `src/app/page.tsx` | ~400 words of actual copy below the fold |
| Per-page titles | `src/app/guide/layout.tsx` | The guide gets its own title and description |

### The two that matter most

**On-page content.** Before this, the homepage was a wordmark, a tagline and two
buttons. Nothing for a crawler to rank. There's now a section under the CTAs
explaining what the app does, how a game runs, the roles and themes, and four
FAQs. It sits below the fold so it never costs a host a tap in a dark room.

**JSON-LD.** Unlike meta keywords, Google documents and uses this. The `FAQPage`
block is what can turn your result from a plain blue link into one with an
expandable Q&A, which takes up more space and gets more clicks. The visible
FAQs deliberately match the structured data, because Google penalises FAQ markup
with no on-page equivalent.

---

## What you need to do

### 1 · Confirm the domain is set (required: do this first)

Everything now points at `https://graveshift.1stplaybook.com`, that's the real
domain, not a placeholder, since `1stplaybook.com` is a domain you own and
Graveshift lives on its subdomain.

Set it in `.env` **and** in Netlify's environment variables:

```
NEXT_PUBLIC_SITE_URL=https://graveshift.1stplaybook.com
```

Then redeploy. `NEXT_PUBLIC_*` is inlined at build time, so it does nothing
until you rebuild.

**Worth knowing about subdomains and SEO:** search engines treat a subdomain of
an owned root domain (`graveshift.1stplaybook.com`) far better than a
free-hosting one (`*.netlify.app`). See §6 for how this interacts with the
1st Playbook landing page now that it exists.

### 2 · Google Search Console (the single highest-value 10 minutes)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. **Add property** → choose **Domain**, not URL prefix → enter
   `1stplaybook.com`

   > **Use a Domain property, now that there are two sites.** A URL-prefix
   > property only covers the exact host you type, so you would need one for
   > `graveshift.1stplaybook.com` and a second for `1stplaybook.com`, forever
   > adding another for each new product. A Domain property covers the root
   > **and every subdomain** in one place, and it is the only way to see both
   > sites' performance side by side, which is exactly the comparison you will
   > want (§6).

3. Verify via **DNS**. Domain properties require it. Search Console gives you a
   `TXT` record; add it in Cloudflare (DNS → Records → Add record, type `TXT`,
   name `@`), then click Verify. You already know this dashboard from
   `DEPLOY_DOMAIN.md`.

   *(Prefer not to touch DNS? The HTML-tag method still works, but only for a
   URL-prefix property: add `verification: { google: '…' }` to `metadata` in
   `src/app/layout.tsx` and redeploy. You would then repeat the whole exercise
   for the landing page.)*
4. **Sitemaps** → submit `sitemap.xml`
5. **URL Inspection** → paste your homepage → **Request indexing**

Without this you're waiting for Google to stumble across you, which can take
weeks. With it, usually days.

### 3 · Bing Webmaster Tools (5 minutes)

[bing.com/webmasters](https://www.bing.com/webmasters), you can import directly
from Search Console. Bing is ~3% of search but also powers ChatGPT's browsing
and DuckDuckGo, which increasingly matters.

### 4 · Get some inbound links

This is the uncomfortable one: **backlinks remain the strongest ranking factor,
and no amount of on-page work substitutes for them.** Realistic places for a
free party-game tool:

- **Reddit**: r/boardgames, r/werewolf, r/partygames, r/webdev "I made a thing".
  Read each subreddit's self-promotion rules first; blatant promo gets removed
  and can get you banned.
- **Hacker News**. Show HN. Post it yourself, honestly, with what it does and
  what it doesn't.
- **BoardGameGeek**, the Werewolf/Mafia forums have exactly your audience.
- **Product Hunt**: one launch, worth a spike and a permanent backlink.
- **itch.io**. Free tools list well there.

Five genuine links from relevant communities beat a hundred from directories.

### 5 · Give it time

Realistic expectations: indexed in days, ranking movement over 2–3 months,
meaningful traffic at 6+ months. Anyone promising faster is selling something.

---

## 6 · The two-site structure (added when the landing page was built)

`1stplaybook.com` is now a real landing page and `graveshift.1stplaybook.com` is
the app. The obvious question, *should SEO move to the root domain since that is
the "actual website"?*, has a clear answer: **no.**

### Why Graveshift stays the SEO surface

**Nobody searches for "1st Playbook".** It is a brand-new brand with no search
volume and no reason for anyone to type it. Brand-name traffic follows products,
not the other way round. People will find Graveshift first and learn the studio
name second, if ever.

The searches that matter are intent searches: *"werewolf moderator app"*,
*"mafia night order"*, *"how to host werewolf"*. The page that should win those
is the page that **satisfies** them. If the root domain ranked for "werewolf
moderator app", the searcher would land on a page that describes an app and
links to it. That is an extra click and a worse intent match, which means a
higher bounce rate, and bouncing off a query you ranked for teaches the ranking
system your page was the wrong answer. **You would be competing with yourself
and losing to yourself.**

So the division is:

| Site | Should rank for | Should *not* chase |
|---|---|---|
| `graveshift.1stplaybook.com` | Every intent keyword: werewolf/mafia hosting, night order, roles, player counts | nothing, this is the SEO surface |
| `1stplaybook.com` | Brand terms only: "1st Playbook", "1st Playbook games" | any werewolf/mafia keyword |

### ⚠ The cannibalisation risk to watch

The landing page will describe Graveshift. That is its whole job. But the more of
Graveshift's *keyword territory* that copy covers ("runs the night order",
"deals the roles", "Mafia and Werewolf game master"), the more Google sees two
pages on the same property answering the same query and has to pick one. It often
picks wrong, and both rank worse than one would have.

**Keep the landing page's Graveshift blurb short and brand-flavoured.** Two or
three sentences, oriented around *what it is* rather than *how to host a werewolf
game*. Let the link do the work. All the depth belongs on Graveshift, where the
app actually is.

Concretely, on the landing page: **do not** add an FAQ section, a rules
explainer, a night-order description, or role lists. Those exist on Graveshift
and duplicating them is pure self-competition. This is written into the landing
page brief.

### What the landing page genuinely gains you

Three real wins, none of which involve ranking for game keywords:

1. **A root-domain link to Graveshift.** Internal, but it establishes the
   hierarchy and gives crawlers a path from the root to the app.
2. **`Organization` structured data.** This only becomes possible once a real
   parent site exists. Put `Organization` JSON-LD on `1stplaybook.com`, then have
   Graveshift's `SoftwareApplication` schema in `src/lib/seo.ts` reference it as
   `publisher`. That tells Google the two are one entity rather than two
   unrelated sites. Worth doing, and cheap.
3. **Somewhere to point brand links.** Press, Product Hunt, a Reddit bio: links
   that are not about werewolf specifically now have a sensible destination.

### The one decision worth knowing you made

There is a real argument that Graveshift should have been
`1stplaybook.com/graveshift`, a **subdirectory**, rather than a subdomain. Google
says it treats the two equally; the practical case-study evidence fairly
consistently favours subdirectories, because authority from backlinks
consolidates onto one host instead of being split across several.

**Do not change it.** The cost is real and immediate: redirects, re-indexing,
reconfiguring DNS and two Netlify sites to proxy one path, and a temporary
ranking dip. The benefit is speculative and scales with backlink volume you do
not have yet. At zero backlinks there is functionally nothing to consolidate.

Revisit only if two things become true at once: Graveshift accumulates real
inbound links, **and** you launch a second product that would benefit from
inheriting them. Until then the subdomain is fine, and the `Organization` schema
above recovers some of the entity-level association anyway.

---

## If you want to go further

The biggest next step by far is **more real content**, because right now you
have one page worth indexing. Each of these could rank on its own:

- `/guide/werewolf-rules`, the complete rules
- `/guide/night-order`, the night order explained (people search this exact phrase)
- `/guide/roles`: one section per role
- `/guide/how-many-players`, the player-count question
- `/guide/mafia-vs-werewolf`, the difference

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
| [PageSpeed Insights](https://pagespeed.web.dev/) | Core Web Vitals, a real ranking factor |
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
the marketing content genuinely server-rendered. Split the landing page from
the app, so `/` is static HTML and the app lives at `/play`. That's a real
restructure, not a tweak, and it isn't worth doing until search is actually
delivering traffic worth protecting.
