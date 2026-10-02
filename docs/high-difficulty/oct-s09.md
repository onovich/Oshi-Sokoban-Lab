# oct-s09 返汀 — rain stop reused as reset approach

Target D3 transfer, unmeasured; one unfinished real task, plus Fake spatial resource. Fake initially stops the player on row 3 so the real Block can move right. Later Fake is pushed right into Spike; it resets while leaving player at (2,4), whose northward slide stops at (2,1) and grants the final down-push side. The reset's useful result is player placement, NOT a claim that the restored Fake is reused as a subsequent stop.

Real winning route `DLURDRRLDRRURDD`: 15 inputs / 4 pushes, 52 states. Ban Fake reset or all resets: exhausted 46 states, unsolved. Independent push-first 4 / 15, 53 states. Reset occurs at input 11, before four more inputs including the final delivery push, not itself the victory action.

Only open (4,0), forbid Fake reset: `DLURDRRURDD`, 11 inputs / 2 pushes, 37 states. Right-side north access independently replaces the reset-created column. This is not S03's fake-upward preparation: the Fake here starts useful and is subsequently driven into Spike to switch the player's reachable stopping column.

Mutation audit: deleting Fake or Goal unsolvable; deleting Spike bypasses reset. Closures (0,0),(1,0),(3,1),(4,1),(2,2),(4,2),(1,3),(2,3),(4,3),(0,4),(2,4) unsolvable. Closures (0,1),(1,1),(0,2),(1,2),(0,3) create alternative stopping points and bypass; (2,1) changes solution. The only equal-cost cell (3,2) was actually closed as a pruning trial: original still solved 15/4, but the single-opening contrast became proven-unsolved (46 states). Restored it; this red check is reproducible in the test. It is retained for the valid counterfactual, not falsely classified indispensable in the original.

Run `node <temp>/audit-bridge.mjs oct-s09` from repository root. Actual engine replay, forbidden exhaustion, single-opening contrast, minimum pushes and mutations verified. Vitest draft awaits integration. Source SHA256 3a5bd24e669922bca0ce2f41d3f57b0221684431f6e1f8b6d2649fde9a61a5ad.

Quality risks: one Fake reset insight, fairly open rain field; not a high-difficulty capstone. No human difficulty or AI-player acceptance claim.
