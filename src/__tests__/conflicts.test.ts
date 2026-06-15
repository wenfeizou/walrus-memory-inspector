import { describe, expect, test } from "bun:test";
import { detectMemoryConflicts } from "../conflicts";
import { memory } from "./helpers";

describe("detectMemoryConflicts", () => {
  test("detects active deadline conflicts and escalates severity for important memories", () => {
    const conflicts = detectMemoryConflicts([
      memory({
        id: "old",
        title: "Original deadline",
        body: "The hackathon deadline was initially June 20.",
        tags: ["deadline"],
        status: "important"
      }),
      memory({
        id: "latest",
        title: "Updated deadline",
        body: "The hackathon organizers updated the final submission deadline to June 15.",
        tags: ["deadline", "latest"]
      })
    ]);

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("deadline-conflict");
    expect(conflicts[0].kind).toBe("deadline");
    expect(conflicts[0].severity).toBe("high");
    expect(conflicts[0].values).toEqual(["June 20", "June 15"]);
    expect(conflicts[0].memoryIds).toEqual(["old", "latest"]);
  });

  test("ignores outdated deadline memories", () => {
    const conflicts = detectMemoryConflicts([
      memory({
        id: "old",
        title: "Original deadline",
        body: "The hackathon deadline was initially June 20.",
        status: "outdated"
      }),
      memory({
        id: "latest",
        title: "Updated deadline",
        body: "The final submission deadline is June 15."
      })
    ]);

    expect(conflicts).toHaveLength(0);
  });

  test("detects requirement version and ownership conflicts", () => {
    const conflicts = detectMemoryConflicts([
      memory({
        id: "req-v1",
        title: "Requirement spec",
        body: "The Walrus memory requirement version is v1.",
        summary: "Requirement v1.",
        tags: ["requirements"]
      }),
      memory({
        id: "req-v2",
        title: "Updated requirement spec",
        body: "The Walrus memory requirement version is v2.",
        summary: "Requirement v2.",
        tags: ["requirements"],
        status: "important"
      }),
      memory({
        id: "owner-a",
        title: "Owner note",
        body: "The demo owner is Alice.",
        tags: ["ownership"]
      }),
      memory({
        id: "owner-b",
        title: "Owner update",
        body: "The demo owner is Bob.",
        tags: ["ownership"]
      })
    ]);

    expect(conflicts).toHaveLength(2);
    expect(conflicts.map((conflict) => conflict.kind)).toEqual(["requirement_version", "ownership"]);
    expect(conflicts[0].values).toEqual(["v1", "v2"]);
    expect(conflicts[0].severity).toBe("high");
    expect(conflicts[1].values).toEqual(["Alice", "Bob"]);
  });
});
