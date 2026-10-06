# Job Hunter — Submission Workflow (manual, Chrome-driven, human-confirmed)

## Status: proven live, 2026-10-05 and 2026-10-06
Three real end-to-end submissions so far:
1. **Automation Engineer - Influencers @ ElevenLabs** (job id 2818, application id 5, via the `ats`/Ashby connector). Real form, real resume, real submission, real "Success" confirmation from Ashby.
2. **AI Systems & Automation Engineer @ Ethos Interactive** (job id 3019, application id 6) — found live via Bayt's site search (not yet in the cached `bayt` connector run), required creating a real Bayt account first (user did this themselves per the login-handoff pattern), then routed through Bayt's "Apply on company site" to the employer's real SmartRecruiters ATS. Hit a genuine tooling limit: the resume dropzone was a web component with its file input fully encapsulated in shadow DOM, unreachable by `file_upload`/`read_page` even after confirming via direct JS DOM inspection — resolved by asking the user to drag-and-drop the file themselves (saved to `Desktop/cvv/eleven.pdf` for them first). Screening questions (nationality, availability, experience band, salary) were answered with real user-provided figures, not invented.
3. **Upwork proposal: "Seeking AI Agents, Automation and Workflow Expert"** (job id 3020, application id 7) — found via a narrow `n8n` keyword search after broader "AI automation" searches on both RemoteOK/Arbeitnow and Glassdoor kept surfacing US-restricted/senior/domain-mismatched roles. Verified client legitimacy first (payment+phone verified, 5.0 rating, real spend/hire history) after an adjacent unverified-client listing showed classic Upwork scam signals. Spent all 11 available Connects on the proposal — a real resource cost, confirmed with the user before submitting. Cover letter referenced the real job-hunter project specifically (exact role, a true reliability lesson, stack, availability) per the client's explicit "no generic AI-generated proposal" instruction. Rate ($10/hr) came directly from the user, not invented.

## Why this isn't a CLI command
Filling and submitting an application requires driving a real browser against a specific site's form, and — critically — reading and answering screening questions honestly from the candidate's real background. That's not something `node src/cli.js` can do unattended. It's done by Claude (via Claude-in-Chrome) in a live chat, on request, per job — never automated/scheduled.

## The actual workflow
1. `applications queue` lists APPROVED applications not yet submitted.
2. Open the job's `application_url` in Chrome.
3. Fill the form: resume upload (an existing real tailored CV from the `cv` profile's `workspace/profiles/meher-awadikian/` folder — picked for fit, not generated fresh), name/email/location, and any free-text screening questions — answered from real, true facts (e.g. this very project), never a fabricated story.
4. **Show the user the complete filled form and get explicit confirmation before clicking the final submit control.** Non-negotiable per the assistant's own operating rules (irreversible action).
5. After confirmed submission, record it: `applications` status → `SUBMITTED`, `jobs` status → `APPLIED`, a `job_events` row logged.

## A real gotcha hit and fixed during the first run
Programmatically setting form field values (`form_input` with direct DOM value assignment) **looked** correct on screen but didn't register with the page's React state. Clicking Submit surfaced "Missing entry for required field" on fields that visibly had text in them. React-controlled inputs only pick up changes delivered through real input/keystroke events, not raw DOM value writes. **Fix: re-enter every field using real keystroke simulation (`computer` tool's `type` action, after a click + select-all), not `form_input`'s direct value-set, on any React-driven application form.** Dropdown/combobox fields additionally require clicking the resulting suggestion to commit the selection — typing alone leaves it uncommitted.

## Required-field surprises
Some fields that looked optional turned out to be required (red asterisk only visible on close inspection): "Link to your GitHub profile" and "Link to something you've built" both required actual URLs. The project's GitHub repo was private at the time — made public (`gh repo edit --visibility public`) after explicit user confirmation, since a private-repo link would be useless to the employer anyway. Always scroll through the entire form once before assuming optional fields can stay blank.

## Platforms confirmed usable for this workflow
- **ATS (Greenhouse/Lever/Ashby)** — no login required, guest application forms. Proven 2026-10-05 (ElevenLabs).
- **Bayt** — required creating a real account first (user did this via the login-handoff pattern below); once logged in, "Apply on company site" routes to the employer's own ATS (SmartRecruiters in this case) rather than staying on Bayt. Proven 2026-10-06 (Ethos Interactive).
- **Upwork** — proven 2026-10-06 (proposal to a verified-client job). Note: broad Glassdoor searches ("AI automation", "junior automation", "n8n") consistently surfaced US-restricted or domain-mismatched roles for this candidate's profile — same pattern as RemoteOK/Arbeitnow. No Glassdoor submission yet; Upwork's project-based format turned out to fit a skills-first pitch better than Glassdoor's full-time corporate listings.
- **Guru, Twine, PeoplePerHour, Shghilni, Furrsati** — **no accounts exist** on any of these (confirmed by checking each directly, correcting an earlier wrong assumption). Would need real account creation first, which is a user decision, not something to do silently.
- **RemoteOK/Arbeitnow** — real candidates checked 2026-10-05 turned up a confirmed crypto-recruitment scam ring (two near-identical listings, same tracking hash, vague company names, external unknown apply domains — flagged and skipped), plus location-restricted and skill-mismatched roles. No submission yet from these two platforms; worth another pass but treat every "too good to be true" junior/part-time crypto listing on RemoteOK as a scam signal, not just a mismatch.

## Login handoff pattern (when no account exists)
When a platform requires an account that doesn't exist yet: open the signup/login page in Chrome, tell the user exactly what's needed and why, and wait for them to create the account or log in themselves. Never fill in a password or create an account with fabricated identity details. Once they confirm, continue from their authenticated session.
