import { defineAction, fail } from "@agent-native/core/action";
import { buildDeepLink } from "@agent-native/core/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "../server/db/index.js";
import { accessibleLaunch, toIso } from "../server/lib/launches.js";

export default defineAction({
  description:
    "Update one launch asset: its copy, title, state (draft, locked, approved), comment, or scheduled time. This is the single edit action used by both the board UI and the agent. A locked asset's text cannot change (fails with asset_locked) until it is unlocked by setting state back to draft. Agent callers cannot change a locked asset at all — not even by unlocking it; only the user can unlock, on the board. Published assets cannot be edited.",
  schema: z.object({
    id: z.string().describe("Asset id from list-assets"),
    text: z.string().optional().describe("New copy; omit to leave unchanged"),
    title: z.string().min(1).optional().describe("New title; omit to leave unchanged"),
    state: z
      .enum(["draft", "locked", "approved"])
      .optional()
      .describe('New state: "draft", "locked", or "approved"; omit to leave unchanged. Publishing is a separate action.'),
    comment: z
      .string()
      .nullable()
      .optional()
      .describe("Reviewer/agent note pinned on the asset; null clears it; omit to leave unchanged"),
    scheduledAt: z
      .string()
      .optional()
      .describe("New scheduled time, ISO 8601 with offset; omit to leave unchanged"),
  }),
  outputSchema: z.object({
    id: z.string(),
    channel: z.string(),
    title: z.string(),
    text: z.string(),
    state: z.enum(["draft", "locked", "approved", "published"]),
    comment: z.string().nullable(),
    scheduledAt: z.string(),
  }),
  link: ({ result }) => ({
    url: buildDeepLink({
      view: "launch",
      to: "/launch",
      params: { assetId: result.id },
    }),
    label: "Open launch board",
  }),
  run: async (args, ctx) => {
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
      fail("This asset is already published and can no longer be edited.", {
        errorCode: "already_published",
        statusCode: 409,
      });
    }
    // A locked asset is final for agent callers: they cannot edit it, and
    // they cannot unlock it either — unlocking is the user's own decision,
    // made on the board. Without this check an agent could route around
    // the lock by unlocking, editing, and re-locking in separate calls
    // (observed live on 2026-11-04: the agent updated a locked X post
    // exactly that way while the text-only guard below held).
    const agentCaller =
      ctx?.caller === "tool" ||
      ctx?.caller === "a2a" ||
      ctx?.caller === "mcp" ||
      ctx?.caller === "webmcp" ||
      ctx?.caller === "mcp-widget-write" ||
      ctx?.caller === "automation";
    if (current.state === "locked" && agentCaller) {
      fail(
        "This asset is locked, so it is final. Agents cannot change a locked asset or unlock it; only the user can unlock it on the board.",
        { errorCode: "asset_locked", statusCode: 409 },
      );
    }
    const textChanges = args.text !== undefined && args.text !== current.text;
    const staysLocked =
      current.state === "locked" && (args.state === undefined || args.state === "locked");
    if (textChanges && staysLocked) {
      fail(
        "This asset is locked, so its text is final. Unlock it (set state to draft) before changing the text.",
        { errorCode: "asset_locked", statusCode: 409 },
      );
    }

    const patch: Partial<typeof current> = {};
    if (args.text !== undefined) patch.text = args.text;
    if (args.title !== undefined) patch.title = args.title;
    if (args.state !== undefined) patch.state = args.state;
    if (args.comment !== undefined) patch.comment = args.comment;
    if (args.scheduledAt !== undefined)
      patch.scheduledAt = toIso(args.scheduledAt, "scheduledAt");

    const [updated] = await getDb()
      .update(a)
      .set(patch)
      .where(and(eq(a.id, args.id), eq(a.state, current.state)))
      .returning({
        id: a.id,
        channel: a.channel,
        title: a.title,
        text: a.text,
        state: a.state,
        comment: a.comment,
        scheduledAt: a.scheduledAt,
      });
    if (!updated) {
      fail("The asset changed while you were editing it. Reload and try again.", {
        errorCode: "conflict",
        statusCode: 409,
      });
    }
    return updated!;
  },
});
