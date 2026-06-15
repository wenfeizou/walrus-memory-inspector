import { describe, expect, test } from "bun:test";
import { runAgent } from "../agent";
import type { ArtifactType } from "../types";
import { artifact, memory } from "./helpers";

describe("runAgent", () => {
  test("uses the latest active deadline memory in the answer and trace", async () => {
    const storedTrace = artifact({
      blobId: "trace-blob-12345678",
      type: "agent_trace",
      createdAt: "2026-06-15T00:30:00.000Z"
    });
    const storedPayloads: Array<{ type: ArtifactType; content: string }> = [];
    const run = await runAgent(
      "What is the current hackathon deadline?",
      [
        memory({
          id: "old",
          title: "Original deadline",
          body: "The hackathon deadline was initially June 20.",
          tags: ["deadline", "old"],
          status: "outdated",
          importance: 5
        }),
        memory({
          id: "latest",
          title: "Updated deadline",
          body: "The hackathon organizers updated the final submission deadline to June 15.",
          tags: ["deadline", "latest"],
          importance: 3
        })
      ],
      async (type, content) => {
        storedPayloads.push({ type, content });
        return storedTrace;
      }
    );

    expect(run.answer).toMatch(/June 15/);
    expect(run.usedMemoryIds).toContain("latest");
    expect(run.usedMemoryIds).not.toContain("old");
    expect(run.retrievalCandidates).toHaveLength(2);
    expect(run.retrievalCandidates[0].score).toBeGreaterThan(run.retrievalCandidates[1].score);
    expect(run.retrievalCandidates.find((candidate) => candidate.memoryId === "latest")?.selected).toBe(true);
    expect(run.retrievalCandidates.find((candidate) => candidate.memoryId === "old")?.reasons).toContain(
      "Status penalty for outdated: -8"
    );
    expect(run.traceArtifact.blobId).toBe("trace-blob-12345678");
    expect(storedPayloads).toHaveLength(1);
    expect(storedPayloads[0].type).toBe("agent_trace");
    expect(storedPayloads[0].content).toContain('"latest"');
    expect(storedPayloads[0].content).toContain('"retrievalCandidates"');
  });
});
