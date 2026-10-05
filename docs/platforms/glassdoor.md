# Glassdoor — STOPPED, not implemented

- **Acquisition method:** None viable found.
- **API:** Official partner API (jobs, companies, salaries, reviews) was retired in 2022. Current access is enterprise-partnership-only, nothing self-serve.
- **Webhook:** No.
- **Scraper:** **Attempted and stopped.** Direct curl returns HTTP 403. Firecrawl's rendered scrape returned only a ~1KB bot-shielded loading shell ("Loading...", no job data at all) on 2026-10-05 — consistent with Glassdoor's known aggressive anti-scraping posture (Cloudflare + often a sign-in wall even for anonymous browsing beyond a few results).
- **MCP:** Not investigated further.
- **Authentication:** N/A.
- **Browser requirement:** N/A — stopped before reaching this question; a stronger rendering attempt (Playwright with longer wait, retries) was deliberately not tried, since an already-exhausted single-request attempt returning a deliberately empty shell reads as bot detection, and pushing harder edges toward the kind of bypass the brief prohibits.
- **Why stopped:** No CAPTCHA was explicitly shown, but the response pattern (403 direct, empty shell via Firecrawl) is consistent with active anti-bot measures; escalating with more aggressive automation wasn't pursued without explicit user direction.
- **What would unblock it:** User explicitly asking for a stronger automation attempt (e.g. Playwright with an authenticated session), or an enterprise partner relationship.
