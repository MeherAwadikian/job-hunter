# RemoteOK

- **Acquisition method:** Public JSON API, `GET https://remoteok.com/api`
- **API:** Yes, no key required.
- **Webhook:** No.
- **Scraper:** Not needed.
- **MCP:** Not needed.
- **Authentication:** None.
- **Browser requirement:** None.
- **Limitations:** First element of the response array is a legal/attribution notice object, not a job — filtered out in `discover()`. Expects a link back to RemoteOK when displaying results publicly (attribution courtesy, not enforced technically).
- **Rate limits:** None published; connector self-limits to 1 request/second via `RateLimiter`.
- **Fallback strategy:** None needed — if the API ever goes down, no fallback is implemented (low priority given it's a free low-stakes source).
