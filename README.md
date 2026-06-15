# Walrus Memory Inspector

Walrus Memory Inspector is a Walrus-track MVP for making AI agent memory visible, debuggable, and auditable.

It is designed for the Walrus AI memory track: instead of treating Walrus as simple file storage, the app turns agent
memory into persistent artifacts that can be inspected, diagnosed, fixed, audited, and exported.

## Features

- Persistent memory artifacts
- Walrus HTTP upload with local demo fallback
- Agent run traces
- Cited memories for generated answers
- Conflict detection across contradictory memories
- One-click conflict resolution with audit artifacts
- Memory health scoring
- Artifact timeline from raw memory to summary, trace, and audit log
- Artifact graph edges across memory, summary, trace, and audit artifacts
- Evidence bundle JSON export
- Memory status management: active, important, outdated, archived

## Why This Fits Walrus

Walrus Memory Inspector treats memory as durable, inspectable artifacts:

```text
raw memory -> summary artifact -> agent run trace -> audit log -> improved answer
```

Walrus is the conceptual storage layer for:

- raw memories
- summaries
- agent traces
- audit logs

The app stores artifacts through the Walrus HTTP publisher when available. If the publisher is unavailable, blocked by the browser, or not configured for the environment, it falls back to local demo artifacts with `walrus-demo-*` blob IDs.

## Tech Stack

- Runtime/package manager: Bun
- App framework: React 19
- Language: TypeScript 6
- Build tool: Vite 8
- Styling: Tailwind CSS v4 through `@tailwindcss/vite`
- Icons: `lucide-react`
- Persistence: browser `localStorage` for metadata, Walrus HTTP publisher for artifacts
- CSS entrypoint: Tailwind v4 via `src/styles.css`

## Quick Start

```bash
bun install
bun run dev
```

Open the local URL printed by Vite.

## Build And Verify

```bash
bun run build
bun outdated
```

Dependency versions are pinned exactly in `package.json` and locked with `bun.lock`.

## Walrus Settings

The adapter uses public testnet endpoints by default:

```bash
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_UPLOAD_TIMEOUT_MS=1500
```

Create a `.env.local` file to override them:

```bash
VITE_WALRUS_PUBLISHER_URL=<your-publisher-url>
VITE_WALRUS_AGGREGATOR_URL=<your-aggregator-url>
VITE_WALRUS_UPLOAD_TIMEOUT_MS=3000
```

## Demo Script

1. Run the agent with the default question: `What is the current hackathon deadline?`
2. Show `Memory Health`: the score reflects the unresolved conflict.
3. Show `Conflict Radar`: it detects the June 20 vs June 15 deadline conflict.
4. Click `Resolve by latest memory` to mark the stale deadline memory outdated.
5. Run the agent again.
6. Observe that the answer now cites the updated June 15 memory.
7. Open `Artifact Timeline`, `Artifact Graph`, and `Audit Log` to show the raw memory, summary, trace, and audit artifacts.
8. Click `Export Evidence Bundle` to download a portable JSON package for judging or cross-agent handoff.

## Architecture

```text
Memory Browser
  -> local metadata index
  -> Walrus HTTP artifact adapter
  -> conflict detector
  -> memory health scoring
  -> Agent Q&A
  -> Agent run trace
  -> Memory Inspector
  -> Artifact Timeline
  -> Artifact Graph
  -> Evidence Bundle
  -> Audit log
```

## Data Flow

```text
seed memory / create memory
  -> store raw artifact through Walrus adapter
  -> store summary artifact through Walrus adapter
  -> detect conflicts
  -> run agent with cited memories
  -> store agent trace artifact
  -> resolve stale memory
  -> store audit artifact
  -> export evidence bundle
```

## Project Structure

- `src/main.tsx`: UI, app state, and user workflows
- `src/agent.ts`: retrieval and answer generation logic
- `src/conflicts.ts`: contradictory memory detection
- `src/inspector.ts`: timeline, graph, health score, and evidence export utilities
- `src/walrusAdapter.ts`: storage adapter abstraction
- `src/demoData.ts`: seed memories
- `src/types.ts`: domain model
- `src/storage.ts`: browser persistence

## Current Limitations

- Real Walrus upload still needs to be verified in the target network and judging environment.
- Browser-to-publisher upload can be affected by CORS, latency, or endpoint availability.
- Metadata persistence is browser-local through `localStorage`.
- Retrieval uses simple keyword scoring instead of embedding search.
- Conflict detection currently focuses on deadline date conflicts.
- Artifact Graph is an edge list rather than an interactive graph canvas.
- Verification currently relies on `bun run build`; no dedicated test suite is included.

## Next Steps

1. Confirm the preferred Walrus publisher endpoint for the judging environment.
2. Add a server-side metadata index if browser-only storage is not enough.
3. Add embedding search for richer retrieval.
4. Add MemWal integration if using its delegated key flow.
5. Add an interactive artifact graph canvas.
