-- Migration: Create domain_logins table
--
-- Records which domains each user has logged into.
-- Run this migration after deploying infrastructure:
--   psql $DATABASE_URL -f migrations/001_domain_logins.sql

CREATE TABLE IF NOT EXISTS domain_logins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  domain VARCHAR(255) NOT NULL,
  first_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  login_count INTEGER NOT NULL DEFAULT 1,

  -- Each user can only have one record per domain
  CONSTRAINT domain_logins_user_domain_unique UNIQUE (user_id, domain)
);

-- Index for looking up all domains a user has logged into
CREATE INDEX IF NOT EXISTS domain_logins_user_id_idx ON domain_logins(user_id);

-- Index for analytics queries by domain
CREATE INDEX IF NOT EXISTS domain_logins_domain_idx ON domain_logins(domain);
