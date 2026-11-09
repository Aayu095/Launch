import { createError, defineEventHandler } from "h3";
import { getSession } from "@agent-native/core/server";
import {
  composioConfigured,
  composioUserId,
  listChannelConnections,
  type CallerContext,
} from "../../../lib/composio";

/** Channel connection state for the signed-in user (Composio side). */
export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  if (!session?.email) {
    throw createError({ statusCode: 401, statusMessage: "Sign in required" });
  }
  const ctx: CallerContext = {
    userEmail: session.email,
    orgId: session.orgId ?? null,
  };
  if (!(await composioConfigured(ctx))) {
    return { configured: false, connected: { twitter: false, linkedin: false } };
  }
  try {
    const connected = await listChannelConnections(
      ctx,
      composioUserId(session.email),
    );
    return { configured: true, connected };
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: "Channel status unavailable",
    });
  }
});
