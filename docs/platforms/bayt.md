# Bayt

- **Acquisition method:** Firecrawl HTML extraction of `https://www.bayt.com/en/lebanon/jobs/`.
- **API:** None official. Third-party scrapers (Apify) exist but weren't used.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct `curl` confirmed HTTP 403 (basic bot block) on 2026-10-05. Firecrawl bypasses it.
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's static scrape sufficient.
- **Limitations:** Listings render as markdown H2s linking to `/en/lebanon/jobs/<slug>-<numeric-id>/`; the page also contains large amounts of unrelated survey/filter/location-dropdown noise before the actual job list starts, which the link regex filters past by requiring the numeric-id URL pattern. Location hardcoded to "Lebanon" (country-scoped listing page).
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
