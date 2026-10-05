import { load as loadYaml } from 'js-yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { normalizedJobSkeleton, fetchWithRetry, RateLimiter } from './base.js';

// Queries companies' own public ATS job-board APIs directly — Greenhouse,
// Lever, and Ashby all expose genuine no-auth JSON endpoints for their
// customers' career pages. This is the cleanest acquisition method of any
// connector in the system: an official public API per company, not
// scraping a job board. See src/config/ats_companies.yaml for the
// (curl-verified) company list and how to add more.
export const platform = 'ats';
export const method = 'official_api';
const limiter = new RateLimiter({ minIntervalMs: 500 });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadCompanies() {
  const file = path.join(__dirname, '..', 'config', 'ats_companies.yaml');
  return loadYaml(readFileSync(file, 'utf-8'));
}

async function fetchGreenhouse(token) {
  await limiter.wait();
  const res = await fetchWithRetry(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`, {}, { retries: 1 });
  const data = await res.json();
  return (data.jobs || []).map((j) => ({ source: 'greenhouse', company: token, raw: j }));
}

async function fetchLever(token) {
  await limiter.wait();
  const res = await fetchWithRetry(`https://api.lever.co/v0/postings/${token}?mode=json`, {}, { retries: 1 });
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((j) => ({ source: 'lever', company: token, raw: j }));
}

async function fetchAshby(token) {
  await limiter.wait();
  const res = await fetchWithRetry(`https://api.ashbyhq.com/posting-api/job-board/${token}`, {}, { retries: 1 });
  const data = await res.json();
  return (data.jobs || []).map((j) => ({ source: 'ashby', company: token, raw: j }));
}

export async function discover() {
  const companies = loadCompanies();
  const items = [];
  for (const token of companies.greenhouse || []) {
    try { items.push(...await fetchGreenhouse(token)); } catch { /* 404/unreachable, skip */ }
  }
  for (const token of companies.lever || []) {
    try { items.push(...await fetchLever(token)); } catch { /* skip */ }
  }
  for (const token of companies.ashby || []) {
    try { items.push(...await fetchAshby(token)); } catch { /* skip */ }
  }
  return items;
}

export function normalize(item) {
  const job = normalizedJobSkeleton(platform);
  const { source, company, raw } = item;

  if (source === 'greenhouse') {
    job.source_url = raw.absolute_url || '';
    job.external_id = `greenhouse:${raw.id}`;
    job.title = raw.title || '';
    job.company = raw.company_name || company;
    job.location = raw.location?.name || '';
    job.posted_at = raw.updated_at || null;
    job.application_url = raw.absolute_url || '';
  } else if (source === 'lever') {
    job.source_url = raw.hostedUrl || '';
    job.external_id = `lever:${raw.id}`;
    job.title = raw.text || '';
    job.company = company;
    job.location = raw.categories?.location || '';
    job.employment_type = raw.categories?.commitment || '';
    job.description = raw.descriptionPlain || raw.description || '';
    job.posted_at = raw.createdAt ? new Date(raw.createdAt).toISOString() : null;
    job.application_url = raw.applyUrl || raw.hostedUrl || '';
  } else if (source === 'ashby') {
    job.source_url = raw.jobUrl || '';
    job.external_id = `ashby:${raw.id}`;
    job.title = raw.title || '';
    job.company = company;
    job.location = raw.location || '';
    job.remote = !!raw.isRemote;
    job.employment_type = raw.employmentType || '';
    job.posted_at = raw.publishedAt || null;
    job.application_url = raw.applyUrl || raw.jobUrl || '';
  }

  job.raw_source = item;
  return job;
}
