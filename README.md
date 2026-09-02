# Oshi-Sokoban-Lab

[简体中文](README.zh-CN.md)

A playable web lab created by the original author of Oshi to reconstruct and extend its grid-push mechanics. It focuses on the puzzle layer only—without the visual-novel narrative or original art and audio assets—and provides a test-driven space for mechanics fidelity and level-design research.

![Oshi-Sokoban-Lab social preview: a dark grid-push board with blocks and paired gates](docs/social-preview-v2.svg)

## Play locally

This repository does not currently host a public build. Install Node.js and npm, then run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite.

## How to play

- Choose a lesson, read its briefing, then select **Start lesson**.
- Move with the arrow keys or `W`, `A`, `S`, and `D`; the on-screen direction buttons provide the same inputs.
- Press `Z` to undo and `R` to restart.
- Completing a lesson keeps the solved board visible and reveals an explicit **Next lesson** button.

## What is here

- Sixty-three compact candidate lessons arranged as twenty-one three-stage groups: establish a rule, bound its meaning with one-variable contrast, then infer a deeper consequence.
- A pure state-machine engine for player movement, pushing, shaped entities, terrain Goals and Spikes, movable Goals, paired Gates, undo, restart, and optional step or time limits.
- A source-audited rules model covering numbered Goals, Fake Blocks, Rain movement, Gate topology, and Spike resets. Path-driven moving Spikes remain outside the main course until their dynamic state is statically readable.
- Grid-aligned CSS/SVG rendering with shared visual marks for the board and rule legend, including animated movement, two-part Gate travel, and a three-stage Spike destroy/rebirth presentation.
- A test-first course workflow: typed domain events, source conformance, branching progress, bounded state-space solvability, theorem-bypass checks, solution replay, and interface flows are automated.

## Development

```powershell
npm test
npm run typecheck
npm run build
```

The project uses React, TypeScript, and Vite. The rule engine lives in [`src/engine`](src/engine); declarative level families live in [`src/levels`](src/levels); the UI only renders state and dispatches player input.

## Status and scope

The playable core and all 63 curriculum boards are implemented as an automated candidate pool. Every board is currently solver-verified and audited for its declared critical event. The creator has completed and accepted the prior 60-board course (now lessons 01–18 and 22–63); the new Spike framing lessons 19–21 still await creator review. Independent blind tests are a separate gate and are still required before the boards are treated as final lessons. Path Spike is intentionally outside the main teaching route. This is the original creator's mechanics and level-design lab, not a full web port of Oshi.

## Research basis

The implementation is verified against the creator's public Oshi source snapshot [`main @ 4afe6809`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45). See the [web-demo specification](research/04-oshi-mechanics-web-demo-spec.md), [mechanics conformance audit](research/10-mechanics-conformance-audit.md), [Witness / SSR design study](research/15-witness-ssr-level-design-study.md), [63-level curriculum](docs/level-family-curriculum-plan.md), and [blind-test protocol](docs/playtest-protocol.md).

## License

No open-source license is currently included in this repository.
