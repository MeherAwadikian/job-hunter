# Twine

- **Acquisition method:** Firecrawl HTML extraction of `https://www.twine.net/jobs`.
- **API:** None found.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct `curl` returns a 200 but with no job data in the raw HTML (no JSON-LD/`JobPosting` schema, no `jobRecord`-style markup), confirming the listing is client-rendered. Firecrawl's rendered scrape was required.
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's render was sufficient, no Playwright needed.
- **Limitations:** Card titles carry "Easy Apply ⚡" / "OPEN JOB" / "PRIORITY" badge text appended, stripped during normalization. Only title + URL extracted.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
