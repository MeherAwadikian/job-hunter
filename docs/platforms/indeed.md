# Indeed — live via undocumented internal API (user sign-off 2026-10-05)

- **Acquisition method:** Indeed's internal mobile-app GraphQL API (`apis.indeed.com/graphql`), using a hardcoded `indeed-api-key` reverse-engineered from Indeed's own iOS app.
- **API:** Not a documented public API. Indeed's real public APIs (Publisher, Job Search) were discontinued (2020/2024); current official APIs are employer-partner-gated and don't return postings for reading. This key is sourced from the open-source `ts-jobspy`/`JobSpy` projects, where it's published openly (and apparently still valid as of 2026-10-05, confirmed live).
- **Webhook:** No.
- **Scraper:** None — direct POST request with the mobile app's headers (`indeed-app-info`, mobile Safari user-agent, `indeed-co` country code). No Firecrawl/Playwright needed; this bypasses the reCAPTCHA-gated public search page entirely by hitting a different endpoint that the public website never shows.
- **MCP:** Not used.
- **Authentication:** The hardcoded key itself is the only "auth" — no user login involved.
- **Browser requirement:** None.
- **Why this is different from every other connector in the system:** Every other connector uses a genuinely public endpoint (official API, or a normal public web page via Firecrawl). This uses a credential that was issued to Indeed's own mobile app, not to the public — closer to "access an internal system via a found credential" than "read a public page." Built only after the user explicitly weighed this tradeoff and said to proceed (2026-10-05) — flagged separately from the general "continue with the other points" approval given to every other connector.
- **Fragility:** Indeed can revoke or rotate this key at any time with zero notice, silently breaking this connector (it would start returning HTTP 403). There is no fallback — if it breaks, Indeed goes back to "stopped" status (per the original CAPTCHA-wall finding) until/unless a maintained open-source project publishes a working replacement key.
- **Limitations:** Fixed search term ("AI automation") and "Remote" location hardcoded in `src/connectors/indeed.js` for now — not yet wired to the candidate profile's full preferred-roles list.
- **Rate limits:** Self-limited to 1 request/1.5s. 30 results per run.
