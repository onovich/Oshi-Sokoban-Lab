# oct-s04 曲隙 — Gate return / Spike auxiliary bridge

Target D4 unmeasured. Group oct-hazard-gate; prerequisite lesson-42, Spike support. The real Block starts off Goal. Main planning is return direction and changing a Gate endpoint under a blocked remote exit; Spike excludes the simpler lower walking approach. This is neither another L-footprint puzzle nor another movable-Goal staging puzzle.

Normal and reset-banned shortest-input route `DLDDDLLUULUDRRRUURDLDR`: 22 inputs / 5 pushes, 276 states each. Actual replay wins. Independent push-first Dijkstra finds 3 pushes / 26 inputs for both normal and reset-banned boards, 219 states each. The 5-push reference is NOT push-optimal; alternative preparation/return ordering is deliberately allowed.

Core is a rightward Gate traversal, a nonfinal transition giving access to the northern push side. Ban all rightward Gate traversals: exhausted 283 states, no solution. Delete only Spike (0,3), retain the same ban: `DLDDDLLULUR`, 11 / 2, 130 states. Lower walking access replaces Gate return, not just a shorter version of the same plan. The proof does not prescribe the Block's exact intermediate coordinates or claim every solution uses the reference Gate move.

Actual loss witness `DLDDDLLUULUDD`: Block has been advanced twice and Gate H moved; then lower Spike resets both objects to (1,3) and (0,1). Audit and production test assert the death-reset and restored preparation.

Mutation audit: Goal removal unsolvable; Spike removal bypasses core; free-cell closures (1,0),(3,0),(1,1),(3,1),(0,2),(1,2),(3,2),(3,3),(1,4),(2,4),(3,4) unsolvable. (4,1) changes solution; (4,2),(0,4),(4,4) are equal-shortest-input alternatives/clearance, retained rather than blindly closing and potentially destroying lower-push solutions. Individual Gate removal is invalid due to dangling pairing and is NOT evidence of criticality; the audit separately removes the entire pair as a valid mechanism mutation.

Audit command: audit-bridge.mjs oct-s04, run from repository. It includes both cost orders, proofs, contrast and loss replays, hashes, and valid pair deletion. Production test draft awaits integration. Source SHA256 after title change: 07d1d6c96153348025a571552eee75b4b31f54c10869a81aa273c307cfcfb833.

Risks: more walking than pushing; no human difficulty or AI-player acceptance. Static teleport pairing/direction may need visual explanation. The earlier reference route is only one plan; do not use its specific completion order as necessity evidence.
