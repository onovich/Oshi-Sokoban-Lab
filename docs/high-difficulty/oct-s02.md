# oct-s02 偏埠 — movable Goal / Spike auxiliary bridge

Candidate only, target D4 not measured. Group oct-hazard-goal; do not chain it immediately after other hazard bridges. Both Block and Goal begin separated with substantial transport remaining. Main relation is Goal push/cross and staging, not another shaped-box detour.

Normal `LDDLLLUDDURRRDRDLLL`, 19 inputs / 9 pushes, explored 1400 states. Ban both object-reset and death-reset: also 19 / 9, explored 1390. Independent lexicographic push-first Dijkstra: both 9 pushes / 19 inputs, 946 states each. It uses actual move() without deadlock pruning, so a cheaper reset solution is ruled out in both requested cost orders.

Nonfinal relation is Goal (1,2)->(0,2), an intermediate blocked edge that can then be crossed to obtain the downward push side. The eventual Goal in the reference solution is (0,4). Banning intermediate edge placement exhausts 327 states with no solution. Delete only Spike (1,0), keeping the prohibition: `LLLLDDRRLUURRD`, 14 / 3, 576 states, actual replay wins with Goal transported right toward Block instead. This changes transport plan, not just walking distance.

Goal reset loss witness: `LDDDRDLLLUUU`. Goal goes (1,2)->(1,1)->(1,0), touches Spike, returns to origin (1,2), player remains (1,1). The production test asserts this exact event; normal winning routes avoid it.

Mutations: remove Goal unsolvable; remove Spike bypasses core; remove Block vacuously bypasses the task. Free cells (3,0),(0,1),(2,2),(3,2),(0,3),(3,3),(4,3),(0,4),(1,4),(2,4),(3,4),(4,4) each become unsolvable when closed. Closing (0,2) creates a valid alternative: the wall changes Goal's push/cross condition, illustrating why obstacle deletion/insertion is not monotone. Retained equal-cost cells (0,0),(2,0) belong to the no-spike contrast entrance; (1,1),(1,3) support the explicit loss witness and alternative staging access. They are not claimed necessary.

Run `node C:/Users/Administrator/AppData/Local/Temp/oshi-oct-spike/audit-bridge.mjs oct-s02` from the repository. Audit can be copied into scripts unchanged. Production test draft is provided for src/levels/lab; its destination Vitest run is pending integration. Audit cost, necessity, replay, and mutation assertions are green. Prior candidate rejected because its alleged core was just the final Goal placement; current core is strictly intermediate.

Source SHA256 after prerequisite/Spike-support metadata: ed6cd887193d354f10faaecca5188071bfc29af558a3424016501a5b1a8e4b3a.

Risks: a single real Block, and first transport may be obvious once the north entrance is excluded. No AI-player or human acceptance, no evidence for lasting early Spike beliefs. This is a Goal-condition bridge, not advanced origin scheduling.
