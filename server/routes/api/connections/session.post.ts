import { createError, defineEventHandler } from "h3";
import { getSession } from "@agent-native/core/server";
import {
  composioUserId,
  createChannelSession,
  type CallerContext,
} from "../../../lib/composio";

/**
 * Finalize after a channel connects: create the user's Tool Router
 * session and hand its MCP endpoint to the client, which registers it
 * with the framework as the user's "Launch channels" MCP server.
 */
export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  if (!session?.email) {
    throw createError({ statusCode: 401, statusMessage: "Sign in required" });
  }
  const ctx: CallerContext = {
    userEmail: session.email,
    orgId: session.orgId ?? null,
  };
  try {
    const { url, headers } = await createChannelSession(
      ctx,
      composioUserId(session.email),
    );
    return { url, headers };
  } catch (err) {
    if (err instanceof Error && err.message === "composio_not_configured") {
      throw createError({
        statusCode: 503,
        statusMessage: "Channel posting is not switched on yet",
      });
    }
    const detail = err instanceof Error ? err.message : "unknown error";
    console.error(`[connections/session] failed: ${detail}`);
    throw createError({
      statusCode: 502,
      statusMessage: `Could not prepare channel posting (${detail.slice(0, 160)})`,
    });
  }
});
