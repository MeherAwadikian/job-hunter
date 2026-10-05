import { normalizedJobSkeleton, fetchWithRetry, RateLimiter } from './base.js';

const API_URL = 'https://remoteok.com/api';
const limiter = new RateLimiter({ minIntervalMs: 1000 });

export const platform = 'remoteok';

export async function discover() {
  await limiter.wait();
  const res = await fetchWithRetry(API_URL, {
    headers: { 'User-Agent': 'job-hunter/0.1 (+personal use, contact krikormher@gmail.com)' },
  });
  const data = await res.json();
  // First element is a metadata/legal notice object, not a job.
  return Array.isArray(data) ? data.filter((item) => item && item.id) : [];
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url || `https://remoteok.com/remote-jobs/${raw.id}`;
  job.external_id = String(raw.id);
  job.title = raw.position || raw.title || '';
  job.company = raw.company || '';
  job.description = raw.description || '';
  job.location = raw.location || 'Remote';
  job.remote = true;
  job.employment_type = Array.isArray(raw.tags) && raw.tags.includes('contract') ? 'contract' : 'full_time';
  job.salary_min = raw.salary_min ?? null;
  job.salary_max = raw.salary_max ?? null;
  job.currency = raw.salary_min || raw.salary_max ? 'USD' : '';
  job.skills = Array.isArray(raw.tags) ? raw.tags : [];
  job.posted_at = raw.date || null;
  job.application_url = raw.apply_url || raw.url || '';
  job.raw_source = raw;
  return job;
}
