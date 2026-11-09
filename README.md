# Launch — the launch-day war room

**Schedulers send posts. Launch runs launch day: you lock what's final, the agent adapts everything else around it and ships on time — nothing goes out without your approval.**

**Live: [launch-runway.vercel.app](https://launch-runway.vercel.app)**

Every scheduler gives posts a calendar. Nobody gives a founder the day itself. Launch puts all six launch channels — Community, X, Product Hunt, email, LinkedIn, Hacker News — on one runway board, from T−15h to T+1h, with one countdown and one agent working the day with you.

## What makes it different

1. **LOCK** — a locked post is final for everyone, including the agent itself. Lock the hero X post and the backend rejects any later edit to it with a real `asset_locked` error; the locked text stays byte-identical. Only the founder can unlock, from the board.
2. **ADAPT** — change the plan once and the agent rewrites every unlocked channel draft around the locked source, live on the same board, using the exact same actions the UI calls.
3. **APPROVE** — nothing publishes without the founder's explicit approval. The gate is enforced server-side in the publish action, not in the UI.

The board, the chat and the agent all call the same shared `defineAction()`s — there is no separate "agent version" of any capability.

## The Day Companion

- **Day Feed** — the day narrates itself as posts go live (with the real link), what's next, and what needs attention.
- **LANDED panel** — when the day wraps, every channel's final state lands in one report: live links, locked finals, and an honest line for anything that failed. *"Ho gaya."*
- **Channels card** — real posting connects from the dashboard: LinkedIn and X connect with the founder's own accounts (behind the scenes via Composio; X needs the workspace's own X developer app, as X requires), Gmail and Slack connect from Settings. Product Hunt and Hacker News have no posting API anywhere, so Launch prepares the submission and walks the founder to the submit step instead of pretending otherwise.

## Actions (one definition — UI, agent, API, CLI, MCP)

| Action | Purpose |
| --- | --- |
| `create-launch` | Create a launch (product, one-liner, audience, launch time) |
| `list-launches` | Launches the user can see |
| `create-assets` | Add the six-channel kit in one batch |
| `list-assets` | Assets on a board, in scheduled order |
| `update-asset` | Edit copy / title / state / comment / schedule (rejected on locked assets) |
| `publish-asset` | Publish an approved asset — human approval required for the specific call |
| `record-post-result` | Attach the channel's real live URL (or the failure) after posting |

## Built on

Builder.io's **Agent-Native** chat template (`@agent-native/core` 0.222.2). Everything else — the runway board, the enforced lock, adapt-around-lock, the approval gate, the Channels card, the Day Feed and the LANDED panel — was built during the hackathon (Oct 27 – Nov 9, 2026).

Built solo by Aashi for the Builder.io Agent-Native Hackathon.

## Run locally

```bash
pnpm install
pnpm exec agent-native dev
```
