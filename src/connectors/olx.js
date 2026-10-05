import { normalizedJobSkeleton } from './base.js';
import { firecrawlScrape } from './firecrawl.js';

// No public API/RSS (third-party Apify scrapers exist but weren't used).
// Listing page is client-rendered (category sidebar only in raw HTML,
// confirmed via direct curl 2026-10-05 — the request even came back HTTP 202
// with an empty body, a bot-challenge pattern), so uses Firecrawl.
//
// Job card titles ("## Title") in the markdown aren't wrapped in a markdown
// link (Firecrawl's conversion drops the anchor around the card), so this
// pairs ordered "## Title" headings with ordered /ad/...-ID<n>.html links
// from Firecrawl's separate `links` output instead of relying on inline
// markdown links like the other connectors.
export const platform = 'olx';
export const method = 'firecrawl';
const LISTING_URL = 'https://www.olx.com.lb/jobs/jobs-available/';
const MAX_LISTINGS = 30;

export async function discover() {
  const page = await firecrawlScrape(LISTING_URL, { formats: ['markdown', 'links'] });
  const markdown = page.markdown || '';
  const links = (page.links || []).filter((l) => /-ID\d+\.html$/.test(l));

  // "Elite"/"Featured" cards render bare "## Title"; plain "Ads" cards
  // render as a list item wrapping the heading ("- ## Title") — both must
  // be matched or the title/link arrays fall out of sync partway through.
  const titleRe = /^(?:-\s*)?##\s+(.{2,150})$/gm;
  const titles = [];
  let m;
  while ((m = titleRe.exec(markdown)) && titles.length < MAX_LISTINGS) {
    titles.push(m[1].trim());
  }

  const items = [];
  const n = Math.min(titles.length, links.length, MAX_LISTINGS);
  for (let i = 0; i < n; i++) {
    items.push({ title: titles[i], url: links[i] });
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
