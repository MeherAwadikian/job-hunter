import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API/RSS. Main listing page's job cards are client-rendered
// (confirmed empty via direct curl 2026-10-05, only category nav present in
// raw HTML), so uses Firecrawl. Individual postings end in a numeric id:
// /freelance-jobs/<category>/<subcategory>/<slug>-<id>.
export const platform = 'peopleperhour';
export const method = 'firecrawl';
const LISTING_URL = 'https://www.peopleperhour.com/freelance-jobs';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  const linkRe = /\[([^\]]{4,250})\]\((https?:\/\/www\.peopleperhour\.com\/freelance-jobs\/[^)]*?-\d+)\)/g;
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
