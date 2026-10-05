# ATS (Greenhouse / Lever / Ashby) — direct company APIs

- **Acquisition method:** Each company's own public job-board API — `boards-api.greenhouse.io/v1/boards/<token>/jobs`, `api.lever.co/v0/postings/<token>?mode=json`, `api.ashbyhq.com/posting-api/job-board/<token>`.
- **API:** **Official, public, no auth required.** These are the same endpoints each company's own careers page JavaScript calls — not scraping, not reverse-engineering. The cleanest acquisition method of any connector in this system.
- **Webhook:** No.
- **Scraper:** None needed.
- **MCP:** Not used.
- **Authentication:** None.
- **Browser requirement:** None.
- **Limitations:** Requires knowing each company's board "token" (usually, not always, matches the company's name/slug) — discovered by direct curl probing, not guessable with certainty. `src/config/ats_companies.yaml` lists only tokens verified live on 2026-10-05: Greenhouse (anthropic, stripe, airtable, figma, vercel), Lever (mistral), Ashby (ramp, notion, linear, cohere, browserbase, langchain, elevenlabs). Many candidate companies tested did NOT resolve under their obvious name (n8n, Deel, Zapier, Retool, OpenAI, Scale, Hugging Face, Replicate, Cohere-via-lever, Perplexity, CrewAI, Weights & Biases all 404'd under the tokens tried) — either they use a different ATS, a non-obvious token, or don't have a public board API at all. Adding a company means verifying its real token first, not assuming the company name is the token.
- **Rate limits:** Self-limited to 1 request/500ms across all three providers combined. No pagination implemented yet — Greenhouse/Ashby/Lever all return their full current listing in one response (confirmed: Anthropic alone returned 638 jobs in a single call).
- **Fallback strategy:** None needed — these are the primary method, not a fallback from anything.
- **To add a company:** test the three URL patterns above with `curl`, confirm HTTP 200 with real job data (not a 404 or empty array), then add the verified token to `src/config/ats_companies.yaml`.
