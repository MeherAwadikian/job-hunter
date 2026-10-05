# Upwork — investigated, not implemented (needs a decision)

- **Acquisition method:** None viable unauthenticated. Requires an authenticated browser session.
- **API:** Official API exists but is gated behind strict eligibility: $25,000+ lifetime earnings/spend, 90%+ Job Success Score, verified identity/payment method, account in good standing. The user has no existing Upwork account history in the Hermes records — almost certainly doesn't qualify yet. OAuth 2.0 if it ever becomes available.
- **Webhook:** No.
- **RSS:** Officially discontinued by Upwork after 2024-08-20 — a previously-viable path that no longer exists.
- **Scraper:** **Attempted, structurally blocked.** Direct curl returns 403. Firecrawl's rendered scrape gets through with **no CAPTCHA** and real job titles/descriptions visible (confirmed 2026-10-05, e.g. "AI Automation Engineer / Consultant for Business Workflow Automation" with full description) — but **zero job-posting URLs anywhere in the response**, neither in the rendered markdown links nor in the raw HTML (`href="/jobs/..."` pattern: 0 matches). This is deliberate anti-scraping design, not a transient block: Upwork renders job content for SEO/logged-out browsing but omits the links a scraper would need to actually reach or apply to a posting.
- **MCP:** Not investigated — moot until the URL problem is solved.
- **Authentication:** Required to get real job URLs and application flow. This is the actual blocker, not bot-detection.
- **Browser requirement:** Yes — Playwright MCP or Claude in Chrome with the user's own logged-in Upwork session, per the brief's priority order (official API > authenticated browser > Playwright > Chrome last resort).
- **Why not built:** Logging into a real Upwork account via browser automation is a decision with real consequences (the account's own activity/rate-limit exposure, ToS considerations) — not something to do without the user explicitly choosing to proceed and providing/approving the session.
- **What would unblock it:** User confirms (a) they have an Upwork account to use, and (b) wants Playwright MCP installed and pointed at an authenticated session for this specific connector. Until then, Upwork stays un-implemented, matching the brief's own Phase 9/Tier-4 placement as the most complex connector.
