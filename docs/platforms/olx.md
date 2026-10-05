# OLX Lebanon

- **Acquisition method:** Firecrawl HTML extraction of `https://www.olx.com.lb/jobs/jobs-available/`.
- **API:** None official. Third-party Apify scrapers exist (7-country OLX job listings API) but weren't used — a free method (Firecrawl) worked.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct curl returned HTTP 202 with an **empty body**, a bot-challenge pattern (likely Akamai/PerimeterX pending-verification response), confirmed on 2026-10-05.
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's render sufficient, no CAPTCHA encountered (unlike Indeed).
- **Limitations:** Job cards' markdown headings aren't wrapped in a markdown link (Firecrawl drops the anchor around the whole card), so this connector pairs ordered `## Title` headings with ordered `/ad/...-ID<n>.html` links from Firecrawl's separate `links` output rather than extracting title+URL from one regex match like every other connector. Two card layouts exist on the same page — "Elite"/"Featured" cards render as bare `## Title`, plain "Ads" cards render as a list item wrapping the heading (`- ## Title`) — missing the second pattern in the first implementation attempt caused a silent positional misalignment partway down the page (titles and URLs paired incorrectly past the ~16th card) until both patterns were matched. One residual edge case observed: an ad titled "Barista - ABC Achrafieh" paired with URL slug `barista-abc-verdun` (a genuine site-side inconsistency, likely a relisted/retitled ad keeping its old slug) — not a connector bug, but a reminder that positional pairing can't be made fully bulletproof against upstream inconsistencies.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
