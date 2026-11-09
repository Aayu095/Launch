import { createError, defineEventHandler, getQuery, getRequestURL } from "h3";
import { getSession } from "@agent-native/core/server";
import {
  composioUserId,
  createConnectLink,
  type CallerContext,
  type ChannelToolkit,
} from "../../../lib/composio";

/**
 * Start a channel connection: returns the hosted OAuth URL for the
 * channel (Composio Connect Link). The user approves on the channel's
 * own page and lands back on the dashboard.
 */
export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  if (!session?.email) {
    throw createError({ statusCode: 401, statusMessage: "Sign in required" });
  }
  const toolkit = String(getQuery(event).toolkit ?? "");
  if (toolkit !== "twitter" && toolkit !== "linkedin") {
    throw createError({ statusCode: 400, statusMessage: "Unknown channel" });
  }
  const origin = getRequestURL(event).origin;
  const callbackUrl = `${origin}/dashboard?connected=${toolkit}`;
  const ctx: CallerContext = {
    userEmail: session.email,
    orgId: session.orgId ?? null,
  };
  try {
    const redirectUrl = await createConnectLink(
      ctx,
      composioUserId(session.email),
      toolkit as ChannelToolkit,
      callbackUrl,
    );
    return { redirectUrl };
  } catch (err) {
    if (err instanceof Error && err.message === "composio_not_configured") {
      throw createError({
        statusCode: 503,
        statusMessage: "Channel posting is not switched on yet",
      });
    }
    if (err instanceof Error && err.message === "x_app_keys_missing") {
      throw createError({
        statusCode: 503,
        statusMessage:
          "X needs the workspace's own X app keys first — add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in Settings → API keys, then try again.",
      });
    }
    const detail = err instanceof Error ? err.message : "unknown error";
    console.error(`[connections/link] toolkit=${toolkit} failed: ${detail}`);
    throw createError({
      statusCode: 502,
      statusMessage: `Could not start the connection (${detail.slice(0, 160)})`,
    });
  }
});
