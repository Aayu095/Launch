import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import {
  actionErrorMessage,
  useActionMutation,
  useActionQuery,
} from "@agent-native/core/client/hooks";
import {
  IconActivity,
  IconBrandLinkedin,
  IconBrandX,
  IconCalendarEvent,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconCopy,
  IconFlag,
  IconLock,
  IconLockOpen,
  IconMail,
  IconMessages,
  IconNews,
  IconPlus,
  IconRocket,
  IconSend,
  IconSparkles,
  IconTrophy,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type AssetState = "draft" | "locked" | "approved" | "published";
type Asset = {
  id: string;
  channel: string;
  title: string;
  text: string;
  state: AssetState;
  comment: string | null;
  scheduledAt: string;
  publishedAt: string | null;
  liveUrl: string | null;
  postError: string | null;
};

const CHANNELS: Record<
  string,
  { label: string; icon: typeof IconBrandX; tile: string; limit?: number }
> = {
  x: { label: "X", icon: IconBrandX, tile: "bg-neutral-900 text-white", limit: 280 },
  "product-hunt": {
    label: "Product Hunt",
    icon: IconTrophy,
    tile: "bg-orange-100 text-orange-600",
    limit: 260,
  },
  linkedin: {
    label: "LinkedIn",
    icon: IconBrandLinkedin,
    tile: "bg-sky-100 text-sky-700",
  },
  "hacker-news": {
    label: "Hacker News",
    icon: IconNews,
    tile: "bg-amber-100 text-amber-700",
  },
  email: { label: "Email", icon: IconMail, tile: "bg-violet-100 text-violet-600" },
  community: {
    label: "Community",
    icon: IconMessages,
    tile: "bg-emerald-100 text-emerald-600",
  },
};
const CHANNEL_KEYS = Object.keys(CHANNELS);

function channelMeta(channel: string) {
  return (
    CHANNELS[channel] ?? {
      label: channel,
      icon: IconMessages,
      tile: "bg-muted text-foreground",
    }
  );
}

const STATE_STYLE: Record<AssetState, string> = {
  draft: "bg-muted text-muted-foreground",
  locked: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  published: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
};
const STATE_DOT: Record<AssetState, string> = {
  draft: "bg-muted-foreground/50",
  locked: "bg-signal",
  approved: "bg-emerald-500",
  published: "bg-sky-500",
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function defaultLaunchTime() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d.toISOString());
}

function timeLabel(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function shortTime(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function relativeLabel(scheduledAt: string, launchAt: string) {
  const diff = new Date(scheduledAt).getTime() - new Date(launchAt).getTime();
  if (diff === 0) return "T-0 · launch moment";
  const abs = Math.abs(diff);
  const suffix = diff < 0 ? "before" : "after";
  if (abs < 3_600_000) return `T${diff < 0 ? "−" : "+"}${Math.round(abs / 60_000)}m`;
  if (abs < 86_400_000)
    return `T${diff < 0 ? "−" : "+"}${Math.round(abs / 3_600_000)}h`;
  return `T${diff < 0 ? "−" : "+"}${Math.round(abs / 86_400_000)}d · ${suffix} launch`;
}

function useCountdown(targetIso: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!targetIso) return null;
  const diff = new Date(targetIso).getTime() - now;
  if (diff <= 0) return { launched: true, d: 0, h: 0, m: 0, s: 0 };
  return {
    launched: false,
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

export default function LaunchBoardRoute() {
  const [searchParams, setSearchParams] = useSearchParams();
  const launchesQuery = useActionQuery("list-launches", {});
  const launches = launchesQuery.data?.launches ?? [];
  const selectedId = searchParams.get("launch") ?? launches[0]?.id ?? "";
  const launch = launches.find((item) => item.id === selectedId);

  const assetsQuery = useActionQuery("list-assets", { launchId: selectedId }, {
    enabled: Boolean(selectedId),
  });
  const assets = (assetsQuery.data?.assets ?? []) as Asset[];
  const countdown = useCountdown(launch?.launchAt);

  const [showCreate, setShowCreate] = useState(false);
  const [productName, setProductName] = useState("");
  const [oneLiner, setOneLiner] = useState("");
  const [audience, setAudience] = useState("");
  const [launchAt, setLaunchAt] = useState(defaultLaunchTime);

  const createLaunch = useActionMutation("create-launch", {
    onSuccess: (result) => {
      setSearchParams({ launch: result.id });
      setShowCreate(false);
      setProductName("");
      setOneLiner("");
      setAudience("");
      toast.success("Launch created. Now ask the agent to build the kit.");
    },
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? "Could not create the launch."),
  });

  function submitLaunch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const when = new Date(launchAt);
    if (!productName.trim() || !oneLiner.trim() || Number.isNaN(when.getTime())) {
      toast.error("Add a product name, a one-liner, and a launch time.");
      return;
    }
    createLaunch.mutate({
      productName: productName.trim(),
      oneLiner: oneLiner.trim(),
      audience: audience.trim(),
      launchAt: when.toISOString(),
    });
  }

  function askAgentToBuildKit() {
    if (!launch) return;
    sendToAgentChat({
      message: `Build the full launch kit for "${launch.productName}" — ${launch.oneLiner}. Audience: ${launch.audience || "not specified"}. Launch time: ${launch.launchAt}. Create one asset per channel (x, product-hunt, linkedin, hacker-news, email, community) with create-assets in a single call, each written in that channel's native format and scheduled around the launch time (teaser the day before, hero posts at launch, follow-up a few hours after).`,
      context: JSON.stringify({ launchId: launch.id, view: "launch" }),
      submit: true,
      openSidebar: true,
    });
  }

  const counts: Record<AssetState, number> = {
    draft: 0,
    locked: 0,
    approved: 0,
    published: 0,
  };
  assets.forEach((a) => counts[a.state]++);
  const ready = counts.approved + counts.published;
  const statusWord =
    assets.length === 0
      ? null
      : counts.published === assets.length
        ? "All live"
        : counts.draft === 0
          ? "Ready to launch"
          : "In preparation";

  if (launchesQuery.isPending) {
    return (
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-5 p-4 sm:p-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-10 rounded-xl" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[420px] w-[340px] shrink-0 rounded-2xl" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-[1400px] flex-col gap-5 p-4 sm:p-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-xl font-bold text-background">
            {launch ? launch.productName.slice(0, 1).toUpperCase() : <IconRocket className="size-6" />}
          </span>
          <div className="min-w-0">
            <p className="font-tech flex items-center gap-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              <span className="dawn-line inline-block h-[3px] w-7 rounded-full" />
              Launch runway
            </p>
            <h1 className="font-display truncate text-[26px] leading-tight font-semibold tracking-tight">
              {launch ? launch.productName : "No launch yet"}
            </h1>
            {launch && (
              <p className="max-w-xl truncate text-sm text-muted-foreground">
                {launch.oneLiner}
                {launch.audience ? ` · for ${launch.audience}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {launches.length > 1 && (
            <select
              className="h-10 rounded-lg border border-input bg-background px-2.5 text-sm"
              value={selectedId}
              onChange={(event) => setSearchParams({ launch: event.target.value })}
              aria-label="Choose launch"
            >
              {launches.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.productName}
                </option>
              ))}
            </select>
          )}
          {launch && countdown && (
            <div className="flex items-stretch gap-1.5" aria-label="Countdown to launch">
              {countdown.launched ? (
                <span className="flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <IconCircleCheck className="size-4" /> Launched
                </span>
              ) : (
                [
                  ["days", countdown.d],
                  ["hrs", countdown.h],
                  ["min", countdown.m],
                  ["sec", countdown.s],
                ].map(([label, value]) => (
                  <span
                    key={label as string}
                    className="flex min-w-14 flex-col items-center rounded-xl border border-border bg-card px-2 py-1.5"
                  >
                    <span className="font-tech text-lg leading-none font-semibold tabular-nums">
                      {String(value).padStart(2, "0")}
                    </span>
                    <span className="mt-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                      {label}
                    </span>
                  </span>
                ))
              )}
              <span className="hidden items-center gap-1.5 self-center pl-1 text-xs text-muted-foreground xl:flex">
                <IconCalendarEvent className="size-4" />
                {timeLabel(launch.launchAt)}
              </span>
            </div>
          )}
          <Link
            to="/home"
            className="hidden h-10 items-center px-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            About Launch
          </Link>
          <Button variant="outline" className="h-10" onClick={() => setShowCreate((v) => !v)}>
            <IconPlus className="size-4" /> New launch
          </Button>
        </div>
      </header>

      {/* ── Create launch ──────────────────────────────────── */}
      {(showCreate || !launch) && (
        <form
          onSubmit={submitLaunch}
          className="glass-panel grid gap-3 rounded-[1.25rem] p-4 md:grid-cols-[1fr_1.6fr_1fr_auto] md:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="launch-product">Product</Label>
            <Input id="launch-product" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Northstar" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="launch-oneliner">One-liner</Label>
            <Input id="launch-oneliner" value={oneLiner} onChange={(e) => setOneLiner(e.target.value)} placeholder="The AI assistant that runs your launch day" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="launch-audience">Audience</Label>
            <Input id="launch-audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="indie builders" />
          </div>
          <div className="flex gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="launch-at">Launch at</Label>
              <Input id="launch-at" type="datetime-local" value={launchAt} onChange={(e) => setLaunchAt(e.target.value)} required />
            </div>
            <Button type="submit" disabled={createLaunch.isPending} className="self-end">
              Create
            </Button>
          </div>
        </form>
      )}

      {launch && (
        <>
          {/* ── Readiness ──────────────────────────────────── */}
          <section className="glass-panel rounded-[1.5rem] px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-display text-sm font-semibold">
                {assets.length === 0 ? "No assets yet" : `${ready} of ${assets.length} ready`}
              </span>
              {statusWord && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {statusWord}
                </span>
              )}
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <IconLock className="size-3.5" />
                Locked assets are final — the agent adapts everything else around them.
              </span>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                {(Object.keys(counts) as AssetState[]).map((state) => (
                  <span key={state} className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${STATE_DOT[state]}`} />
                    {counts[state]} {state}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={assets.length ? Math.round((ready / assets.length) * 100) : 0} aria-valuemin={0} aria-valuemax={100}>
              {(Object.keys(counts) as AssetState[])
                .filter((state) => counts[state] > 0)
                .map((state) => (
                  <span
                    key={state}
                    className={`h-full ${STATE_DOT[state]} transition-all duration-500`}
                    style={{ width: `${(counts[state] / Math.max(assets.length, 1)) * 100}%` }}
                  />
                ))}
            </div>
          </section>

          {/* ── Empty state ────────────────────────────────── */}
          {assets.length === 0 && !assetsQuery.isPending && (
            <section className="glass-panel flex flex-col items-center gap-3 rounded-[1.5rem] px-6 py-14 text-center">
              <span className="bg-signal-soft flex size-14 items-center justify-center rounded-2xl">
                <IconSparkles className="text-signal size-7" />
              </span>
              <div>
                <h2 className="text-base font-semibold">The runway is empty</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  Ask the agent to write every channel asset in one pass — it uses
                  the same actions as the buttons on this board.
                </p>
              </div>
              <Button size="lg" onClick={askAgentToBuildKit}>
                <IconSparkles className="size-4" /> Build my launch kit with the agent
              </Button>
            </section>
          )}

          {/* ── Timeline + cards ───────────────────────────── */}
          {assets.length > 0 && (
            <>
              <TimelineAxis assets={assets} launchAt={launch.launchAt} />
              <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    launchAt={launch.launchAt}
                    launchId={launch.id}
                    productName={launch.productName}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AddAssetForm launchId={launch.id} launchAt={launch.launchAt} />
                <Button size="sm" variant="ghost" className="ml-auto" onClick={askAgentToBuildKit}>
                  <IconSparkles className="size-3.5" /> Ask agent to rebuild the kit
                </Button>
              </div>
              <ActivityStrip assets={assets} />
              <LandedPanel assets={assets} launchAt={launch.launchAt} productName={launch.productName} />
            </>
          )}
        </>
      )}
    </main>
  );
}

function TimelineAxis({ assets, launchAt }: { assets: Asset[]; launchAt: string }) {
  const times = assets.map((a) => new Date(a.scheduledAt).getTime());
  const launchMs = new Date(launchAt).getTime();
  const start = Math.min(...times, launchMs) - 3 * 3_600_000;
  const end = Math.max(...times, launchMs) + 3 * 3_600_000;
  const pct = (t: number) =>
    Math.min(97, Math.max(3, ((t - start) / (end - start)) * 100));

  return (
    <section aria-label="Launch timeline" className="px-1 pt-1">
      <div className="relative h-12">
        <div className="absolute top-7 right-0 left-0 h-px bg-border" />
        {/* launch moment */}
        <div
          className="absolute top-0 -translate-x-1/2 text-center"
          style={{ left: `${pct(launchMs)}%` }}
        >
          <span className="text-signal flex items-center gap-1 text-[11px] font-semibold">
            <IconFlag className="size-3" /> Launch
          </span>
        </div>
        <div
          className="bg-signal absolute top-4 bottom-0 w-px"
          style={{ left: `${pct(launchMs)}%` }}
        />
        {assets.map((a) => (
          <span
            key={a.id}
            title={`${a.title} · ${timeLabel(a.scheduledAt)}`}
            className={`absolute top-7 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-background ${STATE_DOT[a.state]}`}
            style={{ left: `${pct(new Date(a.scheduledAt).getTime())}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{timeLabel(new Date(start).toISOString())}</span>
        <span>{timeLabel(new Date(end).toISOString())}</span>
      </div>
    </section>
  );
}

function tOffset(scheduledAt: string, launchAt: string): string {
  const diff = Math.round((+new Date(scheduledAt) - +new Date(launchAt)) / 60000);
  if (diff === 0) return "T−0";
  const abs = Math.abs(diff);
  const v = abs >= 60 && abs % 60 === 0 ? `${abs / 60}h` : `${abs}m`;
  return diff < 0 ? `T−${v}` : `T+${v}`;
}

/**
 * LANDED — the Day Companion's evening wrap. Appears once the first
 * asset is published and grows as the day lands: every channel's
 * final state, the real live link when the channel returned one, and
 * an honest line for anything that failed. When all channels are
 * published it closes the day: "Ho gaya."
 */
function LandedPanel({
  assets,
  launchAt,
  productName,
}: {
  assets: Asset[];
  launchAt: string;
  productName: string;
}) {
  const publishedCount = assets.filter((a) => a.state === "published").length;
  if (publishedCount === 0) return null;
  const allLive = publishedCount === assets.length;

  return (
    <section className="glass-panel-dark dot-grid-dark rounded-[1.5rem] px-5 py-5 text-zinc-200">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="font-tech text-[10px] tracking-[0.18em] text-orange-400">
          {allLive ? "LANDED — THE DAY, WRAPPED" : "THE DAY SO FAR"}
        </p>
        <span className="font-tech text-[10px] tracking-[0.14em] text-zinc-400">
          {publishedCount} OF {assets.length} LIVE
        </span>
        <span className="dawn-line ml-auto hidden h-[3px] w-16 rounded-full sm:block" />
      </div>
      <h2 className="font-display mt-2 text-xl font-semibold text-white">
        {allLive
          ? `Ho gaya. ${productName} is live.`
          : "The runway is landing, one channel at a time."}
      </h2>
      <ul className="mt-3 divide-y divide-white/10">
        {assets.map((a) => {
          const meta = channelMeta(a.channel);
          let dot = "bg-zinc-500";
          let text: string;
          if (a.state === "published" && a.liveUrl) {
            dot = "bg-emerald-400";
            text = `Live since ${a.publishedAt ? shortTime(a.publishedAt) : "today"}`;
          } else if (a.state === "published" && a.postError) {
            dot = "bg-red-400";
            text = `Post hit a snag — ${a.postError}`;
          } else if (a.state === "published") {
            dot = "bg-emerald-400";
            text = `Published ${a.publishedAt ? shortTime(a.publishedAt) : ""}`.trim();
          } else if (a.state === "locked") {
            dot = "bg-orange-500";
            text = `Locked — final · goes out ${tOffset(a.scheduledAt, launchAt)}`;
          } else if (a.state === "approved") {
            dot = "bg-sky-400";
            text = `Approved — ready · ${tOffset(a.scheduledAt, launchAt)}`;
          } else {
            text = `In preparation · ${tOffset(a.scheduledAt, launchAt)}`;
          }
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className={`size-2 shrink-0 rounded-full ${dot}`} />
              <span className="font-tech w-28 shrink-0 text-[11px] tracking-[0.14em] text-zinc-300">
                {meta.label.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">{text}</span>
              {a.state === "published" && a.liveUrl ? (
                <a
                  href={a.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-zinc-100 transition hover:bg-white/10"
                >
                  View the post ↗
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
        {allLive
          ? "Every post above went out from this one board — under your lock, with your approval. You were not alone today."
          : "This page wraps the day as each channel lands — the moment a post is live, its link appears here."}
      </p>
    </section>
  );
}

function ActivityStrip({ assets }: { assets: Asset[] }) {
  const items: { key: string; text: string; at: number }[] = [];
  assets.forEach((a) => {
    if (a.state === "published" && a.publishedAt)
      items.push({ key: a.id + "p", text: `${a.title} published`, at: new Date(a.publishedAt).getTime() });
    else if (a.state === "locked")
      items.push({ key: a.id + "l", text: `${a.title} locked — final`, at: new Date(a.scheduledAt).getTime() });
    else if (a.state === "approved")
      items.push({ key: a.id + "a", text: `${a.title} approved — ready to publish`, at: new Date(a.scheduledAt).getTime() });
  });
  if (items.length === 0) return null;
  items.sort((x, y) => y.at - x.at);
  return (
    <section className="glass-panel rounded-[1.5rem] px-5 py-4">
      <h2 className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <IconActivity className="size-4" /> Board activity
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {items.slice(0, 4).map((item) => (
          <li key={item.key} className="flex items-center justify-between py-1.5 text-sm">
            <span>{item.text}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {shortTime(new Date(item.at).toISOString())}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddAssetForm({ launchId, launchAt }: { launchId: string; launchAt: string }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState("x");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(launchAt));
  const create = useActionMutation("create-assets", {
    onSuccess: () => {
      toast.success("Asset added to the board.");
      setOpen(false);
      setTitle("");
      setText("");
    },
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? "Could not add the asset."),
  });

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <IconPlus className="size-3.5" /> Add asset manually
      </Button>
    );
  }
  return (
    <form
      className="glass-panel grid w-full gap-3 rounded-[1.25rem] p-4 md:grid-cols-[150px_1fr_auto] md:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const at = new Date(when);
        if (!title.trim() || Number.isNaN(at.getTime())) {
          toast.error("Add a title and a valid time.");
          return;
        }
        create.mutate({
          launchId,
          assets: [
            { channel, title: title.trim(), text: text.trim(), scheduledAt: at.toISOString() },
          ],
        });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="asset-channel">Channel</Label>
        <select
          id="asset-channel"
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          {CHANNEL_KEYS.map((key) => (
            <option key={key} value={key}>
              {channelMeta(key).label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="asset-title">Title</Label>
          <Input id="asset-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="X launch post" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asset-when">Scheduled at</Label>
          <Input id="asset-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="asset-text">Copy</Label>
          <Textarea id="asset-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Write the post…" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={create.isPending}>
          Add asset
        </Button>
      </div>
    </form>
  );
}

function AssetCard({
  asset,
  launchAt,
  launchId,
  productName,
}: {
  asset: Asset;
  launchAt: string;
  launchId: string;
  productName: string;
}) {
  const meta = channelMeta(asset.channel);
  const ChannelIcon = meta.icon;
  const [draftText, setDraftText] = useState(asset.text);
  const [commentText, setCommentText] = useState("");
  const [schedInput, setSchedInput] = useState(() => toLocalInput(asset.scheduledAt));
  const [confirmPublish, setConfirmPublish] = useState(false);
  useEffect(() => setDraftText(asset.text), [asset.text]);
  useEffect(() => setSchedInput(toLocalInput(asset.scheduledAt)), [asset.scheduledAt]);

  const update = useActionMutation("update-asset", {
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? "Could not save that change."),
    onSuccess: () => toast.success("Saved."),
  });
  const publish = useActionMutation("publish-asset", {
    onError: (error) =>
      toast.error(actionErrorMessage(error) ?? "Could not publish."),
    onSuccess: () => {
      setConfirmPublish(false);
      toast.success("Published.");
    },
  });

  const locked = asset.state === "locked";
  const published = asset.state === "published";
  const editable = !locked && !published;
  const charCount = draftText.length;
  const overLimit = meta.limit !== undefined && charCount > meta.limit;
  const schedChanged = schedInput !== toLocalInput(asset.scheduledAt);

  function askAgentToAdapt() {
    sendToAgentChat({
      message: `The asset "${asset.title}" (${asset.channel}) on the "${productName}" launch is locked and is now the source of truth. Read the board with list-assets, then rewrite every other unlocked, unpublished asset with update-asset so the hook, message, and facts match this locked asset — each in its own channel's native format and length. Do not touch the locked asset, and do not publish anything.`,
      context: JSON.stringify({ launchId, sourceAssetId: asset.id, view: "launch" }),
      submit: true,
      openSidebar: true,
    });
  }

  function copyText() {
    navigator.clipboard
      .writeText(asset.text)
      .then(() => toast.success("Copied — ready to paste into " + meta.label + "."))
      .catch(() => toast.error("Could not copy."));
  }

  return (
    <article className="glass-panel flex w-[340px] shrink-0 snap-start flex-col gap-3 rounded-[1.5rem] p-5">
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${meta.tile}`}>
            <ChannelIcon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="font-display truncate text-sm font-semibold">{asset.title}</h3>
            <p className="text-xs text-muted-foreground">{meta.label}</p>
          </div>
        </div>
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATE_STYLE[asset.state]}`}>
          {locked ? <IconLock className="size-3" /> : published ? <IconCircleCheck className="size-3" /> : null}
          {asset.state}
        </span>
      </div>

      {/* schedule */}
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium tabular-nums">
          {relativeLabel(asset.scheduledAt, launchAt)}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <IconClock className="size-3.5" /> {timeLabel(asset.scheduledAt)}
        </span>
      </div>

      {/* copy */}
      {editable ? (
        <Textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={7}
          className="resize-none text-sm leading-relaxed"
          aria-label={`${asset.title} copy`}
        />
      ) : (
        <p className="min-h-[172px] rounded-lg bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {asset.text || <span className="text-muted-foreground">(no copy yet)</span>}
        </p>
      )}

      {/* character meter */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>
            {charCount}
            {meta.limit ? ` / ${meta.limit} characters` : " characters"}
          </span>
          {overLimit && (
            <span className="font-semibold text-destructive">
              {charCount - (meta.limit ?? 0)} over the {meta.label} limit
            </span>
          )}
        </div>
        {meta.limit && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <span
              className={`block h-full transition-all ${overLimit ? "bg-destructive" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(100, (charCount / meta.limit) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* note */}
      {asset.comment && (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Note · </span>
          {asset.comment}
        </p>
      )}

      {/* reschedule */}
      {!published && (
        <div className="flex items-center gap-1.5">
          <Input
            type="datetime-local"
            value={schedInput}
            onChange={(e) => setSchedInput(e.target.value)}
            className="h-8 text-xs"
            aria-label="Scheduled time"
          />
          {schedChanged && (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 shrink-0"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({ id: asset.id, scheduledAt: new Date(schedInput).toISOString() })
              }
            >
              Reschedule
            </Button>
          )}
        </div>
      )}

      {/* actions */}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {editable && draftText !== asset.text && (
          <Button size="sm" onClick={() => update.mutate({ id: asset.id, text: draftText })} disabled={update.isPending || overLimit}>
            <IconCheck className="size-3.5" /> Save
          </Button>
        )}
        {!published &&
          (locked ? (
            <Button size="sm" variant="outline" onClick={() => update.mutate({ id: asset.id, state: "draft" })} disabled={update.isPending}>
              <IconLockOpen className="size-3.5" /> Unlock
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                update.mutate({
                  id: asset.id,
                  state: "locked",
                  ...(draftText !== asset.text ? { text: draftText } : {}),
                })
              }
              disabled={update.isPending}
            >
              <IconLock className="size-3.5" /> Lock
            </Button>
          ))}
        <Button size="sm" variant="ghost" onClick={copyText} aria-label="Copy post text">
          <IconCopy className="size-3.5" /> Copy
        </Button>
        <span className="ml-auto flex items-center gap-1.5">
          {!published && asset.state !== "approved" && (
            <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: asset.id, state: "approved" })} disabled={update.isPending}>
              Approve
            </Button>
          )}
          {asset.state === "approved" && (
            <Button size="sm" className="rounded-full" onClick={() => setConfirmPublish(true)}>
              <IconSend className="size-3.5" /> Publish
            </Button>
          )}
          {published && (
            <span className="flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
              <IconCircleCheck className="size-3.5" /> Live
              {asset.publishedAt ? ` · ${shortTime(asset.publishedAt)}` : ""}
            </span>
          )}
        </span>
      </div>

      {published && asset.liveUrl && (
        <a
          href={asset.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-400"
        >
          <IconCircleCheck className="size-3.5" /> Live on {meta.label} — view the post ↗
        </a>
      )}
      {published && asset.postError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
          <span className="font-semibold">Channel post failed:</span> {asset.postError} — ask the
          agent to retry, or rewrite it.
        </p>
      )}

      {locked && (
        <Button
          className="w-full rounded-full transition-opacity hover:opacity-90"
          onClick={askAgentToAdapt}
        >
          <IconSparkles className="size-4" /> Adapt the rest to this
        </Button>
      )}

      {!published && (
        <form
          className="flex gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!commentText.trim()) return;
            update.mutate({ id: asset.id, comment: commentText.trim() });
            setCommentText("");
          }}
        >
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a note for the agent…"
            className="h-8 text-xs"
            aria-label="Add a note"
          />
          <Button type="submit" size="sm" variant="ghost" className="h-8">
            Note
          </Button>
        </form>
      )}

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish to {meta.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks “{asset.title}” live on the board. Publishing is
              outward-facing, so it always needs your confirmation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction disabled={publish.isPending} onClick={() => publish.mutate({ id: asset.id })}>
              Publish now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
