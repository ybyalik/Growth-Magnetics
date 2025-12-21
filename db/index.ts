import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "marketplace.db");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firebase_uid TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      display_name TEXT,
      photo_url TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      credits INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      domain TEXT NOT NULL UNIQUE,
      industry TEXT,
      domain_rating INTEGER,
      traffic INTEGER,
      quality_tier TEXT CHECK(quality_tier IN ('bronze', 'silver', 'gold', 'platinum')),
      credit_value INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'disabled')),
      admin_notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      target_url TEXT NOT NULL,
      target_keyword TEXT NOT NULL,
      link_type TEXT NOT NULL CHECK(link_type IN ('hyperlink', 'brand_mention')),
      placement_format TEXT NOT NULL CHECK(placement_format IN ('guest_post', 'niche_edit')),
      industry TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      filled_slots INTEGER NOT NULL DEFAULT 0,
      credit_reward INTEGER NOT NULL,
      publisher_notes TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
      publisher_id INTEGER REFERENCES users(id),
      publisher_asset_id INTEGER REFERENCES assets(id),
      proof_url TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'reserved', 'submitted', 'approved', 'rejected')),
      reserved_at INTEGER,
      submitted_at INTEGER,
      reviewed_at INTEGER,
      admin_notes TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('earn', 'spend', 'admin_add', 'admin_remove', 'refund')),
      reference_type TEXT CHECK(reference_type IN ('campaign', 'slot', 'manual')),
      reference_id INTEGER,
      description TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_id);
    CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_slots_campaign ON slots(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_slots_publisher ON slots(publisher_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_user_id);
  `);
}

export { schema };
