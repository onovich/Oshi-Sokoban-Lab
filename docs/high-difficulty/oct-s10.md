# oct-s10 再汀 — reset, then move the recovered resource again

Target D4, unmeasured. One real unfinished task plus Fake. Unlike S09 where the Fake's reset immediately supplies a useful walking column, this Fake must return and then be pushed again to supply the player's intermediate-row exit. In the reference plan it moves down three times, allowing the player to depart row 3 to the right before pushing the real Block left across row 2.

Real route `RUURULDDDRULLL`: 14 inputs / 8 pushes, 134 states. At input 6 Fake resets to (2,1), player (2,0). Inputs 7–9 move Fake to (2,4), player (2,3). Real Block delivery has not begun at either checkpoint. Ban Fake reset: exhaustive 33 states unsolved. Ban reset followed by any further Fake push: exhaustive 62 states unsolved. This proves a second use after recovery, not merely the reference's chosen three exact pushes. Independent push-first 8 / 14, 143 states.

Only open (3,4): forbid both reset and reuse core, `RULLL` wins in 5 inputs / 3 pushes, 13 states. The bottom independent approach decouples Fake recovery from real Block transport.

Mutation audit: delete Fake, target or Spike => unsolvable; remove real Block => vacuous bypass. Five initially equal-cost cells (0,0),(4,0),(0,1),(0,3),(1,3) were closed and the full checks rerun. Now closures (2,0),(3,0),(3,1),(1,2),(2,2),(4,2),(2,3),(3,3),(4,3),(1,4),(2,4) unsolvable. Remaining original equal-cost cell (4,4) supplies the independent-opening contrast route and is retained; not claimed necessary for the original.

Earlier same-object-two-resets research found no qualifying instance in its sampled batch; no impossibility claim. This candidate instead establishes recovery followed by a second resource service, not a two-reset theorem.

Run `node <temp>/audit-bridge.mjs oct-s10` from repository root. Real replays, individual core bans, decoupling, both cost objectives and mutations verified. Vitest draft awaits integration. Source SHA256 2133f58a7e97c8447b03b78f727c203d880f7da5a85ac9575e2c8288cbf3b40c.

Risks: still compact and may be easy after reset discovery; not measured D4 or AI-player accepted. Shares Rain/Fake vocabulary with S09 but requires a different post-reset use and route.
