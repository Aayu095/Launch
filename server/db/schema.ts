import { sql } from "drizzle-orm";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import {
  createSharesTable,
  ownableColumns,
} from "@agent-native/core/db/schema";

export const launches = pgTable("launches", {
  id: text("id").primaryKey(),
  productName: text("product_name").notNull(),
  oneLiner: text("one_liner").notNull(),
  audience: text("audience").notNull().default(""),
  launchAt: text("launch_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
  ...ownableColumns(), // owner_email, org_id, visibility
});
export const launchShares = createSharesTable("launch_shares");

// One channel asset (an X post, the Product Hunt listing, the launch email…).
// state machine: draft -> locked | approved -> published.
// A locked asset's text cannot change until it is unlocked back to draft.
export const launchAssets = pgTable("launch_assets", {
  id: text("id").primaryKey(),
  launchId: text("launch_id").notNull(),
  channel: text("channel").notNull(),
  title: text("title").notNull(),
  text: text("text").notNull().default(""),
  state: text("state", {
    enum: ["draft", "locked", "approved", "published"],
  })
    .notNull()
    .default("draft"),
  comment: text("comment"),
  scheduledAt: text("scheduled_at").notNull(),
  position: integer("position").notNull().default(0),
  publishedAt: text("published_at"),
  // The real-world outcome of a publish: the live post's URL once the
  // channel tool has actually posted it, or the error it returned.
  liveUrl: text("live_url"),
  postError: text("post_error"),
  ownerEmail: text("owner_email").notNull(),
  orgId: text("org_id"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()`),
});
