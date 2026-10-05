import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// Originally built on plain HTTP (Level 3) after confirming server-rendered
// HTML via direct curl on 2026-10-05. That assessment didn't hold up: Guru
// sits behind an Incapsula WAF and started returning 403 on every request
// shortly after (regardless of User-Agent) — likely bot-scoring triggered
// by repeated automated requests during testing. Downgraded to Firecrawl,
// which gets through reliably. Documented honestly in docs/platforms/guru.md
// rather than silently keeping a connector that was actually unreliable.
export const platform = 'guru';
export const method = 'firecrawl';
const LISTING_URL = 'https://www.guru.com/d/jobs/';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  const linkRe = /##\s*\[([^\]]{2,150})\]\((https?:\/\/www\.guru\.com\/jobs\/[^)\s&]+)[^)]*\)/g;
  const seen = new Set();
  const items = [];
  let m;
  while ((m = linkRe.exec(markdown)) && items.length < MAX_LISTINGS) {
    const [, title, url] = m;
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({ url, title: title.trim() });
  }
  return items;
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url;
  job.external_id = raw.url;
  job.title = raw.title;
  job.remote = true;
  job.employment_type = 'freelance';
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
