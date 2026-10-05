// Application generation (brief §16). Originally shelled out to the
// existing `cv` Hermes profile's CLI (`hermes -p cv -z PROMPT --yolo`), per
// the reuse decision in JOB_HUNTER_ARCHITECTURE.md. That wrapper proved
// unreliable in practice on 2026-10-05: two consecutive real runs returned
// empty/malformed output (no error, no section headers) even though the
// underlying model answered instantly and correctly when queried directly —
// consistent with previously-documented Hermes CLI flakiness (see memory
// feedback_hermes_cli_terminal_unreliable / feedback_hermes_ingestion_quality).
//
// Fixed by calling the `cv` profile's own Ollama backend (llama3.2:3b,
// localhost:11434) directly via its OpenAI-compatible API — same model, same
// local/free cost, just skipping the flaky CLI layer. Still slow (~20-40s)
// and still prone to the model ignoring formatting instructions, which is
// why generation stays opt-in and scoped, not run automatically.

import { getDb, nowIso } from '../db/init.js';

const OLLAMA_URL = 'http://localhost:11434/v1/chat/completions';
const MODEL = 'llama3.2:3b';
const TIMEOUT_MS = 120_000;

async function runOllama(prompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Ollama returned no content');
    return content.trim();
  } finally {
    clearTimeout(timer);
  }
}

function buildPrompt(job, profile) {
  const signoff = profile.outreach_policy?.signoff || profile.name;
  const companyLine = job.company
    ? `Hiring company/client: ${job.company}.`
    : `Hiring company/client name is unknown — this job was found via the ${job.platform} freelance/job platform, but ${job.platform} is NOT the employer. Do not name ${job.platform} (or any platform) as the company. Address the letter generically ("Dear Hiring Manager" / "Dear Client") without inventing or guessing a company name.`;

  return `You are helping ${profile.name} (${profile.location}) apply to a job. Candidate background: ${profile.skill_angles.map((a) => a.category + ' (' + a.skills.join(', ') + ')').join('; ')}.

JOB: ${job.title}.
${companyLine}
Description: ${(job.description || '').slice(0, 1200)}

Produce exactly three sections with these exact headers, nothing before the first header and nothing after the last section's content:

### CV_BULLETS
(3-5 bullet points tailoring the candidate's existing background to this specific job, each starting with "- ")

### COVER_LETTER
(a 3-paragraph cover letter, no salutation preamble like "Here is...", start directly with "Dear Hiring Manager," or "Dear Client," )

### SHORT_MESSAGE
(a 2-3 sentence short application message suitable for a platform message box. Open by addressing the client/hiring manager directly — NOT "${signoff}", that is the candidate's own closing signature and must appear only as the LAST line of this section, nothing after it)`;
}

function parseSections(raw) {
  const grab = (label, nextLabels) => {
    const start = raw.indexOf(`### ${label}`);
    if (start === -1) return '';
    const afterHeader = start + `### ${label}`.length;
    let end = raw.length;
    for (const next of nextLabels) {
      const idx = raw.indexOf(`### ${next}`, afterHeader);
      if (idx !== -1 && idx < end) end = idx;
    }
    return raw.slice(afterHeader, end).trim();
  };
  return {
    // local model sometimes echoes the "- " prefix from the instructions
    // literally, producing "- - bullet text" — collapsed here.
    cv_bullets: grab('CV_BULLETS', ['COVER_LETTER', 'SHORT_MESSAGE']).replace(/^-\s+-\s+/gm, '- '),
    cover_letter: grab('COVER_LETTER', ['SHORT_MESSAGE']),
    short_message: grab('SHORT_MESSAGE', []),
  };
}

export async function generateApplication(jobId) {
  const db = getDb();
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
  if (!job) throw new Error(`No job with id ${jobId}`);

  const scoreRow = db.prepare('SELECT * FROM job_scores WHERE job_id = ? ORDER BY scored_at DESC LIMIT 1').get(jobId);
  if (!scoreRow) throw new Error(`Job ${jobId} has no score yet`);

  const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND profile_id = ?').get(jobId, scoreRow.profile_id);
  if (existing) return { job_id: jobId, skipped: true, reason: 'application already exists' };

  const profileRow = db.prepare('SELECT data FROM profiles WHERE id = ?').get(scoreRow.profile_id);
  const profile = JSON.parse(profileRow.data);

  const prompt = buildPrompt(job, profile);
  const raw = await runOllama(prompt);
  const { cv_bullets, cover_letter, short_message } = parseSections(raw);

  const now = nowIso();
  const info = db.prepare(`
    INSERT INTO applications (job_id, profile_id, status, cv_variant, cover_letter, proposal, notes, created_at, updated_at)
    VALUES (?, ?, 'WAITING_APPROVAL', ?, ?, ?, ?, ?, ?)
  `).run(jobId, scoreRow.profile_id, cv_bullets, cover_letter, short_message, raw.length < 50 ? 'WARNING: short/possibly malformed output' : null, now, now);

  db.prepare(`INSERT INTO job_events (job_id, event, detail, created_at) VALUES (?, 'APPLICATION_DRAFTED', ?, ?)`)
    .run(jobId, JSON.stringify({ application_id: Number(info.lastInsertRowid) }), now);
  db.prepare(`UPDATE jobs SET status = 'WAITING_APPROVAL' WHERE id = ?`).run(jobId);

  return { job_id: jobId, application_id: Number(info.lastInsertRowid), cv_bullets, cover_letter, short_message };
}

export async function generateForTopJobs({ limit = 5, minGrade = 'B' } = {}) {
  const db = getDb();
  const gradeOrder = { 'A+': 0, A: 1, B: 2, C: 3, D: 4 };
  const rows = db.prepare(`
    SELECT j.id FROM jobs j
    JOIN job_scores s ON s.job_id = j.id
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE a.id IS NULL
    ORDER BY s.overall_score DESC
  `).all();

  const eligible = rows.filter((r) => {
    const s = db.prepare('SELECT grade FROM job_scores WHERE job_id = ?').get(r.id);
    return gradeOrder[s.grade] <= gradeOrder[minGrade];
  }).slice(0, limit);

  const results = [];
  for (const { id } of eligible) {
    try {
      results.push(await generateApplication(id));
    } catch (err) {
      results.push({ job_id: id, error: String(err.message || err) });
    }
  }
  return results;
}
