// Application generation (brief §16), delegated to the existing `cv` Hermes
// profile rather than reimplementing CV/cover-letter tailoring from scratch
// (per JOB_HUNTER_ARCHITECTURE.md's reuse list). Shells out to the Hermes
// CLI non-interactively (`-z PROMPT --yolo`).
//
// Measured cost: ~60-90s per call on the cv profile's local Ollama model
// (llama3.2:3b) — slow compared to a hosted API, and prone to adding
// unwanted preamble despite explicit instructions not to (documented
// Hermes CLI behavior, see memory feedback_hermes_ingestion_quality). This
// is why generation is opt-in and scoped to a small --limit, not run
// automatically during scan/score.

import { execFile } from 'node:child_process';
import { getDb, nowIso } from '../db/init.js';

const HERMES_BIN = 'C:\\Users\\h\\.local\\bin\\hermes';
const TIMEOUT_MS = 180_000;

function runHermes(prompt) {
  return new Promise((resolve, reject) => {
    execFile(
      HERMES_BIN,
      ['-p', 'cv', '-z', prompt, '--yolo'],
      { timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) reject(new Error(`hermes CLI failed: ${err.message} ${stderr || ''}`.trim()));
        else resolve(stdout.trim());
      }
    );
  });
}

function buildPrompt(job, profile) {
  return `You are helping ${profile.name} (${profile.location}) apply to a job. Candidate background: ${profile.skill_angles.map((a) => a.category + ' (' + a.skills.join(', ') + ')').join('; ')}.

JOB: ${job.title} at ${job.company || 'the company'} (${job.platform}).
Description: ${(job.description || '').slice(0, 1200)}

Produce exactly three sections with these exact headers, nothing before the first header and nothing after the last section's content:

### CV_BULLETS
(3-5 bullet points tailoring the candidate's existing background to this specific job, each starting with "- ")

### COVER_LETTER
(a 3-paragraph cover letter, no salutation preamble like "Here is...", start directly with "Dear Hiring Manager," )

### SHORT_MESSAGE
(a 2-3 sentence short application message suitable for a platform message box, signed "${profile.outreach_policy?.signoff || profile.name}")`;
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
  const raw = await runHermes(prompt);
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
