# G08 栖隙 — borrow and return a final landing

Hash `cb240b6e`. Target D7 is only a target. Two unfinished real Blocks, two static goals, one Gate pair. A goal must first serve as a functioning portal entrance, not merely be crossed by a moving gate, and must later be vacated for the true task. No extra mechanisms are introduced.

True move replay `DDRRDDLLURDDRDLLURURULDLULLDRDRRUULD` wins, 4940 discovered states. The route parks E on lower Goal, uses it to reach the upper pushing side, temporarily rearranges both boxes, and finally clears that Goal. Broad ban: any gate-traversed event whose entry cell is any terrain Goal. Exhaustive no-solution result: 2317 states. Initial gates do not overlap goals, so a merely initial overlap cannot satisfy this relation. Since two one-cell Blocks need the only two Goals, a gate cannot permanently consume one goal at completion. This last fact is a rule consequence, not substituted for the core behavior proof.

Open only wall (3,0) to provide independent upper access: the same ban solves `DRDRRDLDLLURUUDLDRUURRDLULD`, 22208 states. The earlier 20000-state run exhausted its budget and was not treated as an impossibility; the 50000 budget resolves it positively. Ban all traversal: 354 states, proven unsolved.

Compression removed unneeded pockets (4,0) and (0,3). Ten ordinary floor closures: eight exhaustive unsolved; (0,2) retains the direct lower entrance approach (closing it requires a longer alternate route); (4,3) is an alternative gate parking space, not claimed mandatory. Remove A: 10-input solve, 209 states. Remove B: 12-input solve, 235 states. Both trivialize the shared resource task, without claiming shortest-route difference proves all human depth.

Portable audit `audit-oct-gate.mjs g08` with `oracle.mjs` loads actual source, asserts replay/ban/contrast and prints mutations and object deletions. Test draft requires repository integration red→green; not yet AI-playtested or author accepted. Risk: gate-on-goal is less visually obvious than a cleared floor tile, so verify the current renderer preserves goal visibility and readable pairing. No route or theorem should be shown to the AI tester.
