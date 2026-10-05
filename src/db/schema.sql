-- job-hunter SQLite schema
-- Raw sqlite3 convention (node:sqlite), no ORM, matches existing Hermes profile patterns.

CREATE TABLE IF NOT EXISTS platforms (
  id            TEXT PRIMARY KEY,         -- e.g. 'remoteok'
  name          TEXT NOT NULL,
  tier          INTEGER NOT NULL,
  method        TEXT NOT NULL,            -- api | feed | html | firecrawl | playwright | chrome
  enabled       INTEGER NOT NULL DEFAULT 1,
  base_url      TEXT,
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS companies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  website       TEXT,
  UNIQUE(normalized_name)
);

CREATE TABLE IF NOT EXISTS jobs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  platform          TEXT NOT NULL REFERENCES platforms(id),
  source_url        TEXT NOT NULL,
  external_id       TEXT,
  title             TEXT NOT NULL,
  company           TEXT,
  company_id        INTEGER REFERENCES companies(id),
  description       TEXT,
  location          TEXT,
  remote            INTEGER DEFAULT 0,
  employment_type   TEXT,
  salary_min        REAL,
  salary_max        REAL,
  currency          TEXT,
  skills            TEXT,              -- JSON array
  experience        TEXT,
  deadline          TEXT,
  posted_at         TEXT,
  application_url   TEXT,
  contact           TEXT,
  raw_source        TEXT,              -- JSON blob of original payload
  discovered_at     TEXT NOT NULL,
  -- dedup / lifecycle
  canonical_key     TEXT NOT NULL,     -- normalized title+company or external id, used for dedup
  first_seen        TEXT NOT NULL,
  last_seen         TEXT NOT NULL,
  source_platforms  TEXT,              -- JSON array of platform ids this job was also seen on
  status            TEXT NOT NULL DEFAULT 'DISCOVERED',
  UNIQUE(platform, external_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_canonical_key ON jobs(canonical_key);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON jobs(platform);

CREATE TABLE IF NOT EXISTS profiles (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  email             TEXT,
  mobile            TEXT,
  location           TEXT,
  languages         TEXT,              -- JSON array
  data              TEXT NOT NULL      -- full JSON candidate profile (skills, angles, preferences)
);

CREATE TABLE IF NOT EXISTS skills (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id        INTEGER NOT NULL REFERENCES profiles(id),
  category          TEXT,              -- e.g. AI/Automation, CCTV/Security, Lab Informatics, Web3/DeFi
  skill             TEXT NOT NULL,
  weight            REAL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS job_scores (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id            INTEGER NOT NULL REFERENCES jobs(id),
  profile_id        INTEGER NOT NULL REFERENCES profiles(id),
  overall_score     REAL,
  skill_match       REAL,
  experience_match  REAL,
  industry_match    REAL,
  location_match    REAL,
  salary_match      REAL,
  remote_match      REAL,
  application_effort REAL,
  grade             TEXT,              -- A+, A, B, C, D
  rationale         TEXT,
  scored_at         TEXT NOT NULL,
  UNIQUE(job_id, profile_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id            INTEGER NOT NULL REFERENCES jobs(id),
  profile_id        INTEGER NOT NULL REFERENCES profiles(id),
  status            TEXT NOT NULL DEFAULT 'WAITING_APPROVAL',
  cv_variant        TEXT,
  cover_letter      TEXT,
  proposal          TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id            INTEGER NOT NULL REFERENCES jobs(id),
  event             TEXT NOT NULL,     -- e.g. STATUS_CHANGE, DUPLICATE_MERGED, SCORED
  detail            TEXT,
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS connector_runs (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  platform          TEXT NOT NULL,
  method            TEXT,
  started_at        TEXT NOT NULL,
  finished_at       TEXT,
  found             INTEGER DEFAULT 0,
  parsed            INTEGER DEFAULT 0,
  rejected          INTEGER DEFAULT 0,
  duplicates        INTEGER DEFAULT 0,
  errors            TEXT,
  success           INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id            INTEGER REFERENCES jobs(id),
  channel           TEXT,              -- telegram | discord | none (pending decision)
  payload           TEXT,
  sent              INTEGER DEFAULT 0,
  created_at        TEXT NOT NULL
);
