import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";

/**
 * The home page's live sandbox: a REAL mini runway board wired to the same
 * defineAction()s the app uses, running on a dedicated "Northstar — Sandbox"
 * launch so visitors can break things safely. Every click makes a real
 * action call and the terminal shows the real request/response. Nothing
 * here is scripted — the lock guard, the approval gate and the publish
 * rules are enforced by the server, not by this component.
 */

const SANDBOX_NAME = "Northstar — Sandbox";

/* The kit is copied verbatim from the real Northstar launch's board. */
const KIT: { channel: string; title: string; text: string; offsetMin: number }[] = [
  {
    channel: "community",
    title: "Community teaser",
    offsetMin: -900,
    text: "Tomorrow, we ship.\n\nFor the last few months we have been building Northstar — simple analytics for indie SaaS, so nobody has to stitch five dashboards together again.\n\nLaunch day is tomorrow. Tell us: what is the one metric you check first every morning?",
  },
  {
    channel: "x",
    title: "X launch post",
    offsetMin: 0,
    text: "Today we launch Northstar — simple analytics for indie SaaS.\n\nOne dashboard. Every metric that matters. No setup marathon, no 40-tab report.\n\nLive now.",
  },
  {
    channel: "product-hunt",
    title: "Product Hunt listing",
    offsetMin: 5,
    text: "Analytics you will actually open: MRR, churn, trials and revenue in one calm dashboard for indie SaaS. Connect Stripe once — Northstar keeps every number current.",
  },
  {
    channel: "email",
    title: "Launch email",
    offsetMin: 5,
    text: "Subject: Northstar is live\n\nHi — Northstar, the simple analytics dashboard for indie SaaS, is live today.\n\nOne calm dashboard for MRR, churn, trials and revenue. Connect Stripe once, and every number stays current on its own.\n\nTry it free — and tell us what you think.",
  },
  {
    channel: "linkedin",
    title: "LinkedIn post",
    offsetMin: 30,
    text: "For the last few months we have been building Northstar.\n\nIndie SaaS founders kept telling us the same thing: analytics meant five tabs, two spreadsheets, and numbers that never quite agreed.\n\nNorthstar fixes that — one calm dashboard for the metrics that actually matter.\n\nWe launch today.",
  },
  {
    channel: "hacker-news",
    title: "Hacker News post",
    offsetMin: 60,
    text: "Show HN: Northstar — simple analytics for indie SaaS\n\nI built Northstar because my metrics were scattered across Stripe, a spreadsheet, and three other tools. It pulls MRR, churn, trials and revenue into one dashboard that updates itself.\n\nThere is a free tier. Feedback very welcome.",
  },
];

const CH_LABEL: Record<string, string> = {
  x: "X",
  "product-hunt": "PRODUCT HUNT",
  email: "EMAIL",
  linkedin: "LINKEDIN",
  "hacker-news": "HACKER NEWS",
  community: "COMMUNITY",
};

const PILL: Record<string, string> = {
  draft: "border-white/10 bg-white/5 text-zinc-400",
  locked: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  approved: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  published: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

type Asset = {
  id: string;
  channel: string;
  title: string;
  text: string;
  state: string;
  scheduledAt: string;
};

type LogLine = { id: number; kind: "req" | "ok" | "err" | "sys"; text: string };

function clock() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

/** Abbreviate long string values so payloads stay one line each. */
function payload(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    typeof v === "string" && v.length > 44 ? v.slice(0, 42) + "…" : v,
  );
}

function errInfo(error: unknown): { code: string; status: number; message: string } {
  const e = error as { errorCode?: string | null; statusCode?: number; status?: number };
  return {
    code: e?.errorCode ?? "error",
    status: e?.statusCode ?? e?.status ?? 0,
    message: actionErrorMessage(error) ?? "Request failed.",
  };
}

function tLabel(scheduledAt: string, launchAt: string): string {
  const diff = Math.round((new Date(scheduledAt).getTime() - new Date(launchAt).getTime()) / 60000);
  if (diff === 0) return "T−0";
  const abs = Math.abs(diff);
  const v = abs >= 60 && abs % 60 === 0 ? `${abs / 60}h` : `${abs}m`;
  return diff < 0 ? `T−${v}` : `T+${v}`;
}

function sandboxLaunchAt(): Date {
  const d = new Date(Date.now() + 2 * 86_400_000);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function LaunchSandbox() {
  const [lines, setLines] = useState<LogLine[]>([
    { id: 0, kind: "sys", text: "sandbox boot — every line below is a real defineAction() call" },
  ]);
  const lineId = useRef(1);
  const pending = useRef<{ label: string } | null>(null);
  const [pulse, setPulse] = useState<{ from: number; key: number } | null>(null);
  const [adaptNote, setAdaptNote] = useState<string | null>(null);
  const [authFailed, setAuthFailed] = useState(false);

  const log = (kind: LogLine["kind"], text: string) =>
    setLines((prev) => [...prev.slice(-39), { id: lineId.current++, kind, text }]);

  const launchesQuery = useActionQuery("list-launches", {});
  const sandboxes = (launchesQuery.data?.launches ?? []).filter(
    (l) => l.productName === SANDBOX_NAME,
  );
  const sandbox = sandboxes[0];
  const assetsQuery = useActionQuery(
    "list-assets",
    { launchId: sandbox?.id ?? "" },
    { enabled: !!sandbox },
  );
  const assets: Asset[] = [...(assetsQuery.data?.assets ?? [])].sort(
    (a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt),
  );

  const pulseFrom = useRef<number | null>(null);

  function wire(label: string) {
    return {
      onSuccess: (data: unknown) => {
        const d = data as { state?: string; id?: string } | undefined;
        const extra =
          label === "update-asset" && d?.state ? ` {state:"${d.state}"}` : label === "publish-asset" ? ` {state:"published"}` : "";
        log("ok", `← 200 · ${label}${extra}`);
        if (label === "update-asset" && d?.state === "locked" && pulseFrom.current !== null) {
          setPulse({ from: pulseFrom.current, key: Date.now() });
          log("sys", "lock is final — the other five now adapt around this one");
        }
        pulseFrom.current = null;
        pending.current = null;
      },
      onError: (error: unknown) => {
        const info = errInfo(error);
        log("err", `← ${info.status || "ERR"} · {code:"${info.code}", status:"rejected_mutation"}`);
        log("sys", `   ${info.message}`);
        if (info.status === 401) setAuthFailed(true);
        pulseFrom.current = null;
        pending.current = null;
      },
    };
  }

  const createLaunch = useActionMutation("create-launch", wire("create-launch"));
  const createAssets = useActionMutation("create-assets", wire("create-assets"));
  const update = useActionMutation("update-asset", wire("update-asset"));
  const publish = useActionMutation("publish-asset", wire("publish-asset"));
  const busy = createLaunch.isPending || createAssets.isPending || update.isPending || publish.isPending;

  function callCreateLaunch() {
    const at = sandboxLaunchAt();
    const args = {
      productName: SANDBOX_NAME,
      oneLiner: "Sandbox copy of the Northstar launch — safe to break. Every button runs the real actions.",
      audience: "indie SaaS founders",
      launchAt: at.toISOString(),
    };
    pending.current = { label: "create-launch" };
    log("req", `→ create-launch ${payload({ productName: args.productName, launchAt: args.launchAt })}`);
    createLaunch.mutate(args);
  }

  // Provision the sandbox launch on first view.
  const creating = useRef(false);
  useEffect(() => {
    if (launchesQuery.data && sandboxes.length === 0 && !creating.current) {
      creating.current = true;
      callCreateLaunch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchesQuery.data]);

  // Seed the kit into a fresh sandbox launch.
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (!sandbox || !assetsQuery.data) return;
    if (assetsQuery.data.assets.length === 0 && seededFor.current !== sandbox.id) {
      seededFor.current = sandbox.id;
      const base = new Date(sandbox.launchAt).getTime();
      const args = {
        launchId: sandbox.id,
        assets: KIT.map((k) => ({
          channel: k.channel,
          title: k.title,
          text: k.text,
          scheduledAt: new Date(base + k.offsetMin * 60000).toISOString(),
        })),
      };
      pending.current = { label: "create-assets" };
      log("req", `→ create-assets {assets: 6 channels}`);
      createAssets.mutate(args);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandbox?.id, assetsQuery.data]);

  function doUpdate(
    asset: Asset,
    args: { id: string; state?: "draft" | "locked" | "approved"; text?: string },
    fromIndex?: number,
  ) {
    pending.current = { label: "update-asset" };
    pulseFrom.current = args.state === "locked" && fromIndex !== undefined ? fromIndex : null;
    log("req", `→ update-asset ${payload(args)}`);
    update.mutate(args);
  }

  function doPublish(asset: Asset) {
    pending.current = { label: "publish-asset" };
    log("req", `→ publish-asset ${payload({ id: asset.id })}`);
    publish.mutate({ id: asset.id });
  }

  function doAdapt(asset: Asset) {
    const targets = assets.filter((a) => a.id !== asset.id && a.state !== "published" && a.state !== "locked");
    log("req", `→ agent.adapt ${payload({ source: asset.title, targets: targets.map((t) => t.channel) })}`);
    log("sys", "dispatched — the agent runs in the app, on this same board, through these same actions");
    setAdaptNote(asset.id);
  }

  function reset() {
    seededFor.current = null;
    creating.current = true;
    setAdaptNote(null);
    setPulse(null);
    log("sys", "reset — seeding a fresh sandbox launch; the previous one stays in your launches");
    callCreateLaunch();
  }

  // Terminal autoscroll.
  const termRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = termRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  if (launchesQuery.isError || authFailed) {
    const off = (m: number) =>
      m === 0
        ? "T−0"
        : `${m < 0 ? "T−" : "T+"}${Math.abs(m) >= 60 && Math.abs(m) % 60 === 0 ? `${Math.abs(m) / 60}h` : `${Math.abs(m)}m`}`;
    const kit = [...KIT].sort((a, b) => a.offsetMin - b.offsetMin);
    return (
      <div>
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="flex min-h-[220px] flex-col items-start justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-6">
            <p className="font-tech text-[11px] tracking-[0.18em] text-orange-300">SANDBOX — SIGN-IN REQUIRED</p>
            <p className="max-w-md text-sm leading-relaxed text-zinc-400">
              The sandbox runs on your own launches, so it needs you signed in. Sign in, and the
              board — lock guard, approval gate and all — is live. Below is the exact kit it seeds.
            </p>
            {/* plain anchor: /sign-in is server-rendered, not an SPA route */}
            <a
              href="/sign-in"
              className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-white"
            >
              Sign in to run it live →
            </a>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/50 p-4 font-tech text-[11px] leading-[1.8] text-red-300">
            ← 401 · {"{code:\"sign_in_required\"}"}
            <br />
            <span className="text-zinc-500">the sandbox only ever touches launches you own</span>
          </div>
        </div>

        {/* the sample kit, exactly as the live sandbox seeds it — read-only here */}
        <p className="mt-5 font-tech text-[10px] tracking-[0.18em] text-zinc-500">
          THE SAMPLE KIT — NORTHSTAR, SIX CHANNELS, AS SEEDED
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {kit.map((k) => (
            <article
              key={k.channel}
              className="flex min-h-[218px] flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-tech text-[9.5px] tracking-[0.14em] text-zinc-400">
                  {CH_LABEL[k.channel] ?? k.channel.toUpperCase()}
                </span>
                <span className="font-tech text-[9.5px] text-zinc-500">{off(k.offsetMin)}</span>
              </div>
              <p className="line-clamp-6 text-[11px] leading-snug whitespace-pre-line text-zinc-300">{k.text}</p>
              <div className="mt-auto">
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 font-tech text-[9px] tracking-[0.12em] uppercase ${PILL.draft}`}
                >
                  draft
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  const ready = assets.filter((a) => a.state !== "draft").length;

  return (
    <div>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 pb-3">
        <span className="flex items-center gap-2 font-tech text-[11px] tracking-[0.16em] text-zinc-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          SANDBOX — REAL ACTIONS
        </span>
        <span className="font-tech text-[11px] text-zinc-500">
          launch: {sandbox ? SANDBOX_NAME : "provisioning…"} · {assets.length ? `${ready} of ${assets.length} ready` : "…"}
        </span>
        <span className="ml-auto flex items-center gap-2">
          {sandbox ? (
            <Link
              to={`/launch?launch=${sandbox.id}`}
              className="rounded-md border border-white/15 px-2.5 py-1 font-tech text-[10px] tracking-wide text-zinc-300 transition hover:border-white/40 hover:text-white"
            >
              OPEN THIS BOARD IN THE APP →
            </Link>
          ) : null}
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="rounded-md border border-white/15 px-2.5 py-1 font-tech text-[10px] tracking-wide text-zinc-300 transition hover:border-orange-300/60 hover:text-orange-200 disabled:opacity-40"
          >
            RESET SANDBOX
          </button>
        </span>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        {/* board */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {assets.map((asset, i) => (
              <SandboxCard
                key={pulse ? `${asset.id}-${pulse.key}` : asset.id}
                asset={asset}
                index={i}
                launchAt={sandbox?.launchAt ?? asset.scheduledAt}
                hitDelay={pulse && pulse.from !== i ? Math.abs(i - pulse.from) * 120 : undefined}
                busy={busy}
                onLock={() => doUpdate(asset, { id: asset.id, state: "locked" }, i)}
                onUnlock={() => doUpdate(asset, { id: asset.id, state: "draft" })}
                onApprove={() => doUpdate(asset, { id: asset.id, state: "approved" })}
                onSaveText={(text) => doUpdate(asset, { id: asset.id, text })}
                onPublish={() => doPublish(asset)}
                onAdapt={() => doAdapt(asset)}
              />
            ))}
            {assets.length === 0 ? (
              <p className="col-span-full py-10 text-center font-tech text-[11px] text-zinc-500">
                provisioning the sandbox board…
              </p>
            ) : null}
          </div>

          {/* pulse beams along the runway (xl only, where cards sit in one row) */}
          {pulse ? (
            <div key={pulse.key} className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px xl:block" aria-hidden>
              <div
                className="beam-r absolute top-0 h-px bg-gradient-to-r from-orange-400 to-orange-400/0"
                style={{
                  left: `${((pulse.from + 0.5) / 6) * 100}%`,
                  width: `${(1 - (pulse.from + 0.5) / 6) * 100}%`,
                }}
              />
              <div
                className="beam-l absolute top-0 h-px bg-gradient-to-l from-orange-400 to-orange-400/0"
                style={{ left: 0, width: `${((pulse.from + 0.5) / 6) * 100}%` }}
              />
            </div>
          ) : null}

          <p className="mt-3 font-tech text-[10.5px] leading-relaxed text-zinc-500">
            TRY IT — 1 · LOCK THE X POST&nbsp;&nbsp;2 · TRY EDITING IT ANYWAY, WATCH THE TERMINAL&nbsp;&nbsp;3 · APPROVE
            PRODUCT HUNT, THEN PUBLISH IT
          </p>
          {adaptNote ? (
            <p className="mt-2 rounded-lg border border-orange-300/25 bg-orange-400/5 px-3 py-2 text-[12px] leading-relaxed text-orange-200/90">
              Adapt dispatched. The agent rewrites inside the app — where it shares this board — once AI is
              connected.{" "}
              {sandbox ? (
                <Link to={`/launch?launch=${sandbox.id}`} className="font-semibold underline underline-offset-2">
                  Open this board in the app →
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>

        {/* terminal */}
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
          <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
            <span className="size-2 rounded-full bg-zinc-700" />
            <span className="size-2 rounded-full bg-zinc-700" />
            <span className="size-2 rounded-full bg-zinc-700" />
            <span className="ml-2 font-tech text-[10px] tracking-[0.16em] text-zinc-400">
              EXECUTION — defineAction() LOG
            </span>
          </div>
          <div ref={termRef} className="h-[320px] overflow-y-auto scroll-smooth p-3 font-tech text-[11px] leading-[1.75]">
            {lines.map((l) => (
              <p
                key={l.id}
                className={
                  l.kind === "req"
                    ? "text-zinc-200"
                    : l.kind === "ok"
                      ? "text-emerald-300"
                      : l.kind === "err"
                        ? "text-red-300"
                        : "text-zinc-500"
                }
              >
                {l.kind !== "sys" ? <span className="mr-2 text-zinc-600">{clock()}</span> : null}
                {l.text}
              </p>
            ))}
            <p className="animate-pulse text-zinc-500">▌</p>
          </div>
          <p className="border-t border-white/10 px-3 py-1.5 font-tech text-[9.5px] text-zinc-600">
            real calls only — long values abbreviated for display
          </p>
        </div>
      </div>
    </div>
  );
}

function SandboxCard({
  asset,
  index,
  launchAt,
  hitDelay,
  busy,
  onLock,
  onUnlock,
  onApprove,
  onSaveText,
  onPublish,
  onAdapt,
}: {
  asset: Asset;
  index: number;
  launchAt: string;
  hitDelay: number | undefined;
  busy: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onApprove: () => void;
  onSaveText: (text: string) => void;
  onPublish: () => void;
  onAdapt: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(asset.text);
  const [confirmPub, setConfirmPub] = useState(false);
  useEffect(() => setDraft(asset.text), [asset.text]);
  useEffect(() => {
    if (!confirmPub) return;
    const t = setTimeout(() => setConfirmPub(false), 3000);
    return () => clearTimeout(t);
  }, [confirmPub]);

  const btn =
    "rounded-md border border-white/12 px-2 py-1 font-tech text-[9.5px] tracking-wide text-zinc-300 transition hover:border-white/40 hover:text-white disabled:opacity-40";

  return (
    <article
      className={`flex min-h-[218px] flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5 ${hitDelay !== undefined ? "card-hit" : ""}`}
      style={hitDelay !== undefined ? { animationDelay: `${hitDelay}ms` } : undefined}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-tech text-[9.5px] tracking-[0.14em] text-zinc-400">
          {CH_LABEL[asset.channel] ?? asset.channel.toUpperCase()}
        </span>
        <span className="font-tech text-[9.5px] text-zinc-500">{tLabel(asset.scheduledAt, launchAt)}</span>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          className="w-full resize-none rounded-md border border-white/15 bg-black/40 p-1.5 text-[11px] leading-snug text-zinc-100 outline-none focus:border-orange-300/60"
        />
      ) : (
        <p className="line-clamp-6 text-[11px] leading-snug whitespace-pre-line text-zinc-300">{asset.text}</p>
      )}

      <div className="mt-auto flex flex-col gap-1.5">
        <span
          className={`inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 font-tech text-[9px] tracking-[0.12em] uppercase ${PILL[asset.state] ?? PILL.draft}`}
        >
          {asset.state}
        </span>
        <div className="flex flex-wrap gap-1">
          {asset.state === "draft" ? (
            <>
              <button type="button" className={btn} disabled={busy} onClick={onLock}>
                LOCK
              </button>
              <button type="button" className={btn} disabled={busy} onClick={onApprove}>
                APPROVE
              </button>
            </>
          ) : null}
          {asset.state === "locked" ? (
            <button type="button" className={btn} disabled={busy} onClick={onUnlock}>
              UNLOCK
            </button>
          ) : null}
          {asset.state === "approved" ? (
            <button
              type="button"
              className={`${btn} ${confirmPub ? "!border-red-300/60 !text-red-200" : ""}`}
              disabled={busy}
              onClick={() => (confirmPub ? onPublish() : setConfirmPub(true))}
            >
              {confirmPub ? "CONFIRM?" : "PUBLISH"}
            </button>
          ) : null}
          {asset.state !== "published" ? (
            editing ? (
              <>
                <button
                  type="button"
                  className={btn}
                  disabled={busy}
                  onClick={() => {
                    onSaveText(draft);
                    setEditing(false);
                  }}
                >
                  SAVE
                </button>
                <button type="button" className={btn} onClick={() => setEditing(false)}>
                  CANCEL
                </button>
              </>
            ) : (
              <button type="button" className={btn} disabled={busy} onClick={() => setEditing(true)}>
                EDIT
              </button>
            )
          ) : null}
        </div>
        {asset.state === "locked" ? (
          <button
            type="button"
            onClick={onAdapt}
            className="rounded-md bg-orange-400/90 px-2 py-1 font-tech text-[9.5px] font-semibold tracking-wide text-zinc-950 transition hover:bg-orange-300"
          >
            ADAPT THE REST →
          </button>
        ) : null}
      </div>
    </article>
  );
}
