import { normalizedJobSkeleton, fetchWithRetry, RateLimiter } from './base.js';

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';
const limiter = new RateLimiter({ minIntervalMs: 1000 });

export const platform = 'arbeitnow';

export async function discover() {
  await limiter.wait();
  const res = await fetchWithRetry(API_URL, {
    headers: { 'User-Agent': 'job-hunter/0.1 (+personal use, contact krikormher@gmail.com)' },
  });
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url || '';
  job.external_id = raw.slug || raw.url || '';
  job.title = raw.title || '';
  job.company = raw.company_name || '';
  job.description = stripHtml(raw.description);
  job.location = raw.location || (raw.remote ? 'Remote' : '');
  job.remote = !!raw.remote;
  job.employment_type = Array.isArray(raw.job_types) ? raw.job_types.join(', ') : (raw.job_types || '');
  job.skills = Array.isArray(raw.tags) ? raw.tags : [];
  job.posted_at = raw.created_at ? new Date(raw.created_at * 1000).toISOString() : null;
  job.application_url = raw.url || '';
  job.raw_source = raw;
  return job;
}
