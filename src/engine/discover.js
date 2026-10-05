import { getDb, nowIso } from '../db/init.js';
import { canonicalKey } from './dedupe.js';
import { scoreJob } from './score.js';
import { semanticScoreJob, SEMANTIC_FLOOR } from './semanticScore.js';
import { RateLimiter } from '../connectors/base.js';
import candidateProfile from '../config/candidate_profile.json' with { type: 'json' };

const semanticLimiter = new RateLimiter({ minIntervalMs: 3000 });

import * as remoteok from '../connectors/remoteok.js';
import * as arbeitnow from '../connectors/arbeitnow.js';
import * as expertini from '../connectors/expertini.js';
import * as daleelmadani from '../connectors/daleelmadani.js';
import * as twine from '../connectors/twine.js';
import * as bayt from '../connectors/bayt.js';
import * as shghilni from '../connectors/shghilni.js';
import * as guru from '../connectors/guru.js';
import * as peopleperhour from '../connectors/peopleperhour.js';
import * as furrsati from '../connectors/furrsati.js';
import * as olx from '../connectors/olx.js';
import * as ats from '../connectors/ats.js';
import * as indeed from '../connectors/indeed.js';

export const CONNECTORS = {
  remoteok,
  arbeitnow,
  expertini,
  'daleel-madani': daleelmadani,
  twine,
  bayt,
  shghilni,
  guru,
  peopleperhour,
  furrsati,
  olx,
  ats,
  indeed,
};

function ensureProfile(db) {
  const existing = db.prepare('SELECT id FROM profiles WHERE name = ?').get(candidateProfile.name);
  if (existing) return existing.id;
  const stmt = db.prepare(
    `INSERT INTO profiles (name, email, mobile, location, languages, data) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    candidateProfile.name,
    candidateProfile.email,
    candidateProfile.mobile,
    candidateProfile.location,
    JSON.stringify(candidateProfile.languages),
    JSON.stringify(candidateProfile)
  );
  return Number(info.lastInsertRowid);
}

function ensurePlatformRow(db, id, method) {
  db.prepare(
    `INSERT OR IGNORE INTO platforms (id, name, tier, method, enabled) VALUES (?, ?, 1, ?, 1)`
  ).run(id, id, method);
}

export async function scanPlatform(platformId) {
  const connector = CONNECTORS[platformId];
  if (!connector) throw new Error(`Unknown platform: ${platformId}`);

  const db = getDb();
  const profileId = ensureProfile(db);
  ensurePlatformRow(db, platformId, connector.method || 'unknown');

  const startedAt = nowIso();
  const runStmt = db.prepare(
    `INSERT INTO connector_runs (platform, started_at, found, parsed, rejected, duplicates, success) VALUES (?, ?, 0, 0, 0, 0, 0)`
  );
  const runId = Number(runStmt.run(platformId, startedAt).lastInsertRowid);

  let found = 0, parsed = 0, rejected = 0, duplicates = 0;
  const errors = [];
  const newJobs = [];

  try {
    const rawItems = await connector.discover();
    found = rawItems.length;

    for (const raw of rawItems) {
      try {
        const job = connector.normalize(raw);
        if (!job.title) { rejected++; continue; }

        const key = canonicalKey(job);
        const existing = db.prepare('SELECT id, source_platforms FROM jobs WHERE canonical_key = ?').get(key);

        if (existing) {
          duplicates++;
          const sources = new Set(JSON.parse(existing.source_platforms || '[]'));
          sources.add(platformId);
          db.prepare('UPDATE jobs SET last_seen = ?, source_platforms = ? WHERE id = ?')
            .run(nowIso(), JSON.stringify([...sources]), existing.id);
          continue;
        }

        const now = nowIso();
        const insert = db.prepare(`
          INSERT INTO jobs (
            platform, source_url, external_id, title, company, description, location, remote,
            employment_type, salary_min, salary_max, currency, skills, experience, deadline,
            posted_at, application_url, contact, raw_source, discovered_at,
            canonical_key, first_seen, last_seen, source_platforms, status
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `);
        const info = insert.run(
          job.platform, job.source_url, job.external_id, job.title, job.company, job.description,
          job.location, job.remote ? 1 : 0, job.employment_type, job.salary_min, job.salary_max,
          job.currency, JSON.stringify(job.skills), job.experience, job.deadline, job.posted_at,
          job.application_url, job.contact, JSON.stringify(job.raw_source), job.discovered_at,
          key, now, now, JSON.stringify([platformId]), 'DISCOVERED'
        );
        const jobId = Number(info.lastInsertRowid);
        parsed++;

        const s = scoreJob(job, candidateProfile);
        db.prepare(`
          INSERT OR REPLACE INTO job_scores (
            job_id, profile_id, overall_score, skill_match, experience_match, industry_match,
            location_match, salary_match, remote_match, application_effort, grade, rationale, scored_at
          ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          jobId, profileId, s.overall_score, s.skill_match, s.experience_match, s.industry_match,
          s.location_match, s.salary_match, s.remote_match, s.application_effort, s.grade, s.rationale, nowIso()
        );
        db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run('QUALIFIED', jobId);

        newJobs.push({ ...job, id: jobId, score: s });
      } catch (err) {
        rejected++;
        errors.push(String(err.message || err));
      }
    }
  } catch (err) {
    errors.push(String(err.message || err));
  }

  db.prepare(`
    UPDATE connector_runs SET finished_at = ?, found = ?, parsed = ?, rejected = ?, duplicates = ?, errors = ?, success = ?
    WHERE id = ?
  `).run(nowIso(), found, parsed, rejected, duplicates, JSON.stringify(errors), errors.length === 0 ? 1 : 0, runId);

  return { platform: platformId, found, parsed, rejected, duplicates, errors, newJobs };
}

export async function scanAll(platformIds = Object.keys(CONNECTORS)) {
  const results = [];
  for (const id of platformIds) {
    results.push(await scanPlatform(id));
  }
  return results;
}

// Second-pass semantic scoring (brief §14/§27): only called explicitly via
// `job-hunter score --semantic`, never automatically during scan, to keep
// the free rule-based pass as the default and LLM spend opt-in.
export async function semanticPass({ limit = 20 } = {}) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT j.id as job_id, j.title, j.company, j.location, j.remote, j.employment_type,
           j.skills, j.description, s.overall_score, s.profile_id
    FROM jobs j JOIN job_scores s ON s.job_id = j.id
    WHERE s.overall_score >= ? AND s.rationale NOT LIKE '[semantic]%'
    ORDER BY s.overall_score DESC
    LIMIT ?
  `).all(SEMANTIC_FLOOR, limit);

  const results = [];
  for (const row of rows) {
    await semanticLimiter.wait();
    const job = {
      title: row.title,
      company: row.company,
      location: row.location,
      remote: !!row.remote,
      employment_type: row.employment_type,
      skills: JSON.parse(row.skills || '[]'),
      description: row.description,
    };
    try {
      const sem = await semanticScoreJob(job, candidateProfile);
      db.prepare(`
        UPDATE job_scores SET overall_score = ?, skill_match = ?, experience_match = ?,
          industry_match = ?, remote_match = ?, grade = ?, rationale = ?, scored_at = ?
        WHERE job_id = ? AND profile_id = ?
      `).run(
        sem.overall_score, sem.skill_match, sem.experience_match, sem.industry_match,
        sem.remote_match, sem.grade, `[semantic] ${sem.why}`, nowIso(), row.job_id, row.profile_id
      );
      db.prepare(`INSERT INTO job_events (job_id, event, detail, created_at) VALUES (?, 'SEMANTIC_SCORED', ?, ?)`)
        .run(row.job_id, JSON.stringify(sem), nowIso());
      results.push({ job_id: row.job_id, title: row.title, ...sem });
    } catch (err) {
      results.push({ job_id: row.job_id, title: row.title, error: String(err.message || err) });
    }
  }
  return results;
}
