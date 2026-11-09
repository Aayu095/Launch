# Chat — Agent Guide

Chat is the minimal chat-first agent-native app. `/` redirects to shared sign-in, then `/home`, the editable Get started page. Chat lives at `/chat`; new chats start there. Actions carry capabilities; screens exist only for durable workflows.

## Skills

Search with `rg --hidden --follow`; read the exact linked guide before deeper work. `.agents/skills/build-an-app/SKILL.md` — start here for vague requests to create a domain app. `.agents/skills/adding-a-feature/SKILL.md` — cross-area feature checklist. Data/integrations: `.agents/skills/actions/SKILL.md`, `.agents/skills/storing-data/SKILL.md`, `.agents/skills/security/SKILL.md`, `.agents/skills/secrets/SKILL.md`, `.agents/skills/sharing/SKILL.md`. UI: `.agents/skills/frontend-design/SKILL.md`, `.agents/skills/shadcn-ui/SKILL.md`, `.agents/skills/client-side-routing/SKILL.md`. Agent context/workflows: `.agents/skills/context-awareness/SKILL.md`, `.agents/skills/real-time-sync/SKILL.md`, `.agents/skills/reliable-mutations/SKILL.md`, `.agents/skills/performance/SKILL.md`, `.agents/skills/delegate-to-agent/SKILL.md`. Framework: `.agents/skills/agent-native-docs/SKILL.md`, `.agents/skills/agent-native-toolkit/SKILL.md`, `.agents/skills/customizing-agent-native/SKILL.md`.

Use local docs only (no web research): `pnpm action docs-search --query "<topic>"`, `pnpm action docs-search --slug "<slug>"`, `pnpm action docs-search --list`, `pnpm action source-search --query "<pattern>"`, `pnpm action source-search --path <path>`, or `pnpm action source-search --list`. For external-agent integrations, read `pnpm action docs-search --slug "external-agents"`.

## Core rules

- UI feedback: target 100 ms, never exceed 400 ms; acknowledge before network work.
- Normal app data must flow through actions. Keep actions deterministic and focused; use agent chat/AgentSidebar for AI work and follow-ups in the same thread. Keep structured state in SQL and large files in configured storage; persist references only.
- For external integrations, inspect the workspace/provider connection catalog first; reuse its scoped resolver. Never hardcode credentials, webhook URLs, or private/customer data.
- Never fabricate. Report failures and recover; verify writes by reading the row or screen. Navigation is in `<current-screen>`; use `view-screen` for fresh visible-record details.

For custom branding, keep `server/plugins/agent-native-email-branding.ts` aligned: `app.name` appears in transactional email and optional `app.logoUrl` must be an absolute HTTPS URL.

## Application state

- `navigation` describes the view and selected ids. Chat is `chat` at `/chat` and `/chat/<threadId>`; the Get started page is `home` at `/home`; `/` opens shared sign-in/signup.
- Use `navigate` when supported and `view-screen` for a fresh read of visible details; basic navigation is already in `<current-screen>`.

## Building a domain app

Choose the primary workflow and route before editing. Add a domain route under `app/routes/` and set `app.homePath` in `server/plugins/agent-native-email-branding.ts` with `defineAppConfig`. The default Get started page lives at `/home`, and Chat stays at `/chat`; edit `app/routes/home.tsx` when replacing that page with a domain-specific home. Add a static link in `app/components/layout/Sidebar.tsx` before `ChatThreadsSection`; `Header.tsx` uses `APP_TITLE` elsewhere. Shared sidebar and AgentInspector remain.

Use `adding-a-feature` for functional parity and `frontend-design` for a user-facing screen. Keep feature guidance here; do not rewrite `README.md` or `DESIGN.md`. After all edits, run one typecheck, one doctor check, and one browser smoke of the primary workflow, including overlap rejection, cancellation freeing the slot, and authenticated landing. Skip production build and extra test suites.

Before building common workspace or agent UI, read `agent-native-toolkit`; for supported customization, read `customizing-agent-native`.

- Guarded verification: run `pnpm agent-native:doctor`; fix findings before done.

## Launch

Launch is a launch-day war room: one runway board at `/launch?launch=<id>` where the user and the agent co-edit channel assets through the same actions. Chat stays at `/chat`. The domain home at `/home` (app homePath) is the Launch intro page — product story, how-it-works, and the real board screenshot at `public/board.png` — with CTAs into the board. The home is a standalone full page, NOT framed by the app shell: `homeOwnsChrome` in `app/components/layout/Layout.tsx` (the same opt-out pattern settings uses) renders no Sidebar, no Header/MobileAppBar, and no AgentInspector on HOME_PATH — the home brings its own header; providers and data stay. The home is personalized per signed-in user: its "Your next launch" panel reads that user's own `list-launches`/`list-assets` — live countdown, readiness counts, and a Continue CTA to their launch (empty state prompts a first launch). Design rule (Aashi, 2026-10-31): the template is the engine, not the design — build the product beyond it; never present the intro framed by the app sidebar. The home's art direction (rebuilt 2026-11-01, supersedes the earlier "editorial story" and "launch-day sunrise" directions): a light, airy paper canvas with dark engineering islands — Linear/Vercel density, not prose. A flowing 3D glass arc (`.glass-tile` tiles on the dawn wash, `.animate-arc-a/b` in global.css) sweeps diagonally across the hero, its tiles labeled with channels/states/times. The hero's centerpiece is a LIVE SANDBOX (`app/components/launch-sandbox.tsx`): a real mini runway board on a dedicated "Northstar — Sandbox" launch (auto-provisioned via the real `create-launch`/`create-assets`; Reset re-seeds a fresh one; the user's real launches are never touched, and `useMyRunway` on the home excludes the sandbox launch). Every sandbox click calls the real actions; the execution terminal beside the board logs the real request/response JSON (including the real `asset_locked` 409 on editing a locked card). Adapt is dispatched from the sandbox but executes in the app via the agent (needs the AI connection) — never fake a rewrite on the page. Below the sandbox, the rules are a bento grid of interactive components with "Fig 0.x" captions (chaos-vs-order toggle, approval-gate diagram, six-surfaces switcher, state machine, character-limit editor, live countdown cell); the footer is dark and dense with verb pills. The dawn gradient (`.dawn-line` / `.dawn-text`) is reserved for the line, progress, and accent words only. Brand: warm-paper tokens in `app/global.css`, Space Grotesk (`.font-display`) for headings, JetBrains Mono (`.font-tech`) for labels/countdowns, and a signal-orange accent (`.bg-signal` / `.text-signal`); locked assets use an ink "stamp" pill.

- Launches are org-visible with an active org, private to their creator otherwise. Assets inherit their launch's access via the copied `org_id`.
- Asset states: `draft` -> `locked` or `approved` -> `published`. A locked asset's text is final: `update-asset` rejects text changes with `asset_locked` (409) until it is unlocked back to `draft`. Report that rejection; never try to route around it.
- `publish-asset` is the only way to publish. It fails with `not_approved` unless the asset is `approved`, and it always needs the human to approve the specific call. Never publish on your own initiative.
- To build a kit, call `create-launch`, then one `create-assets` with every channel (`x`, `product-hunt`, `linkedin`, `hacker-news`, `email`, `community`), each in its channel's native format, scheduled around the launch time. To adapt, read with `list-assets` and rewrite only unlocked, unpublished assets with `update-asset`.
- Times: collect in the user's timezone, send ISO 8601 with an offset; actions store normalized UTC. On board pages `navigation` view is `launch`.

| Action | Purpose |
| --- | --- |
| list-launches | Launches the user can see |
| create-launch | Create a launch (product, one-liner, audience, launch time) |
| list-assets | Assets on a launch board, in scheduled order |
| create-assets | Add a batch of channel assets as drafts |
| update-asset | Edit copy/title/state/comment/schedule of one asset |
| publish-asset | Mark an approved asset published (human approval required) |
| record-post-result | After a real channel post, attach its live URL (or the failure) to the published asset |
