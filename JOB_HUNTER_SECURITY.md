# Job Hunter — Security

## Secrets
- `FIRECRAWL_API_KEY` lives in `job apps/.env` (gitignored), reused from the existing Hermes profile keys — not duplicated as a new key, not hardcoded anywhere in source.
- `.env.example` documents the required variable without a value.
- No credentials are ever logged; `connector_runs.errors` stores exception messages only.

## Rate limiting / abuse avoidance
- Every connector goes through `RateLimiter` (`src/connectors/base.js`) — minimum interval enforced between requests to the same source (1s for JSON APIs, 2s for Firecrawl calls).
- `fetchWithRetry` caps retries at 2 with exponential backoff and a 15s timeout — no unbounded retry loops.
- Firecrawl-based connectors cap listing extraction at 30 items per run (`MAX_LISTINGS`) — no uncontrolled crawling.
- RemoteOK/Arbeitnow requests identify themselves with a descriptive `User-Agent` including a contact email, per good-citizen scraping practice.

## What this system will never do
- No CAPTCHA/MFA/anti-bot bypass attempts — none of the Tier-1 connectors encountered this; if one does, the brief requires stopping and asking the user, not working around it.
- No automatic application submission — the `applications` table defaults every row to `WAITING_APPROVAL`; nothing in the current codebase writes `APPLIED`.
- No auto-scheduling (cron/Task Scheduler) — manual CLI trigger only, per the user's standing policy.
- No scraping of authenticated/paywalled content — all four Tier-1 sources are public listings.

## Data handling
- Job descriptions and raw source payloads are stored locally in `data/job-hunter.db` only — nothing is sent to a third party except the Firecrawl scrape calls themselves (to Firecrawl's own API, which the user already trusts with their key elsewhere in the Hermes stack).
- No PII beyond what the job postings themselves already publish (recruiter emails, application URLs).
