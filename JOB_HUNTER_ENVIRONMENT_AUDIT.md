# Job Hunter — Environment Audit (Phase 1)

Date: 2026-10-05
Scope: survey existing Hermes environment before building `job-hunter`. No tools installed, no code written.

## 1. Existing capability inventory

| Capability | Location/configuration | Reusable? | Free? | API/MCP/webhook? | Recommended use |
|---|---|---|---|---|---|
| **Existing manual job-search profile** | `~/AppData/Local/hermes/profiles/remote-jobs/SOUL.md` — "Remote Jobs Acquisition Engine", manual target tracking (65 targets across tracks A-J), rate rules (max 10 leads/day, max 10 outreach/day) | **Yes — this IS the closest existing asset** | n/a | n/a (manual, no connectors) | Don't duplicate. `job-hunter` supersedes this profile's *discovery* function; keep its outreach-rate rules and branding ("ResultsDriven Team") as policy inputs. Retire or fold into job-hunter once connectors are live. |
| **Candidate profile data** | Embedded in `remote-jobs/SOUL.md` (name, location, languages, skill angles: AI/Automation, CCTV/Security, Lab Informatics, Web3/DeFi) | Yes | n/a | n/a | Seed `job-hunter`'s `candidate_profile` table directly from this — don't re-interview the user. |
| **CV generation engine** | `cv` Hermes profile, `~/AppData/Local/hermes/profiles/cv/SOUL.md` — ATS-tailoring CV specialist | Yes | n/a | n/a | Call into/reuse for section 16 (application generation) instead of rebuilding CV tailoring logic inside job-hunter. |
| **harvester_client.py toolkit** | `~/harvester_client.py` (also `~/hermes-advanced-lead-discovery/harvester_client.py`), ~74 functions | Partial | Yes (local) + some paid sub-services | Direct Python import | Reuse `crawl_website`, `extract_site_intelligence`, `verify_email`/`harvest_domain` (recruiter contact enrichment), `log_outreach`/`get_learnings` (maps directly to brief §28 self-improvement). Not job-board specific — no existing RemoteOK/Arbeitnow/Indeed connectors in it. |
| **Firecrawl** | `FIRECRAWL_API_KEY`, confirmed live 2026-10-03 (1000/1000 credits) | Yes | Yes (metered, has quota) | API | Use as Level-4 fallback for platforms without API/feed (Daleel Madani, Bayt, Shghilni HTML pages). Don't burn credits on RemoteOK/Arbeitnow/Expertini which have direct feeds. |
| **SerpAPI** | `SERPAPI_KEY`, confirmed live 2026-10-03 (245/250 left) | Yes | Limited quota | API | Low priority for job-hunter; reserve for other lead-gen profiles already depending on it. |
| **Hunter.io** | `HUNTER_API_KEY` | Yes (status flaps — retest before use per [[feedback_credential_check_retest_before_acting]]) | Metered | API | Optional: enrich recruiter/company contact emails for direct-apply outreach. |
| **n8n** | Cloud instance `https://meher7914.app.n8n.cloud` — MCP configured but shows "Needs authentication"; no local n8n process running (port 5678 unreachable) | Partially — needs re-auth | Cloud free/paid tier unclear | Webhook-capable once authed | Don't build a second webhook system (brief §10). If Discord/notification webhooks are wanted, re-authenticate the n8n MCP first rather than standing up local n8n. |
| **Discord** | No DISCORD_WEBHOOK found in any of the ~79 profile `.env` files. The `discord` profile (`~/AppData/Local/hermes/profiles/discord`) is a bot *presence* for the AiOlogy project, not a generic notification channel. | No existing reusable notification path | — | — | Brief §21 assumes Discord is "already connected" — it is not, for notification purposes. **Recommend Telegram instead**: `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` already live and used by `project_tghub` — lowest-friction notification channel for job-hunter digests/approvals. Flag this to user before building notifications. |
| **SQLite patterns** | Used throughout (e.g. `harvester_client.py`'s `_db()`, `domain-sniper`, `leads` profiles) — standard `sqlite3` local file pattern, no ORM | Yes | Yes | n/a | Follow the same raw-sqlite3 convention for `job-hunter.db` rather than introducing an ORM or Postgres. |
| **Cron/scheduling** | User policy: never auto-register Task Scheduler/cron unless explicitly asked ([[feedback_task_scheduler]]) | — | — | — | Brief §23 proposes auto-scheduling (every 4h/6h/12h). **This conflicts with established user policy.** Build `job-hunter scan` as a manual/on-demand command; only wire actual OS-level scheduling if the user explicitly opts in later. |
| **Playwright MCP** | Not installed (`claude mcp list` shows no playwright entry) | N/A | Free to add | MCP | Install only when Tier 2+ connectors need it (brief §18) — not needed for Tier 1. |
| **Claude in Chrome** | Available as a Claude Code tool already (deferred, loads via ToolSearch) | Yes | Yes | Native tool | Reserve as last resort per brief §19 — none of the Tier 1 platforms need it. |
| **Python runtime** | **BROKEN** — `python`/`py -3` fail: `C:\Python314\python.exe` registered but missing (`0x80070003`, corrupt install) | No, until fixed | — | — | **Blocking issue**, out of scope to fix here. Recommend building `job-hunter`'s engine in **Node.js** (v24.16.0 confirmed working) instead of Python, since harvester_client.py is only needed for occasional enrichment calls (can shell out once Python is repaired, or port the 3-4 needed functions to Node). |
| **Node.js** | v24.16.0 confirmed working | Yes | Yes | — | Primary implementation runtime for job-hunter. |

## 2. Platform-specific findings (Tier 1)

| Platform | Acquisition method confirmed | Notes |
|---|---|---|
| **RemoteOK** | Public JSON API: `GET https://remoteok.com/api` — no auth, returns array of job objects (title, company, tags, salary_min/max, url, date) | Attribution requested (link back to RemoteOK). Jobs embed a spam-filter "verification word" in the description — surface this to the user if generating application text, don't strip it silently. |
| **Arbeitnow** | Public JSON API: `GET https://www.arbeitnow.com/api/job-board-api` — no auth, `data[]` array (slug, company_name, title, description HTML, remote bool, url, tags, job_types, location, created_at) | Straightforward Level-2 feed integration. |
| **Daleel Madani** | No public API/RSS found. Jobs live at `daleel-madani.org/jobs` (~259 postings, NGO/civil-society focus in Lebanon) | Level 3/4: HTML extraction or Firecrawl. Low volume (one country, one sector) — good first HTML-based connector to validate the Firecrawl fallback path. |
| **Expertini** | Has its own per-country **RSS feed** natively (confirmed via third-party scraper docs referencing "the country's RSS feed" as the fast/lightweight discovery mode); a paid Apify wrapper also exists but is unnecessary | Use Expertini's native RSS directly — do not pay for the Apify actor. Needs the exact feed URL pattern confirmed during implementation (Phase 4), not assumed here. |

## 3. Proposed architecture (for approval before implementation)

**Profile placement:** New Hermes profile `job-hunter` (new folder `~/AppData/Local/hermes/profiles/job-hunter` + matching `WORKFLOW AI/job apps` source dir, following the existing one-folder-per-profile convention). Not an extension of `remote-jobs` — that profile's SOUL.md is manual-outreach-tracking content, not a connector engine; migrate its useful policy/profile data into job-hunter's config, then the old profile can be considered superseded.

**Runtime:** Node.js (not Python, see §1 blocker). SQLite via `better-sqlite3` or equivalent, raw SQL, no ORM — matches existing codebase conventions.

**Reused, not rebuilt:**
- Candidate profile seed data → from `remote-jobs/SOUL.md`
- CV/cover-letter generation → delegate to existing `cv` profile rather than re-implementing
- Contact/recruiter enrichment → `harvester_client.py`'s `verify_email`/`harvest_domain` (called via Python shell-out once Python is fixed, or ported)
- Self-improvement logging → same `log_outreach`/`get_learnings` pattern already in use
- Notifications → Telegram (already live), not Discord (not actually wired despite brief's assumption)
- Scraping fallback → Firecrawl (already live, has quota) for Daleel Madani-style HTML-only platforms

**Tier 1 connector plan:**
1. RemoteOK — direct JSON API
2. Arbeitnow — direct JSON API
3. Expertini — native RSS feed (confirm exact URL during build)
4. Daleel Madani — Firecrawl extraction of `/jobs` listing + detail pages

**Scheduling:** Manual trigger only (`job-hunter scan [--platform X|--all]`) per user's standing no-auto-cron policy. Revisit automated scheduling only if the user explicitly asks.

**Open items needing a user decision before Phase 3 starts:**
1. Confirm Telegram (not Discord) as the notification channel, or explicitly request Discord webhook setup.
2. Confirm it's OK to treat `remote-jobs` Hermes profile as superseded/retired once job-hunter's Tier 1 connectors are live (vs. keeping both running in parallel).
3. Python is broken system-wide (`C:\Python314`) — confirm whether to fix it now (affects other profiles too) or proceed Node-only for job-hunter.
