export type MemoryStatus = "active" | "outdated" | "important" | "archived";

export type ArtifactType = "raw_memory" | "summary" | "agent_trace" | "audit_log";

export type WalrusArtifact = {
  blobId: string;
  type: ArtifactType;
  contentHash: string;
  createdAt: string;
  preview: string;
  storage: "walrus" | "local-demo";
  objectId?: string;
  url?: string;
};

export type MemoryRecord = {
  id: string;
  title: string;
  body: string;
  summary: string;
  tags: string[];
  status: MemoryStatus;
  importance: number;
  rawArtifact: WalrusArtifact;
  summaryArtifact: WalrusArtifact;
  createdAt: string;
  updatedAt: string;
};

export type AgentRun = {
  id: string;
  question: string;
  answer: string;
  usedMemoryIds: string[];
  traceArtifact: WalrusArtifact;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  action: string;
  targetId: string;
  detail: string;
  artifact: WalrusArtifact;
  createdAt: string;
};

export type DemoState = {
  memories: MemoryRecord[];
  agentRuns: AgentRun[];
  auditLogs: AuditLog[];
};
