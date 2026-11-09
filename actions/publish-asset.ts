import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { accessibleLaunch } from "../server/lib/launches.js";

export default defineAction({
  description:
    "Publish an approved launch asset (mark it live on its channel). Only an asset in state 'approved' can be published; drafts and locked assets fail with not_approved. This is an outward-facing action and always requires a human to approve the specific call.",
  schema: z.object({
    id: z.string().describe("Asset id from list-assets"),
  }),
  needsApproval: true,
  outputSchema: z.object({
    id: z.string(),
    channel: z.string(),
    state: z.literal("published"),
    publishedAt: z.string(),
  }),
  run: async (args) => {
    const a = schema.launchAssets;
    const [asset] = await getDb()
      .select()
      .from(a)
      .where(eq(a.id, args.id))
      .limit(1);
    if (!asset) {
      fail("Asset not found.", { errorCode: "not_found", statusCode: 404 });
    }
    const current = asset!;
    await accessibleLaunch(current.launchId);
    if (current.state === "published") {
      fail("This asset is already published.", {
        errorCode: "already_published",
        statusCode: 409,
      });
    }
    if (current.state !== "approved") {
      fail(
        `Only an approved asset can be published. This asset is "${current.state}" — approve it first.`,
        { errorCode: "not_approved", statusCode: 409 },
      );
    }
    const publishedAt = new Date().toISOString();
    const [updated] = await getDb()
      .update(a)
      .set({ state: "published", publishedAt })
      .where(and(eq(a.id, args.id), eq(a.state, "approved")))
      .returning({ id: a.id, channel: a.channel });
    if (!updated) {
      fail("The asset changed while publishing. Reload and try again.", {
        errorCode: "conflict",
        statusCode: 409,
      });
    }
    return {
      id: updated!.id,
      channel: updated!.channel,
      state: "published" as const,
      publishedAt,
    };
  },
});
