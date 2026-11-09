import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { LaunchSandbox } from "@/components/launch-sandbox";

/**
 * Launch — the public website, served at "/" to signed-out visitors.
 * Follows the system theme (light paper canvas / dark canvas, dark
 * engineering islands in both): the hero carries a
 * flowing glass arc (the runway, bent), the product shows itself in a
 * dark sandbox panel (live for real once signed in), and the rules are
 * shown as dense bento components — not paragraphs. "Get started" leads
 * to the branded sign-in; signed-in visitors never see this page — the
 * root route sends them straight to their dashboard.
 */

const MONO = "font-tech";

/* ── scroll reveal ──────────────────────────────────────────── */
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? "is-in" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ── the 3D glass arc: the runway, bent, flowing ────────────── */
const ARC_A = ["X · T−0", "LOCKED", "PH · T+5M", "ADAPT", "EMAIL · T+5M", "APPROVE", "HN · T+1H"];
const ARC_B = ["DRAFT", "LINKEDIN · T+30M", "PUBLISH", "COMMUNITY · T−15H", "REJECTED_MUTATION", "A2A", "T−0"];
const TILE_W = ["7.5rem", "5.5rem", "8rem", "5.5rem", "7.5rem", "6rem", "6.5rem"];

function ArcRow({
  labels,
  anim,
  offset,
  dark = false,
}: {
  labels: string[];
  anim: string;
  offset: string;
  dark?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${anim}`} style={{ marginLeft: offset }}>
      {labels.map((label, i) => (
        <div
          key={label}
          className={`flex h-16 shrink-0 items-end rounded-2xl p-2.5 ${
            dark
              ? `glass-tile-dark ${i % 3 === 0 ? "glass-tile-dark-warm" : ""}`
              : `glass-tile ${i % 3 === 0 ? "glass-tile-warm" : ""}`
          }`}
          style={{
            width: TILE_W[i % TILE_W.length]!,
            transform: `rotate(${i % 2 ? 1.5 : -1.5}deg) scale(${i % 2 ? 0.94 : 1})`,
          }}
        >
          <span className={`${MONO} text-[8.5px] tracking-[0.14em] ${dark ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-300"}`}>
            <span className="mr-1 inline-block size-1 rounded-full bg-orange-500 align-middle" />
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function GlassArc() {
  return (
    <div className="pointer-events-none absolute top-6 right-[-7rem] hidden w-[52rem] rotate-[-12deg] lg:block" aria-hidden>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(30rem_16rem_at_60%_40%,rgba(255,120,40,0.30),rgba(255,194,77,0.12)_55%,transparent_75%)]" />
      <div className="flex flex-col gap-3 [mask-image:linear-gradient(90deg,transparent,black_18%,black_82%,transparent)]">
        <ArcRow labels={ARC_A} anim="animate-arc-a" offset="0" />
        <ArcRow labels={ARC_B} anim="animate-arc-b" offset="-4rem" />
        <ArcRow labels={[...ARC_A].reverse()} anim="animate-arc-a" offset="-2rem" />
      </div>
    </div>
  );
}

/* ── bento cells ────────────────────────────────────────────── */
function Fig({ n, title, dark = false }: { n: string; title: string; dark?: boolean }) {
  return (
    <p className={`${MONO} text-[10px] tracking-[0.2em] ${dark ? "text-zinc-500" : "text-zinc-400"}`}>
      FIG {n} — {title}
    </p>
  );
}

const SIX = [
  { label: "COMMUNITY", t: "T−15H" },
  { label: "X", t: "T−0" },
  { label: "PH", t: "T+5M" },
  { label: "EMAIL", t: "T+5M" },
  { label: "LINKEDIN", t: "T+30M" },
  { label: "HN", t: "T+1H" },
];
const SCATTER = [
  { x: "4%", y: "8%", r: "-7deg" },
  { x: "38%", y: "58%", r: "5deg" },
  { x: "70%", y: "4%", r: "-4deg" },
  { x: "16%", y: "62%", r: "8deg" },
  { x: "58%", y: "64%", r: "-6deg" },
  { x: "82%", y: "52%", r: "4deg" },
];

function ChaosOrderCell() {
  const [ordered, setOrdered] = useState(true);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Fig n="0.1" title="CHAOS VS ORDER" />
        <div className="flex rounded-full border border-border p-0.5 text-[11px] font-medium">
          {(["Without Launch", "With Launch"] as const).map((label) => {
            const active = (label === "With Launch") === ordered;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setOrdered(label === "With Launch")}
                className={`rounded-full px-3 py-1 transition ${active ? "bg-foreground text-background" : "text-zinc-500 hover:text-foreground dark:text-zinc-400"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative mt-4 h-36">
        <div
          className={`absolute inset-x-0 top-[68%] h-px bg-gradient-to-r from-orange-500/0 via-orange-500 to-orange-500/0 transition-opacity duration-700 ${ordered ? "opacity-100" : "opacity-15"}`}
        />
        {SIX.map((c, i) => (
          <div
            key={c.label}
            className="absolute flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1.5 shadow-sm transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={
              ordered
                ? { left: `${(i * 100) / 6 + 1}%`, top: "58%", transform: "rotate(0deg)" }
                : { left: SCATTER[i]!.x, top: SCATTER[i]!.y, transform: `rotate(${SCATTER[i]!.r})` }
            }
          >
            <span className={`${MONO} text-[9px] tracking-[0.12em] text-zinc-700 dark:text-zinc-300`}>{c.label}</span>
            <span className={`${MONO} text-[9px] text-zinc-400`}>{c.t}</span>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        {ordered ? "Six posts. One line. One moment." : "Six channels, six drafts, six chances to drift."}
      </p>
    </div>
  );
}

function GateCell() {
  const [approved, setApproved] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div className="dot-grid-dark rounded-2xl border border-black bg-[#0a0b0d] p-5 text-zinc-200">
      <Fig n="0.2" title="APPROVAL GATE" dark />
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
        The agent can draft and adapt. It can never publish. Try:
      </p>
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setApproved((v) => !v)}
          className={`rounded-md border px-2.5 py-1.5 ${MONO} text-[10px] tracking-wide transition ${
            approved ? "border-sky-300/50 bg-sky-400/10 text-sky-200" : "border-white/15 text-zinc-300 hover:border-white/40"
          }`}
        >
          APPROVE {approved ? "✓ ON" : "○ OFF"}
        </button>
        <button
          type="button"
          onClick={() =>
            setResult(
              approved
                ? { ok: true, text: '← 200 · publish-asset {state:"published"}' }
                : { ok: false, text: '← 409 · {code:"not_approved", status:"rejected_mutation"}' },
            )
          }
          className="rounded-md bg-zinc-100 px-2.5 py-1.5 font-tech text-[10px] font-semibold tracking-wide text-zinc-900 transition hover:bg-white"
        >
          PUBLISH
        </button>
      </div>
      <p className={`${MONO} mt-4 min-h-4 text-[10.5px] ${result ? (result.ok ? "text-emerald-300" : "text-red-300") : "text-zinc-600"}`}>
        {result ? result.text : "← awaiting call…"}
      </p>
      <p className="mt-2 text-[11px] text-zinc-500">A diagram of the rule — the sandbox above enforces it for real.</p>
    </div>
  );
}

const SURFACES: { id: string; code: string }[] = [
  { id: "UI", code: 'onClick → update-asset({ id, state: "locked" })' },
  { id: "AGENT", code: 'tool_call · update-asset {"id":"…","state":"locked"}' },
  { id: "CLI", code: "agent-native run update-asset --id … --state locked" },
  { id: "HTTP API", code: 'POST /api/actions/update-asset {"state":"locked"}' },
  { id: "MCP", code: 'tools/call · update-asset {"state":"locked"}' },
  { id: "A2A", code: 'message/send · skill "update-asset" {"state":"locked"}' },
];

function SurfacesCell() {
  const [active, setActive] = useState(0);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
      <Fig n="0.3" title="ONE ACTION — SIX SURFACES" />
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SURFACES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-md border px-2.5 py-1 ${MONO} text-[10px] tracking-wide transition ${
              active === i
                ? "border-foreground bg-foreground text-background"
                : "border-zinc-900/15 text-zinc-600 hover:border-zinc-900/40 dark:border-white/15 dark:text-zinc-300 dark:hover:border-white/40"
            }`}
          >
            {s.id}
          </button>
        ))}
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 font-tech text-[11px] text-emerald-200/90">
        {SURFACES[active]!.code}
      </pre>
      <p className="mt-3 text-[13px] text-zinc-500 dark:text-zinc-400">
        Defined once with <span className="font-tech text-[12px] text-zinc-700 dark:text-zinc-300">defineAction()</span>. Called identically
        from every surface — the UI and the agent share one source of truth.
      </p>
    </div>
  );
}

function StateMachineCell() {
  const nodes = ["DRAFT", "LOCKED", "APPROVED", "PUBLISHED"];
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Fig n="0.4" title="ASSET STATE MACHINE" />
      <div className="mt-5 flex flex-wrap items-center gap-y-2">
        {nodes.map((n, i) => (
          <span key={n} className="flex items-center">
            <span
              className={`sm-node rounded-md border px-2 py-1 ${MONO} text-[9.5px] tracking-[0.12em] ${
                n === "LOCKED"
                  ? "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                  : n === "PUBLISHED"
                    ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-zinc-900/15 bg-zinc-50 text-zinc-600 dark:border-white/15 dark:bg-white/5 dark:text-zinc-300"
              }`}
              style={{ animationDelay: `${i * 1.5}s` }}
            >
              {n}
            </span>
            {i < nodes.length - 1 ? <span className="mx-1 text-zinc-300 dark:text-zinc-600">→</span> : null}
          </span>
        ))}
      </div>
      <ul className={`mt-4 space-y-1 ${MONO} text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400`}>
        <li>lock — text becomes final, server-enforced</li>
        <li>approve — a human, never the agent</li>
        <li>publish — only from approved, only with approval</li>
      </ul>
    </div>
  );
}

function CharLimitCell() {
  const [text, setText] = useState(
    "Today we launch Northstar — simple analytics for indie SaaS.\n\nOne dashboard. Every metric that matters. No setup marathon, no 40-tab report.\n\nLive now.",
  );
  const over = text.length > 280;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <Fig n="0.5" title="CHANNEL LIMITS, ENFORCED" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-[12.5px] leading-snug text-foreground outline-none focus:border-orange-400"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className={`${MONO} text-[10.5px] ${over ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
          X — {text.length}/280
        </span>
        <span
          className={`rounded-md border px-2 py-1 ${MONO} text-[9.5px] tracking-wide ${
            over
              ? "border-red-300 bg-red-50 text-red-600 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-400"
              : "border-emerald-600/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {over ? "SAVE DISABLED" : "WITHIN LIMIT"}
        </span>
      </div>
      <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">Type past 280 — the same rule the board runs. Try it.</p>
    </div>
  );
}

function StationsCell() {
  return (
    <div className="dot-grid-dark rounded-2xl border border-black bg-[#0a0b0d] p-5 text-zinc-200">
      <Fig n="0.6" title="ONE DAY — SIX STATIONS" dark />
      <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">
        A launch is not a calendar. It's one day — six moments on one line, every post in its
        place, in order.
      </p>
      <div className="relative mt-7" aria-hidden>
        <div className="dawn-line absolute top-[3px] right-1 left-1 h-[2px] rounded-full opacity-90" />
        <div className="relative flex justify-between">
          {SIX.map((c) => (
            <div key={c.label} className="flex w-10 flex-col items-center">
              {c.label === "X" ? (
                <span className="node-pulse size-2.5 shrink-0 rounded-full bg-[#ff5a1f]" />
              ) : (
                <span className="mt-[2px] size-1.5 shrink-0 rounded-full bg-zinc-500" />
              )}
              <span
                className={`${MONO} mt-2.5 text-[8px] tracking-[0.1em] ${c.label === "X" ? "font-semibold text-orange-400" : "text-zinc-400"}`}
              >
                {c.label}
              </span>
              <span className={`${MONO} mt-0.5 text-[8px] tracking-[0.1em] text-zinc-600`}>{c.t}</span>
            </div>
          ))}
        </div>
      </div>
      <p className={`${MONO} mt-6 text-[10px] leading-relaxed text-zinc-500`}>
        COMMUNITY OPENS THE RUNWAY · X AT T−0 · THE DAY LANDS BY T+1H — YOUR OWN COUNTDOWN LIVES
        INSIDE THE APP
      </p>
    </div>
  );
}

/* ── the day companion: three beats, one promise ────────────── */
const COMPANION: { when: string; line: string; text: string }[] = [
  {
    when: "T−1 · THE NIGHT BEFORE",
    line: "“Everything's ready — six posts set, X locked, timings fixed. Sleep. I'll run tomorrow.”",
    text: "The agent checks the whole board the night before, so the last thing you do before launch day is rest — not re-check six drafts at 1 AM.",
  },
  {
    when: "T−0 · ALL DAY, THE DAY FEED",
    line: "“09:00 — X is live. 09:05 — Product Hunt is live. Next: LinkedIn, 09:30.”",
    text: "All day, the board narrates itself: what shipped, what's next. And if a post fails, the agent doesn't go silent — it arrives with a fix. Retry it, or rewrite it?",
  },
  {
    when: "EVENING · THE LANDED REPORT",
    line: "“Every live link. The first reactions. One page.”",
    text: "When the day lands, you get the whole day on one page — proof, not screenshots you have to chase across six apps. It landed.",
  },
];

function CompanionSection() {
  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-14 sm:px-8">
      <Reveal>
        <p className={`${MONO} text-[10px] tracking-[0.2em] text-zinc-400`}>THE DAY COMPANION</p>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">
          You're not alone on <span className="dawn-text">launch day.</span>
        </h2>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
          Schedulers sell efficiency — save time, post everywhere. Nobody sells this: on the most
          nervous day of building in public, something competent is awake with you, running the
          day beside you.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {COMPANION.map((beat) => (
            <div key={beat.when} className="rounded-2xl border border-border bg-card p-5">
              <p className={`${MONO} text-[10px] tracking-[0.2em] text-orange-600 dark:text-orange-400`}>{beat.when}</p>
              <p className="font-display mt-3 text-[15px] leading-snug font-semibold text-foreground">
                {beat.line}
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{beat.text}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── the page ───────────────────────────────────────────────── */
export default function LaunchWebsite({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* status strip */}
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2 sm:px-8">
          <span className={`${MONO} text-[10px] tracking-[0.2em] text-zinc-500`}>
            LAUNCH® — AGENT-NATIVE LAUNCH SYSTEM
          </span>
          <span className={`${MONO} ml-auto text-[10px] tracking-[0.14em] text-zinc-500`}>
            {signedIn ? (
              <>
                YOU'RE SIGNED IN
                <Link to="/dashboard" className="ml-4 font-semibold text-orange-600 hover:text-orange-500">
                  OPEN THE APP →
                </Link>
              </>
            ) : (
              <>
                SCHEDULERS SEND POSTS — <span className="text-foreground">LAUNCH RUNS THE DAY</span>
                {/* /sign-in is a server-rendered standalone page, not an SPA
                    route — it must be a plain anchor (full document load).
                    A router <Link> lands on the SPA's 404 until refreshed. */}
                <a href="/sign-in" className="ml-4 font-semibold text-foreground hover:text-orange-600">
                  SIGN IN
                </a>
              </>
            )}
          </span>
        </div>
      </div>

      {/* nav */}
      <header className="mx-auto flex max-w-[1440px] items-center gap-6 px-5 py-4 sm:px-8">
        <span className="font-display text-lg font-bold tracking-tight">
          Launch<sup className="text-orange-500">®</sup>
        </span>
        <nav className="ml-auto hidden items-center gap-6 text-sm text-zinc-500 sm:flex dark:text-zinc-400">
          <a href="#sandbox" className="transition hover:text-foreground">Live sandbox</a>
          <a href="#rules" className="transition hover:text-foreground">The rules</a>
          {signedIn ? null : (
            <a href="/sign-in" className="transition hover:text-foreground">Sign in</a>
          )}
        </nav>
        {signedIn ? (
          <Link
            to="/dashboard"
            className="ml-auto rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-85 sm:ml-0"
          >
            Open the app
          </Link>
        ) : (
          <a
            href="/sign-in"
            className="ml-auto rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-85 sm:ml-0"
          >
            Get started
          </a>
        )}
      </header>

      <main>
        {/* hero */}
        <section className="relative overflow-hidden">
          <GlassArc />
          <div className="relative mx-auto max-w-[1440px] px-5 pt-14 pb-12 sm:px-8 sm:pt-20">
            <div className="flex flex-wrap gap-1.5">
              {["defineAction() × 6", "UI · AGENT · CLI · API · MCP · A2A", signedIn ? "● LIVE SANDBOX BELOW" : "● SANDBOX BELOW — LIVE AFTER SIGN-IN"].map((b) => (
                <span
                  key={b}
                  className={`rounded-md border border-border bg-card/70 px-2 py-1 ${MONO} text-[10px] tracking-[0.12em] text-muted-foreground`}
                >
                  {b}
                </span>
              ))}
            </div>
            <h1 className="font-display mt-6 max-w-3xl text-[clamp(2.7rem,6vw,4.9rem)] leading-[0.98] font-bold tracking-tight">
              Launch day,
              <br />
              on one <span className="dawn-text">runway.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Launch day is the one day every other tool leaves you alone. Not here. One board where
              you and your agent draft every channel post together — lock the one that matters and
              the rest adapt around it. Nothing goes live without your approval.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {signedIn ? (
                <Link
                  to="/dashboard"
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-85"
                >
                  Open the app →
                </Link>
              ) : (
                <a
                  href="/sign-in"
                  className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-85"
                >
                  Get started →
                </a>
              )}
              <a
                href="#sandbox"
                className="rounded-full border border-zinc-900/15 px-5 py-2.5 text-sm font-semibold transition hover:border-zinc-900/40 dark:border-white/15 dark:hover:border-white/40"
              >
                {signedIn ? "See it running ↓" : "See the board ↓"}
              </a>
            </div>
            <p className="mt-5 max-w-xl text-[13.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Schedulers give your posts a calendar. Launch gives you a partner for launch day.
            </p>
            <p className={`${MONO} mt-10 text-[10.5px] tracking-[0.16em] text-zinc-400`}>
              6 CHANNELS — 1 BOARD — 6 SURFACES — 0 POSTS LIVE WITHOUT APPROVAL
            </p>
          </div>
        </section>

        {/* live sandbox */}
        <section id="sandbox" className="mx-auto max-w-[1440px] scroll-mt-6 px-5 sm:px-8">
          <div className="dot-grid-dark rounded-[1.5rem] border border-black bg-[#0a0b0d] p-4 text-zinc-200 shadow-[0_24px_60px_rgba(20,10,5,0.25)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="font-display text-xl font-semibold text-white">The product, running live</h2>
              <span className={`${MONO} text-[10px] tracking-[0.18em] text-zinc-500`}>
                {signedIn ? "FIG 0.0 — NOT A MOCKUP. CLICK THINGS." : "FIG 0.0 — THE REAL ACTIONS. SIGN IN AND CLICK THINGS."}
              </span>
            </div>
            <LaunchSandbox />
          </div>
        </section>

        {/* bento — the rules as components */}
        <section id="rules" className="mx-auto max-w-[1440px] scroll-mt-6 px-5 py-14 sm:px-8">
          <Reveal>
            <p className={`${MONO} text-[10px] tracking-[0.2em] text-zinc-400`}>THE RULES, AS COMPONENTS</p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">The system, not the story.</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <ChaosOrderCell />
              <GateCell />
              <SurfacesCell />
              <StateMachineCell />
              <CharLimitCell />
              <StationsCell />
            </div>
          </Reveal>
        </section>

        {/* the day companion */}
        <CompanionSection />

        {/* finale — the whole day on one line, right before it lands in the footer */}
        <section className="relative overflow-hidden border-t border-border">
          <div className="mx-auto max-w-[1440px] px-5 py-14 text-center sm:px-8">
            <Reveal>
              <p className={`${MONO} text-[10px] tracking-[0.22em] text-zinc-400`}>T−0 IS COMING EITHER WAY</p>
              <h2 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                See you on <span className="dawn-text">launch day.</span>
              </h2>

              {/* every channel on the runway line — the day itself fills the space */}
              <div className="relative mx-auto mt-14 max-w-6xl" aria-hidden>
                <div className="dawn-line absolute top-[5px] right-8 left-8 h-[2px] rounded-full opacity-90" />
                <div className="relative flex justify-between">
                  {SIX.map((c) => (
                    <div key={c.label} className="flex w-14 flex-col items-center sm:w-16">
                      {c.label === "X" ? (
                        <span className="node-pulse size-3 shrink-0 rounded-full bg-[#ff5a1f]" />
                      ) : (
                        <span className="mt-[3px] size-1.5 shrink-0 rounded-full bg-zinc-400" />
                      )}
                      <span className={`${MONO} mt-3 text-[8.5px] tracking-[0.14em] sm:text-[9.5px] ${c.label === "X" ? "font-semibold text-orange-600 dark:text-orange-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                        {c.label}
                      </span>
                      <span className={`${MONO} mt-0.5 text-[9px] tracking-[0.14em] text-zinc-400`}>{c.t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {signedIn ? (
                <Link
                  to="/dashboard"
                  className="mt-12 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-85"
                >
                  Open the app →
                </Link>
              ) : (
                <a
                  href="/sign-in"
                  className="mt-12 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:opacity-85"
                >
                  Get started →
                </a>
              )}
            </Reveal>
          </div>
        </section>
      </main>

      {/* footer — the bookend: the runway lands, the arc comes home */}
      <footer className="relative overflow-hidden bg-[#0a0b0d] text-zinc-400">
        {/* dawn glow where the runway lands */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(48rem_17rem_at_50%_118%,rgba(255,77,0,0.30),rgba(255,150,60,0.10)_55%,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-[1440px] px-5 pt-12 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="font-display text-lg font-bold text-white">
                Launch<sup className="text-orange-500">®</sup>
              </p>
              <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-zinc-500">
                The launch-day war room where a human and an agent run every channel from one board —
                locks enforced, publishing approved, nothing improvised.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className={`${MONO} text-[10px] tracking-[0.2em] text-zinc-600`}>PRODUCT</span>
              <a href="#sandbox" className="transition hover:text-white">Live sandbox</a>
              <a href="#rules" className="transition hover:text-white">The rules</a>
              {signedIn ? (
                <Link to="/dashboard" className="transition hover:text-white">Open the app</Link>
              ) : (
                <a href="/sign-in" className="transition hover:text-white">Get started</a>
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <span className={`${MONO} text-[10px] tracking-[0.2em] text-zinc-600`}>THE SYSTEM</span>
              <span>One defineAction(), six surfaces</span>
              <span>Lock → adapt → approve → publish</span>
              <span>A2A with the other Agent-Native apps</span>
            </div>
          </div>

          {/* the runway, landing: the whole day on one line, ending at T−0 */}
          <div className="relative mt-14" aria-hidden>
            <span className={`${MONO} absolute -top-6 left-1/2 -translate-x-1/2 text-[9.5px] tracking-[0.22em] text-orange-400`}>
              T−0 · LANDED
            </span>
            <div className="dawn-line h-[2px] w-full rounded-full opacity-90" />
            <span className="node-pulse absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff5a1f]" />
            <span className={`${MONO} absolute top-1/2 left-0 -translate-y-1/2 bg-[#0a0b0d] pr-3 text-[9.5px] tracking-[0.16em] text-zinc-600`}>
              T−15H
            </span>
            <span className={`${MONO} absolute top-1/2 right-0 -translate-y-1/2 bg-[#0a0b0d] pl-3 text-[9.5px] tracking-[0.16em] text-zinc-600`}>
              T+1H
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-1.5 border-t border-white/10 pt-5">
            {["DRAFT", "LOCK", "ADAPT", "APPROVE", "PUBLISH"].map((v) => (
              <span key={v} className={`rounded-full border border-white/10 px-2.5 py-1 ${MONO} text-[9.5px] tracking-[0.16em] text-zinc-400`}>
                {v}
              </span>
            ))}
            <span className={`${MONO} ml-auto text-[10px] text-zinc-600`}>
              © 2026 LAUNCH · BUILT ON AGENT-NATIVE
            </span>
          </div>

          {/* the closing scene: giant wordmark, the glass arc drifting over it,
              both cropped by the page edge — the hero's 3D language, landed */}
          <div aria-hidden className="pointer-events-none relative mt-6 h-40 select-none sm:h-60">
            <p className="font-display absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[24%] text-[clamp(7rem,18vw,16rem)] leading-[0.78] font-bold tracking-tight whitespace-nowrap text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.13)]">
              LAUNCH
            </p>
            <div className="absolute bottom-[-2.75rem] left-1/2 w-[78rem] max-w-none -translate-x-1/2 rotate-[9deg]">
              <div className="flex flex-col gap-4 [mask-image:linear-gradient(90deg,transparent,black_16%,black_84%,transparent)]">
                <ArcRow dark labels={[...ARC_B].reverse()} anim="animate-arc-b" offset="-3rem" />
                <ArcRow dark labels={ARC_A} anim="animate-arc-a" offset="0" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
