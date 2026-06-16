# Video Script

Use this script for the submission video or a timed live walkthrough.

## 60-Second Pitch

```text
Walrus Memory Inspector is a developer tool for persistent AI memory.

Most agent memory demos only show that an agent can remember something. This project shows how memory can be inspected, debugged, corrected, audited, and exported as durable artifacts.

The artifact chain is raw memory, summary, agent trace, audit log, and evidence bundle. The demo detects contradictory memories, runs an agent with cited memories, shows retrieval scores and citation reasons, resolves stale memory, records the fix as an audit artifact, and exports or imports the full memory evidence bundle.

This fits the Walrus track because it demonstrates long-term memory, persistent data access, artifact-driven workflows, and tooling that helps developers trust and debug agent memory stored on Walrus.
```

## 3-5 Minute Recording Flow

### 0:00-0:30 - Project Setup

Show the app title and top-level metrics.

Say:

```text
This is Walrus Memory Inspector, a browser-only MVP for making AI agent memory visible, debuggable, and auditable.
```

Click `Reset Demo`.

Say:

```text
Reset Demo creates a fresh memory state and stores raw memory and summary artifacts.
```

Say:

```text
The top quick nav lets us jump directly to Diagnostics, Health, Conflicts, Agent, Trace, Memories, Audit, Timeline, Graph, and Bundle during the demo.
```

### 0:30-1:00 - Walrus Storage Visibility

Show `Walrus Diagnostics`.

Point to:

- Publisher URL
- Aggregator URL
- Walrus count
- Fallback count
- Latest upload
- Recent upload events

Say:

```text
The app makes storage behavior explicit. Every artifact records whether it reached Walrus, how long upload took, and why fallback happened if it failed.
```

### 1:00-1:35 - Memory Health And Conflicts

Show `Memory Health`.

Say:

```text
Memory Health gives a quick trust score for the agent's memory set.
```

Show `Conflict Radar`.

Say:

```text
Conflict Radar detects contradictory memory claims, including deadline, requirement version, and owner or source conflicts.
```

### 1:35-2:20 - Run The Agent And Inspect Trace

Run:

```text
What is the current hackathon deadline?
```

Show `Latest Answer`.

Open `Trace Viewer`.

Point to:

- Used memories
- Retrieval scores
- Matched tokens
- Citation reasons
- Status penalty for outdated memories

Say:

```text
The agent is deterministic in this MVP so the debugging flow is reproducible. It does not call a live LLM API yet. The important part is the memory and trace layer: we can see which memories were considered, which were selected, and why.
```

### 2:20-3:00 - Resolve Memory Conflict

Return to `Conflict Radar`.

Click `Resolve by latest memory`.

Say:

```text
Resolving a conflict does not silently mutate memory. It marks stale memory outdated and creates an audit artifact.
```

Run the agent again.

Say:

```text
After the correction, the agent cites the updated June 15 deadline, and the trace explains why.
```

### 3:00-3:45 - Artifact Provenance

Show:

- `Audit Log`
- `Artifact Timeline`
- `Artifact Graph`

Say:

```text
The timeline and graph show the provenance chain from raw memory to summary, trace, and audit artifacts.
```

### 3:45-4:30 - Evidence Bundle Export And Import

Click `Export Evidence Bundle`.

Say:

```text
The evidence bundle packages memories, conflicts, agent traces, audit logs, timeline entries, health metrics, and upload diagnostics.
```

Click `Import Evidence Bundle` and select the exported JSON.

Say:

```text
Import restores the debugging session without a backend, demonstrating portable cross-session memory handoff.
```

### 4:30-5:00 - Closing

Say:

```text
Walrus is not just file storage here. It is the durable artifact layer that makes agent memory reviewable, portable, and auditable. The next steps would be MemWal integration, a shared metadata index, and a live LLM behind the same retrieval and trace interface.
```

## Short Checklist Before Recording

- Run `bun run test`.
- Run `bun run build`.
- Start with `bun run dev`.
- Confirm `Reset Demo` works.
- Confirm `Run Agent With Memory` creates a trace.
- Confirm `Resolve by latest memory` creates an audit log.
- Confirm evidence bundle export works.
- Confirm evidence bundle import restores the session.
