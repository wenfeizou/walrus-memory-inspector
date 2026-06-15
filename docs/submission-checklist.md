# Submission Checklist

Use this checklist before recording or submitting the project.

## Local Verification

- Run `bun install` on a clean checkout.
- Run `bun run test`.
- Run `bun run build`.
- Start the app with `bun run dev`.
- Open the Vite local URL.
- Click `Reset Demo`.

## Walrus Verification

- Confirm `Walrus Diagnostics` shows the expected publisher URL.
- Confirm `Walrus Diagnostics` shows the expected aggregator URL.
- Confirm at least one new artifact stores as `walrus` when the network is healthy.
- If artifacts fall back to `local-demo`, capture the displayed fallback reason.
- Open a real aggregator blob link when available.

## Demo Flow

For the full presenter script, use [demo-walkthrough.md](demo-walkthrough.md).

- Show `Memory Health`.
- Show `Conflict Radar` with deadline, requirement version, and ownership conflicts.
- Run the default agent question: `What is the current hackathon deadline?`
- Open `Trace Viewer` and show retrieval scores, matched tokens, and citation reasons.
- Resolve the deadline conflict by latest memory.
- Run the agent again and show the June 15 answer.
- Show `Audit Log`.
- Show `Artifact Timeline`.
- Show `Artifact Graph`.
- Export the evidence bundle JSON.

## Submission Assets

- README is up to date.
- `.env.example` is present and contains public testnet defaults.
- `docs/architecture.md` is present.
- `docs/demo-walkthrough.md` is present.
- `docs/project-recreation-brief.md` is present.
- `docs/submission-checklist.md` is present.
- Evidence bundle export has been tested.

## Known Limitations To Mention

- Metadata is browser-local through `localStorage`.
- Retrieval is explainable keyword scoring, not embedding search.
- Conflict detection uses transparent rules, not open-ended contradiction detection.
- Artifact Graph is an edge list rather than a canvas graph.
- Browser-direct Walrus upload may fall back when the publisher is unavailable, slow, or blocked.
