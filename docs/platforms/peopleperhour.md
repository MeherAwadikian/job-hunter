# PeoplePerHour

- **Acquisition method:** Firecrawl HTML extraction of `https://www.peopleperhour.com/freelance-jobs`.
- **API:** None found despite extensive third-party RSS-automation tooling referencing PPH — none of it is an official PPH feed.
- **Webhook:** No.
- **Scraper:** Firecrawl — direct `curl` on both the main listing and a category sub-page returned only navigation/category links in raw HTML (no `jobRecord`-style markup), confirming client-side rendering.
- **MCP:** Not used.
- **Authentication:** None for reading listings.
- **Browser requirement:** None — Firecrawl's render was sufficient.
- **Limitations:** Only title + URL extracted. Individual postings reliably end in a numeric ID (`-\d+`), used to distinguish real jobs from category links in the regex.
- **Rate limits:** Firecrawl calls self-limited to 1 every 2s. Capped at 30 listings per run.
- **Fallback strategy:** None beyond Firecrawl.
