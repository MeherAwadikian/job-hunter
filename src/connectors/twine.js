import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API/RSS. Listing page is client-rendered (confirmed empty via
// direct curl 2026-10-05 — no JSON-LD/job data in raw HTML), so uses
// Firecrawl. Card title text is suffixed with "Easy Apply ⚡" or "OPEN JOB"
// badges which get stripped off.
export const platform = 'twine';
export const method = 'firecrawl';
const LISTING_URL = 'https://www.twine.net/jobs';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  const linkRe = /\[([^\]]{4,250})\]\((https?:\/\/www\.twine\.net\/projects\/[^)]+)\)/g;
  const seen = new Set();
  const items = [];
  let m;
  while ((m = linkRe.exec(markdown)) && items.length < MAX_LISTINGS) {
    const [, block, url] = m;
    if (seen.has(url)) continue;
    seen.add(url);
    const title = block
      .split(/\\+\s*\n/)[0]
      .replace(/Easy Apply ?⚡?/i, '')
      .replace(/OPEN JOB/i, '')
      .trim();
    items.push({ url, title });
  }
  return items;
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url;
  job.external_id = raw.url;
  job.title = raw.title;
  job.employment_type = 'freelance';
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
