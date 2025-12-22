import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "marketplace.db");

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export function initializeDatabase() {
  try {
    sqlite.exec(`
      ALTER TABLE assets ADD COLUMN backlinks INTEGER;
    `);
  } catch (e) {}
  try {
    sqlite.exec(`
      ALTER TABLE assets ADD COLUMN referring_domains INTEGER;
    `);
  } catch (e) {}
  try {
    sqlite.exec(`
      ALTER TABLE assets ADD COLUMN broken_backlinks INTEGER;
    `);
  } catch (e) {}
  try {
    sqlite.exec(`
      ALTER TABLE assets ADD COLUMN broken_pages INTEGER;
    `);
  } catch (e) {}
  try {
    sqlite.exec(`
      ALTER TABLE assets ADD COLUMN spam_score INTEGER;
    `);
  } catch (e) {}
  console.log("Database initialized at:", dbPath);
}

export { schema };
