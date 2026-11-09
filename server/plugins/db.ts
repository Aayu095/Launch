import { runMigrations } from "@agent-native/core/db";

export default runMigrations(
  [
    {
      version: 1,
      name: "launches-and-assets",
      sql: `CREATE TABLE IF NOT EXISTS launches (
  id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT '',
  launch_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (now()),
  owner_email TEXT NOT NULL DEFAULT 'local@localhost',
  org_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'private'
);
CREATE TABLE IF NOT EXISTS launch_shares (
  id TEXT PRIMARY KEY,
  resource_id TEXT NOT NULL,
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (now()),
  notified_at TEXT
);
CREATE TABLE IF NOT EXISTS launch_assets (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL REFERENCES launches(id),
  channel TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'locked', 'approved', 'published')),
  comment TEXT,
  scheduled_at TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  published_at TEXT,
  owner_email TEXT NOT NULL,
  org_id TEXT,
  created_at TEXT NOT NULL DEFAULT (now())
);
CREATE INDEX IF NOT EXISTS launches_owner_org_idx ON launches (owner_email, org_id, created_at);
CREATE INDEX IF NOT EXISTS launch_shares_resource_idx ON launch_shares (resource_id, principal_type, principal_id);
CREATE INDEX IF NOT EXISTS launch_assets_launch_idx ON launch_assets (launch_id, scheduled_at, position);
CREATE INDEX IF NOT EXISTS launch_assets_org_launch_idx ON launch_assets (org_id, launch_id)`,
    },
    {
      version: 2,
      name: "assets-post-result",
      sql: `ALTER TABLE launch_assets ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE launch_assets ADD COLUMN IF NOT EXISTS post_error TEXT`,
    },
  ],
  { table: "launch_app_migrations" },
);
