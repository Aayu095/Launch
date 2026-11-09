import { createHash } from "node:crypto";
import { resolveCredential } from "@agent-native/core/credentials";

/**
 * Composio is Launch's behind-the-scenes posting bridge. The product
 * holds ONE Composio project; its API key lives in the app's own
 * credential store (Settings → custom keys, name COMPOSIO_API_KEY),
 * saved by the workspace owner — never in env, never in chat. End
 * users never see Composio's dashboard: they click "Connect X" in
 * Launch, approve on the channel's own OAuth page (via a Composio
 * Connect Link), and land back in Launch. This module is the small
 * server-side client for that flow: auth configs (Composio-managed
 * OAuth), connect links, connected-account status, and the per-user
 * Tool Router session whose MCP URL the client registers with the
 * framework (POST /_agent-native/mcp/servers) so the agent gains the
 * channel posting tools.
 */

const BASE = "https://backend.composio.dev/api/v3.1";
const KEY_NAME = "COMPOSIO_API_KEY";
export const CHANNEL_TOOLKITS = ["twitter", "linkedin"] as const;
export type ChannelToolkit = (typeof CHANNEL_TOOLKITS)[number];

export interface CallerContext {
  userEmail: string;
  orgId?: string | null;
}

async function apiKey(ctx: CallerContext): Promise<string> {
  const key = await resolveCredential(KEY_NAME, {
    userEmail: ctx.userEmail,
    orgId: ctx.orgId ?? null,
  });
  if (!key) throw new Error("composio_not_configured");
  return key;
}

export async function composioConfigured(ctx: CallerContext): Promise<boolean> {
  try {
    const key = await resolveCredential(KEY_NAME, {
      userEmail: ctx.userEmail,
      orgId: ctx.orgId ?? null,
    });
    return Boolean(key);
  } catch {
    return false;
  }
}

/** Stable, non-reversible Composio user id for a Launch account. */
export function composioUserId(email: string): string {
  const hash = createHash("sha256").update(email.toLowerCase()).digest("hex");
  return `launch_${hash.slice(0, 32)}`;
}

async function composioFetch(
  ctx: CallerContext,
  path: string,
  init: RequestInit = {},
): Promise<any> {
  const key = await apiKey(ctx);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const message =
        data?.error?.message ?? data?.message ?? `composio_http_${res.status}`;
      throw new Error(String(message).slice(0, 300));
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function itemsOf(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  return [];
}

function toolkitSlugOf(item: any): string | null {
  return (
    item?.toolkit?.slug ??
    item?.toolkit_slug ??
    item?.toolkitSlug ??
    item?.app_name ??
    item?.appName ??
    null
  );
}

const authConfigCache = new Map<string, string>();

async function credential(ctx: CallerContext, name: string) {
  return resolveCredential(name, {
    userEmail: ctx.userEmail,
    orgId: ctx.orgId ?? null,
  });
}

/**
 * Twitter/X has no Composio-managed credentials (X requires every
 * product to bring its own developer app), so for twitter we create
 * a custom auth config from the workspace's own X app keys, saved in
 * the app credential store as TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET
 * (TWITTER_BEARER_TOKEN optional). Other toolkits use managed auth.
 */
async function createAuthConfig(
  ctx: CallerContext,
  slug: ChannelToolkit,
): Promise<string> {
  let authConfig: Record<string, unknown>;
  if (slug === "twitter") {
    const clientId = await credential(ctx, "TWITTER_CLIENT_ID");
    const clientSecret = await credential(ctx, "TWITTER_CLIENT_SECRET");
    if (!clientId || !clientSecret) throw new Error("x_app_keys_missing");
    const bearerToken = await credential(ctx, "TWITTER_BEARER_TOKEN");
    authConfig = {
      type: "use_custom_auth",
      authScheme: "OAUTH2",
      credentials: {
        client_id: clientId,
        client_secret: clientSecret,
        ...(bearerToken ? { bearer_token: bearerToken } : {}),
        oauth_redirect_uri:
          "https://backend.composio.dev/api/v3.1/toolkits/auth/callback",
        scopes: ["tweet.read", "tweet.write", "users.read", "offline.access"],
      },
    };
  } else {
    authConfig = { type: "use_composio_managed_auth" };
  }
  const created = await composioFetch(ctx, "/auth_configs", {
    method: "POST",
    body: JSON.stringify({ toolkit: { slug }, auth_config: authConfig }),
  });
  const id: string | undefined =
    created?.id ?? created?.auth_config?.id ?? created?.data?.id;
  if (!id) throw new Error("composio_auth_config_failed");
  return id;
}

/** Find (managed first, then any) or create the auth config. */
export async function getAuthConfigId(
  ctx: CallerContext,
  slug: ChannelToolkit,
): Promise<string> {
  const cached = authConfigCache.get(slug);
  if (cached) return cached;
  const list = await composioFetch(ctx, "/auth_configs?limit=100");
  const forSlug = itemsOf(list).filter((c: any) => toolkitSlugOf(c) === slug);
  const found =
    forSlug.find((c: any) => c?.is_composio_managed !== false) ?? forSlug[0];
  const id: string =
    found?.id ?? found?.auth_config?.id ?? (await createAuthConfig(ctx, slug));
  authConfigCache.set(slug, id);
  return id;
}

/** Hosted OAuth link for one user + toolkit. Returns the redirect URL. */
export async function createConnectLink(
  ctx: CallerContext,
  userId: string,
  slug: ChannelToolkit,
  callbackUrl: string,
): Promise<string> {
  const authConfigId = await getAuthConfigId(ctx, slug);
  const data = await composioFetch(ctx, "/connected_accounts/link", {
    method: "POST",
    body: JSON.stringify({
      auth_config_id: authConfigId,
      user_id: userId,
      callback_url: callbackUrl,
    }),
  });
  const redirectUrl: string | undefined =
    data?.redirect_url ??
    data?.redirectUrl ??
    data?.connection_request?.redirectUrl ??
    data?.connectionRequest?.redirectUrl;
  if (
    !redirectUrl ||
    !redirectUrl.startsWith("https://") ||
    !redirectUrl.includes("composio.dev")
  ) {
    throw new Error("composio_link_invalid");
  }
  return redirectUrl;
}

/** Which of the channel toolkits this user has actively connected. */
export async function listChannelConnections(
  ctx: CallerContext,
  userId: string,
): Promise<Record<ChannelToolkit, boolean>> {
  const data = await composioFetch(
    ctx,
    `/connected_accounts?limit=50&user_ids=${encodeURIComponent(userId)}`,
  );
  const result: Record<ChannelToolkit, boolean> = {
    twitter: false,
    linkedin: false,
  };
  for (const account of itemsOf(data)) {
    const slug = toolkitSlugOf(account);
    const status = String(account?.status ?? "").toUpperCase();
    if (
      (slug === "twitter" || slug === "linkedin") &&
      (status === "ACTIVE" || status === "CONNECTED")
    ) {
      result[slug] = true;
    }
  }
  return result;
}

/**
 * Create the user's Tool Router session (both channel toolkits) and
 * return the MCP endpoint + headers for the client to register with
 * the framework. Sessions persist at Composio; a fresh one is created
 * per finalize and the client replaces its previous registration.
 */
export async function createChannelSession(
  ctx: CallerContext,
  userId: string,
): Promise<{ url: string; headers: Record<string, string> }> {
  const data = await composioFetch(ctx, "/tool_router/session", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      toolkits: [...CHANNEL_TOOLKITS],
    }),
  });
  const mcp = data?.mcp ?? data?.data?.mcp ?? {};
  const url: string | undefined =
    mcp?.url ?? data?.mcp_url ?? data?.data?.mcp_url;
  if (!url || !url.startsWith("https://")) {
    throw new Error("composio_session_invalid");
  }
  const headers: Record<string, string> = {
    ...(mcp?.headers ?? {}),
    "x-api-key": await apiKey(ctx),
  };
  return { url, headers };
}
