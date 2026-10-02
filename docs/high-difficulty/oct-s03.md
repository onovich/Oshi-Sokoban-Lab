# oct-s03 侧汀 — rain / Fake approach / Spike auxiliary bridge

Target D3, not measured. Group oct-hazard-rain and prerequisite lab-rs10-self-stop-bank; not linked into a consecutive hazard chain. Fake is not a task Block. The real Block starts off its Goal with three pushes of transport required, and its right push side is initially inaccessible safely.

Normal and banned-object/death-reset solutions both `DRUUULLLULD`, 11 inputs / 5 pushes, 33 states each. Independent push-first Dijkstra confirms both 5 pushes / 11 inputs, 35 states each. Actual move replay wins.

Core is moving Fake to advance the safe southern approach into the real Block's right push side. With Fake never pushed, exhaustive 7-state frontier has no solution. Delete only Spike (2,0) and still forbid moving Fake: `RDLLLULD`, 8 / 3, 32 states. The original fixed Fake then stops a north approach; the change eliminates preparation, rather than merely shortening a walk.

Actual loss witness `DRUUULUL`: after two upward Fake pushes, sliding left across the upper Spike resets the entire board. Fake returns (4,2), player (1,0), so this is loss of useful preparation, not an unprepared death demonstration. Audit and test assert this boundary.

Mutation audit: deleting Fake or Goal unsolvable; deleting Spike bypasses preparation. Many added walls themselves provide stops and create bypasses: (0,3),(1,3),(2,3),(1,4),(3,4),(4,4). Do not blindly fill the open field to eliminate visually empty cells. Closures (0,0),(4,0),(0,1),(1,1),(3,1),(4,1),(4,3),(2,4) are unsolvable. Equal-cost optional cells (3,0),(2,2),(3,2),(3,3),(0,4) retain the open rectangular sliding surface; (3,0) also supports the explicit loss and no-spike shortcut. Open topology is a readability/behavior constraint, not a claim every tile is proof-critical.

Run audit-bridge.mjs oct-s03 from repository. Both cost orders, replays, proof, single-Spike contrast, actual progress loss, and mutations are green. Production Vitest draft supplied; destination execution pending integration.

Source SHA256: 1bf76802f7944dc3ba5c9d44ed1b575937c7b29a568d1161cbe740357d61d22f.

Risks: very short coordination, possibly easier than D3. Fake is used to advance an approach position, not removed as garbage. No evidence for player belief formation, readability, or human difficulty. Shape bridge and Goal bridge use different primary relations; this should be interleaved into Rain, not made their sequel.
