# oct-m01 双埠 — machine-verified candidate, no playtest acceptance

## 原版核对补充（2026-10-02）

根代理读取本地Unity `GameRoleFSMController.cs:78`、`GoalRepository.cs:72`、`GridUtils_Pushable.cs:39`：按目标组成格找到Goal，再按其anchor平移整形状，没有角色必须站在整体外部的约束。但Unity的`HasNoProp`包含Goal自身，沿长轴移动会发生已知自重叠误阻挡；不是未经修正的Unity逐步相同结果。项目既有 `research/04-oshi-mechanics-web-demo-spec.md:126,165,179` 明确规定Web修正为忽略自身旧占格、检查完整新占格。本关使用这项既有规范与真实引擎，不新增规则。视觉分组尚待实际试玩。

ID lab-oct-m01; export octM01; group oct-goal; targetD3 design-target. Hash916d0694. Source/test drafts copy directly to src/levels/lab; only the separate Temp test configuration aliases project dependencies.

4×3 clear; P(3,2); walls(3,0),(3,1); horizontal two-cell realBlock at(1,1), horizontal movableGoal at(1,2). Neither starts complete. Full board/source is oct-m01.ts.

Route LLLRLUURD:9inputs,3pushes (2Goal+1Block). Actual solveLevel+move replay wins. Domain events show parking Goal at(0,2), two goal-crossed events, standing inside at(0,2), pushing adjacent constituent right to restore Goal(1,2), then Block down. Movement is current engine behavior; no new exceptions. Original Unity cross-shape parity and static visual grouping still need reviewer/UI confirmation before treating this as a taught rule.

Real-move exhaustive graph (40,000 budget, none exhausted): base57states; forbid allGoal-pushed1state unsolved; forbidGoal-crossed9states unsolved; forbid Goal return0,2→1,2 exhausted32states unsolved. Official solver separately confirms both declared proof conditions individually necessary. They are non-final Goal actions, not the final victory push.

Decoupled board removes exactly two walls making connected right upper passage; UULD wins4inputs1Blockpush with noGoalpush/cross,12states. Ordinary-floor sealing(0,0),(1,0),(0,1),(0,2) yields unsolved36/18/30/20states. Removing sole Goal is unsolved. No fake/task identity deletion issue in this oneBlock level.

Floor(2,0) is deliberately retained despite unchanged shortest cost if sealed: after LLLR, the plausible upward Block push U is legal only with this far constituent clearance; it parks Block against top edge and cannot be recovered (exhaustive state test). It supports a real mistaken plan, not empty ornament; also keeps the upper bypass contrast clean. No minimum-board claim.

TDD: test initially failed missing oct-m01 module; added level then first route test green; added causal/contrast/error/mutation tests, six passed. Run tests from repository:
`npx vitest run --config C:/Users/Administrator/AppData/Local/Temp/oshi-oct-goal/vitest.config.mjs --root C:/Users/Administrator/AppData/Local/Temp/oshi-oct-goal oct-m01.test.ts`

Audit final draft source:
`node C:/Users/Administrator/AppData/Local/Temp/oshi-oct-goal/audit-m01.mjs`

Detailed graph/variant output: explore.mjs. This is a compact multi-cellGoal permission establish level, not a high-difficulty resource handoff. Distinct from single-cell return examples by internal constituent contact. Later candidates must deepen shared-resource timing, not repeat larger shapes. No AI/author acceptance, no course insertion performed by designer.
