# Judging Notes

Use this page to keep the judging narrative crisp.

## What This Project Solves

AI agent memory is usually hidden, app-local, and hard to trust. Walrus Memory Inspector turns memory into durable artifacts that can be inspected, debugged, corrected, audited, and exported.

The core workflow is:

```text
raw memory -> summary artifact -> agent trace -> audit log -> evidence bundle
```

## Why It Fits The Walrus Track

- Long-term memory: memories persist as raw and summary artifacts.
- Persistent data: artifacts are written through the Walrus HTTP publisher when available.
- Artifact-driven workflow: traces, audit logs, and evidence bundles are first-class outputs.
- Developer tooling: the UI helps inspect, debug, and manage agent memory.
- Portability: evidence bundles can be exported and imported across sessions.
- Trust: storage diagnostics, hashes, retrieval reasons, and audit logs are visible.

## Current Agent Mode

The current MVP uses a deterministic local agent. It does not call a live LLM API.

This is intentional for the hackathon demo:

- The memory debugging flow is reproducible.
- Retrieval scores and citation reasons are easy to inspect.
- The demo does not require private API keys.
- A real LLM can be added later behind the same retrieval and trace interface.

Current flow:

```text
question -> retrieve scored memories -> select active candidates -> generate rule-based answer -> store trace artifact
```

Future LLM flow:

```text
question -> retrieve scored memories -> build prompt -> call LLM -> store prompt, answer, citations, and trace artifact
```

## What Judges Should Look At

1. `Walrus Diagnostics`: storage mode, endpoint, upload duration, fallback reason.
2. `Conflict Radar`: deadline, requirement version, and ownership conflicts.
3. `Trace Viewer`: retrieval scores, matched tokens, and citation reasons.
4. `Resolve by latest memory`: audit-backed memory correction.
5. `Artifact Timeline`: raw memory, summaries, traces, and audit artifacts.
6. `Artifact Graph`: provenance edges between artifacts.
7. `Evidence Bundle`: export/import for portable memory handoff.

## How To Explain Limitations

### No Backend

```text
The project intentionally stays frontend-only for the submission. The default Walrus testnet path works browser-direct, and avoiding a backend keeps the demo focused on memory artifacts and inspection.
```

### Browser-Local Metadata

```text
Metadata is browser-local in the MVP, while artifacts are Walrus-backed. Evidence bundle import/export demonstrates the portable handoff path without adding backend risk.
```

### No Live LLM API

```text
The local deterministic agent makes trace inspection reproducible. The retrieval and trace boundary is ready for a live LLM later.
```

### Rule-Based Conflict Detection

```text
The conflict rules are intentionally transparent for auditability. LLM-assisted contradiction detection can be added while keeping the same audit artifact model.
```

## One-Minute Pitch

```text
Walrus Memory Inspector is a developer tool for persistent AI memory.

Instead of treating memory as hidden prompt context, it turns memory into Walrus-backed artifacts: raw memories, summaries, agent traces, audit logs, and evidence bundles.

The demo shows contradictory memories, runs an agent with cited memories, exposes retrieval scores and citation reasons, resolves stale memory, records the fix as an audit artifact, and exports or imports the full memory evidence bundle.

This fits the Walrus track because it demonstrates long-term memory, persistent data access, artifact-driven workflows, and tooling that helps developers trust and debug agent memory stored on Walrus.
```
