import { describe, expect, test } from "bun:test";
import {
  buildArtifactGraph,
  buildArtifactTimeline,
  buildEvidenceBundle,
  calculateMemoryHealth,
  parseEvidenceBundle,
  summarizeUploadDiagnostics
} from "../inspector";
import { agentRun, auditLog, memory, state } from "./helpers";

describe("inspector utilities", () => {
  test("calculates memory health from status, conflicts, and artifact storage", () => {
    const demoState = state({
      memories: [
        memory({ id: "active", title: "Active", body: "Active memory.", status: "active" }),
        memory({ id: "outdated", title: "Outdated", body: "Old memory.", status: "outdated" }),
        memory({ id: "archived", title: "Archived", body: "Archived memory.", status: "archived" })
      ],
      agentRuns: [agentRun({ id: "run-1", usedMemoryIds: ["active"] })],
      auditLogs: [auditLog({ id: "audit-1" })]
    });

    const health = calculateMemoryHealth(demoState, [
      {
        id: "deadline-conflict",
        topic: "Hackathon deadline",
        kind: "deadline",
        severity: "high",
        description: "Conflicting deadline memories found.",
        memoryIds: ["active", "outdated"],
        values: ["June 20", "June 15"]
      }
    ]);

    expect(health.score).toBe(61);
    expect(health.activeCount).toBe(1);
    expect(health.outdatedCount).toBe(1);
    expect(health.archivedCount).toBe(1);
    expect(health.conflictCount).toBe(1);
    expect(health.walrusArtifactCount).toBe(7);
    expect(health.localArtifactCount).toBe(1);
  });

  test("builds timeline, graph, upload diagnostics, and evidence bundle", () => {
    const demoState = state({
      memories: [memory({ id: "latest", title: "Updated deadline", body: "Deadline is June 15." })],
      agentRuns: [agentRun({ id: "run-1", usedMemoryIds: ["latest"], createdAt: "2026-06-15T00:10:00.000Z" })],
      auditLogs: [auditLog({ id: "audit-1", createdAt: "2026-06-15T00:20:00.000Z" })]
    });

    const timeline = buildArtifactTimeline(demoState);
    const graph = buildArtifactGraph(demoState);
    const uploadDiagnostics = summarizeUploadDiagnostics(demoState);
    const health = calculateMemoryHealth(demoState, []);
    const bundle = buildEvidenceBundle({
      state: demoState,
      conflicts: [],
      timeline,
      health,
      uploadDiagnostics
    });

    expect(timeline).toHaveLength(4);
    expect(timeline[0].id).toBe("audit-1-audit");
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(2);
    expect(uploadDiagnostics?.totalUploads).toBe(4);
    expect(uploadDiagnostics?.walrusUploads).toBe(3);
    expect(uploadDiagnostics?.fallbackUploads).toBe(1);
    expect(uploadDiagnostics?.recentEvents).toHaveLength(4);
    expect(uploadDiagnostics?.recentEvents[0].type).toBe("audit_log");
    expect(uploadDiagnostics?.recentFailures).toHaveLength(1);
    expect(bundle.uploadDiagnostics?.lastUpload?.type).toBe("audit_log");
    expect(bundle.timeline).toHaveLength(4);

    const importedState = parseEvidenceBundle(bundle);
    expect(importedState.memories).toHaveLength(1);
    expect(importedState.agentRuns).toHaveLength(1);
    expect(importedState.auditLogs).toHaveLength(1);
  });

  test("rejects invalid evidence bundle input", () => {
    expect(() => parseEvidenceBundle({ project: "Other", memories: [], agentRuns: [], auditLogs: [] })).toThrow(
      /project/
    );
    expect(() => parseEvidenceBundle({ project: "Walrus Memory Inspector", memories: [] })).toThrow(/missing/);
  });
});
