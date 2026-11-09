import { defineAction, fail } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { accessibleLaunch } from "../server/lib/launches.js";

export default defineAction({
  description:
    "Record the real-world outcome of publishing an asset, AFTER publish-asset succeeded and the channel's posting tool actually ran: pass liveUrl with the live post's URL on success, or error with what the channel returned on failure. Only valid on a published asset. This never changes the asset's text or state — it attaches the proof (or the failure) that the Day Feed shows. Product Hunt and Hacker News have no posting API: never invent a URL for them; record an error like 'prepared — no posting API, ready to submit manually' only when that is the honest outcome.",
  schema: z
    .object({
      id: z.string().describe("Asset id from list-assets"),
      liveUrl: z
        .string()
        .url()
        .optional()
        .describe("The live post's URL, exactly as the channel returned it"),
      error: z
        .string()
        .min(1)
        .optional()
        .describe("The failure the channel tool returned, in plain words"),
    })
    .refine((v) => Boolean(v.liveUrl) !== Boolean(v.error), {
      message: "Pass exactly one of liveUrl or error.",
    }),
  outputSchema: z.object({
    id: z.string(),
    channel: z.string(),
    liveUrl: z.string().nullable(),
    postError: z.string().nullable(),
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
    if (current.state !== "published") {
      fail(
        `Only a published asset can take a post result. This asset is "${current.state}" — publish it first (publish-asset, with the human's approval).`,
        { errorCode: "not_published", statusCode: 409 },
      );
    }
    // A success clears any earlier failure; a failure never erases a live URL
    // that already proves the post went out.
    const patch = args.liveUrl
      ? { liveUrl: args.liveUrl, postError: null }
      : { postError: args.error! };
    const [updated] = await getDb()
      .update(a)
      .set(patch)
      .where(and(eq(a.id, args.id), eq(a.state, "published")))
      .returning({
        id: a.id,
        channel: a.channel,
        liveUrl: a.liveUrl,
        postError: a.postError,
      });
    if (!updated) {
      fail("The asset changed while recording. Reload and try again.", {
        errorCode: "conflict",
        statusCode: 409,
      });
    }
    return updated!;
  },
});
