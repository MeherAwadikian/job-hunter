# Job Hunter — Connectors

| Platform | Tier | Method | Status | Notes |
|---|---|---|---|---|
| RemoteOK | 1 | Public JSON API (`remoteok.com/api`) | **Live, tested** | No auth. First array element is a legal/attribution notice, filtered out. |
| Arbeitnow | 1 | Public JSON API (`arbeitnow.com/api/job-board-api`) | **Live, tested** | No auth. Description field is HTML, stripped to text. |
| Expertini | 1 | Firecrawl HTML extraction of `lb.expertini.com/jobs/` | **Live, tested** | No public API/RSS exists (checked robots.txt + direct probes, both empty — the brief's assumption of a native RSS feed did not hold up). Individual postings are at singular `/job/<slug>`, not `/jobs/<slug>` — that distinction mattered for the link regex. |
| Daleel Madani | 1 | Firecrawl HTML extraction of `daleel-madani.org/jobs` | **Live, tested** | Direct HTTP returns 403 (basic bot block); Firecrawl bypasses it. Listings are markdown H4s linking to `/civil-society-directory/<org>/jobs/<slug>`. |
| Guru | 2 | Firecrawl HTML extraction (`guru.com/d/jobs/`) | **Live, tested** | No official API/RSS. Initially built on plain HTTP after confirming server-rendered HTML via curl, but Guru sits behind an Incapsula WAF that started returning 403 on every request mid-development — downgraded to Firecrawl. See `docs/platforms/guru.md` for the full story. |
| Twine | 2 | Firecrawl HTML extraction (`twine.net/jobs`) | **Live, tested** | No API/RSS; confirmed client-rendered (no job data in raw HTML/no JSON-LD) via direct curl before choosing Firecrawl. |
| Bayt | 2 | Firecrawl HTML extraction (`bayt.com/en/lebanon/jobs/`) | **Live, tested** | No API/RSS; direct HTTP returns 403, confirmed via curl. |
| Shghilni | 2 | Firecrawl HTML extraction (`shghilni.com/en/jobs`) | **Live, tested** | No API/RSS; confirmed client-rendered via direct curl. |
| PeoplePerHour | 2 | Firecrawl HTML extraction (`peopleperhour.com/freelance-jobs`) | **Live, tested** | No API/RSS; confirmed client-rendered via direct curl (only category nav present in raw HTML). |
| Contra | 2 | Official read-only public API (`contra.com/public-api/`, X-API-Key) + hosted MCP (`contra.com/mcp`) | **Not implemented — needs a decision** | The best Tier-2 find: a genuine official API, no scraping required. Confirmed to exist (401 on unauthenticated probe = real auth-gated endpoint, not 404). Not built because it requires the user to create a Contra account and self-serve an API key — a decision point, not something to do silently. |
| Furrsati | 3 | Firecrawl HTML extraction (`furrsati.com/jobs`) | **Live, tested** | No API/RSS; a community Furrsati MCP exists but only searches freelancer profiles, not postings. Confirmed client-rendered via curl. |
| OLX Lebanon | 3 | Firecrawl HTML extraction + `links` output pairing (`olx.com.lb/jobs/jobs-available/`) | **Live, tested** | No API/RSS; direct curl returns HTTP 202 empty body (bot-challenge pattern). Markdown headings aren't anchor-wrapped, so titles are paired positionally with Firecrawl's separate `links` array — required catching two different card-layout patterns on the same page after an initial implementation silently misaligned past the first ~16 cards. |
| Indeed | 3 | Undocumented internal mobile GraphQL API + hardcoded key | **Live, tested (2026-10-05, user sign-off)** | Public search page still reCAPTCHA-walled (unchanged). This instead uses a reverse-engineered API key from Indeed's own iOS app, sourced from the open-source ts-jobspy project. Materially different risk profile from every other connector — flagged and built only after explicit user approval, separate from the general connector go-ahead. Can be revoked by Indeed without notice. See `docs/platforms/indeed.md`. |
| Glassdoor | 3 | **Stopped** | Not implemented | Firecrawl returned an empty bot-shielded shell, consistent with Glassdoor's known anti-scraping posture (public API retired 2022). Not pursued further without explicit user direction. See `docs/platforms/glassdoor.md`. |
| **ATS (Greenhouse/Lever/Ashby)** | 1 (new) | Direct official company job-board APIs | **Live, tested** | No scraping at all — genuine public, no-auth APIs each company's own careers page calls. 2,339 jobs pulled from 12 verified companies in testing (Anthropic alone: 638). See `docs/platforms/ats.md` for the verified token list and how to add more. Sourced from a research pass into existing open-source job-aggregator projects (`Feashliaa/job-board-aggregator`) rather than built from scratch. |
| Upwork | 4 | Investigated — needs authenticated browser session | **Not built, needs a decision** | Official API gated behind $25k lifetime earnings/90% JSS (user doesn't qualify). RSS discontinued 2024. Unauthenticated Firecrawl scrape gets through with no CAPTCHA and real job content, but Upwork structurally omits every job-posting URL from the logged-out page — nothing to link/apply to. Needs Playwright MCP + the user's own logged-in session; flagged, not built silently. See `docs/platforms/upwork.md`. |

See `docs/platforms/*.md` for platform-level detail docs on the four implemented connectors.

## Adding a new connector
1. Create `src/connectors/<platform>.js` exporting `platform`, `discover()`, `normalize(raw)`.
2. Add an entry to `src/config/platforms.yaml`.
3. Register it in `CONNECTORS` in `src/engine/discover.js`.
4. Run `node src/cli.js test --platform <id>` against live data before enabling in `scanAll()`.

No other file needs to change — this is the acceptance criterion from the brief (#16: add a platform without redesigning the core).
