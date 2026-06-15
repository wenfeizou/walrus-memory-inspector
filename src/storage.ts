import type { AuditLog, AgentRun, DemoState, MemoryRecord, WalrusArtifact } from "./types";

const STORAGE_KEY = "walrus-memory-inspector-state-v1";

type LegacyArtifact = WalrusArtifact & {
  diagnostics?: WalrusArtifact["diagnostics"];
};

function withDiagnostics(artifact: LegacyArtifact): WalrusArtifact {
  if (artifact.diagnostics) return artifact as WalrusArtifact;
  let legacyAggregatorUrl = "unknown legacy artifact";
  if (artifact.url) {
    try {
      legacyAggregatorUrl = new URL(artifact.url).origin;
    } catch {
      legacyAggregatorUrl = "unknown legacy artifact";
    }
  }
  return {
    ...artifact,
    diagnostics: {
      mode: "browser-direct",
      publisherUrl: "unknown legacy artifact",
      aggregatorUrl: legacyAggregatorUrl,
      uploadTimeoutMs: 0,
      durationMs: 0,
      ok: artifact.storage === "walrus",
      error: artifact.storage === "local-demo" ? "Legacy local demo artifact without recorded upload diagnostics" : undefined
    }
  };
}

function migrateState(state: DemoState): DemoState {
  return {
    memories: state.memories.map(
      (memory): MemoryRecord => ({
        ...memory,
        rawArtifact: withDiagnostics(memory.rawArtifact),
        summaryArtifact: withDiagnostics(memory.summaryArtifact)
      })
    ),
    agentRuns: state.agentRuns.map(
      (run): AgentRun => ({
        ...run,
        retrievalCandidates: run.retrievalCandidates ?? [],
        traceArtifact: withDiagnostics(run.traceArtifact)
      })
    ),
    auditLogs: state.auditLogs.map(
      (log): AuditLog => ({
        ...log,
        artifact: withDiagnostics(log.artifact)
      })
    )
  };
}

export function loadState(): DemoState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return migrateState(JSON.parse(raw) as DemoState);
  } catch {
    return null;
  }
}

export function saveState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
