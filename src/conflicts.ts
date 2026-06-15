import type { MemoryRecord } from "./types";

export type MemoryConflict = {
  id: string;
  topic: string;
  severity: "low" | "medium" | "high";
  description: string;
  memoryIds: string[];
  values: string[];
};

function extractDeadlineValue(memory: MemoryRecord): string | null {
  const match = memory.body.match(/June\s+\d{1,2}/i) ?? memory.summary.match(/June\s+\d{1,2}/i);
  return match?.[0] ?? null;
}

export function detectMemoryConflicts(memories: MemoryRecord[]): MemoryConflict[] {
  const visibleMemories = memories.filter((memory) => memory.status === "active" || memory.status === "important");
  const deadlineClaims = visibleMemories
    .map((memory) => ({ memory, value: extractDeadlineValue(memory) }))
    .filter((item): item is { memory: MemoryRecord; value: string } => Boolean(item.value));

  const uniqueDeadlineValues = [...new Set(deadlineClaims.map((item) => item.value))];
  if (uniqueDeadlineValues.length <= 1) return [];

  return [
    {
      id: "deadline-conflict",
      topic: "Hackathon deadline",
      severity: deadlineClaims.some((item) => item.memory.status === "important") ? "high" : "medium",
      description: `Conflicting deadline memories found: ${uniqueDeadlineValues.join(" vs ")}.`,
      memoryIds: deadlineClaims.map((item) => item.memory.id),
      values: uniqueDeadlineValues
    }
  ];
}
