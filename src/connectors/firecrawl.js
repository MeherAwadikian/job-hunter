// Thin Firecrawl v1 scrape wrapper, shared by HTML-only connectors
// (Daleel Madani, Expertini). Reuses the FIRECRAWL_API_KEY already
// live across Hermes profiles — set it in job apps/.env (see .env.example).

import { fetchWithRetry, RateLimiter } from './base.js';

const limiter = new RateLimiter({ minIntervalMs: 2000 });

export async function firecrawlScrape(url, { formats = ['markdown'] } = {}) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not set. Copy it into job apps/.env (see .env.example).');
  }
  await limiter.wait();
  const res = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, formats }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(`Firecrawl scrape failed for ${url}: ${JSON.stringify(json).slice(0, 300)}`);
  return json.data;
}
