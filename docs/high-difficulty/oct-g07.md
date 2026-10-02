# G07 返隙 — same substrate, changed strategy

Hash `b86f1f1c`, target D7 uncalibrated. Source/test drafts have not yet been integrated or AI-playtested. Relative to G06, only the goal changes from (2,2) to (0,0). This is intentional recognizable substrate reuse, not rotation padding: G06 has a winning monotonic gate plan, whereas this board provably requires at least one gate to be pushed in opposite directions during one route.

Replay `ULLDRUUDLLDRURDLURUURRDULDURRLDDULDLURURULL` wins (1369 discovered states). Gate E first moves upward to make space, then downward again before final task transport. The proof does not restrict reversal to E or fixed coordinates: history-mask BFS rejects any gate push if the same gate was previously pushed in the opposite direction, and exhausts 914 states without a win. Masks participate in transposition identity; physical-state-only deduplication would be invalid for this proof.

Counterfactual: change only Goal back to (2,2), same no-reversal search solves `ULLDRUUDLLDRURDLURUURRRLDDUULDLULD` with 681 states. Thus recovery is caused by the altered final transport requirement. It is not a compulsory extra action inserted independently of the task. No traversal exhausts 7 states.

Eight eligible floor closures each exhaust without victory (44,3,2,1,42,9,271,8 states). The formerly optional lower standing cell (1,3) has become necessary under the new task destination. The only Block's removal empties the victory condition and is not counted as evidence of quality. Four Gate pair IDs are visible in the production renderer; no undisclosed new rule is introduced.

Run the portable `audit-oct-gate.mjs g07` with sibling `oracle.mjs` from repository root. It loads actual source, asserts replay/no-reversal exhaustion/decoupling and prints mutation and deletion results. Root performs test red→green when integrating. Quality question for testing: does the change of final destination prompt reconsideration of the earlier one-way clearing plan, or merely feel like a longer repeat? This cannot be inferred from necessity alone.
