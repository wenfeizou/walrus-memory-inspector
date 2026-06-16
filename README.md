# Walrus Memory Inspector

Walrus Memory Inspector is a Walrus-track MVP for making AI agent memory visible, debuggable, and auditable.

It is designed for the Walrus AI memory track: instead of treating Walrus as simple file storage, the app turns agent
memory into persistent artifacts that can be inspected, diagnosed, fixed, audited, and exported.

## Features

- Persistent memory artifacts
- Walrus HTTP upload with local demo fallback
- Walrus upload diagnostics with endpoint, timeout, storage mode, and fallback reason
- Upload loading states and duplicate-click guards for artifact-producing actions
- Agent run traces
- Cited memories for generated answers
- Conflict detection across deadline, requirement version, and ownership memories
- One-click conflict resolution with audit artifacts
- Memory health scoring
- Retrieval scoring with matched tokens and citation reasons
- Artifact timeline from raw memory to summary, trace, and audit log
- Artifact graph edges across memory, summary, trace, and audit artifacts
- Evidence bundle JSON export
- Evidence bundle JSON import for cross-session handoff
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

## Current Agent Mode

The current MVP uses a deterministic local agent for reproducible memory debugging. It does not call a live LLM API yet.

The flow is:

```text
question -> retrieve scored memories -> select active candidates -> generate rule-based answer -> store trace artifact
```

A live LLM can be added later behind the same retrieval and trace interface.

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

For local Walrus overrides:

```bash
cp .env.example .env.local
```

## Build And Verify

```bash
bun run build
bun run test
bun outdated
```

Dependency versions are pinned exactly in `package.json` and locked with `bun.lock`.

## Walrus Settings

The adapter uses public testnet endpoints by default:

```bash
VITE_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
VITE_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_UPLOAD_TIMEOUT_MS=10000
```

Create a `.env.local` file to override them:

```bash
VITE_WALRUS_PUBLISHER_URL=<your-publisher-url>
VITE_WALRUS_AGGREGATOR_URL=<your-aggregator-url>
VITE_WALRUS_UPLOAD_TIMEOUT_MS=10000
```

Copy `.env.example` to `.env.local` when you need local overrides.

## Walrus Verification

The default testnet endpoints were verified on 2026-06-15:

- Publisher CORS preflight accepted browser `PUT` requests from a localhost origin.
- `PUT /v1/blobs` returned a real blob ID.
- Aggregator `GET /v1/blobs/:blobId` returned the uploaded JSON artifact.
- The observed upload took about 7.2 seconds, so the default upload timeout is 10000ms.

Current decision: a backend proxy is not required for the default testnet path. Add one only if the judging endpoint needs private credentials, has unstable CORS behavior, or repeatedly exceeds the browser-direct timeout.

## Demo Script

See [docs/demo-walkthrough.md](docs/demo-walkthrough.md) for the full presenter walkthrough.

1. Click `Reset Demo` to create a fresh artifact chain.
2. Show `Walrus Diagnostics` and confirm whether artifacts are real Walrus blobs or local demo fallback.
3. Show `Memory Health`: the score reflects unresolved memory conflicts.
4. Show `Conflict Radar`: it detects deadline, requirement version, and owner/source conflicts.
5. Run the default question: `What is the current hackathon deadline?`
6. Open `Trace Viewer` and show retrieval scores, matched tokens, and citation reasons.
7. Click `Resolve by latest memory` to mark stale deadline memory outdated.
8. Run the agent again and show the answer citing the updated June 15 memory.
9. Open `Audit Log`, `Artifact Timeline`, and `Artifact Graph`.
10. Click `Export Evidence Bundle` to download a portable JSON package.
11. Click `Import Evidence Bundle` to restore the exported memory debugging session.

## Submission Docs

- [Architecture](docs/architecture.md)
- [Demo walkthrough](docs/demo-walkthrough.md)
- [Judging notes](docs/judging-notes.md)
- [Video script](docs/video-script.md)
- [Walrus track fit analysis](docs/walrus-track-fit.md)
- [Submission checklist](docs/submission-checklist.md)
- [Project recreation brief](docs/project-recreation-brief.md)

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
  -> Walrus Diagnostics
  -> Artifact Timeline
  -> Artifact Graph
  -> Evidence Bundle export/import
  -> Audit log
```

See [docs/architecture.md](docs/architecture.md) for Mermaid diagrams.

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
  -> summarize upload diagnostics
  -> export evidence bundle
  -> import evidence bundle for handoff/replay
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
- Walrus Diagnostics records fallback reasons, but it does not make browser-to-publisher upload more reliable by itself.
- Metadata persistence is browser-local through `localStorage`.
- Retrieval uses explainable keyword scoring instead of embedding search.
- Conflict detection covers a small set of transparent rules, not arbitrary contradiction detection.
- Artifact Graph is an edge list rather than an interactive graph canvas.
- Automated tests cover the core conflict, inspector, upload diagnostics, evidence bundle, and agent retrieval logic.

## Next Steps

1. Confirm the preferred Walrus publisher endpoint for the judging environment.
2. Use Walrus Diagnostics to decide whether browser-direct upload is stable enough or a backend proxy is needed.
3. Add a server-side metadata index if browser-only storage is not enough.
4. Add embedding search for richer retrieval.
5. Add MemWal integration if using its delegated key flow.
6. Add an interactive artifact graph canvas.
