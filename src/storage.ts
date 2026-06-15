import type { DemoState } from "./types";

const STORAGE_KEY = "walrus-memory-inspector-state-v1";

export function loadState(): DemoState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoState;
  } catch {
    return null;
  }
}

export function saveState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}
