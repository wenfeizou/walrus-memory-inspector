# Architecture

Walrus Memory Inspector is a browser-only MVP. The browser keeps metadata in `localStorage` and writes durable artifacts through the Walrus HTTP publisher when available.

## System Diagram

```mermaid
flowchart LR
  User[User / Judge] --> UI[React Inspector UI]
  UI --> State[Local metadata index<br/>localStorage]
  UI --> Adapter[Walrus Adapter]
  Adapter --> Publisher[Walrus Publisher<br/>PUT /v1/blobs]
  Publisher --> Blob[Walrus Blob ID]
  Blob --> Aggregator[Walrus Aggregator<br/>GET /v1/blobs/:id]
  Adapter --> Fallback[Local demo artifact<br/>walrus-demo-*]

  State --> Browser[Memory Browser]
  State --> Conflict[Conflict Radar]
  State --> Agent[Agent Q&A]
  State --> Health[Memory Health]
  State --> Timeline[Artifact Timeline]
  State --> Graph[Artifact Graph]
  State --> Bundle[Evidence Bundle Export]

  Agent --> Trace[Agent trace artifact]
  Conflict --> Audit[Audit log artifact]
  Trace --> Adapter
  Audit --> Adapter
```

## Artifact Chain

```mermaid
sequenceDiagram
  participant UI as React UI
  participant Adapter as Walrus Adapter
  participant Walrus as Walrus Publisher
  participant State as localStorage

  UI->>Adapter: Store raw memory
  Adapter->>Walrus: PUT /v1/blobs
  Walrus-->>Adapter: blobId / objectId
  Adapter-->>UI: WalrusArtifact
  UI->>Adapter: Store summary
  Adapter->>Walrus: PUT /v1/blobs
  UI->>State: Save memory metadata
  UI->>UI: Detect conflicts and score memory health
  UI->>Adapter: Store agent trace / audit log
  Adapter->>Walrus: PUT /v1/blobs
  UI->>State: Save trace and audit metadata
  UI-->>UI: Export evidence bundle JSON
```

## Core Boundaries

- `src/main.tsx`: UI workflows and state transitions.
- `src/walrusAdapter.ts`: artifact storage boundary, timeout, diagnostics, and fallback.
- `src/agent.ts`: explainable retrieval, answer generation, and trace artifact creation.
- `src/conflicts.ts`: transparent conflict rules.
- `src/inspector.ts`: derived views for health, timeline, graph, diagnostics, and evidence bundles.
- `src/storage.ts`: local metadata persistence and migration.

## Backend Decision

The default Walrus testnet browser-direct path was verified on 2026-06-15. A backend proxy is not required for the current MVP.

Add a backend proxy only if:

- The judging publisher endpoint requires private credentials.
- Browser CORS behavior changes or blocks upload.
- Uploads repeatedly exceed the configured timeout.
- Metadata needs to be shared across users, devices, or browsers.
