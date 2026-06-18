import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Archive,
  Bot,
  CheckCircle2,
  Database,
  Download,
  FileSearch,
  Flag,
  GitBranch,
  History,
  Link,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag
} from "lucide-react";
import { runAgent } from "./agent";
import { detectMemoryConflicts, type MemoryConflict } from "./conflicts";
import { createMemory, seedState } from "./demoData";
import {
  buildArtifactGraph,
  buildArtifactTimeline,
  buildEvidenceBundle,
  calculateMemoryHealth,
  downloadJson,
  parseEvidenceBundle,
  summarizeUploadDiagnostics
} from "./inspector";
import { clearState, loadState, saveState } from "./storage";
import type { AuditLog, DemoState, MemoryRecord, MemoryStatus } from "./types";
import { storeArtifact } from "./walrusAdapter";
import "./styles.css";

const statusLabels: Record<MemoryStatus, string> = {
  active: "Active",
  outdated: "Outdated",
  important: "Important",
  archived: "Archived"
};

const panelClass = "min-w-0 rounded-lg border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(25,44,38,0.08)]";
const panelHeaderClass = "mb-4 flex items-center gap-2 text-emerald-950";
const labelClass = "mb-2 block text-xs font-extrabold uppercase tracking-normal text-slate-500";
const fieldClass =
  "mb-3 w-full resize-y rounded-md border border-emerald-100 bg-white p-3 text-slate-950 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";
const primaryButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-emerald-700 bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-slate-600";
const quietButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-950/15 bg-white px-4 text-sm font-bold text-emerald-950 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500";
const smallButtonClass =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-emerald-950/15 bg-white px-3 text-xs font-bold text-emerald-950 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500";
const statusButtonClass =
  "inline-flex min-h-10 min-w-40 flex-1 basis-40 items-center justify-center gap-2 rounded-md border border-emerald-100 bg-white px-3 text-sm font-bold text-emerald-950 hover:border-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500";
const emptyClass = "rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-slate-600";
const listClass = "grid max-h-[420px] gap-2 overflow-auto pr-1";
const anchorClass = "scroll-mt-36 sm:scroll-mt-32";

const quickNavItems = [
  { label: "Diagnostics", href: "#diagnostics" },
  { label: "Health", href: "#health" },
  { label: "Conflicts", href: "#conflicts" },
  { label: "Agent", href: "#agent" },
  { label: "Trace", href: "#trace" },
  { label: "Memories", href: "#memories" },
  { label: "Audit", href: "#audit" },
  { label: "Timeline", href: "#timeline" },
  { label: "Graph", href: "#graph" },
  { label: "Bundle", href: "#bundle" }
];

type BusyAction = "reset" | "agent" | "create-memory" | "status-update" | "resolve-conflict" | null;

function statusClass(status: MemoryStatus): string {
  const base = "inline-flex w-fit rounded-full px-2 py-1 text-xs font-bold";
  if (status === "outdated") return `${base} bg-orange-100 text-orange-900`;
  if (status === "important") return `${base} bg-blue-100 text-blue-900`;
  if (status === "archived") return `${base} bg-zinc-200 text-zinc-700`;
  return `${base} bg-emerald-100 text-emerald-950`;
}

function getBusyLabel(action: BusyAction): string | null {
  if (action === "reset") return "Resetting demo and storing seed artifacts...";
  if (action === "agent") return "Running agent and storing trace artifact...";
  if (action === "create-memory") return "Storing raw memory and summary artifacts...";
  if (action === "status-update") return "Updating memory status and storing audit artifact...";
  if (action === "resolve-conflict") return "Resolving conflict and storing audit artifact...";
  return null;
}

function App() {
  const [state, setState] = useState<DemoState | null>(null);
  const [query, setQuery] = useState("What is the current hackathon deadline?");
  const [memoryFilter, setMemoryFilter] = useState("");
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [newMemory, setNewMemory] = useState({
    title: "",
    body: "",
    tags: ""
  });
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [bundleImportStatus, setBundleImportStatus] = useState<string | null>(null);
  const bundleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const existing = loadState();
    if (existing) {
      setState(existing);
      return;
    }
    seedState().then((seeded) => {
      setState(seeded);
      saveState(seeded);
    });
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const selectedMemory = useMemo(
    () => state?.memories.find((memory) => memory.id === selectedMemoryId) ?? state?.memories[0],
    [selectedMemoryId, state]
  );

  const filteredMemories = useMemo(() => {
    if (!state) return [];
    const needle = memoryFilter.trim().toLowerCase();
    if (!needle) return state.memories;
    return state.memories.filter((memory) =>
      `${memory.title} ${memory.summary} ${memory.body} ${memory.tags.join(" ")} ${memory.status}`
        .toLowerCase()
        .includes(needle)
    );
  }, [memoryFilter, state]);

  if (!state) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#edf2ed] text-emerald-950">
        Loading memory artifacts and checking Walrus storage...
      </div>
    );
  }

  const isBusy = busyAction !== null;

  async function updateMemoryStatus(memoryId: string, status: MemoryStatus) {
    if (!state || isBusy) return;
    const target = state.memories.find((memory) => memory.id === memoryId);
    if (!target) return;
    setBusyAction("status-update");
    try {
      const detail = `Marked memory "${target.title}" as ${status}.`;
      const artifact = await storeArtifact("audit_log", detail);
      const audit: AuditLog = {
        id: `audit-${artifact.blobId.slice(-8)}`,
        action: "memory.status.update",
        targetId: memoryId,
        detail,
        artifact,
        createdAt: new Date().toISOString()
      };
      setState({
        ...state,
        memories: state.memories.map((memory) =>
          memory.id === memoryId ? { ...memory, status, updatedAt: new Date().toISOString() } : memory
        ),
        auditLogs: [audit, ...state.auditLogs]
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function resolveConflict(conflict: MemoryConflict) {
    if (!state || isBusy) return;
    const conflictingMemories = conflict.memoryIds
      .map((memoryId) => state.memories.find((memory) => memory.id === memoryId))
      .filter((memory): memory is MemoryRecord => Boolean(memory));
    const latestMemory = conflictingMemories.find((memory) => memory.tags.includes("latest"));
    const memoriesToOutdate = conflictingMemories.filter((memory) => memory.id !== latestMemory?.id);
    if (!latestMemory || memoriesToOutdate.length === 0) return;

    setBusyAction("resolve-conflict");
    try {
      const detail = `Resolved "${conflict.topic}" by keeping "${latestMemory.title}" and marking ${memoriesToOutdate
        .map((memory) => `"${memory.title}"`)
        .join(", ")} as outdated.`;
      const artifact = await storeArtifact("audit_log", detail);
      const audit: AuditLog = {
        id: `audit-${artifact.blobId.slice(-8)}`,
        action: "memory.conflict.resolve",
        targetId: conflict.id,
        detail,
        artifact,
        createdAt: new Date().toISOString()
      };
      const outdatedIds = new Set(memoriesToOutdate.map((memory) => memory.id));
      setState({
        ...state,
        memories: state.memories.map((memory) =>
          outdatedIds.has(memory.id) ? { ...memory, status: "outdated", updatedAt: new Date().toISOString() } : memory
        ),
        auditLogs: [audit, ...state.auditLogs]
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function askAgent() {
    if (!state || isBusy) return;
    setBusyAction("agent");
    try {
      const run = await runAgent(query, state.memories);
      setState({ ...state, agentRuns: [run, ...state.agentRuns] });
    } finally {
      setBusyAction(null);
    }
  }

  async function addMemory() {
    if (!state || isBusy || !newMemory.title || !newMemory.body) return;
    setBusyAction("create-memory");
    try {
      const created = await createMemory({
        title: newMemory.title,
        body: newMemory.body,
        summary: newMemory.body.length > 130 ? `${newMemory.body.slice(0, 130)}...` : newMemory.body,
        tags: newMemory.tags
          .split(",")
          .map((tagValue) => tagValue.trim())
          .filter(Boolean),
        status: "active",
        importance: 3
      });
      setState({ ...state, memories: [created, ...state.memories] });
      setSelectedMemoryId(created.id);
      setNewMemory({ title: "", body: "", tags: "" });
    } finally {
      setBusyAction(null);
    }
  }

  async function resetDemo() {
    if (isBusy) return;
    setBusyAction("reset");
    try {
      clearState();
      const seeded = await seedState();
      setState(seeded);
      setSelectedMemoryId(null);
    } finally {
      setBusyAction(null);
    }
  }

  async function importEvidenceBundle(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const imported = parseEvidenceBundle(parsed);
      setState(imported);
      setSelectedMemoryId(null);
      setBundleImportStatus(
        `Imported ${imported.memories.length} memories, ${imported.agentRuns.length} runs, and ${imported.auditLogs.length} audit logs.`
      );
    } catch (error) {
      setBundleImportStatus(error instanceof Error ? error.message : "Could not import evidence bundle.");
    } finally {
      if (bundleInputRef.current) bundleInputRef.current.value = "";
    }
  }

  const latestRun = state.agentRuns[0];
  const conflicts = detectMemoryConflicts(state.memories);
  const timeline = buildArtifactTimeline(state, selectedMemory?.id);
  const health = calculateMemoryHealth(state, conflicts);
  const uploadDiagnostics = summarizeUploadDiagnostics(state);
  const graph = buildArtifactGraph(state);
  const usedMemories = latestRun
    ? latestRun.usedMemoryIds
        .map((id) => state.memories.find((memory) => memory.id === id))
        .filter((memory): memory is MemoryRecord => Boolean(memory))
    : [];
  const busyLabel = getBusyLabel(busyAction);

  return (
    <main className="mx-auto max-w-[1440px] bg-[#edf2ed] p-4 text-slate-950 sm:p-7">
      <header className="grid gap-6 rounded-lg bg-emerald-950 p-7 text-white shadow-[0_18px_50px_rgba(20,46,38,0.18)] lg:flex lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-normal text-emerald-200">Walrus Track MVP</p>
          <h1 className="mb-3 text-4xl font-bold leading-none tracking-normal sm:text-6xl lg:text-7xl">
            Walrus Memory Inspector
          </h1>
          <p className="max-w-3xl text-base leading-7 text-emerald-50">
            Inspect, debug, and verify AI agent memories stored as Walrus-style artifacts. The demo shows persistent
            memory, artifact chains, agent run traces, and audit logs.
          </p>
        </div>
        <button className={quietButtonClass} disabled={isBusy} onClick={resetDemo}>
          <RefreshCw size={16} />
          {busyAction === "reset" ? "Resetting..." : "Reset Demo"}
        </button>
      </header>

      <nav className="sticky top-0 z-20 -mx-4 mt-4 min-h-14 border-y border-emerald-100 bg-[#edf2ed]/95 px-4 py-2 backdrop-blur sm:-mx-7 sm:px-7">
        <div className="mx-auto flex max-w-[1440px] gap-2 overflow-x-auto">
          {quickNavItems.map((item) => (
            <a
              className="whitespace-nowrap rounded-md border border-emerald-100 bg-white px-3 py-2 text-xs font-bold text-emerald-950 hover:border-emerald-700 hover:bg-emerald-50"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <section className="my-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Database />} label="Memory Artifacts" value={state.memories.length} />
        <Metric icon={<Bot />} label="Agent Runs" value={state.agentRuns.length} />
        <Metric icon={<History />} label="Audit Logs" value={state.auditLogs.length} />
        <Metric
          icon={<ShieldAlert />}
          label="Conflicts"
          value={conflicts.length}
        />
      </section>

      {busyLabel ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
          {busyLabel}
        </div>
      ) : null}

      <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`${panelClass} ${anchorClass}`} id="health">
          <div className={panelHeaderClass}>
            <CheckCircle2 size={18} />
            <h2 className="text-base font-bold">Memory Health</h2>
          </div>
          <div className="grid gap-4 2xl:grid-cols-[150px_1fr]">
            <div className="grid place-items-center rounded-lg border border-emerald-100 bg-emerald-50 p-5">
              <strong className="text-5xl text-emerald-950">{health.score}</strong>
              <span className="text-xs font-bold uppercase text-slate-500">Health score</span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-3">
              <HealthItem label="Active" value={health.activeCount} />
              <HealthItem label="Outdated" value={health.outdatedCount} />
              <HealthItem label="Archived" value={health.archivedCount} />
              <HealthItem label="Conflicts" value={health.conflictCount} />
              <HealthItem label="Walrus" value={health.walrusArtifactCount} />
              <HealthItem label="Fallback" value={health.localArtifactCount} />
            </div>
          </div>
        </div>

        <div className={`${panelClass} ${anchorClass}`} id="diagnostics">
          <div className={panelHeaderClass}>
            <Database size={18} />
            <h2 className="text-base font-bold">Walrus Diagnostics</h2>
          </div>
          {uploadDiagnostics ? (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <HealthItem label="Walrus" value={uploadDiagnostics.walrusUploads} />
                <HealthItem label="Fallback" value={uploadDiagnostics.fallbackUploads} />
                <HealthItem label="Total" value={uploadDiagnostics.totalUploads} />
              </div>
              <div className="grid gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                <DiagnosticRow label="Mode" value={uploadDiagnostics.mode} />
                <DiagnosticRow label="Publisher" value={uploadDiagnostics.publisherUrl} />
                <DiagnosticRow label="Aggregator" value={uploadDiagnostics.aggregatorUrl} />
                <DiagnosticRow label="Timeout" value={`${uploadDiagnostics.uploadTimeoutMs}ms`} />
              </div>
              {uploadDiagnostics.lastUpload ? (
                <div className="rounded-lg border border-emerald-100 bg-white p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className={labelClass}>Latest Upload</span>
                    <strong className={statusClass(uploadDiagnostics.lastUpload.storage === "walrus" ? "active" : "outdated")}>
                      {uploadDiagnostics.lastUpload.storage}
                    </strong>
                  </div>
                  <p className="mb-2 text-sm font-bold text-slate-800">{uploadDiagnostics.lastUpload.type}</p>
                  {uploadDiagnostics.lastUpload.url ? (
                    <a
                      className="block text-xs text-emerald-950 underline decoration-emerald-700/40 [overflow-wrap:anywhere]"
                      href={uploadDiagnostics.lastUpload.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {uploadDiagnostics.lastUpload.blobId}
                    </a>
                  ) : (
                    <code className="block text-xs text-emerald-950 [overflow-wrap:anywhere]">
                      {uploadDiagnostics.lastUpload.blobId}
                    </code>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {uploadDiagnostics.lastUpload.durationMs}ms
                    {uploadDiagnostics.lastUpload.error ? ` · ${uploadDiagnostics.lastUpload.error}` : ""}
                  </p>
                </div>
              ) : null}
              {uploadDiagnostics.recentFailures.length ? (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className={labelClass}>Recent Failures</p>
                  <div className="grid gap-2">
                    {uploadDiagnostics.recentFailures.map((failure) => (
                      <div className="text-xs text-orange-950" key={`${failure.blobId}-${failure.createdAt}`}>
                        <strong>{failure.type}</strong>
                        <span className="block [overflow-wrap:anywhere]">{failure.error ?? "Unknown upload error"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="rounded-lg border border-emerald-100 bg-white p-3">
                <p className={labelClass}>Recent Upload Events</p>
                <div className="grid max-h-36 gap-2 overflow-auto pr-1">
                  {uploadDiagnostics.recentEvents.map((event) => (
                    <div className="grid gap-1 text-xs" key={`${event.blobId}-${event.createdAt}`}>
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-800">{event.type}</strong>
                        <span className={event.ok ? "font-bold text-emerald-800" : "font-bold text-orange-900"}>
                          {event.storage}
                        </span>
                      </div>
                      <code className="text-emerald-950 [overflow-wrap:anywhere]">{event.blobId}</code>
                      <span className="text-slate-500">
                        {event.durationMs}ms{event.error ? ` · ${event.error}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={emptyClass}>No upload attempts recorded yet.</div>
          )}
        </div>

        <div className={`${panelClass} ${anchorClass}`} id="bundle">
          <div className={panelHeaderClass}>
            <Download size={18} />
            <h2 className="text-base font-bold">Evidence Bundle</h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-slate-600">
            Export or import a portable JSON package containing memories, conflicts, run traces, audit logs, timeline
            entries, health metrics, and upload diagnostics for judging or cross-agent handoff.
          </p>
          <div className="grid gap-2">
            <button
              className={primaryButtonClass}
              onClick={() =>
                downloadJson(
                  `walrus-memory-inspector-evidence-${new Date().toISOString().slice(0, 10)}.json`,
                  buildEvidenceBundle({ state, conflicts, timeline, health, uploadDiagnostics })
                )
              }
            >
              <Download size={16} />
              Export Evidence Bundle
            </button>
            <input
              accept="application/json,.json"
              className="hidden"
              ref={bundleInputRef}
              type="file"
              onChange={(event) => void importEvidenceBundle(event.target.files?.[0])}
            />
            <button className={quietButtonClass} disabled={isBusy} onClick={() => bundleInputRef.current?.click()}>
              <FileSearch size={16} />
              Import Evidence Bundle
            </button>
            {bundleImportStatus ? (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-950">
                {bundleImportStatus}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`${panelClass} ${anchorClass}`} id="agent">
          <div className={panelHeaderClass}>
            <Bot size={18} />
            <h2 className="text-base font-bold">Agent Run</h2>
          </div>
          <label className={labelClass} htmlFor="question">
            Question
          </label>
          <textarea
            className={fieldClass}
            id="question"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            rows={3}
          />
          <button className={primaryButtonClass} disabled={isBusy} onClick={askAgent}>
            <Sparkles size={16} />
            {busyAction === "agent" ? "Running Agent..." : "Run Agent With Memory"}
          </button>
          {latestRun ? (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <p className={labelClass}>Latest Answer</p>
              <p className="mb-3 leading-6 text-slate-800">{latestRun.answer}</p>
              <div className="inline-flex max-w-full overflow-wrap-anywhere rounded-md bg-emerald-100 px-2 py-1 font-mono text-xs text-emerald-900 [overflow-wrap:anywhere]">
                Trace blob: {latestRun.traceArtifact.blobId}
              </div>
            </div>
          ) : (
            <div className={emptyClass}>Run the agent to create an inspectable trace.</div>
          )}
        </div>

        <div className={`${panelClass} ${anchorClass}`} id="trace">
          <div className={panelHeaderClass}>
            <GitBranch size={18} />
            <h2 className="text-base font-bold">Trace Viewer</h2>
          </div>
          {latestRun ? (
            <>
              <p className={labelClass}>Used Memories</p>
              <div className={listClass}>
                {usedMemories.map((memory) => (
                  <button
                    key={memory.id}
                    className="grid w-full gap-1 rounded-lg border border-emerald-100 bg-white p-3 text-left hover:border-emerald-700 hover:ring-4 hover:ring-emerald-700/10"
                    onClick={() => setSelectedMemoryId(memory.id)}
                  >
                    <span className="font-medium">{memory.title}</span>
                    <strong className={statusClass(memory.status)}>{statusLabels[memory.status]}</strong>
                    <small className="text-xs text-slate-500 [overflow-wrap:anywhere]">{memory.rawArtifact.blobId}</small>
                  </button>
                ))}
              </div>
              <p className={`${labelClass} mt-4`}>Retrieval Scores</p>
              <div className="grid max-h-72 gap-2 overflow-auto pr-1">
                {latestRun.retrievalCandidates.length ? (
                  latestRun.retrievalCandidates.map((candidate) => (
                    <button
                      className={`grid w-full gap-2 rounded-lg border p-3 text-left ${
                        candidate.selected
                          ? "border-emerald-700 bg-emerald-50 ring-4 ring-emerald-700/10"
                          : "border-emerald-100 bg-white"
                      }`}
                      key={candidate.memoryId}
                      onClick={() => setSelectedMemoryId(candidate.memoryId)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <strong className="block">{candidate.title}</strong>
                          <span className="text-xs text-slate-500">{statusLabels[candidate.status]}</span>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-emerald-950">
                          {candidate.score}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candidate.matchedTokens.length ? (
                          candidate.matchedTokens.map((token) => (
                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.68rem] font-bold text-emerald-950" key={token}>
                              {token}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">No token match</span>
                        )}
                      </div>
                      <ul className="grid gap-1 text-xs text-slate-600">
                        {candidate.reasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </button>
                  ))
                ) : (
                  <div className={emptyClass}>This trace was created before retrieval scoring was recorded.</div>
                )}
              </div>
            </>
          ) : (
            <div className={emptyClass}>No trace yet.</div>
          )}
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`${panelClass} ${anchorClass}`} id="conflicts">
          <div className={panelHeaderClass}>
            <ShieldAlert size={18} />
            <h2 className="text-base font-bold">Conflict Radar</h2>
          </div>
          {conflicts.length ? (
            <div className={listClass}>
              {conflicts.map((conflict) => (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4" key={conflict.id}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className={labelClass}>Severity: {conflict.severity}</p>
                      <h3 className="text-lg font-bold text-orange-950">{conflict.topic}</h3>
                      <span className="mt-1 inline-flex rounded-full bg-white px-2 py-1 text-xs font-bold text-orange-950">
                        {conflict.kind.replace("_", " ")}
                      </span>
                    </div>
                    <strong className="rounded-full bg-orange-200 px-2 py-1 text-xs font-bold text-orange-950">
                      {conflict.values.join(" / ")}
                    </strong>
                  </div>
                  <p className="mb-3 text-sm leading-6 text-orange-950">{conflict.description}</p>
                  <div className="grid gap-2">
                    {conflict.memoryIds.map((memoryId) => {
                      const memory = state.memories.find((item) => item.id === memoryId);
                      if (!memory) return null;
                      return (
                        <button
                          className="rounded-md border border-orange-200 bg-white px-3 py-2 text-left text-sm hover:border-orange-500"
                          key={memoryId}
                          onClick={() => setSelectedMemoryId(memoryId)}
                        >
                          <span className="font-bold">{memory.title}</span>
                          <span className="ml-2 text-orange-900">{statusLabels[memory.status]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className={`${smallButtonClass} mt-3 border-orange-300 text-orange-950 hover:bg-orange-100`}
                    disabled={isBusy}
                    onClick={() => resolveConflict(conflict)}
                  >
                    <CheckCircle2 size={14} />
                    {busyAction === "resolve-conflict" ? "Resolving..." : "Resolve by latest memory"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={emptyClass}>No active memory conflicts detected.</div>
          )}
        </div>

        <div className={`${panelClass} ${anchorClass}`} id="timeline">
          <div className={panelHeaderClass}>
            <GitBranch size={18} />
            <h2 className="text-base font-bold">Artifact Timeline</h2>
          </div>
          <div className={listClass}>
            {timeline.map((item) => (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4" key={item.id}>
                <div className="mb-1 flex items-start justify-between gap-3">
                  <strong>{item.title}</strong>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-emerald-950">{item.artifact.type}</span>
                </div>
                <p className="mb-2 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                <p className="mb-2 text-sm text-slate-700">{item.detail}</p>
                <Artifact label={item.artifact.storage === "walrus" ? "Walrus blob" : "Demo blob"} value={item.artifact.blobId} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-5">
        <div className={`${panelClass} ${anchorClass}`} id="graph">
          <div className={panelHeaderClass}>
            <GitBranch size={18} />
            <h2 className="text-base font-bold">Artifact Graph</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
              <p className={labelClass}>Graph Summary</p>
              <div className="grid grid-cols-2 gap-2">
                <HealthItem label="Nodes" value={graph.nodes.length} />
                <HealthItem label="Edges" value={graph.edges.length} />
              </div>
            </div>
            <div className="grid max-h-72 gap-2 overflow-auto pr-1">
              {graph.edges.length ? (
                graph.edges.map((edge, index) => (
                  <div className="grid gap-1 rounded-lg border border-emerald-100 bg-white p-3" key={`${edge.from}-${edge.to}-${index}`}>
                    <span className="text-xs font-bold uppercase text-slate-500">{edge.label}</span>
                    <code className="text-xs text-emerald-950 [overflow-wrap:anywhere]">{edge.from}</code>
                    <span className="text-xs text-slate-500">to</span>
                    <code className="text-xs text-emerald-950 [overflow-wrap:anywhere]">{edge.to}</code>
                  </div>
                ))
              ) : (
                <div className={emptyClass}>Run the agent to add trace edges.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`${panelClass} ${anchorClass}`} id="memories">
          <div className={panelHeaderClass}>
            <FileSearch size={18} />
            <h2 className="text-base font-bold">Memory Browser</h2>
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-md border border-emerald-100 bg-white px-3">
            <Search size={16} />
            <input
              className="mb-0 w-full border-0 bg-transparent py-3 text-slate-950 outline-none"
              value={memoryFilter}
              onChange={(event) => setMemoryFilter(event.target.value)}
              placeholder="Search title, body, tags, status..."
            />
          </div>
          <div className={listClass}>
            {filteredMemories.map((memory) => (
              <button
                key={memory.id}
                className={`grid w-full gap-1 rounded-lg border bg-white p-3 text-left hover:border-emerald-700 hover:ring-4 hover:ring-emerald-700/10 ${
                  selectedMemory?.id === memory.id ? "border-emerald-700 ring-4 ring-emerald-700/10" : "border-emerald-100"
                }`}
                onClick={() => setSelectedMemoryId(memory.id)}
              >
                <span className="font-medium">{memory.title}</span>
                <strong className={statusClass(memory.status)}>{statusLabels[memory.status]}</strong>
                <small className="text-xs text-slate-500 [overflow-wrap:anywhere]">{memory.summary}</small>
              </button>
            ))}
          </div>
        </div>

        <div className={`${panelClass} ${anchorClass}`} id="memory-inspector">
          <div className={panelHeaderClass}>
            <Database size={18} />
            <h2 className="text-base font-bold">Memory Inspector</h2>
          </div>
          {selectedMemory ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={labelClass}>Selected Memory</p>
                  <h3 className="text-xl font-bold">{selectedMemory.title}</h3>
                </div>
                <strong className={statusClass(selectedMemory.status)}>{statusLabels[selectedMemory.status]}</strong>
              </div>
              <p className="my-4 leading-6 text-slate-700">{selectedMemory.body}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedMemory.tags.map((tagValue) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-900"
                    key={tagValue}
                  >
                    <Tag size={12} />
                    {tagValue}
                  </span>
                ))}
              </div>
              <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Artifact label="Raw memory" artifact={selectedMemory.rawArtifact} value={selectedMemory.rawArtifact.blobId} />
                <Artifact label="Raw hash" value={selectedMemory.rawArtifact.contentHash.slice(0, 24)} />
                <Artifact label="Summary" artifact={selectedMemory.summaryArtifact} value={selectedMemory.summaryArtifact.blobId} />
                <Artifact label="Summary hash" value={selectedMemory.summaryArtifact.contentHash.slice(0, 24)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={statusButtonClass} disabled={isBusy} onClick={() => updateMemoryStatus(selectedMemory.id, "outdated")}>
                  <ShieldAlert size={15} />
                  {busyAction === "status-update" ? "Updating..." : "Mark Outdated"}
                </button>
                <button className={statusButtonClass} disabled={isBusy} onClick={() => updateMemoryStatus(selectedMemory.id, "important")}>
                  <Flag size={15} />
                  {busyAction === "status-update" ? "Updating..." : "Mark Important"}
                </button>
                <button className={statusButtonClass} disabled={isBusy} onClick={() => updateMemoryStatus(selectedMemory.id, "archived")}>
                  <Archive size={15} />
                  {busyAction === "status-update" ? "Updating..." : "Archive"}
                </button>
                <button className={statusButtonClass} disabled={isBusy} onClick={() => updateMemoryStatus(selectedMemory.id, "active")}>
                  <CheckCircle2 size={15} />
                  {busyAction === "status-update" ? "Updating..." : "Restore Active"}
                </button>
              </div>
            </>
          ) : (
            <div className={emptyClass}>Select a memory.</div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className={`${panelClass} ${anchorClass}`} id="create-memory">
          <div className={panelHeaderClass}>
            <Database size={18} />
            <h2 className="text-base font-bold">Create Memory Artifact</h2>
          </div>
          <label className={labelClass}>Title</label>
          <input
            className={fieldClass}
            value={newMemory.title}
            onChange={(event) => setNewMemory({ ...newMemory, title: event.target.value })}
            placeholder="Memory title"
          />
          <label className={labelClass}>Body</label>
          <textarea
            className={fieldClass}
            value={newMemory.body}
            onChange={(event) => setNewMemory({ ...newMemory, body: event.target.value })}
            placeholder="Memory content"
            rows={4}
          />
          <label className={labelClass}>Tags</label>
          <input
            className={fieldClass}
            value={newMemory.tags}
            onChange={(event) => setNewMemory({ ...newMemory, tags: event.target.value })}
            placeholder="comma,separated,tags"
          />
          <button className={primaryButtonClass} disabled={isBusy || !newMemory.title || !newMemory.body} onClick={addMemory}>
            <Database size={16} />
            {busyAction === "create-memory" ? "Storing Memory..." : "Store Memory"}
          </button>
        </div>

        <div className={`${panelClass} ${anchorClass}`} id="audit">
          <div className={panelHeaderClass}>
            <History size={18} />
            <h2 className="text-base font-bold">Audit Log</h2>
          </div>
          {state.auditLogs.length ? (
            <div className={listClass}>
              {state.auditLogs.map((log) => (
                <div className="grid gap-1 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4" key={log.id}>
                  <strong>{log.detail}</strong>
                  <span className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                  <small className="text-xs text-slate-500 [overflow-wrap:anywhere]">
                    Audit blob: {log.artifact.blobId}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className={emptyClass}>Status changes create Walrus-style audit artifacts.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-lg border border-emerald-100 bg-white/90 p-4 shadow-[0_12px_30px_rgba(25,44,38,0.08)]">
      <div className="grid size-11 place-items-center rounded-lg bg-emerald-50 text-emerald-700">{icon}</div>
      <div>
        <span className="block text-sm text-slate-500">{label}</span>
        <strong className="mt-1 block text-3xl font-bold">{value}</strong>
      </div>
    </div>
  );
}

function HealthItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid min-h-20 min-w-0 content-between rounded-lg border border-emerald-100 bg-white p-3">
      <span className="block truncate text-xs font-bold uppercase text-slate-500" title={label}>
        {label}
      </span>
      <strong className="mt-1 block min-w-0 truncate text-2xl text-emerald-950" title={String(value)}>
        {value}
      </strong>
    </div>
  );
}

function DiagnosticRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <code className="text-xs text-emerald-950 [overflow-wrap:anywhere]">{value}</code>
    </div>
  );
}

function Artifact({ label, value, artifact }: { label: string; value: string; artifact?: { storage: string; url?: string } }) {
  return (
    <div className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50/40 p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="block text-xs font-extrabold uppercase tracking-normal text-slate-500">{label}</span>
        {artifact ? (
          <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-bold uppercase text-emerald-950">
            {artifact.storage}
          </span>
        ) : null}
      </div>
      {artifact?.url ? (
        <a
          className="flex items-start gap-1 text-xs text-emerald-950 underline decoration-emerald-700/40 [overflow-wrap:anywhere]"
          href={artifact.url}
          rel="noreferrer"
          target="_blank"
        >
          <Link className="mt-0.5 shrink-0" size={12} />
          {value}
        </a>
      ) : (
        <code className="block text-xs text-emerald-950 [overflow-wrap:anywhere]">{value}</code>
      )}
    </div>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
