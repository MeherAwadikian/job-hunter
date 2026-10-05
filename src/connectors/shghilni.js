import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API/RSS. Listing page is client-rendered (confirmed empty via
// direct curl 2026-10-05), so uses Firecrawl. Each card's markdown block is
// "Category\n\n**Title**\n\nBudget\n\nREMOTE|location\n\nskills\n\nposted"
// linked to /en/j/<id>/<slug>.
export const platform = 'shghilni';
export const method = 'firecrawl';
const LISTING_URL = 'https://shghilni.com/en/jobs';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  const linkRe = /\[([^\]]{4,250})\]\((https?:\/\/shghilni\.com\/en\/j\/[^)]+)\)/g;
  const items = [];
  let m;
  while ((m = linkRe.exec(markdown)) && items.length < MAX_LISTINGS) {
    const [, block, url] = m;
    const parts = block.split(/\\+\s*\n\\+\s*\n|\\+\n/).map((p) => p.trim()).filter(Boolean);
    const titleMatch = block.match(/\*\*([^*]{2,150})\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : (parts[0] || '').trim();
    const remote = /REMOTE/i.test(block);
    items.push({ url, title, remote, raw: parts });
  }
  return items;
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url;
  job.external_id = raw.url;
  job.title = raw.title;
  job.location = raw.remote ? 'Remote' : 'Lebanon';
  job.remote = raw.remote;
  job.employment_type = 'freelance';
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
