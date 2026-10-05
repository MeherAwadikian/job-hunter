import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API/RSS (the only "Furrsati MCP" found is a community connector
// for searching freelancer profiles, not job postings — wrong direction for
// this engine). Listing page is client-rendered (confirmed via direct curl
// 2026-10-05), so uses Firecrawl. Card markdown blocks mirror Shghilni's
// pattern: "Category\n\n**Title**\n\nBudget\n\ndesc...\n\nskills\n\nposter".
export const platform = 'furrsati';
export const method = 'firecrawl';
const LISTING_URL = 'https://furrsati.com/jobs';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL);
  const markdown = page.markdown || '';
  const linkRe = /\[([^\]]{10,600})\]\((https?:\/\/furrsati\.com\/jobs\/[a-f0-9-]{36})\)/g;
  const items = [];
  let m;
  while ((m = linkRe.exec(markdown)) && items.length < MAX_LISTINGS) {
    const [, block, url] = m;
    const titleMatch = block.match(/\*\*([^*]{2,150})\*\*/);
    const budgetMatch = block.match(/\$[\d.,]+\s*[kK]?\s*[–-]\s*\$[\d.,]+\s*[kK]?/);
    if (!titleMatch) continue;
    items.push({ url, title: titleMatch[1].trim(), budget: budgetMatch ? budgetMatch[0] : null });
  }
  return items;
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.url;
  job.external_id = raw.url;
  job.title = raw.title;
  job.location = 'Lebanon';
  job.remote = true;
  job.employment_type = 'freelance';
  job.application_url = raw.url;
  job.raw_source = raw;
  return job;
}
