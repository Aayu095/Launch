import { defineAction, fail } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { toIso } from "../server/lib/launches.js";

export default defineAction({
  description:
    "Create a launch (a product release on the Launch runway board) with its name, one-line pitch, audience, and launch date-time.",
  schema: z.object({
    productName: z.string().min(1).describe('Product name, e.g. "Northstar"'),
    oneLiner: z
      .string()
      .min(1)
      .describe('One-line pitch, e.g. "An AI assistant for freelancers"'),
    audience: z
      .string()
      .default("")
      .describe('Who the launch is for, e.g. "freelancers"; may be empty'),
    launchAt: z
      .string()
      .describe("Launch date-time, ISO 8601 with offset, e.g. 2026-11-04T09:00:00+05:30"),
  }),
  outputSchema: z.object({
    id: z.string(),
    productName: z.string(),
    oneLiner: z.string(),
    audience: z.string(),
    launchAt: z.string(),
  }),
  link: ({ result }) => ({
    url: buildDeepLink({
      view: "launch",
      to: `/launch?launch=${encodeURIComponent(result.id)}`,
      params: { launchId: result.id },
    }),
    label: `Open ${result.productName} launch board`,
  }),
  run: async (args, ctx) => {
    const ownerEmail =
      ctx?.userEmail ?? fail("Sign in to create a launch.", { statusCode: 401 });
    const orgId = ctx?.orgId ?? null;
    const launch = {
      id: crypto.randomUUID(),
      productName: args.productName,
      oneLiner: args.oneLiner,
      audience: args.audience,
      launchAt: toIso(args.launchAt, "launchAt"),
      ownerEmail,
      orgId,
      visibility: orgId ? ("org" as const) : ("private" as const),
    };
    await getDb().insert(schema.launches).values(launch);
    return {
      id: launch.id,
      productName: launch.productName,
      oneLiner: launch.oneLiner,
      audience: launch.audience,
      launchAt: launch.launchAt,
    };
  },
});
