# Daleel Madani

- **Acquisition method:** Firecrawl HTML extraction of `https://daleel-madani.org/jobs`, then regex over the returned markdown.
- **API:** None.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct `fetch()` returns HTTP 403 (basic bot block), confirmed during build, which is exactly the case Firecrawl is meant for.
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's static scrape sufficient.
- **Limitations:** NGO/civil-society jobs only, Lebanon-focused, ~160-260 live postings at any time (small volume, good low-risk connector to validate the Firecrawl path). Listing page markdown renders postings as H4 headers linking to `/civil-society-directory/<org>/jobs/<slug>` — the regex depends on that exact structure.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2 seconds. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
