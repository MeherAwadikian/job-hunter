export function normalizeKey(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Canonical key = normalized title + company. Good enough for cross-platform
// dedup at Tier-1 scale; description-similarity (brief §12 level 5) can be
// added later if false-negatives show up in connector_runs logs.
export function canonicalKey(job) {
  return `${normalizeKey(job.title)}::${normalizeKey(job.company)}`;
}
