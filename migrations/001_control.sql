-- Milestone 1: a single transactional aggregate is the authoritative ledger.
-- Row locking covers claims, interactions, session revocation, STOP and receipts.
-- JSON schema is versioned by the immutable DEMO version and domain types.
CREATE TABLE IF NOT EXISTS control_state (
 id smallint PRIMARY KEY CHECK (id = 1),
 revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
 data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
-- No public/player database access. Only the server database role may read this ledger.
REVOKE ALL ON control_state FROM PUBLIC;
ALTER TABLE control_state ENABLE ROW LEVEL SECURITY;
-- No browser-facing policies. The application connects using the table-owner server role.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
  EXECUTE 'REVOKE ALL ON control_state FROM anon';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
  EXECUTE 'REVOKE ALL ON control_state FROM authenticated';
 END IF;
END $$;
