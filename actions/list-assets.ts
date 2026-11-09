import { defineAction } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { accessibleLaunch } from "../server/lib/launches.js";

const assetOut = z.object({
  id: z.string(),
  channel: z.string(),
  title: z.string(),
  text: z.string(),
  state: z.enum(["draft", "locked", "approved", "published"]),
  comment: z.string().nullable(),
  scheduledAt: z.string(),
  publishedAt: z.string().nullable(),
  liveUrl: z.string().nullable(),
  postError: z.string().nullable(),
});

export default defineAction({
  description:
    "List all channel assets on a launch board, in scheduled order. Locked assets are final: their text must not be changed.",
  schema: z.object({
    launchId: z.string().describe("Launch id from list-launches"),
  }),
  http: { method: "GET" },
  readOnly: true,
  outputSchema: z.object({ assets: z.array(assetOut) }),
  link: ({ args }) => ({
    url: buildDeepLink({
      view: "launch",
      to: `/launch?launch=${encodeURIComponent(args.launchId)}`,
      params: { launchId: args.launchId },
    }),
    label: "Open launch board",
  }),
  run: async (args) => {
    await accessibleLaunch(args.launchId);
    const a = schema.launchAssets;
    const rows = await getDb()
      .select({
        id: a.id,
        channel: a.channel,
        title: a.title,
        text: a.text,
        state: a.state,
        comment: a.comment,
        scheduledAt: a.scheduledAt,
        publishedAt: a.publishedAt,
        liveUrl: a.liveUrl,
        postError: a.postError,
      })
      .from(a)
      .where(eq(a.launchId, args.launchId))
      .orderBy(asc(a.scheduledAt), asc(a.position))
      .limit(200);
    return { assets: rows };
  },
});
