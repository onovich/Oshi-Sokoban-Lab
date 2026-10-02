# oct-s08 借扉 — Gate conditional movement and origin loan

Target D4, unmeasured. Complete unfinished Block task. Gate H must leave (1,3), Block borrows then releases that origin, H resets through the lower Spike and is parked elsewhere, then Block uses the same Spike to reset and obtain a new delivery side. Not claimed to require teleporting in the winning route: the Gate's conditional push/traverse behavior is the relevant distinction.

Real winning route `LLDDRRLLUURDLDRUURRDDUULLDDRLUURRDDLLULURRLDDRRUU`: 49 inputs / 12 pushes, 572 states. Independent push-first search: 12 / 49, 541 states. Individually forbid Gate H reset: exhausted 291 states; forbid Block (1,2)->(1,3) origin loan: 265 states; forbid H-reset then A-reset ordered pair: 770 states. Each is proven unsolved, not budget exhaustion. The second reset is nonfinal, preceding four delivery pushes.

Only open (2,0), forbid all three relations: route `LLDDRUULURR`, 11 inputs / 5 pushes, 110 states. Top-side access replaces the shared lower-origin preparation.

Actual type counterfactual: replace both Gates with same-position same-shape Fake Blocks, otherwise unchanged. The new real-engine winning route is `RDDLLULURRLDDRRUU`, 17 inputs / 5 pushes, 792 states. Therefore the original 49-input schedule is NOT equivalent to generic resettable obstacles. Valid deletion of the complete Gate pair gives 17 / 4, 130 states. Individual Gate deletion is invalid dangling pairing, NOT criticality evidence.

Boundary witness: replay `LLDDRRLLUURDURRD`, then Down attempts Gate H reset while Block occupies H origin; actual move rejects with Reset conflict. Green assertion in audit. The reference route's conditionally unavailable simple Gate-push approach distinguishes this from S05's two real Block goals, but origin-loan reuse remains a similarity risk.

Mutation details: target removal unsolvable; Spike deletion creates bypass. Closing (0,1),(1,1),(3,1),(0,2),(3,2),(0,3),(2,3),(3,3),(1,4) is unsolvable. Closing (4,2) creates an alternate order bypass (changes Gate exit availability), so retaining that free cell is meaningful. Equal-shortest-cost cells (0,0),(1,0),(4,1),(0,4) remain acknowledged surplus/alternatives; (1,0) also supports north-opening contrast. No minimal-floor claim.

Run `node <temp>/audit-bridge.mjs oct-s08` from repository root. Includes actual replays, both cost orders, forbidden conditions, contrast, mutation, type replacement and occupied-origin boundary. Production Vitest draft awaits integration. Source SHA256 after neutral player description: 8c1670e17d2728a4c387244e3c5b16d2cfac5da1f446a25fe5e78b4545fae279.

Risk: 49 inputs contain extensive walking; no human difficulty measurement or AI-player acceptance. Distinct type-conditioned obstacle schedule, not a claim of a new teleport skill.
