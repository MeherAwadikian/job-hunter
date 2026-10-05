# Guru

- **Acquisition method:** Firecrawl HTML extraction of `https://www.guru.com/d/jobs/`.
- **API:** None official. Third-party paid Apify scrapers exist but weren't used.
- **Webhook:** No.
- **Scraper:** Firecrawl. **Correction from initial build:** direct `curl` on 2026-10-05 first showed job cards present in raw HTML (server-rendered, `jobRecord__title` classes visible), so this was initially built on plain HTTP as the cheapest Level-3 method. After several real test runs during development, Guru started returning HTTP 403 on every request regardless of User-Agent — response headers show `incap_ses_*`/`visid_incap_*` cookies, confirming an **Incapsula WAF** sits in front of the site and had started bot-scoring the repeated automated requests. Downgraded to Firecrawl, which gets through reliably. Kept as a documented lesson: a server-rendered page confirmed once isn't a guarantee the host won't start blocking plain HTTP under an automation pattern — always have a fallback path in mind even for "Level 3" connectors.
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's render sufficient.
- **Limitations:** Only title + URL extracted; description/budget not parsed.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl (already the fallback from the original plain-HTTP attempt).
