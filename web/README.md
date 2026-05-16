# Plate — marketing site

Static HTML/CSS landing + legal pages. No build step, no JS framework. Drop the folder on Netlify, point a domain, done.

## What's in here

| File                 | Route (after `_redirects`) | Purpose                                                   |
| -------------------- | -------------------------- | --------------------------------------------------------- |
| `index.html`         | `/`                        | Landing                                                   |
| `about.html`         | `/about`                   | Company / values                                          |
| `help.html`          | `/help`                    | Support hub. Each category opens a pre-filled `mailto:`   |
| `privacy.html`       | `/privacy`                 | **Required by App Store + Google Play**                   |
| `terms.html`         | `/terms`                   | **Required by App Store + Google Play**                   |
| `manifesto.html`     | `/manifesto`               | Coming-soon placeholder                                   |
| `careers.html`       | `/careers`                 | Coming-soon placeholder                                   |
| `404.html`           | —                          | Custom 404 (served via `_redirects` for any unknown path) |
| `styles.css`         | —                          | One stylesheet for the whole site                         |
| `sitemap.xml`        | `/sitemap.xml`             | Crawler discovery                                         |
| `robots.txt`         | `/robots.txt`              | Crawler instructions (explicitly allows LLM bots)         |
| `llms.txt`           | `/llms.txt`                | Answer-engine summary (AEO)                               |
| `_redirects`         | —                          | Netlify URL rewrites (pretty URLs + 404)                  |
| `_headers`           | —                          | Netlify response headers (caching, security)              |
| `assets/logo.png`    | `/assets/logo.png`         | Brand mark (yellow on dark)                               |
| `assets/favicon.png` | `/assets/favicon.png`      | Browser + iOS home-screen icon                            |

Total weight: ~115 KB uncompressed, well under 30 KB gzipped excluding the logos.

---

## Deploy to Netlify (drag & drop, ~2 minutes)

1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Drag the **entire `web/` folder** onto the page.
3. Netlify gives you a random `*.netlify.app` URL immediately — that's your site live.
4. Verify it works (open the URL, click every nav link).
5. Tab over to **Site settings → Domain management → Add custom domain**, enter `plate.best`.
6. Netlify gives you DNS records to add at Dynadot (one A record + one CNAME, or just nameservers if you want Netlify DNS).
7. Update Dynadot DNS. Wait 5–60 min for propagation + SSL provisioning.
8. Done.

**To redeploy after an edit:** open the site in the Netlify dashboard → **Deploys → drag the updated `web/` folder onto the deploy box.** Each drop creates an immutable version, so you can roll back in one click.

If you'd rather connect via Git instead of drag-drop, see "Git deploy" at the bottom.

---

## Analytics

Google Analytics 4 is wired (`G-WFKSVZGZ1S`) on every page. Real-time traffic should show up in your GA4 dashboard within minutes of the first visit.

---

## SEO + AEO

Already in place:

- **Per-page** `<title>`, `<meta description>`, `<link rel="canonical">`, full Open Graph + Twitter card tags
- **JSON-LD** structured data on every page (Organization, MobileApplication, FAQPage on the landing; WebPage / AboutPage elsewhere)
- **`sitemap.xml`** with all 7 pages, referenced from `robots.txt`
- **`robots.txt`** explicitly allows the major LLM crawlers (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended) — Plate is positioned to be discoverable in answer-engine results, not gated
- **`llms.txt`** at the site root: structured markdown summary that answer engines can ingest directly without re-scraping every page. Follows the emerging [llms.txt convention](https://llmstxt.org)
- **Pretty URLs** via `_redirects` so canonicals match the served path
- **Security headers** via `_headers` (no sniff, referrer policy, locked permissions)

After deploy, verify the SEO basics by pasting the URL into:

- **Google's [Rich Results Test](https://search.google.com/test/rich-results)** — confirms the JSON-LD parses
- **Facebook's [Sharing Debugger](https://developers.facebook.com/tools/debug/)** — confirms OG card renders
- **Twitter's [Card Validator](https://cards-dev.twitter.com/validator)** — same for Twitter card

Then submit `https://plate.best/sitemap.xml` in **Google Search Console** and **Bing Webmaster Tools** so the crawlers find you faster.

---

## What to update before launch

Search the codebase for these and replace with real values:

| Find                                                                  | Replace with                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `href="#"` on Download buttons in `index.html` (4 occurrences)        | Real App Store + Play Store URLs once your listings are live                                                                                                                                          |
| `og-image.png` references (all pages)                                 | A real **1200×630 PNG** at `assets/og-image.png`. The current pages reference this filename but the file doesn't exist yet — make one before you share the URL publicly so social previews look right |
| `94% scan accuracy`, `800k food database` (`index.html` numbers band) | Your real numbers once you've measured them on production data, or soften the claims                                                                                                                  |
| `Effective May 16, 2026` (`privacy.html`, `terms.html`)               | Update if you edit the legal text                                                                                                                                                                     |

---

## Local preview

```bash
cd web
python3 -m http.server 4000
# open http://localhost:4000
```

Or `npx serve .`, `caddy file-server`, etc.

Note: `_redirects` only takes effect on Netlify — local preview will need `.html` suffixes (`/privacy.html`, not `/privacy`).

---

## Optional: Git deploy instead of drag-and-drop

If you'd rather have deploys-on-push:

1. Push this repo to GitHub.
2. Netlify dashboard → **Add new site → Import an existing project → GitHub** → pick the repo.
3. Build command: _(leave blank)_
4. Publish directory: `web`
5. Deploy.

Every push to `main` rebuilds. You can also create deploy previews for PRs from the same settings page.

---

## Things deliberately NOT done

- **No build step.** A landing page is text plus a few CSS-drawn phone mockups. React would add seconds of load for zero functionality.
- **No real app screenshots yet.** The phones are CSS approximations. When v1.0 ships, swap each `.mock-*` div in `index.html` for an `<img src="assets/screen-today.png">` — drop the PNGs into `assets/`.
- **No cookie banner.** GA4 with consent mode and no PII tracking doesn't strictly require one in most jurisdictions; if you start serving EU traffic at scale, add one (Klaro or Osano cover this for free).
