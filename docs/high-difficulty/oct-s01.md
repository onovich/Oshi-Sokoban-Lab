# oct-s01 曲垣 — shape / Spike auxiliary bridge

Candidate only; target D3, no player rating or AI-player acceptance. `oct-s01.ts` and `oct-s01.test.ts` copy into `src/levels/lab`. No LAB number assigned. Group `oct-hazard-space`; not chained to the other hazard bridges.

Complete task: transport a rigid L block from (3,2) to the L goal at (1,4), with all three cells initially unfinished. Compared with existing vertical H2, this uses an asymmetric elbow and permits two contact sides; it is a basic footprint transfer, not a claim of a new technique or higher difficulty. The geometry is newly constructed, not a rotation of H2.

Normal route: `DRDULLDDRDDRRULRUULDRDL`, 23 inputs / 4 pushes. Actual move replay wins. Banning both object-reset and death-reset gives exactly the same 23 / 4 cost. Search budget 30000; normal and banned-reset both explored 91 states, complete window.

Nonfinal core: A anchor (3,2)->(3,3), opening a safe turning route. Forbid it: proven-unsolved, 16 states, complete frontier. Delete only Spike (2,2) and keep that prohibition: `DDDDRRULLRUULDD`, 15 / 4, solved in 13 states. Thus deletion permits another transport order as well as a shorter route; it is not only fewer walking steps with the same pushes.

Actual loss witness: `DRDULLDDRDDRRULLU`. Final push A (1,3)->(1,2) touches Spike with its right arm at (2,2); A returns to origin (3,2), player remains (2,3). All inputs replay legally. An earlier discarded 5x5 prototype failed this assertion because its return was blocked by the player occupying a remote origin cell; it was not retained as a bridge. This regression motivated the explicit reset-event assertion.

Mutation audit passed on the final version: all three individual Goal deletions unsolvable; Spike deletion bypasses the core; 12 currently free cell insertions each unsolvable. Entity removal mechanically bypasses the task and is not independent difficulty evidence. Seven previously redundant floor cells were walled off and all replay/proof checks rerun.

The 12 checked free cells are (1,1), (2,1), (3,1), (1,2), (1,3), (2,3), (4,3), (3,4), (4,4), (2,5), (3,5), (4,5). Independent push-first Dijkstra is included in the audit, using actual move() transitions without deadlock pruning; it compares normal and banned-reset optima to rule out a lower-push reset solution. The audit resolves Vite from the current repository and can be copied into `scripts/` unchanged.

Audit: `node C:/Users/Administrator/AppData/Local/Temp/oshi-oct-spike/audit-s01.mjs` (from repository). Audit uses the real repository engine and solver. Production Vitest draft supplied but has not yet been run in its destination tree; the audit executes its substantive move/necessity/cost assertions successfully.

SHA256 of final production source: `6847fb13a534427d56dc38f8b0bbe7a3726f63c726eeb647802f5291564aa339`.

Risk: initial safe displacement is forced once the hazard is understood; suitable as a short shape transfer, not a D5–6 strategy claim. No evidence yet about natural early Spike beliefs, readability, or whether this is distinct enough from H2 for the chapter.
