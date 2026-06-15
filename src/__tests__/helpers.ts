import type { AuditLog, AgentRun, DemoState, MemoryRecord, MemoryStatus, WalrusArtifact } from "../types";

export function artifact(input: {
  blobId: string;
  type?: WalrusArtifact["type"];
  storage?: WalrusArtifact["storage"];
  createdAt?: string;
  ok?: boolean;
  error?: string;
  url?: string;
}): WalrusArtifact {
  const createdAt = input.createdAt ?? "2026-06-15T00:00:00.000Z";
  const storage = input.storage ?? "walrus";
  return {
    blobId: input.blobId,
    type: input.type ?? "raw_memory",
    contentHash: `hash-${input.blobId}`,
    createdAt,
    preview: `preview-${input.blobId}`,
    storage,
    url: input.url,
    diagnostics: {
      mode: "browser-direct",
      publisherUrl: "https://publisher.example.test",
      aggregatorUrl: "https://aggregator.example.test",
      uploadTimeoutMs: 10000,
      durationMs: 120,
      ok: input.ok ?? storage === "walrus",
      error: input.error
    }
  };
}

export function memory(input: {
  id: string;
  title: string;
  body: string;
  summary?: string;
  tags?: string[];
  status?: MemoryStatus;
  importance?: number;
  createdAt?: string;
}): MemoryRecord {
  const createdAt = input.createdAt ?? "2026-06-15T00:00:00.000Z";
  return {
    id: input.id,
    title: input.title,
    body: input.body,
    summary: input.summary ?? input.body,
    tags: input.tags ?? [],
    status: input.status ?? "active",
    importance: input.importance ?? 3,
    rawArtifact: artifact({
      blobId: `${input.id}-raw`,
      type: "raw_memory",
      createdAt
    }),
    summaryArtifact: artifact({
      blobId: `${input.id}-summary`,
      type: "summary",
      createdAt
    }),
    createdAt,
    updatedAt: createdAt
  };
}

export function agentRun(input: { id: string; usedMemoryIds: string[]; createdAt?: string }): AgentRun {
  const createdAt = input.createdAt ?? "2026-06-15T00:10:00.000Z";
  return {
    id: input.id,
    question: "What is the current hackathon deadline?",
    answer: "The latest reliable memory says the final submission deadline is June 15.",
    usedMemoryIds: input.usedMemoryIds,
    retrievalCandidates: [],
    traceArtifact: artifact({
      blobId: `${input.id}-trace`,
      type: "agent_trace",
      createdAt
    }),
    createdAt
  };
}

export function auditLog(input: { id: string; createdAt?: string }): AuditLog {
  const createdAt = input.createdAt ?? "2026-06-15T00:20:00.000Z";
  return {
    id: input.id,
    action: "memory.conflict.resolve",
    targetId: "deadline-conflict",
    detail: "Resolved deadline conflict.",
    artifact: artifact({
      blobId: `${input.id}-audit`,
      type: "audit_log",
      createdAt,
      storage: "local-demo",
      ok: false,
      error: "Upload timed out after 10000ms"
    }),
    createdAt
  };
}

export function state(input: Partial<DemoState> = {}): DemoState {
  return {
    memories: input.memories ?? [],
    agentRuns: input.agentRuns ?? [],
    auditLogs: input.auditLogs ?? []
  };
}
