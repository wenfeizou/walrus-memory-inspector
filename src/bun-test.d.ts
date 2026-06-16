declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export const expect: {
    <T>(actual: T): {
      toBe(expected: T): void;
      toEqual(expected: unknown): void;
      toContain(expected: unknown): void;
      toHaveLength(expected: number): void;
      toBeGreaterThan(expected: number): void;
      toBeDefined(): void;
      toMatch(expected: RegExp): void;
      toThrow(expected?: string | RegExp): void;
      not: {
        toContain(expected: unknown): void;
      };
    };
  };
}
