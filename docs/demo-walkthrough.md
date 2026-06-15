# Demo Walkthrough

This document is the manual presentation flow for Walrus Memory Inspector. Use it for live demos, judging walkthroughs, or screen recording.

## Preparation

Start the app:

```bash
bun run dev
```

Open the Vite local URL.

Optional verification before the demo:

```bash
bun run test
bun run build
```

## Demo Flow

### 1. Reset The Demo

Click `Reset Demo`.

What to show:

- The app creates a fresh set of memory artifacts.
- The page may show loading while raw memories and summaries are stored.
- Upload-related buttons are disabled while artifacts are being written.

What to say:

```text
This starts from a clean memory state and creates the raw memory and summary artifacts that the rest of the demo inspects.
```

### 2. Check Walrus Diagnostics

Open the `Walrus Diagnostics` panel near the top of the page.

What to show:

- `Walrus`
- `Fallback`
- `Total`
- `Publisher`
- `Aggregator`
- `Latest Upload`
- `Recent Upload Events`

How to interpret it:

- `walrus` means the app stored a real Walrus artifact.
- `local-demo` means the app fell back locally and records the fallback reason.
- A real blob link can be opened through the aggregator when available.

What to say:

```text
The app does not hide storage behavior. Every artifact records whether it reached Walrus, which endpoint was used, how long upload took, and why fallback happened if it failed.
```

### 3. Review Memory Health

Open `Memory Health`.

What to show:

- Overall health score
- Active memories
- Outdated memories
- Archived memories
- Conflict count
- Walrus vs fallback artifact counts

What to say:

```text
Memory health is a compact signal for whether the agent's memory set is trustworthy. Conflicts reduce the score, while traces and audit logs improve observability.
```

### 4. Review Conflict Radar

Open `Conflict Radar`.

What to show:

- Deadline conflict: `June 20` vs `June 15`
- Requirement version conflict: `v1` vs `v2`
- Owner/source conflict: `Alice` vs `Bob`
- Conflict severity and affected memories

Do not resolve the conflict yet.

What to say:

```text
The inspector catches multiple transparent conflict types, not just one hard-coded deadline example. Each conflict links back to the memories that caused it.
```

### 5. Run The Agent

Find `Agent Run`.

Use the default question:

```text
What is the current hackathon deadline?
```

Click `Run Agent With Memory`.

What to show:

- The answer appears in `Latest Answer`.
- A trace blob is created.
- The button is disabled while the trace artifact is stored.

What to say:

```text
The answer is not just text. It creates a trace artifact that records which memories were considered and why.
```

### 6. Inspect Trace Viewer

Open `Trace Viewer`.

What to show:

- `Used Memories`
- `Retrieval Scores`
- Candidate score
- Matched tokens
- Selection status
- Citation reasons
- Status penalty for outdated or archived memory

What to say:

```text
The trace makes retrieval debuggable. We can see which memories were selected, which were rejected, and how score and status affected the decision.
```

### 7. Resolve The Deadline Conflict

Return to `Conflict Radar`.

Click:

```text
Resolve by latest memory
```

What to show:

- The stale deadline memory is marked `Outdated`.
- An audit artifact is created.
- The conflict count and health score update.

What to say:

```text
Conflict resolution is auditable. The app does not silently mutate memory; it creates an audit log artifact for the decision.
```

### 8. Run The Agent Again

Return to `Agent Run`.

Click `Run Agent With Memory` again.

What to show:

- The answer should cite the updated June 15 deadline.
- The trace should show the updated memory selected.
- The old memory should have an outdated status penalty.

What to say:

```text
After resolving the memory conflict, the agent answer improves and the trace explains why.
```

### 9. Inspect Memory Browser And Memory Inspector

Open `Memory Browser`.

Click several memories, including:

- `Original deadline`
- `Updated deadline`
- `Updated Walrus requirement spec`
- Owner/source memories

What to show in `Memory Inspector`:

- Memory body
- Tags
- Status
- Raw memory blob
- Summary blob
- Content hashes
- Status action buttons

What to say:

```text
Memory is treated as inspectable state. Each memory has durable raw and summary artifacts, metadata, status, and hashes.
```

### 10. Inspect Audit Log

Open `Audit Log`.

What to show:

- Conflict resolution audit entry
- Status update audit entries, if any
- Audit blob ID

What to say:

```text
Every memory fix creates an audit artifact so the correction path can be reviewed later.
```

### 11. Inspect Artifact Timeline

Open `Artifact Timeline`.

What to show:

- Raw memory artifacts
- Summary artifacts
- Agent trace artifacts
- Audit log artifacts
- Storage labels: `walrus` or `local-demo`

What to say:

```text
The timeline shows how memory became summaries, traces, and audit artifacts over time.
```

### 12. Inspect Artifact Graph

Open `Artifact Graph`.

What to show:

- Node count
- Edge count
- Raw memory to summary edges
- Summary to trace citation edges

What to say:

```text
The graph is currently an edge list. It still exposes the provenance relationships between memory, summaries, traces, and audits.
```

### 13. Export Evidence Bundle

Click `Export Evidence Bundle`.

What to show:

- A JSON file is downloaded.
- It includes memories, conflicts, agent runs, audit logs, timeline entries, health metrics, and upload diagnostics.

What to say:

```text
The evidence bundle makes the memory debugging session portable for judging, review, or handoff to another agent.
```

## Recommended Short Demo

Use this shorter flow for a 3 to 5 minute demo:

```text
Reset Demo
-> Walrus Diagnostics
-> Memory Health
-> Conflict Radar
-> Run Agent
-> Trace Viewer
-> Resolve by latest memory
-> Run Agent again
-> Audit Log
-> Artifact Timeline
-> Artifact Graph
-> Export Evidence Bundle
```

## If Walrus Upload Falls Back

If `Walrus Diagnostics` shows `local-demo`:

- Point to the displayed error reason.
- Explain that fallback is intentional for demo continuity.
- Show that the app still records endpoint, timeout, storage mode, duration, and error.
- Mention that a backend proxy is only needed if the judging endpoint has CORS, credentials, or timeout problems.
