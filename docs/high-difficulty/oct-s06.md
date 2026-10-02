# oct-s06 回桁 — Goal reset reverses delivery side

Target D3, unmeasured. A complete unfinished Block/Goal task, not an already prepared ending. The Block starts on the bottom row and cannot be pushed north. The movable Goal must be transported down to it. Goal is first pushed north into Spike; it returns south of the player, who can now push it down before moving the Block onto it.

Real route `LDDRDRUUDDLULLDDRR`, 18 inputs / 5 pushes, 314 states. Reset at input 8 is nonfinal: two Goal pushes and one Block push remain. Ban Goal reset: exhausts 192 states. Independent push-first finds 5/18 (256 states); banning resets exhausts 164. One opening (2,1) supplies a northern approach: no-reset route `DRDDLULLDDRR`, 12/3, 262 states.

This is not the stronger attempted Goal-reset-onto-occupied-Block-origin theorem: those searches did not yield a qualified candidate and establish no impossibility result. Here the goal itself must be brought to the immobile-axis Block, versus S07 transporting a shaped Block to fixed goals. It shares the general reset-to-change-side idea and is a transfer exercise, not a wholly new reset concept.

Pruning closed four equal-cost cells (0,0),(4,0),(4,3),(4,4), then reran the original and single-opening contrast. Remaining ordinary cells: closing (1,0),(1,1),(3,1),(0,2),(1,2),(2,2),(0,3),(2,3),(3,3),(0,4),(1,4),(3,4) makes it unsolvable. Closing (4,2) instead creates a bypass by changing Goal push/cross permission; retain the cell. Deleting Goal unsolvable; deleting Spike bypasses reset; removing the sole Block is vacuous.

Run `node <temp>/audit-bridge.mjs oct-s06` from repository root. Engine replay, exhaustive bans, contrast, push-first and mutation checks green. Vitest draft awaits integration. Source SHA256 14d7d8d0ae0c9beea025aabe91f7f216a8efb11aa86a164be3fcd791c59fda0b.

Risks: low-complexity bidirectional Goal transfer with considerable walking, no measured human difficulty or AI-player acceptance.
