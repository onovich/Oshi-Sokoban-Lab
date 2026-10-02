# oct-s05 交原 — two origins and one reset entrance

Post-reveal candidate, group oct-origin, target D5 unmeasured. Both real Blocks begin unsolved. The source is a new 5x5 geometry, not a rotation/translation of BE1. It inherits origin borrowing but extends coordination: A must temporarily use B origin; B must reset before A resets through the same hazard entrance. Their final pair of adjacent Goals doubles as circulation space.

Real winning route `LLDLDRRDDLUULUURDLDRDRRUDLLULUURDDRDDLURRULLRDDLU`: 49 inputs, 15 pushes. Shortest-input search 1095 states; independent push-first Dijkstra also 15 / 49, 932 states. No reset: proven-unsolved, ordinary solver 540 states and Dijkstra 485.

Core prohibitions separately exhausted: B reset 540 states; A (2,2)->(2,1), borrowing B origin, 329 states; ordered B reset then A reset 1635 states. These are nonfinal interactions, not a final delivery push. The two reset events precede further deliveries. Event sequence does not claim exact intermediate coordinates for every other move or a unique solution.

Failed permission witness `LLDLDRRDDLUURDR` reaches player (4,3), A (2,1), B (4,2). Up would send B onto Spike (4,1), but A occupies B origin (2,1): actual move rejects with Reset conflict. The test asserts unchanged state. Clearing that origin in winning play restores the reset permission.

Single-cell decoupling: open wall (3,1), retaining all other positions, goals and Spike. Forbid all core conditions simultaneously: `LLDRDLRDDLU`, 11 / 3, solved 317 states. The independent side access makes the reset circulation unnecessary.

Mutation checks: either Block deletion bypasses the interaction; either Goal deletion unsolvable; Spike deletion creates a bypass because its cell becomes a walking connection. Ten free-cell closures all unsolvable: (1,0),(2,0),(3,0),(1,1),(3,2),(4,2),(3,3),(4,3),(2,4),(3,4). Removed four initially redundant cells (0,1),(0,3),(1,4),(4,4), then reran proofs and routes. Equal-cost alternative walking/handling remains; do not claim unique strategy.

Audit `node .../oshi-oct-spike/audit-bridge.mjs oct-s05` is green for both cost orders, all individual prohibitions, contrast replays, and mutation audit. Production Vitest draft awaits copying into src/levels/lab. Its occupied-origin boundary assertion is an additional explicit regression.

Source SHA256 after prerequisites/Spike-primary metadata: `7332e06ad19bc63c72f5817cf3b9a1ef3bdb8e7871cd126dd09d0a7f66c05389`.

Quality risks: 49 inputs include substantial circulation and cannot establish D5. Still requires player testing for readable origin ownership, perceived reason for the second reset, and whether the repeated cycle adds planning rather than execution. No AI-player or author acceptance claimed.
