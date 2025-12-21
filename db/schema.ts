import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  photoUrl: text("photo_url"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  credits: integer("credits").notNull().default(0),
  status: text("status", { enum: ["active", "suspended"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  domain: text("domain").notNull().unique(),
  industry: text("industry"),
  domainRating: integer("domain_rating"),
  traffic: integer("traffic"),
  qualityTier: text("quality_tier", { enum: ["bronze", "silver", "gold", "platinum"] }),
  creditValue: integer("credit_value").default(0),
  status: text("status", { enum: ["pending", "approved", "rejected", "disabled"] }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  targetUrl: text("target_url").notNull(),
  targetKeyword: text("target_keyword").notNull(),
  linkType: text("link_type", { enum: ["hyperlink_dofollow", "hyperlink_nofollow", "brand_mention"] }).notNull(),
  placementFormat: text("placement_format", { enum: ["guest_post", "niche_edit"] }).notNull(),
  industry: text("industry").notNull(),
  quantity: integer("quantity").notNull(),
  filledSlots: integer("filled_slots").notNull().default(0),
  creditReward: integer("credit_reward").notNull(),
  publisherNotes: text("publisher_notes"),
  status: text("status", { enum: ["active", "paused", "completed", "cancelled"] }).notNull().default("active"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const slots = sqliteTable("slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  targetUrl: text("target_url"),
  targetKeyword: text("target_keyword"),
  linkType: text("link_type"),
  placementFormat: text("placement_format"),
  publisherId: integer("publisher_id").references(() => users.id),
  publisherAssetId: integer("publisher_asset_id").references(() => assets.id),
  proofUrl: text("proof_url"),
  status: text("status", { enum: ["open", "reserved", "submitted", "approved", "rejected"] }).notNull().default("open"),
  reservedAt: integer("reserved_at", { mode: "timestamp" }),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  adminNotes: text("admin_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type", { enum: ["earn", "spend", "admin_add", "admin_remove", "refund"] }).notNull(),
  referenceType: text("reference_type", { enum: ["campaign", "slot", "manual"] }),
  referenceId: integer("reference_id"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
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
