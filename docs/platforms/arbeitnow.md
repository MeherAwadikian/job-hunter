# Arbeitnow

- **Acquisition method:** Public JSON API, `GET https://www.arbeitnow.com/api/job-board-api`
- **API:** Yes, no key required.
- **Webhook:** No.
- **Scraper:** Not needed.
- **MCP:** Not needed.
- **Authentication:** None.
- **Browser requirement:** None.
- **Limitations:** `description` field is HTML, stripped to plain text in `normalize()`. Skews heavily German/EU listings — lower relevance signal for Lebanon-based candidate but still useful for remote-eligible roles.
- **Rate limits:** None published; connector self-limits to 1 request/second.
- **Fallback strategy:** None needed.
