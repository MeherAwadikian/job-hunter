// Shared connector interface. Every platform connector exports:
//   discover()   -> raw items from the source (API/feed/HTML)
//   normalize(raw) -> normalized job object (see JOB_HUNTER_ARCHITECTURE.md schema)
// deduplicate/score/store are handled centrally by the engine, not per-connector.

export function normalizedJobSkeleton(platform) {
  return {
    platform,
    source_url: '',
    external_id: '',
    title: '',
    company: '',
    description: '',
    location: '',
    remote: false,
    employment_type: '',
    salary_min: null,
    salary_max: null,
    currency: '',
    skills: [],
    experience: '',
    deadline: null,
    posted_at: null,
    application_url: '',
    contact: '',
    raw_source: null,
    discovered_at: new Date().toISOString(),
  };
}

export class RateLimiter {
  constructor({ minIntervalMs = 500 } = {}) {
    this.minIntervalMs = minIntervalMs;
    this.lastCall = 0;
  }
  async wait() {
    const elapsed = Date.now() - this.lastCall;
    if (elapsed < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - elapsed));
    }
    this.lastCall = Date.now();
  }
}

export async function fetchWithRetry(url, opts = {}, { retries = 2, timeoutMs = 15000 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      }
    }
  }
  throw lastErr;
}
