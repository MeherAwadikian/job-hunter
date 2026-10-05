# Job Hunter — Tool Selection Matrix

| Tool | Purpose | Official/OSS | Free? | API | MCP | Webhook | Auth needed | Recommended | Reason |
|---|---|---|---|---|---|---|---|---|---|
| `node:sqlite` | Local DB | Official (Node core) | Yes | n/a | n/a | n/a | No | **Yes** | Zero-dependency, avoids broken system Python / native-module builds entirely. |
| `js-yaml` | Parse `platforms.yaml` | OSS, maintained | Yes | n/a | n/a | n/a | No | **Yes** | Trivial, well-maintained, only dependency added. |
| Native `fetch` | HTTP connectors | Official (Node core) | Yes | n/a | n/a | n/a | No | **Yes** | RemoteOK/Arbeitnow need nothing more. |
| Firecrawl | HTML extraction fallback | Commercial API, already live w/ quota | Metered (has quota) | Yes | No | No | API key | **Yes, for HTML-only sites** | Already paid-for and live in the Hermes stack; avoids writing fragile raw-HTML parsers. Used only for Expertini/Daleel Madani, not RemoteOK/Arbeitnow which have real feeds. |
| Playwright MCP | Authenticated/dynamic sites | Official (Microsoft) | Yes | n/a | Yes | n/a | n/a | **Not yet** | Not needed for any Tier-1 platform. Install when a Tier 2+ connector (e.g. Guru, PeoplePerHour) proves it needs structured browser interaction. |
| Claude in Chrome | Last-resort browser automation | Anthropic, already available | Yes | n/a | n/a | n/a | n/a | **Reserve only** | None of the implemented connectors need it; brief explicitly scopes it as final fallback. |
| harvester_client.py | Contact/recruiter enrichment | Internal, ~74 functions | Yes (local) | Direct import | No | No | n/a | **Later, for enrichment only** | Not job-board specific, no overlap/duplication risk with connectors built here. Needs Python fixed first, or the 2-3 needed functions ported to Node. |
| n8n (cloud) | Webhook/notification routing | Cloud, user's account | Free/paid tier unclear | Yes once authed | n/a | Yes | Needs re-auth | **Not used** | MCP currently shows "needs authentication"; no notification channel has been requested yet anyway. |
| Discord | Notifications | — | — | — | — | — | — | **Not used** | No notification webhook actually exists for this purpose despite the brief's assumption; user chose "neither yet" over Telegram/Discord on 2026-10-05. |
| crawl4ai / Scrapy / BeautifulSoup | General scraping | OSS | Yes | n/a | n/a | n/a | No | **Not installed** | Not needed — Tier-1 HTML needs were fully served by Firecrawl (already paid-for) + regex-on-markdown. Would only be worth evaluating if Firecrawl quota becomes a real constraint across many Tier 2+ connectors. |

## Policy enforced
`FREE API -> FREE WEBHOOK -> RSS/JSON -> HTTP -> FREE SELF-HOSTED SCRAPER -> Firecrawl -> Playwright -> Claude in Chrome` was followed in order for every Tier-1 platform; none skipped a cheaper tier that was actually available (verified by direct probing, not assumption — the brief's Expertini-RSS assumption was checked and found false before building around it).
