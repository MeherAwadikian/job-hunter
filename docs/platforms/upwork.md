# Upwork — accessible via authenticated Chrome, but not automatable as a CLI connector

- **Acquisition method:** None usable from job-hunter's own Node code. Confirmed accessible through the user's existing, already-logged-in Upwork freelancer account in Chrome.
- **API:** Official API gated behind $25k lifetime earnings/spend + 90% Job Success Score — user doesn't qualify.
- **RSS:** Discontinued by Upwork in 2024.
- **Unauthenticated scraping:** No CAPTCHA, but the logged-out page structurally omits every job-posting URL (unchanged finding) — nothing to link to.
- **Authenticated browser check (2026-10-05):** Navigated to Upwork's "Find Work" page via Claude-in-Chrome, reusing the user's real Chrome profile. The user has an active, logged-in freelancer account ("My proposals", "My profile", job search tabs all present) — this is the same account/session that would see real job URLs and could actually submit proposals.
- **Why this isn't built as a `node src/cli.js scan --platform upwork` connector:** Same reason as Glassdoor — Claude-in-Chrome only runs inside a live chat turn, not from job-hunter's own unattended Node process. There's no way to turn this into a scheduled/scriptable connector without Playwright reusing a persistent authenticated context, which wasn't set up without explicit buy-in (risk of profile-lock conflicts with the user's actual running Chrome).
- **What actually works today:** Ask me (in a live chat) to check Upwork via Chrome and I can pull real job listings and URLs from the authenticated feed on demand.
- **What would make this a real automated connector:** Playwright with a safely-isolated persistent authenticated context (a separate browser profile, logged into Upwork once, reused by automation) — a real decision given it touches the user's actual freelancer account and its own rate-limit/ToS exposure.
