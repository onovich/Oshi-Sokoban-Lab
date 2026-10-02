# oct-s07 远原 — remote footprint reset / side transfer

Target D3, unmeasured. One complete unfinished horizontal two-cell Block task, not a claimed high-difficulty origin schedule. Distinct from S01: reset is now the necessary useful action, and the remote part of a horizontal shape triggers it. Distinct from S05: no second object's origin loan or reset ordering.

Real winning route `DLDRRUURULL`: 11 inputs / 6 pushes, 43 solver states. The fourth input pushes the anchor from (2,4) to (3,4); remote cell (4,4) touches Spike and resets the whole shape to (2,3), leaving the player at (2,4). Four goal-delivery pushes remain after this nonfinal transition. Ban Block reset: exhaustive 20 states, no solution. Ban all reset: also exhaustive 20. Independent push-first search finds 6 pushes / 11 inputs, 52 states.

Single-variable contrast: open only wall (1,2). With reset forbidden, route `LDDRRUURULL` wins in 11 inputs / 4 pushes, 75 states. This independently supplies the lower push side; equal input count is not disguised as a shorter-input result.

Mutation audit after pruning: removing Spike or either target cell is unsolvable; removing Block is vacuous and not useful evidence. Every remaining ordinary empty cell closure is unsolvable: (2,1),(3,1),(4,1),(3,2),(4,2),(1,3),(1,4),(2,4),(3,4). Six previously surplus cells (1,0),(2,0),(4,0),(0,2),(4,3),(0,4) were successively closed, rerunning original and single-opening contrast each time. The contrast route changed, but its relation and costs remain. This is locally deletion-minimal ordinary floor, not a global geometric optimality claim.

Run `node <temporary-directory>/audit-bridge.mjs oct-s07` from repository root. Actual engine replay, exhaustive forbidden search, contrast, push-first and mutations are green; production Vitest draft awaits integration. Source SHA256 after floor pruning: d9e4f7e3300470fa69fbf546c61e0180e58a026617667c3aa43f36844f6ea392.

No AI-player acceptance or measured human difficulty is claimed. Main quality risk: only one reset insight, therefore suitable as post-reveal transfer practice rather than hard capstone.
