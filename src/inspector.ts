import type { AuditLog, DemoState, MemoryRecord, WalrusArtifact } from "./types";
import type { MemoryConflict } from "./conflicts";

export type TimelineItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
  artifact: WalrusArtifact;
};

export type MemoryHealth = {
  score: number;
  activeCount: number;
  outdatedCount: number;
  archivedCount: number;
  conflictCount: number;
  walrusArtifactCount: number;
  localArtifactCount: number;
};

export type UploadDiagnosticsSummary = {
  mode: WalrusArtifact["diagnostics"]["mode"];
  publisherUrl: string;
  aggregatorUrl: string;
  uploadTimeoutMs: number;
  totalUploads: number;
  walrusUploads: number;
  fallbackUploads: number;
  lastUpload?: {
    blobId: string;
    type: WalrusArtifact["type"];
    storage: WalrusArtifact["storage"];
    createdAt: string;
    durationMs: number;
    ok: boolean;
    error?: string;
    url?: string;
  };
  recentEvents: Array<{
    blobId: string;
    type: WalrusArtifact["type"];
    storage: WalrusArtifact["storage"];
    createdAt: string;
    durationMs: number;
    ok: boolean;
    error?: string;
    url?: string;
  }>;
  recentFailures: Array<{
    blobId: string;
    type: WalrusArtifact["type"];
    createdAt: string;
    durationMs: number;
    error?: string;
  }>;
};

export type ArtifactGraphNode = {
  id: string;
  label: string;
  type: string;
  storage: WalrusArtifact["storage"];
};

export type ArtifactGraphEdge = {
  from: string;
  to: string;
  label: string;
};

export function buildArtifactTimeline(state: DemoState, selectedMemoryId?: string): TimelineItem[] {
  const memoryEvents = state.memories
    .filter((memory) => !selectedMemoryId || memory.id === selectedMemoryId)
    .flatMap((memory) => [
      {
        id: `${memory.id}-raw`,
        title: `${memory.title}: raw memory`,
        detail: memory.rawArtifact.preview,
        createdAt: memory.rawArtifact.createdAt,
        artifact: memory.rawArtifact
      },
      {
        id: `${memory.id}-summary`,
        title: `${memory.title}: summary`,
        detail: memory.summaryArtifact.preview,
        createdAt: memory.summaryArtifact.createdAt,
        artifact: memory.summaryArtifact
      }
    ]);

  const runEvents = state.agentRuns.map((run) => ({
    id: `${run.id}-trace`,
    title: `Agent run: ${run.question}`,
    detail: run.answer,
    createdAt: run.createdAt,
    artifact: run.traceArtifact
  }));

  const auditEvents = state.auditLogs.map((log) => ({
    id: `${log.id}-audit`,
    title: "Audit log",
    detail: log.detail,
    createdAt: log.createdAt,
    artifact: log.artifact
  }));

  return [...memoryEvents, ...runEvents, ...auditEvents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function calculateMemoryHealth(state: DemoState, conflicts: MemoryConflict[]): MemoryHealth {
  const artifacts = collectArtifacts(state);
  const outdatedCount = state.memories.filter((memory) => memory.status === "outdated").length;
  const archivedCount = state.memories.filter((memory) => memory.status === "archived").length;
  const conflictPenalty = conflicts.length * 22;
  const outdatedPenalty = outdatedCount * 5;
  const archivedPenalty = archivedCount * 3;
  const traceBonus = Math.min(state.agentRuns.length * 5, 15);
  const auditBonus = Math.min(state.auditLogs.length * 4, 12);
  const score = Math.max(0, Math.min(100, 82 - conflictPenalty - outdatedPenalty - archivedPenalty + traceBonus + auditBonus));

  return {
    score,
    activeCount: state.memories.filter((memory) => memory.status === "active" || memory.status === "important").length,
    outdatedCount,
    archivedCount,
    conflictCount: conflicts.length,
    walrusArtifactCount: artifacts.filter((artifact) => artifact.storage === "walrus").length,
    localArtifactCount: artifacts.filter((artifact) => artifact.storage === "local-demo").length
  };
}

export function summarizeUploadDiagnostics(state: DemoState): UploadDiagnosticsSummary | null {
  const artifacts = collectArtifacts(state).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latest = artifacts[0];
  if (!latest) return null;
  const diagnostics = latest.diagnostics;

  return {
    mode: diagnostics.mode,
    publisherUrl: diagnostics.publisherUrl,
    aggregatorUrl: diagnostics.aggregatorUrl,
    uploadTimeoutMs: diagnostics.uploadTimeoutMs,
    totalUploads: artifacts.length,
    walrusUploads: artifacts.filter((artifact) => artifact.storage === "walrus").length,
    fallbackUploads: artifacts.filter((artifact) => artifact.storage === "local-demo").length,
    lastUpload: {
      blobId: latest.blobId,
      type: latest.type,
      storage: latest.storage,
      createdAt: latest.createdAt,
      durationMs: diagnostics.durationMs,
      ok: diagnostics.ok,
      error: diagnostics.error,
      url: latest.url
    },
    recentEvents: artifacts.slice(0, 8).map((artifact) => ({
      blobId: artifact.blobId,
      type: artifact.type,
      storage: artifact.storage,
      createdAt: artifact.createdAt,
      durationMs: artifact.diagnostics.durationMs,
      ok: artifact.diagnostics.ok,
      error: artifact.diagnostics.error,
      url: artifact.url
    })),
    recentFailures: artifacts
      .filter((artifact) => !artifact.diagnostics.ok)
      .slice(0, 5)
      .map((artifact) => ({
        blobId: artifact.blobId,
        type: artifact.type,
        createdAt: artifact.createdAt,
        durationMs: artifact.diagnostics.durationMs,
        error: artifact.diagnostics.error
      }))
  };
}

export function buildArtifactGraph(state: DemoState): { nodes: ArtifactGraphNode[]; edges: ArtifactGraphEdge[] } {
  const nodes = new Map<string, ArtifactGraphNode>();
  const edges: ArtifactGraphEdge[] = [];

  for (const memory of state.memories) {
    nodes.set(memory.rawArtifact.blobId, {
      id: memory.rawArtifact.blobId,
      label: `${memory.title} raw`,
      type: memory.rawArtifact.type,
      storage: memory.rawArtifact.storage
    });
    nodes.set(memory.summaryArtifact.blobId, {
      id: memory.summaryArtifact.blobId,
      label: `${memory.title} summary`,
      type: memory.summaryArtifact.type,
      storage: memory.summaryArtifact.storage
    });
    edges.push({
      from: memory.rawArtifact.blobId,
      to: memory.summaryArtifact.blobId,
      label: "summarized into"
    });
  }

  for (const run of state.agentRuns) {
    nodes.set(run.traceArtifact.blobId, {
      id: run.traceArtifact.blobId,
      label: `Trace ${run.id}`,
      type: run.traceArtifact.type,
      storage: run.traceArtifact.storage
    });
    for (const memoryId of run.usedMemoryIds) {
      const memory = state.memories.find((item) => item.id === memoryId);
      if (!memory) continue;
      edges.push({
        from: memory.summaryArtifact.blobId,
        to: run.traceArtifact.blobId,
        label: "cited by"
      });
    }
  }

  for (const log of state.auditLogs) {
    nodes.set(log.artifact.blobId, {
      id: log.artifact.blobId,
      label: `Audit ${log.id}`,
      type: log.artifact.type,
      storage: log.artifact.storage
    });
  }

  return { nodes: [...nodes.values()], edges };
}

export function buildEvidenceBundle(input: {
  state: DemoState;
  conflicts: MemoryConflict[];
  timeline: TimelineItem[];
  health: MemoryHealth;
  uploadDiagnostics: UploadDiagnosticsSummary | null;
}) {
  return {
    exportedAt: new Date().toISOString(),
    project: "Walrus Memory Inspector",
    purpose: "Portable evidence bundle for agent memory debugging.",
    health: input.health,
    uploadDiagnostics: input.uploadDiagnostics,
    conflicts: input.conflicts,
    memories: input.state.memories,
    agentRuns: input.state.agentRuns,
    auditLogs: input.state.auditLogs,
    timeline: input.timeline
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function collectArtifacts(state: DemoState): WalrusArtifact[] {
  const memoryArtifacts = state.memories.flatMap((memory) => [memory.rawArtifact, memory.summaryArtifact]);
  const runArtifacts = state.agentRuns.map((run) => run.traceArtifact);
  const auditArtifacts = state.auditLogs.map((log: AuditLog) => log.artifact);
  return [...memoryArtifacts, ...runArtifacts, ...auditArtifacts];
}
