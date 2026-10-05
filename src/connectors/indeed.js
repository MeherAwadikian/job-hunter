import { normalizedJobSkeleton, RateLimiter } from './base.js';

// ⚠️ NOT a documented public API. This hits Indeed's internal mobile-app
// GraphQL endpoint using a hardcoded API key reverse-engineered from
// Indeed's own iOS app, sourced from the open-source `ts-jobspy`/`JobSpy`
// projects (where the same key is openly published). This is materially
// different from every other connector in this system, which all use
// genuinely public endpoints or Firecrawl on normal public web pages.
// Built only after explicit user sign-off on 2026-10-05, given this is
// closer to "scraping an undocumented internal API" than "using a public
// API" — see docs/platforms/indeed.md for the full tradeoff writeup.
// Indeed can revoke/rotate this key at any time with no notice.
export const platform = 'indeed';
export const method = 'undocumented_internal_api';

const API_URL = 'https://apis.indeed.com/graphql';
const API_HEADERS = {
  Host: 'apis.indeed.com',
  'content-type': 'application/json',
  'indeed-api-key': '161092c2017b5bbab13edb12461a62d5a833871e7cad6d9d475304573de67ac8',
  accept: 'application/json',
  'indeed-locale': 'en-US',
  'accept-language': 'en-US,en;q=0.9',
  'user-agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Indeed App 193.1',
  'indeed-app-info': 'appv=193.1; appid=com.indeed.jobsearch; osv=16.6.1; os=ios; dtype=phone',
  'indeed-co': 'US',
};

const SEARCH_TERM = 'AI automation';
const RESULTS_WANTED = 30;
const limiter = new RateLimiter({ minIntervalMs: 1500 });

const QUERY = `
  query GetJobData {
    jobSearch(
      what: ${JSON.stringify(SEARCH_TERM)}
      location: {where: "Remote", radius: 50, radiusUnit: MILES}
      limit: ${RESULTS_WANTED}
      sort: RELEVANCE
    ) {
      pageInfo { nextCursor }
      results {
        job {
          key
          title
          datePublished
          description { html }
          location { countryCode admin1Code city formatted { long } }
          employer { name relativeCompanyPageUrl }
          attributes { key label }
          recruit { viewJobUrl }
        }
      }
    }
  }
`;

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function discover() {
  await limiter.wait();
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: API_HEADERS,
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('HTTP 403 — the embedded indeed-api-key has likely been rotated/revoked. This connector needs a refreshed key from an up-to-date fork of ts-jobspy/JobSpy, not a code fix.');
    }
    throw new Error(`Indeed internal API error ${res.status}`);
  }
  const data = await res.json();
  const results = data?.data?.jobSearch?.results;
  if (!Array.isArray(results)) {
    throw new Error('Indeed API response missing jobSearch.results (API shape may have changed)');
  }
  return results.map((r) => r.job).filter(Boolean);
}

export function normalize(raw) {
  const job = normalizedJobSkeleton(platform);
  job.source_url = raw.recruit?.viewJobUrl || `https://www.indeed.com/viewjob?jk=${raw.key}`;
  job.external_id = raw.key;
  job.title = raw.title || '';
  job.company = raw.employer?.name || '';
  job.description = stripHtml(raw.description?.html);
  job.location = raw.location?.formatted?.long || raw.location?.city || '';
  job.remote = (raw.attributes || []).some((a) => /remote/i.test(a.label || ''));
  job.posted_at = raw.datePublished ? new Date(raw.datePublished).toISOString() : null;
  job.application_url = raw.recruit?.viewJobUrl || job.source_url;
  job.raw_source = raw;
  return job;
}
