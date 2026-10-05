# Job Hunter — Submission Workflow (manual, Chrome-driven, human-confirmed)

## Status: proven live, 2026-10-05
First real end-to-end submission: **Automation Engineer - Influencers @ ElevenLabs** (job id 2818, application id 5, via the `ats`/Ashby connector). Real form, real resume, real submission, real "Success" confirmation from Ashby.

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
- **ATS (Greenhouse/Lever/Ashby)** — no login required, guest application forms. Proven 2026-10-05.
- **Glassdoor, Upwork** — real logged-in accounts confirmed via Chrome (2026-10-05), not yet used for an actual submission.
- **Guru, Twine, PeoplePerHour, Shghilni, Furrsati** — **no accounts exist** on any of these (confirmed by checking each directly, correcting an earlier wrong assumption). Would need real account creation first, which is a user decision, not something to do silently.
