# Furrsati

- **Acquisition method:** Firecrawl HTML extraction of `https://furrsati.com/jobs`.
- **API:** None official. A community-built "Furrsati MCP connector" exists (found via search) but only exposes `search_freelancers`/`get_freelancer` — freelancer profile discovery, not job postings. Wrong direction for this engine (job-hunter needs postings to apply to, not freelancers to hire), so not used.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct curl confirmed client-rendered (a `JobCard` string only appears inside a minified JS bundle reference, no actual listing data in raw HTML).
- **MCP:** Not used (see API note above).
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's render sufficient.
- **Limitations:** Lebanon-only freelance marketplace, founded 2024, smaller volume. Card markdown blocks concatenate category/title/budget/description/skills/poster into one link text blob — parsed by extracting the bold `**Title**` segment and an optional `$X – $Y` budget, rest discarded for now.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
