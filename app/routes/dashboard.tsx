import { Link } from "react-router";
import { useActionQuery } from "@agent-native/core/client/hooks";

import ChannelsCard from "@/components/channels-card";
import { parts, useMyLaunches, useMyRunway, useNow } from "@/lib/runway";

export function meta() {
  return [{ title: "Launch — Your runway" }];
}

const MONO = "font-tech";

const CH_SHORT: Record<string, string> = {
  x: "X",
  "product-hunt": "PH",
  email: "EMAIL",
  linkedin: "IN",
  "hacker-news": "HN",
  community: "COMM",
};

const DOT: Record<string, string> = {
  draft: "bg-zinc-400",
  locked: "bg-orange-500",
  approved: "bg-sky-400",
  published: "bg-emerald-400",
};

function tLabel(scheduledAt: string, launchAt: string): string {
  const diff = Math.round((+new Date(scheduledAt) - +new Date(launchAt)) / 60000);
  if (diff === 0) return "T−0";
  const abs = Math.abs(diff);
  const v = abs >= 60 && abs % 60 === 0 ? `${abs / 60}h` : `${abs}m`;
  return diff < 0 ? `T−${v}` : `T+${v}`;
}

function fmtWhen(launchAt: string): string {
  const d = new Date(launchAt);
  return `${d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}`;
}

/* ── the hero: your next launch, on a dark glass runway ─────── */
function NextLaunchPanel() {
  const runway = useMyRunway();
  const now = useNow();
  const { launch } = runway;

  if (runway.loading) {
    return (
      <div className="glass-panel rounded-[1.5rem] p-6">
        <p className={`${MONO} text-[11px] tracking-[0.16em] text-zinc-400`}>LOADING YOUR RUNWAY…</p>
      </div>
    );
  }

  if (!launch) {
    return (
      <div className="glass-panel rounded-[1.5rem] p-6 sm:p-8">
        <p className={`${MONO} text-[10px] tracking-[0.2em] text-orange-600`}>NO LAUNCH YET</p>
        <h2 className="font-display mt-3 max-w-lg text-2xl font-bold tracking-tight">
          Your countdown, readiness and board will live here.
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-500">
          Tell the agent about your product — what it is, who it's for, and the day. It thinks up
          the posts, prepares all six channels, and runs the day with you. You lock what's final;
          nothing goes live without your approval.
        </p>
        <Link
          to="/chat"
          className="mt-5 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          Start with the agent →
        </Link>
      </div>
    );
  }

  const t = parts(+new Date(launch.launchAt) - now);
  const past = +new Date(launch.launchAt) - now <= 0;
  const stations = [...runway.assets].sort(
    (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt),
  );
  const noKit = runway.total === 0;

  return (
    <div className="glass-panel-dark dot-grid-dark rounded-[1.5rem] p-6 text-zinc-200 sm:p-8">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
        <div className="min-w-0 flex-1">
          <p className={`${MONO} text-[10px] tracking-[0.2em] text-orange-400`}>
            {past ? "LAUNCHED" : "NEXT LAUNCH"} — {fmtWhen(launch.launchAt).toUpperCase()}
          </p>
          <h2 className="font-display mt-2 truncate text-3xl font-bold tracking-tight text-white">
            {launch.productName}
          </h2>
          <p className="mt-1.5 line-clamp-2 max-w-xl text-sm leading-relaxed text-zinc-400">
            {launch.oneLiner}
          </p>

          {noKit ? (
            <>
              <p className={`${MONO} mt-5 inline-block rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[10px] tracking-[0.16em] text-orange-300`}>
                KIT NOT BUILT YET — 0 POSTS PREPARED
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                This board is empty. Tell the agent about the product and it will prepare all six
                channel posts here — then you lock what's final.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  to="/chat"
                  className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Ask the agent to build the kit →
                </Link>
                <Link
                  to={`/launch?launch=${launch.id}`}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                >
                  Open the board
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mt-5 max-w-md">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="dawn-line h-full rounded-full transition-all duration-700"
                    style={{ width: runway.total ? `${(runway.ready / runway.total) * 100}%` : "0%" }}
                  />
                </div>
                <p className={`${MONO} mt-2 text-[10.5px] tracking-[0.12em] text-zinc-400`}>
                  {runway.ready} OF {runway.total} READY · {runway.locked} LOCKED · {runway.live} LIVE
                </p>
              </div>
              <Link
                to={`/launch?launch=${launch.id}`}
                className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
              >
                Continue on the board →
              </Link>
            </>
          )}
        </div>

        {!past ? (
          <div className="flex gap-1.5">
            {[
              [t.d, "DAYS"],
              [t.h, "HRS"],
              [t.m, "MIN"],
              [t.s, "SEC"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-center"
              >
                <span className="font-tech text-xl font-semibold text-white tabular-nums">{v}</span>
                <span className="block font-tech text-[8px] tracking-[0.18em] text-zinc-500">{l}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {stations.length ? (
        <div className="relative mt-9" aria-hidden>
          <div className="dawn-line absolute top-[5px] right-2 left-2 h-[2px] rounded opacity-80" />
          <div className="relative flex justify-between">
            {stations.map((a) => (
              <div key={a.id} className="flex w-14 flex-col items-center">
                <span className={`size-[11px] shrink-0 rounded-full ring-4 ring-[#12100e] ${DOT[a.state] ?? DOT.draft}`} />
                <span className={`${MONO} mt-2 text-[8.5px] tracking-[0.12em] text-zinc-300`}>
                  {CH_SHORT[a.channel] ?? a.channel.toUpperCase()}
                </span>
                <span className={`${MONO} mt-0.5 text-[8.5px] tracking-[0.12em] text-zinc-500`}>
                  {tLabel(a.scheduledAt, launch.launchAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── every launch, as a glass card ──────────────────────────── */
function LaunchCard({ launch }: { launch: { id: string; productName: string; oneLiner: string; launchAt: string } }) {
  const assetsQuery = useActionQuery("list-assets", { launchId: launch.id });
  const assets = assetsQuery.data?.assets ?? [];
  const ready = assets.filter((a) => a.state !== "draft").length;
  const live = assets.filter((a) => a.state === "published").length;
  return (
    <Link
      to={`/launch?launch=${launch.id}`}
      className="glass-panel group rounded-[1.25rem] p-5 transition duration-300 hover:-translate-y-0.5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display truncate text-lg font-semibold tracking-tight group-hover:text-orange-700">
          {launch.productName}
        </h3>
        <span className={`${MONO} shrink-0 text-[10px] tracking-[0.12em] text-zinc-400`}>
          {fmtWhen(launch.launchAt).toUpperCase()}
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">{launch.oneLiner}</p>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-zinc-900/[0.07]">
        <div
          className="dawn-line h-full rounded-full"
          style={{ width: assets.length ? `${(ready / assets.length) * 100}%` : "0%" }}
        />
      </div>
      <p className={`${MONO} mt-2.5 text-[10px] tracking-[0.14em] text-zinc-500`}>
        {assetsQuery.isLoading
          ? "…"
          : assets.length === 0
            ? "NO KIT YET"
            : `${ready} OF ${assets.length} READY${live ? ` · ${live} LIVE` : ""}`}
      </p>
    </Link>
  );
}

/* ── the page ───────────────────────────────────────────────── */
export default function DashboardRoute() {
  const { launches } = useMyLaunches();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className={`${MONO} flex items-center gap-2 text-[10px] tracking-[0.22em] text-zinc-400`}>
            <span className="dawn-line inline-block h-[3px] w-8 rounded-full" />
            LAUNCH — THE RUNWAY
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Your runway</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Every launch you're running — countdown, readiness and the board, in one place.
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-1">
          <Link
            to="/chat"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            + New launch
          </Link>
          <span className={`${MONO} text-[9px] tracking-[0.14em] text-zinc-400`}>
            THE AGENT BUILDS THE KIT WITH YOU
          </span>
        </div>
      </div>

      <div className="mt-6">
        <NextLaunchPanel />
      </div>

      <div className="glass-panel mt-3 flex items-start gap-3 rounded-[1.25rem] px-5 py-4">
        <span className={`${MONO} mt-0.5 shrink-0 text-[10px] tracking-[0.18em] text-orange-600`}>
          ON LAUNCH DAY
        </span>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          This page becomes your <span className="font-semibold text-foreground">Day Feed</span> — what
          went live, what's next, and a rescue from the agent if anything fails. The night before,
          the agent confirms everything is ready. In the evening, your whole day lands here as one
          report. You're not running the day alone.
        </p>
      </div>

      <ChannelsCard />

      {launches.length > 1 ? (
        <>
          <h2 className={`${MONO} mt-10 text-[11px] tracking-[0.2em] text-zinc-400`}>ALL LAUNCHES</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {launches.map((l) => (
              <LaunchCard key={l.id} launch={l} />
            ))}
          </div>
        </>
      ) : null}

      <div className="glass-panel-dark mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[1.25rem] px-5 py-4">
        <span className={`${MONO} shrink-0 text-[10px] tracking-[0.18em] text-orange-400`}>
          PRACTICE RUNWAY
        </span>
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-zinc-400">
          The live sandbox on the website runs these same actions on a throwaway board — safe to
          break before the real day.
        </p>
        <Link
          to="/home#sandbox"
          className="shrink-0 text-[13px] font-semibold text-white underline decoration-orange-500/60 decoration-2 underline-offset-4 transition hover:decoration-orange-400"
        >
          Open the sandbox →
        </Link>
      </div>
    </div>
  );
}
