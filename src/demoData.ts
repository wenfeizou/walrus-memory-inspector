import type { DemoState, MemoryRecord } from "./types";
import { storeArtifact } from "./walrusAdapter";

function now(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

export async function createMemory(input: {
  title: string;
  body: string;
  summary: string;
  tags: string[];
  status?: MemoryRecord["status"];
  importance?: number;
}): Promise<MemoryRecord> {
  const rawArtifact = await storeArtifact("raw_memory", input.body);
  const summaryArtifact = await storeArtifact("summary", input.summary);
  const id = `mem-${rawArtifact.blobId.slice(-8)}`;
  const createdAt = now();
  return {
    id,
    title: input.title,
    body: input.body,
    summary: input.summary,
    tags: input.tags,
    status: input.status ?? "active",
    importance: input.importance ?? 3,
    rawArtifact,
    summaryArtifact,
    createdAt,
    updatedAt: createdAt
  };
}

export async function seedState(): Promise<DemoState> {
  const memories = [
    await createMemory({
      title: "Original deadline",
      body: "The Sui hackathon project submission deadline was initially June 20. This note came from an early planning conversation.",
      summary: "Older note says the hackathon deadline is June 20.",
      tags: ["deadline", "hackathon", "old"],
      status: "important",
      importance: 5
    }),
    await createMemory({
      title: "Updated deadline",
      body: "The hackathon organizers updated the final submission deadline to June 15. This replaces earlier schedule notes.",
      summary: "Latest note says the final submission deadline is June 15.",
      tags: ["deadline", "hackathon", "latest"],
      status: "active",
      importance: 3
    }),
    await createMemory({
      title: "Walrus track requirement",
      body: "Walrus track projects should demonstrate persistent agent memory, portable artifacts, cross-session retrieval, and reusable data rather than simple file upload.",
      summary: "Walrus rewards persistent AI memory and artifact-driven workflows.",
      tags: ["walrus", "requirements", "memory"],
      status: "active",
      importance: 4
    }),
    await createMemory({
      title: "Campus Memory Network concept",
      body: "Campus Memory Network turns alumni check-ins into Walrus-backed memory artifacts with media, location, AI summaries, privacy tiers, and multi-agent retrieval.",
      summary: "Campus Memory Network is an alumni memory graph, not a simple check-in app.",
      tags: ["campus", "memory", "walrus"],
      status: "active",
      importance: 3
    })
  ];
  return { memories, agentRuns: [], auditLogs: [] };
}
