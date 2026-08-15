# DEPLOY_DOMAIN.md: Pointing graveshift.1stplaybook.com at a host

> **Now on Cloudflare Workers.** See §5 at the bottom for that setup and for the
> one trap that wasted a build. The Netlify instructions below still work and
> are kept for reference.

How to wire `graveshift.1stplaybook.com` (DNS on Cloudflare) to serve the
Netlify-hosted build. Two dashboards, ~15 minutes, plus DNS propagation time.

**Order matters:** start on Netlify. It tells you the exact value Cloudflare
needs; doing it the other way round means guessing.

---

## 0 · What you're connecting

- **`1stplaybook.com`**. Your domain, DNS managed on **Cloudflare**
- **`graveshift`**, the subdomain for this app (§ your earlier naming decision)
- **Netlify**. Where the built site actually runs

Nothing here touches the rest of `1stplaybook.com`. A subdomain is its own DNS
record; adding `graveshift` doesn't affect the root domain or any other
subdomain you add later for a sibling product.

---

## 1 · Confirm Netlify's build settings first

This project is a **static export** (`next.config.ts` → `output: 'export'`),
there's no server, no API routes, nothing for Netlify's Next.js runtime plugin
to do. Plain static hosting is both simpler and correct here.

**Site settings → Build & deploy → Build settings:**

| Field | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `out` |

> **Use `npm run build`, not `next build`.** The full script also runs
> `scripts/stamp-sw.mjs`, which stamps a unique id into the service worker's
> cache name. Skip it and every deploy ships the *same* cache name, and
> returning visitors get stuck on yesterday's JavaScript, the exact bug this
> project spent real effort fixing (see `public/sw.js`'s own comments).

**Environment variables**. Site settings → Environment variables. Add every
`NEXT_PUBLIC_*` key from your local `.env`:

```
NEXT_PUBLIC_SITE_URL=https://graveshift.1stplaybook.com
NEXT_PUBLIC_SUPABASE_URL=<your value>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your value>
NEXT_PUBLIC_KOFI_USERNAME=1stplaybook
```

`NEXT_PUBLIC_*` values are inlined at **build** time, not read at runtime,
Netlify needs them set *before* it builds, and any change here means
redeploying, not just refreshing the page.

---

## 2 · Add the domain in Netlify

**Site settings → Domain management → Add a domain** → enter
`graveshift.1stplaybook.com` → Add domain.

Netlify will offer to manage DNS itself. **Decline that** (you're keeping DNS
on Cloudflare). It'll instead show you either:

- a **CNAME target**, something like `your-site-name.netlify.app`, or
- for an apex domain it'd ask for an A record. Irrelevant here since
  `graveshift` is a subdomain, so you'll get the CNAME option

**Write down the exact CNAME target shown.** That's the one value Cloudflare
needs in the next step.

---

## 3 · Add the record in Cloudflare

**Cloudflare dashboard → select the `1stplaybook.com` zone → DNS → Records → Add record**

| Field | Value |
|---|---|
| Type | `CNAME` |
| Name | `graveshift` |
| Target | the `*.netlify.app` value from step 2 |
| Proxy status | **DNS only** (grey cloud). See below |
| TTL | Auto |

Save.

### ⚠ Keep it grey-cloud (DNS only), at least at first

Cloudflare's proxy (orange cloud) puts Cloudflare's edge in front of Netlify's.
Two concrete problems that causes here:

1. **SSL issuance.** Netlify auto-provisions a Let's Encrypt certificate for
   the domain, which needs to see real DNS resolution to verify ownership.
   Proxying can interfere with that handshake on first setup.
2. **Your service worker can go stale again.** `public/sw.js` is deliberately
   network-first for navigations specifically so a stale bundle can't get
   stuck, but if Cloudflare's edge caches `/sw.js` itself, browsers behind it
   would keep fetching an old worker regardless of what Netlify serves. This is
   the same class of bug fixed earlier (stale SW → wrong API keys, screens
   stuck on "Loading…").

If you later want Cloudflare's CDN/WAF in front of this subdomain, that's fine
to add, but only *after* confirming Netlify's certificate is active, and only
with a **Cache Rule that bypasses cache for `/sw.js`** (and ideally
`/manifest.webmanifest`). Until you've set that rule up deliberately, DNS-only
is the safe default.

---

## 4 · Wait, then verify

DNS propagation through Cloudflare is usually fast (seconds to a couple of
minutes, since Cloudflare is likely your authoritative nameserver already).
Netlify's certificate typically issues within a few minutes of DNS resolving.

Check, in order:

1. **Netlify → Domain management**, `graveshift.1stplaybook.com` shows a
   green "Netlify DNS verified" or equivalent, no longer "Awaiting external DNS".
2. Visit `https://graveshift.1stplaybook.com`. Valid padlock, site loads.
3. `curl -s https://graveshift.1stplaybook.com/sitemap.xml`. Should show
   `<loc>https://graveshift.1stplaybook.com/…</loc>`, confirming
   `NEXT_PUBLIC_SITE_URL` actually took effect in that build.
4. Install it as a PWA on a phone and confirm it still works offline after,
   service workers require HTTPS, so this only becomes testable once the
   certificate is live.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Netlify says "Awaiting external DNS" indefinitely | CNAME target doesn't match exactly, or it's still proxied (orange cloud) during initial verification |
| "Too many redirects" | Cloudflare's SSL/TLS mode is set to `Flexible`. Switch to `Full` or `Full (strict)` in Cloudflare → SSL/TLS |
| Site loads but shows old content after a deploy | The `npm run build` vs `next build` distinction in §1. Confirm the full script ran, check Netlify's deploy log for `[stamp-sw]` |
| Sitemap/canonical URLs still show the wrong domain | `NEXT_PUBLIC_SITE_URL` not set in Netlify, or set but not redeployed since |
| Google OAuth 404s after login | Unrelated to this, that's `docs/GOOGLE_AUTH.md` §3, the trailing-slash redirect URL issue |

---

## One thing worth fixing separately

Several existing docs (`ARCHITECTURE.md`, `SEO.md`, `CLOUD_PLAN.md`,
`EMAIL_SETUP.md`, `GOOGLE_AUTH.md`) say "Vercel's environment variables",
written before it was confirmed this deploys via Netlify. The instructions
transfer directly (same `NEXT_PUBLIC_*` / rebuild-on-change rule, different
dashboard), but the wording is stale. Worth a pass to swap "Vercel" for
"Netlify" throughout. Say the word and I'll do it.


---

## 5 · Cloudflare Workers (current host)

The site is a **static export**, so it needs a plain file host. Cloudflare
serves `out/` straight from its edge, and there is no Worker script involved.

**Workers Builds settings:**

| Field | Value |
|---|---|
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Everything else is in `wrangler.jsonc`, which is the important part.

### ⚠ The trap: do NOT let Wrangler auto-detect the framework

With no `wrangler.jsonc` in the repo, `wrangler deploy` sees a Next.js project
and helpfully installs **OpenNext**, the server-side adapter for Workers. It
then rewrites `package.json`, `next.config`, `.gitignore` and **`public/_headers`**,
and finally tries to bundle a server that does not exist:

```
Error: ENOENT: no such file or directory,
  open '.next/standalone/.next/server/pages-manifest.json'
```

`output: 'export'` produces no `.next/standalone`, so that file can never be
there. The build before it succeeds, which makes the failure look unrelated.

`wrangler.jsonc` prevents all of this: auto-config only runs when there is no
config. It declares `assets.directory = "./out"` and nothing else.

### Environment variables

Workers Builds → Settings → Variables. Same `NEXT_PUBLIC_*` keys as before, and
they are still inlined at **build** time, so a change needs a redeploy.

### After the first deploy, re-check the two MIME fixes

Cloudflare applies its own caching defaults, so confirm `public/_headers` took
effect:

```bash
curl -sI https://graveshift.1stplaybook.com/opengraph-image | grep -i content-type
```

Expect `image/png`, not `text/plain`. Then check `/sw.js` returns
`Cache-Control: no-cache`, or the stale-worker bug comes straight back.
