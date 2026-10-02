# G06 连隙 — machine-verified candidate, not playtest acceptance

Hash `4b0e235e`. Design target D7 only; no calibrated rating or AI acceptance. Two reciprocal pairs preserve the existing engine rules; no new portal behavior. The new relation is cross-pair control: moving one pair's endpoint supplies an obstruction that licenses pushing an endpoint of the other pair. A serial tour through two otherwise independent portals would not satisfy the necessity test.

Board 5×4; player(4,1), one real block(3,1), Goal(2,2). Pair E(1,2)↔X(2,1), F(0,2)↔Y(1,1). Walls(3,2),(4,2),(0,3),(3,3),(4,3). All task objects initially unfinished.

Real replay `ULLDRUUDLLDRURDLURUURRRLDDUULDLULD` wins, 889 discovered states. Forbid any gate push licensed by a moved gate in a different pair occupying the remote destination: exhausts 334 states without victory. Predicate is not restricted to one coordinate, one gate or one final step. The chosen route contains 2 task pushes after the portal arrangement; this is a topology preparation puzzle, not a many-box transport puzzle.

Decoupling opens only (0,3), enabling another approach around F. The identical broad ban now solves with `ULLLLDDURRUULURDLURUULDRRDLULURRD`, 847 states. Thus crossing the pairs' permissions is geometry-dependent, not entailed by the presence of four portals.

Compression removed unreachable isolated (4,3). Eight eligible floor-wall mutations: seven exhaust unsolved, closing (1,3) creates a 13-input shortcut `ULLDDUURRDLULD` by supplying static remote obstruction. Keep it open as a proof element. Removing E/X gives `LULD`, 18 states; removing F/Y exhausts 24 states, showing this is not an independent optional second tour. Removing the sole Block empties the victory set, so that trivial result does not establish task quality.

Run `node scripts/audit-oct-gate.mjs g06` together with sibling `oracle.mjs` from repository root. Both resolve Vite and source without permanent Temp paths; assertions cover true move replay, exhaustive core ban and the valid contrast, and print all eight floor closures and both pair deletions. The production test draft exercises the broader relationship directly. Root integration must perform missing-module red then source green. Main uncertainty: four gates may impose visual identity burden; AI player must receive only normal visible information and no pairing answers. Difficulty must not be inferred from the 34-key route or solver size.
