import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// Direct HTTP returns 403 (confirmed via curl 2026-10-05). No public API/RSS
// exists — only paid third-party Apify scrapers do. Firecrawl bypasses the
// block. Listings render as markdown H2s: "## [Title](.../jobs/slug-12345/)".
export const platform = 'bayt';
export const method = 'firecrawl';
const LISTING_URL = 'https://www.bayt.com/en/lebanon/jobs/';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  const linkRe = /##\s*\[([^\]]{2,150})\]\((https?:\/\/www\.bayt\.com\/en\/lebanon\/jobs\/[a-z0-9-]+-\d+\/)[^)]*\)/g;
  const seen = new Set();
  const items = [];
  let m;
  while ((m = linkRe.exec(markdown)) && items.length < MAX_LISTINGS) {
    const [, text, url] = m;
    if (seen.has(url)) continue;
    seen.add(url);
    items.push({ title: text.trim(), url });
  }
  return items;
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url;
  job.external_id = raw.url;
  job.title = raw.title;
  job.location = 'Lebanon';
  job.remote = false;
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
