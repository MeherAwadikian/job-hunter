# Shghilni

- **Acquisition method:** Firecrawl HTML extraction of `https://shghilni.com/en/jobs`.
- **API:** None found.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct `curl` returns 200 but with no parseable job markup in raw HTML (confirmed client-rendered SPA).
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's render was sufficient.
- **Limitations:** Each card's markdown is a single link whose text blob contains category, bold title, budget, remote/location flag, skills, and posted-time all concatenated with markdown hard-breaks — parsed by extracting the bold `**Title**` segment and a `REMOTE` flag; budget/skills are discarded for now. Lebanon-only marketplace, smaller volume (~101 jobs total at last check).
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
