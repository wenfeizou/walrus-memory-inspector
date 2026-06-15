import type { MemoryRecord } from "./types";

export type MemoryConflict = {
  id: string;
  topic: string;
  kind: "deadline" | "requirement_version" | "ownership";
  severity: "low" | "medium" | "high";
  description: string;
  memoryIds: string[];
  values: string[];
};

function extractDeadlineValue(memory: MemoryRecord): string | null {
  const match = memory.body.match(/June\s+\d{1,2}/i) ?? memory.summary.match(/June\s+\d{1,2}/i);
  return match?.[0] ?? null;
}

function extractRequirementVersion(memory: MemoryRecord): string | null {
  const text = `${memory.title} ${memory.body} ${memory.summary}`;
  if (!/requirement|spec|version|v\d+/i.test(text)) return null;
  const match = text.match(/\bv(?:ersion\s*)?(\d+(?:\.\d+)*)\b/i);
  return match ? `v${match[1]}` : null;
}

function extractOwnerValue(memory: MemoryRecord): string | null {
  const text = `${memory.body} ${memory.summary}`;
  const match = text.match(/\b(?:owner|lead|source)\s*(?:is|:)\s*([A-Z][A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

function buildConflict(input: {
  id: string;
  kind: MemoryConflict["kind"];
  topic: string;
  descriptionPrefix: string;
  claims: Array<{ memory: MemoryRecord; value: string }>;
  highWhenImportant?: boolean;
}): MemoryConflict | null {
  const values = [...new Set(input.claims.map((item) => item.value))];
  if (values.length <= 1) return null;

  return {
    id: input.id,
    kind: input.kind,
    topic: input.topic,
    severity: input.highWhenImportant && input.claims.some((item) => item.memory.status === "important") ? "high" : "medium",
    description: `${input.descriptionPrefix}: ${values.join(" vs ")}.`,
    memoryIds: input.claims.map((item) => item.memory.id),
    values
  };
}

export function detectMemoryConflicts(memories: MemoryRecord[]): MemoryConflict[] {
  const visibleMemories = memories.filter((memory) => memory.status === "active" || memory.status === "important");
  const deadlineClaims = visibleMemories
    .map((memory) => ({ memory, value: extractDeadlineValue(memory) }))
    .filter((item): item is { memory: MemoryRecord; value: string } => Boolean(item.value));
  const requirementClaims = visibleMemories
    .filter((memory) => memory.tags.includes("requirements") || memory.tags.includes("requirement") || /requirement|spec/i.test(memory.title))
    .map((memory) => ({ memory, value: extractRequirementVersion(memory) }))
    .filter((item): item is { memory: MemoryRecord; value: string } => Boolean(item.value));
  const ownerClaims = visibleMemories
    .map((memory) => ({ memory, value: extractOwnerValue(memory) }))
    .filter((item): item is { memory: MemoryRecord; value: string } => Boolean(item.value));

  return [
    buildConflict({
      id: "deadline-conflict",
      kind: "deadline",
      topic: "Hackathon deadline",
      descriptionPrefix: "Conflicting deadline memories found",
      claims: deadlineClaims,
      highWhenImportant: true
    }),
    buildConflict({
      id: "requirement-version-conflict",
      kind: "requirement_version",
      topic: "Requirement version",
      descriptionPrefix: "Conflicting requirement versions found",
      claims: requirementClaims,
      highWhenImportant: true
    }),
    buildConflict({
      id: "ownership-conflict",
      kind: "ownership",
      topic: "Owner or source",
      descriptionPrefix: "Conflicting owner or source memories found",
      claims: ownerClaims
    })
  ].filter((conflict): conflict is MemoryConflict => Boolean(conflict));
}
