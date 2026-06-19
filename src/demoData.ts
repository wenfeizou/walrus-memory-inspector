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
  const [rawArtifact, summaryArtifact] = await Promise.all([
    storeArtifact("raw_memory", input.body),
    storeArtifact("summary", input.summary)
  ]);
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
  const memories = await Promise.all([
    createMemory({
      title: "Original deadline",
      body: "The Sui hackathon project submission deadline was initially June 20. This note came from an early planning conversation.",
      summary: "Older note says the hackathon deadline is June 20.",
      tags: ["deadline", "hackathon", "old"],
      status: "important",
      importance: 5
    }),
    createMemory({
      title: "Updated deadline",
      body: "The hackathon organizers updated the final submission deadline to June 15. This replaces earlier schedule notes.",
      summary: "Latest note says the final submission deadline is June 15.",
      tags: ["deadline", "hackathon", "latest"],
      status: "active",
      importance: 3
    }),
    createMemory({
      title: "Walrus track requirement",
      body: "Walrus track requirement version is v1. Projects should demonstrate persistent agent memory, portable artifacts, cross-session retrieval, and reusable data rather than simple file upload.",
      summary: "Requirement v1 rewards persistent AI memory and artifact-driven workflows.",
      tags: ["walrus", "requirements", "memory"],
      status: "active",
      importance: 4
    }),
    createMemory({
      title: "Updated Walrus requirement spec",
      body: "Walrus track requirement version is v2. The latest spec emphasizes inspectable memory artifacts, trace export, and auditability.",
      summary: "Requirement v2 emphasizes inspectable memory artifacts, trace export, and auditability.",
      tags: ["walrus", "requirements", "latest"],
      status: "important",
      importance: 4
    }),
    createMemory({
      title: "Campus Memory Network concept",
      body: "Campus Memory Network turns alumni check-ins into Walrus-backed memory artifacts with media, location, AI summaries, privacy tiers, and multi-agent retrieval.",
      summary: "Campus Memory Network is an alumni memory graph, not a simple check-in app.",
      tags: ["campus", "memory", "walrus"],
      status: "active",
      importance: 3
    }),
    createMemory({
      title: "Demo owner note",
      body: "The project owner is Alice for the initial prototype review.",
      summary: "Owner is Alice for the initial prototype review.",
      tags: ["ownership", "demo"],
      status: "active",
      importance: 2
    }),
    createMemory({
      title: "Demo owner update",
      body: "The project owner is Bob for the final submission handoff.",
      summary: "Owner is Bob for the final submission handoff.",
      tags: ["ownership", "latest"],
      status: "active",
      importance: 2
    })
  ]);
  return { memories, agentRuns: [], auditLogs: [] };
}
