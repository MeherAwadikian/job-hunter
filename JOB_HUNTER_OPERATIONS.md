# Job Hunter — Operations

## Setup
```bash
cd "WORKFLOW AI/job apps"
npm install
# .env already contains FIRECRAWL_API_KEY (copied from an existing live Hermes profile key)
```

## Commands
```bash
# Scan every enabled Tier-1 platform, score, store, print summary
node --env-file=.env src/cli.js scan --all

# Scan a single platform
node --env-file=.env src/cli.js scan --platform remoteok

# Self-test a connector against live data (same as scan but prints per-item results)
node --env-file=.env src/cli.js test --platform expertini
node --env-file=.env src/cli.js test --all

# Top 20 qualified jobs by score, across all platforms
node --env-file=.env src/cli.js digest

# Generate CV bullets + cover letter + short message for a specific job (slow: ~60-90s)
node --env-file=.env src/cli.js generate --job-id <id>

# Generate for the top N ungenerated jobs scoring B or better
node --env-file=.env src/cli.js generate --limit 5 --min-grade B

# Review, approve, or reject drafted applications (nothing auto-submits)
node --env-file=.env src/cli.js applications list
node --env-file=.env src/cli.js applications show <id>
node --env-file=.env src/cli.js applications approve <id>
node --env-file=.env src/cli.js applications reject <id>
```

`generate` does not need `FIRECRAWL_API_KEY` but does require the `cv` Hermes profile's local Ollama backend running (`http://localhost:11434`).

`--env-file=.env` is only required for connectors that call Firecrawl (`expertini`, `daleel-madani`). RemoteOK/Arbeitnow need no key.

## Observability
Every run writes a row to `connector_runs` (platform, method, found/parsed/rejected/duplicates, errors, success flag, timestamps) — query it directly:
```bash
node --env-file=.env -e "
import('./src/db/init.js').then(({getDb}) => {
  console.log(getDb().prepare('SELECT * FROM connector_runs ORDER BY id DESC LIMIT 10').all());
});
"
```

## Known limitations (be aware before relying on counts)
- Scoring is rule-based keyword overlap only — no Claude semantic pass yet, so scores run low (mostly C/D) for jobs that are genuinely a good fit but don't use the candidate's exact keyword vocabulary. Treat current scores as a coarse pre-filter, not a final verdict.
- Expertini/Daleel Madani connectors parse Firecrawl's markdown output with regex tuned to each site's current structure (verified live 2026-10-05) — if either site changes its template, the connector will return 0 results silently rather than erroring; check `connector_runs.found` after a scan.
- Dedup is title+company only; two postings with slightly different titles for the same role will not be merged.

## Day-to-day usage
1. Run `node --env-file=.env src/cli.js scan --all` whenever you want fresh listings (no auto-schedule by design).
2. Run `digest` to see the current top-scored qualified jobs.
3. Nothing gets sent anywhere automatically — review manually; notification wiring is deferred (see `JOB_HUNTER_ARCHITECTURE.md`).
