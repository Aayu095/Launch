import { useEffect, useState } from "react";
import { useActionQuery } from "@agent-native/core/client/hooks";

export const SANDBOX_NAME = "Northstar — Sandbox";

/* ── live clock + countdown parts ───────────────────────────── */
export function useNow(stepMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

export function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return { d: p(d), h: p(h), m: p(m), s: p(sec) };
}

/* ── the signed-in user's own launches (real data) ──────────── */
export function useMyLaunches() {
  const launchesQuery = useActionQuery("list-launches", {});
  const launches = (launchesQuery.data?.launches ?? []).filter(
    (l) => l.productName !== SANDBOX_NAME,
  );
  return { loading: launchesQuery.isLoading, launches };
}

/** The user's next launch (soonest upcoming, else the latest by date) + its board state. */
export function useMyRunway() {
  const { loading, launches } = useMyLaunches();
  const now = Date.now();
  const upcoming = launches
    .filter((l) => +new Date(l.launchAt) > now - 3_600_000)
    .sort((a, b) => +new Date(a.launchAt) - +new Date(b.launchAt));
  const byDateDesc = [...launches].sort(
    (a, b) => +new Date(b.launchAt) - +new Date(a.launchAt),
  );
  const launch = upcoming[0] ?? byDateDesc[0];
  const assetsQuery = useActionQuery(
    "list-assets",
    { launchId: launch?.id ?? "" },
    { enabled: !!launch },
  );
  const assets = assetsQuery.data?.assets ?? [];
  return {
    loading,
    launch,
    assets,
    total: assets.length,
    ready: assets.filter((a) => a.state !== "draft").length,
    locked: assets.filter((a) => a.state === "locked").length,
    live: assets.filter((a) => a.state === "published").length,
  };
}
