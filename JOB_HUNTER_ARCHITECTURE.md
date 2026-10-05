# Job Hunter — Architecture

## Status
Tier 1, Tier 2, and Tier 3 connectors complete and tested end-to-end against live data (2026-10-05), plus an opt-in semantic scoring pass. 11 connectors live: RemoteOK, Arbeitnow, Expertini, Daleel Madani, Guru, Twine, Bayt, Shghilni, PeoplePerHour, Furrsati, OLX. Three deliberately not built: Contra (Tier 2) has a genuine official API but needs the user to create an account/API key first; Indeed and Glassdoor (Tier 3) were stopped after hitting a live reCAPTCHA wall and a bot-shielded empty response respectively; Upwork (Tier 4) was investigated — no CAPTCHA, but it structurally omits every job-posting URL from the unauthenticated page, so it needs Playwright MCP plus the user's own logged-in session, a real decision not to be made silently. Application generation and the human-approval gate (§16/§17) are now live — see below. Notifications remain — see "Open decisions" below.

## Application generation (§16)
`src/engine/applicationGen.js` shells out to the existing `cv` Hermes profile (`hermes -p cv -z <prompt> --yolo`) rather than reimplementing CV tailoring, per the reuse decision in the audit. The `cv` profile runs on a local Ollama model (`llama3.2:3b`) — no paid API key needed, but **slow** (~60-90s per job) and prone to adding unwanted preamble despite explicit instructions not to (consistent with previously-documented Hermes CLI behavior). Output is parsed into three sections (CV bullets, cover letter, short application message) via header markers and stored in the `applications` table with status `WAITING_APPROVAL`. Because of the latency, generation is opt-in and scoped (`generate --limit n --min-grade B`), never run automatically during scan/score.

## Human approval gate (§17)
`node src/cli.js applications list|show <id>|approve <id>|reject <id>`. Approving only flips `applications.status` to `APPROVED` and logs a `job_events` row — **nothing is ever submitted automatically**; the CLI prints the job's `application_url` for the user to submit manually. Verified end-to-end on a real job (iMerit Technology "AI Response Analyst", B/72): generated → reviewed → approved, no auto-submission at any point.

## Runtime
Node.js (v24.16.0+), ESM modules, built-in `node:sqlite` (`DatabaseSync`) — no native-module build step, avoids the broken system Python (see `JOB_HUNTER_ENVIRONMENT_AUDIT.md`). One dependency: `js-yaml`, used only to parse `src/config/platforms.yaml`.

## Pipeline

```
CLI (src/cli.js)
  -> engine/discover.js: scanPlatform(id) / scanAll()
       -> connector.discover()     raw items from source
       -> connector.normalize()    -> normalized job schema
       -> engine/dedupe.js          canonical_key = normalize(title)::normalize(company)
       -> engine/score.js           rule-based match against candidate_profile.json
       -> db/init.js (SQLite)       jobs, job_scores, connector_runs, job_events
```

## Normalized job schema
Matches the brief's §6 schema exactly (see `src/connectors/base.js: normalizedJobSkeleton`). Every connector returns this shape — the engine never branches on platform-specific fields.

## Connector interface
Each file in `src/connectors/` exports:
- `platform` — string id, must match `src/config/platforms.yaml` key
- `discover()` — async, returns raw platform-native items
- `normalize(raw)` — pure function, raw item -> normalized job object

No connector touches the database or scoring directly — `engine/discover.js` orchestrates that centrally, so adding platform #5 never requires touching the engine (acceptance criterion #16).

## Database
SQLite file at `data/job-hunter.db` (gitignored). Tables: `jobs`, `companies`, `platforms`, `applications`, `profiles`, `skills`, `job_scores`, `job_events`, `connector_runs`, `notifications` — see `src/db/schema.sql`. Raw SQL, no ORM, matching the convention already used elsewhere in the user's Hermes stack.

## Deduplication
Level 1 implemented: canonical key = normalized `title::company`. Cross-platform duplicates get merged into the first-seen row's `source_platforms` JSON array rather than creating a second row. Description-similarity dedup (brief's level 5) is not implemented — not needed at current Tier-1 volume; revisit if `connector_runs.duplicates` logs show false negatives.

## Scoring
Two passes, per brief §27's cost-optimization policy:
1. **Rule-based (`src/engine/score.js`)** — free, runs on every job automatically during `scan`. Weighted keyword overlap between the job's title/description/skills and `candidate_profile.json`'s `skill_angles`.
2. **Semantic (`src/engine/semanticScore.js`)** — opt-in only, via `node src/cli.js score --semantic [--limit n]`. Only re-scores jobs that already cleared `SEMANTIC_FLOOR` (35) on the rule-based pass, so the LLM is never spent validating obvious non-matches. Uses DeepSeek's OpenAI-compatible API (`deepseek-chat`), **not Claude** — the Anthropic key in the Hermes key pool is dead/placeholder (24 chars, not a real key format); DeepSeek KEY_5 was the only confirmed-live paid-capable key as of 2026-10-05 (re-tested directly, $1.07 balance). Rate-limited to 1 call/3s. Verified end-to-end against 60 real jobs — correctly distinguished genuine AI/automation fits (e.g. "AI Response Analyst", B/72) from surface keyword matches that don't actually fit (e.g. generic ops/sales roles that scored C/D despite containing "remote" or "AI" in the title).

## Candidate profile
`src/config/candidate_profile.json`, seeded from `~/AppData/Local/hermes/profiles/remote-jobs/SOUL.md` per user decision (that profile stays running in parallel, not retired). Connectors and the scorer only ever read this file — no candidate data is hardcoded into any connector (brief's "do not" list, §30).

## Notifications
Not implemented yet. User decision 2026-10-05: skip Discord/Telegram notifications for now; review results manually via `node src/cli.js digest` until connectors are proven over more runs. The `notifications` table exists in schema for when this is revisited.

## Scheduling
Manual only (`node src/cli.js scan --all`). No cron/Task Scheduler registered, per the user's standing policy — see `feedback_task_scheduler` in Hermes memory. Revisit only if explicitly requested.

## Open decisions (deferred, not blocking)
- Discord vs Telegram vs none — currently none.
- CV/cover-letter generation wiring into the existing `cv` Hermes profile — not yet connected (`applications` table exists, nothing writes to it yet).
- Tier 2+ connectors (Twine, Bayt, Shghilni, Contra, Guru, PeoplePerHour) and Playwright MCP — not started.
