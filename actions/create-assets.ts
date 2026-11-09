import { defineAction, fail } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { accessibleLaunch, toIso } from "../server/lib/launches.js";

const assetInput = z.object({
  channel: z
    .string()
    .min(1)
    .describe('Channel key, e.g. "x", "product-hunt", "linkedin", "hacker-news", "email", "community"'),
  title: z.string().min(1).describe('Asset title, e.g. "X launch post"'),
  text: z.string().default("").describe("The full copy for this channel"),
  scheduledAt: z
    .string()
    .describe("When this asset goes out, ISO 8601 with offset"),
});

const assetOut = z.object({
  id: z.string(),
  channel: z.string(),
  title: z.string(),
  text: z.string(),
  state: z.enum(["draft", "locked", "approved", "published"]),
  scheduledAt: z.string(),
});

export default defineAction({
  description:
    "Add one or more channel assets (posts, listing, email) to a launch in a single batch. New assets start as drafts. Use this to build the whole launch kit at once.",
  schema: z.object({
    launchId: z.string().describe("Launch id from list-launches or create-launch"),
    assets: z.array(assetInput).min(1).max(20).describe("Assets to add, in board order"),
  }),
  outputSchema: z.object({ assets: z.array(assetOut) }),
  link: ({ args }) => ({
    url: buildDeepLink({
      view: "launch",
      to: `/launch?launch=${encodeURIComponent(args.launchId)}`,
      params: { launchId: args.launchId },
    }),
    label: "Open launch board",
  }),
  run: async (args, ctx) => {
    const ownerEmail =
      ctx?.userEmail ?? fail("Sign in to add assets.", { statusCode: 401 });
    const launch = await accessibleLaunch(args.launchId);
    const db = getDb();
    const existing = await db
      .select({ id: schema.launchAssets.id })
      .from(schema.launchAssets)
      .where(eq(schema.launchAssets.launchId, args.launchId));
    const startPosition = existing.length;
    const rows = args.assets.map((asset, index) => ({
      id: crypto.randomUUID(),
      launchId: args.launchId,
      channel: asset.channel,
      title: asset.title,
      text: asset.text,
      state: "draft" as const,
      comment: null,
      scheduledAt: toIso(asset.scheduledAt, "scheduledAt"),
      position: startPosition + index,
      publishedAt: null,
      ownerEmail,
      orgId: launch.orgId,
    }));
    await db.insert(schema.launchAssets).values(rows);
    return {
      assets: rows.map((row) => ({
        id: row.id,
        channel: row.channel,
        title: row.title,
        text: row.text,
        state: row.state,
        scheduledAt: row.scheduledAt,
      })),
    };
  },
});
