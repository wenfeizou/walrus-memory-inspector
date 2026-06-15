import type { AgentRun, MemoryRecord } from "./types";
import { storeArtifact } from "./walrusAdapter";

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "what",
  "when",
  "where",
  "who",
  "how",
  "to",
  "of",
  "and",
  "in",
  "for",
  "on",
  "it",
  "this",
  "that",
  "deadline"
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token));
}

function scoreMemory(question: string, memory: MemoryRecord): number {
  const questionTokens = tokenize(question);
  const text = `${memory.title} ${memory.body} ${memory.summary} ${memory.tags.join(" ")}`.toLowerCase();
  const tokenScore = questionTokens.reduce((score, token) => score + (text.includes(token) ? 2 : 0), 0);
  const statusScore = memory.status === "outdated" || memory.status === "archived" ? -8 : 0;
  const importantScore = memory.status === "important" ? 2 : 0;
  return tokenScore + memory.importance + statusScore + importantScore;
}

function buildAnswer(question: string, used: MemoryRecord[]): string {
  const lower = question.toLowerCase();
  const active = used.filter((memory) => memory.status !== "outdated" && memory.status !== "archived");
  const strongestDeadline = active.find(
    (memory) => memory.body.includes("June 15") || memory.body.includes("June 20")
  );

  if (lower.includes("deadline") && strongestDeadline?.body.includes("June 15")) {
    return "The latest reliable memory says the final submission deadline is June 15. I am citing the updated deadline memory and ignoring older or archived deadline notes.";
  }

  if (lower.includes("deadline") && strongestDeadline?.body.includes("June 20")) {
    return "The memory I found says the deadline is June 20. This may need review if there are newer schedule notes.";
  }

  if (lower.includes("walrus")) {
    return "Walrus is being used as a persistent memory and artifact layer: raw memories, summaries, traces, and audit logs can be stored and inspected across sessions.";
  }

  if (active.length === 0) {
    return "I could not find an active memory that supports a confident answer.";
  }

  return `Based on the strongest active memories: ${active.map((memory) => memory.summary).join(" ")}`;
}

export async function runAgent(question: string, memories: MemoryRecord[]): Promise<AgentRun> {
  const ranked = memories
    .map((memory) => ({ memory, score: scoreMemory(question, memory) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter((item) => item.score > 0);

  const used = ranked.map((item) => item.memory);
  const answer = buildAnswer(question, used);
  const trace = {
    question,
    answer,
    usedMemoryIds: used.map((memory) => memory.id),
    usedArtifacts: used.map((memory) => ({
      memoryId: memory.id,
      rawBlobId: memory.rawArtifact.blobId,
      summaryBlobId: memory.summaryArtifact.blobId,
      status: memory.status
    }))
  };
  const traceArtifact = await storeArtifact("agent_trace", JSON.stringify(trace, null, 2));
  return {
    id: `run-${traceArtifact.blobId.slice(-8)}`,
    question,
    answer,
    usedMemoryIds: used.map((memory) => memory.id),
    traceArtifact,
    createdAt: new Date().toISOString()
  };
}
