# Indeed — STOPPED, not implemented

- **Acquisition method:** None viable found.
- **API:** Indeed's public Job Search API and Publisher API were both discontinued (publisher sign-ups closed 2020, job-search API switched off 2024). Remaining official APIs (Job Sync, Indeed Apply, Disposition Sync, Sponsored Jobs) are employer-side/partner-gated and don't return job postings for reading.
- **Webhook:** No.
- **Scraper:** **Attempted and stopped.** Direct curl returns HTTP 403. Firecrawl's rendered scrape got further but the response contains a live **reCAPTCHA challenge** ("Recaptcha requires verification", confirmed 2026-10-05).
- **MCP:** Not investigated further once the CAPTCHA was hit.
- **Authentication:** N/A.
- **Browser requirement:** N/A — stopped before reaching this question.
- **Why stopped:** Per the brief's explicit rule (§19/§20): if a CAPTCHA appears, stop, do not attempt to bypass it, request human intervention. This connector is not built.
- **What would unblock it:** Either an official Indeed partner-API relationship, or the user explicitly deciding to solve the CAPTCHA manually / provide an authenticated session — a decision for the user, not something to route around automatically.
