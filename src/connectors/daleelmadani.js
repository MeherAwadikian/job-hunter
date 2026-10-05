import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API/RSS. Direct HTTP returns 403 (basic bot block) so this
// uses Firecrawl per JOB_HUNTER_ENVIRONMENT_AUDIT.md's recommendation.
export const platform = 'daleel-madani';
const LISTING_URL = 'https://daleel-madani.org/jobs';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  // Job titles render as markdown H4s: "#### [Title](.../jobs/slug)"
  const linkRe = /####\s*\[([^\]]{2,150})\]\((https?:\/\/daleel-madani\.org\/civil-society-directory\/[^)\s]*\/jobs\/[^)\s]+)\)/g;
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
  job.employment_type = 'full_time';
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
