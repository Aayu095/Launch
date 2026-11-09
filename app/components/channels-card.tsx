import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Channels — post for real. The user-facing side of the posting
 * bridge: two buttons, "Connect X" and "Connect LinkedIn". A click
 * asks our server for a hosted OAuth link (Composio, behind the
 * scenes), the user approves on the channel's own page, and lands
 * back here; this card then registers the user's channel session
 * with the framework as their "Launch channels" MCP server, so the
 * agent can post for real — always behind the approval gate.
 */

const MONO = "font-tech";
const SERVER_NAME = "Launch channels";

type Toolkit = "twitter" | "linkedin";
type ConnStatus = {
  configured: boolean;
  connected: Record<Toolkit, boolean>;
};

const CHANNELS: { id: Toolkit; label: string; short: string }[] = [
  { id: "twitter", label: "X (Twitter)", short: "X" },
  { id: "linkedin", label: "LinkedIn", short: "IN" },
];

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { credentials: "include", ...init });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.statusMessage ?? data?.error ?? `http_${res.status}`);
  }
  return data;
}

function serverListOf(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.servers)) return data.servers;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function ChannelsCard() {
  const [status, setStatus] = useState<ConnStatus | null>(null);
  const [registered, setRegistered] = useState(false);
  const [phase, setPhase] = useState<"idle" | "linking" | "connecting">("idle");
  const [error, setError] = useState<string | null>(null);
  const finalizeTried = useRef(false);

  const load = useCallback(async () => {
    const [conn, servers] = await Promise.all([
      fetchJson("/api/connections/status"),
      fetchJson("/_agent-native/mcp/servers").catch(() => null),
    ]);
    setStatus(conn);
    const ours = serverListOf(servers).find((s) => s?.name === SERVER_NAME);
    setRegistered(Boolean(ours));
    return { conn, ours };
  }, []);

  const finalize = useCallback(async () => {
    setPhase("linking");
    setError(null);
    try {
      const session = await fetchJson("/api/connections/session", {
        method: "POST",
      });
      const servers = await fetchJson("/_agent-native/mcp/servers").catch(
        () => null,
      );
      const ours = serverListOf(servers).find((s) => s?.name === SERVER_NAME);
      if (ours?.id) {
        await fetchJson(
          `/_agent-native/mcp/servers/${encodeURIComponent(ours.id)}?scope=user`,
          { method: "DELETE" },
        ).catch(() => null);
      }
      await fetchJson("/_agent-native/mcp/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "user",
          name: SERVER_NAME,
          url: session.url,
          headers: session.headers,
          description:
            "Launch's channel posting bridge — X and LinkedIn, via the user's own connected accounts.",
        }),
      });
      setRegistered(true);
    } catch {
      setError(
        "Your channel connected, but linking it to the agent hit a snag. Reload this page to retry.",
      );
    } finally {
      setPhase("idle");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { conn, ours } = await load();
        if (cancelled) return;
        const anyConnected = conn.connected.twitter || conn.connected.linkedin;
        const returned = new URLSearchParams(window.location.search).has(
          "connected",
        );
        if (
          conn.configured &&
          anyConnected &&
          (!ours || returned) &&
          !finalizeTried.current
        ) {
          finalizeTried.current = true;
          await finalize();
        }
      } catch {
        if (!cancelled) {
          setError("Could not check your channels just now.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load, finalize]);

  const connect = async (toolkit: Toolkit) => {
    setPhase("connecting");
    setError(null);
    try {
      const { redirectUrl } = await fetchJson(
        `/api/connections/link?toolkit=${toolkit}`,
      );
      window.location.href = redirectUrl;
    } catch (err) {
      setPhase("idle");
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Could not start the connection. Try again in a moment.",
      );
    }
  };

  const anyConnected =
    status?.connected.twitter || status?.connected.linkedin;

  return (
    <div className="glass-panel mt-3 rounded-[1.25rem] px-5 py-4">
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <div className="min-w-0 flex-1">
          <p className={`${MONO} text-[10px] tracking-[0.18em] text-orange-600`}>
            CHANNELS — POST FOR REAL
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Connect your accounts once, and on launch day the agent posts to
            them for real —{" "}
            <span className="font-semibold text-foreground">
              never without your approval
            </span>
            . The live link of every post lands back on its board card.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {CHANNELS.map((c) => {
            const isConnected = status?.connected[c.id];
            return (
              <span key={c.id} className="flex items-center gap-2">
                <span
                  className={`${MONO} text-[10px] tracking-[0.14em] text-muted-foreground`}
                >
                  {c.label}
                </span>
                {status === null ? (
                  <span className="text-[12px] text-muted-foreground">…</span>
                ) : !status.configured ? (
                  <span
                    className={`${MONO} rounded-full border border-border px-2.5 py-1 text-[9.5px] tracking-[0.12em] text-muted-foreground`}
                  >
                    NOT SWITCHED ON
                  </span>
                ) : isConnected ? (
                  <span
                    className={`${MONO} rounded-full border border-emerald-600/25 bg-emerald-500/10 px-2.5 py-1 text-[9.5px] tracking-[0.12em] text-emerald-700 dark:text-emerald-400`}
                  >
                    ● CONNECTED
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={phase !== "idle"}
                    onClick={() => connect(c.id)}
                    className="rounded-full bg-foreground px-3.5 py-1.5 text-[12px] font-semibold text-background transition hover:opacity-85 disabled:opacity-50"
                  >
                    Connect {c.short}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      </div>
      {status && !status.configured ? (
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          Real posting isn't switched on for this workspace yet — your board
          still tracks every post, and channel posting turns on as soon as the
          workspace owner finishes a one-time setup.
        </p>
      ) : null}
      {phase === "linking" ? (
        <p className={`${MONO} mt-2 text-[10.5px] tracking-[0.08em] text-muted-foreground`}>
          LINKING YOUR CHANNELS TO THE AGENT…
        </p>
      ) : null}
      {status?.configured && anyConnected && registered && phase === "idle" ? (
        <p className={`${MONO} mt-2 text-[10.5px] tracking-[0.08em] text-emerald-700 dark:text-emerald-400`}>
          READY — THE AGENT CAN POST TO YOUR CONNECTED CHANNELS, WITH YOUR
          APPROVAL FIRST.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-[12px] leading-relaxed text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
