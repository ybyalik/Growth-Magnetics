import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  role: text("role").notNull().default("user"),
  credits: integer("credits").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  domain: text("domain").notNull().unique(),
  industry: text("industry"),
  domainRating: integer("domain_rating"),
  traffic: integer("traffic"),
  qualityTier: text("quality_tier"),
  creditValue: integer("credit_value").default(0),
  backlinks: integer("backlinks"),
  referringDomains: integer("referring_domains"),
  brokenBacklinks: integer("broken_backlinks"),
  brokenPages: integer("broken_pages"),
  spamScore: integer("spam_score"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  summary: text("summary"),
  metricsJson: text("metrics_json"),
  metricsFetchedAt: timestamp("metrics_fetched_at"),
  organicTraffic: integer("organic_traffic"),
  paidTraffic: integer("paid_traffic"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  targetUrl: text("target_url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  linkType: text("link_type").notNull(),
  placementFormat: text("placement_format").notNull(),
  industry: text("industry").notNull(),
  quantity: integer("quantity").notNull(),
  filledSlots: integer("filled_slots").notNull().default(0),
  creditReward: integer("credit_reward").notNull(),
  publisherNotes: text("publisher_notes"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  targetUrl: text("target_url"),
  targetKeyword: text("target_keyword"),
  linkType: text("link_type"),
  placementFormat: text("placement_format"),
  creditReward: integer("credit_reward"),
  industry: text("industry"),
  publisherNotes: text("publisher_notes"),
  publisherId: integer("publisher_id").references(() => users.id),
  publisherAssetId: integer("publisher_asset_id").references(() => assets.id),
  proofUrl: text("proof_url"),
  status: text("status").notNull().default("open"),
  reservedAt: timestamp("reserved_at"),
  submittedAt: timestamp("submitted_at"),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),
  verified: boolean("verified").default(false),
  verificationDetails: text("verification_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type Slot = typeof slots.$inferSelect;
export type NewSlot = typeof slots.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
