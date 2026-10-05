import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API or RSS feed confirmed for Expertini (checked robots.txt + direct
// feed-path probes on 2026-10-05, both empty/unavailable). Uses Firecrawl HTML
// extraction instead, same as Daleel Madani. Country portal confirmed via search:
// https://lb.expertini.com/jobs/
export const platform = 'expertini';
const LISTING_URL = 'https://lb.expertini.com/jobs/';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  // Individual postings use singular /job/<slug>, not /jobs/ (that's category/search pages).
  const linkRe = /\[([^\]]{4,150})\]\((https?:\/\/lb\.expertini\.com\/job\/[^)\s]+?)\/?\)/g;
  const seen = new Set();
  const items = [];
  let m;
  while ((m = linkRe.exec(markdown)) && items.length < MAX_LISTINGS) {
    const [, text, urlRaw] = m;
    const url = urlRaw.replace(/\/$/, '');
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
  job.remote = /remote/i.test(raw.title);
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
