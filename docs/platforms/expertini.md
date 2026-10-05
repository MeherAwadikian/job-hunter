# Expertini

- **Acquisition method:** Firecrawl HTML extraction of `https://lb.expertini.com/jobs/`, then regex over the returned markdown.
- **API:** None found. Checked and ruled out, not assumed.
- **Webhook:** No.
- **Scraper:** Firecrawl (`src/connectors/firecrawl.js`), markdown link regex targeting singular `/job/<slug>` postings (plural `/jobs/...` is category/search pages, not individual listings — this distinction caused the first implementation attempt to return junk UI links instead of jobs; fixed and verified against live data on 2026-10-05).
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's static scrape was sufficient, no Playwright needed.
- **Limitations:** Only extracts title + URL from the listing page (no description, salary, etc. without a per-job detail fetch, not implemented yet to conserve Firecrawl quota). Capped at 30 listings per run.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2 seconds.
- **Fallback strategy:** None beyond Firecrawl; if it starts failing, this platform has no further fallback tier.

## Correction vs. the original brief
The brief assumed Expertini has a native RSS feed. That was checked directly (robots.txt probe, direct feed-path probes, web search) on 2026-10-05 and found false — no RSS/feed exists. Built on Firecrawl HTML extraction instead, which is still ahead of Playwright/Chrome in the acquisition-method priority order.
