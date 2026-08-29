# Oshi Web Demo：机制逐项源码核对与 TDD 审计

审计日期：2026-08-28  
Unity 基线：[Oshi `4afe6809`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)  
范围：只核对推箱子规则与游戏画面，不包含 VN 叙事。  
测试边界：公开的 `createGame` / `move` / `undo` / `tick`、关卡目录、`Board` / `GameGlyph` 渲染输出；不测试私有辅助函数。

## 结论

- 已逐项覆盖原版已落地的玩法机制；12 个教学关均有有界求解器和明确 walkthrough 双重验证。
- 本轮发现并修复了一个实际 Gate 规则差异：出口可回到角色刚离开的格子时，原版仍会传送且计为一步；Web 旧实现误把该格视作障碍，可能改为推入口 Gate。
- Gate 视觉已经改为原始 `Spr_Gate_001` 的外框 + 实心能量窗，并按 Portal Shader 的 `Time × Speed → Twirl → Voronoi → Power` 分层近似。
- 下表标为“安全规范化”的项目是原版已记录或可从代码确认的时序 / 碰撞缺陷；它们没有被悄悄伪装成“原作规则”。如需 bug-for-bug 模式，应作为单独的 legacy 模式实现，而不能混入可玩关卡。

## 机制—源码—测试矩阵

| 机制 | Unity 运行时代码事实 | Web 结果 | 严格测试证据 |
| --- | --- | --- | --- |
| 单格移动与单次推 Block | Role FSM 只接受一轴；Block 只推进一格，不能拉或连推。 | 一致。 | `game-engine.test.ts`：`pushes a block…`、`refuses a multi-cell push…`。 |
| 多格 footprint 与动态 Wall | 原版按 Shape cell 占用格；Wall 是硬阻挡。 | 一致，并对任意 shape 整体预检。 | `uses every cell…`、`refuses a multi-cell push…`、`treats shaped dynamic walls…`。 |
| Terrain Goal / 动态 Goal / 编号 | 非 Fake Block 的每一格须落在 Terrain Goal 或相同编号动态 Goal；Goal 可多余。 | 一致。 | `uses every cell of a numbered block…`；`match-03` 的 BFS + walkthrough。 |
| Fake Block | Fake 不计入胜利，但仍是 Block、可推且会在 Spike 回出生点。 | 一致。 | `uses every cell…`；`source-conformance.test.ts`：`resets a Fake Block…`；`fake-04` 求解测试。 |
| Spike | Role 可进入 Spike 后死亡；Block / Goal / Gate 任一 footprint cell 命中 Spike 会回 origin。 | 规则一致；将逐帧 Unity 时序收束为确定的原子回合。 | `returns dynamic goals and gates…`、`keeps a reset block…`、`resets a Fake Block…`。 |
| Rain | 仅 Role 滑行；相邻可推物只推进一格；可用 Gate 是滑行落点。 | 一致于可玩规则。 | `makes the player slide…`、`makes an adjacent pushable goal…`、`uses an unblocked gate as a rain landing cell…`。 |
| 可推动 Goal | 能推则推；普通天气下被阻挡且未被 Block 覆盖时 Role 可经过。 | 一致。 | `pushes a movable goal…`；`goal-07` 求解 / walkthrough。 |
| Gate 传送 | 仅 Role 进入 Gate；从配对 Gate 沿原输入方向走出一格；出口被挡时入口可推。 | 一致；本轮修复“出口回到出发格”边界。 | `teleports through…`、`lets a linked Gate exit back…`、`keeps a Block out of a Gate…`、`preserves the entry direction…`。 |
| Path / 移动 Spike | 原版真正携带的 Traveler 只有 Spike；Goal/Gate 不是 Path blocker；loop 和 ping-pong 都存在。 | 一致于意图，并作全 footprint 预检。 | `advances loop and ping-pong…`、`lets a moving Spike cross Goal and Gate…`；`path-loop-10` / `path-pingpong-11` 求解测试。 |
| Undo / Restart | 原版记录 Role、Block、Gate、Goal、Spike，尝试恢复 Path。 | 安全增强：完整快照恢复所有逻辑字段。 | `resolves reset hazards… restores every logical field on undo`；`applies optional step and time limits… restarts…`。 |
| 步数 / 时间 | 原版先检查时间、再步数、再胜利；随附关卡未开启限制。 | 可选字段；步数优先于胜利已锁定。 | `applies optional step and time limits before victory…`。 |
| 教学关可解性 | 原版地图不是本 demo 的关卡数据来源；本项目承诺每个教学关都可玩且可解。 | 12/12 都在有界状态空间找到解，并复跑文案中的路线。 | `level-solvability.test.ts` 对每一关各运行 BFS 与 walkthrough。 |
| Gate 视觉 | `Spr_Gate_001` 是外侧 1px 框 + 中央实心 10×10 mask；两个材质仅 HDR tint 不同，shader 为时间驱动 Twirl/Voronoi。 | 外框与实心能量核按 16→32 坐标映射；用 CSS 分层近似 shader。 | `Board.test.tsx`：`projects the source Gate mask…`；完整一手链见 `09-gate-render-audit.md`。 |

## 本轮修复的 Gate 行为差异

原版 `GridUtils_Movable.CheckNextGateMovable` 检查出口前方时只看 Wall / Block / Goal / Gate / Terrain，**不把当前 Role 的出发格当作占用物**。因此下面这一条动作合法并消耗一步：

```text
Role(4,1) --left--> Entry(3,1) → Exit(5,1) --left--> Role(4,1)
```

此前 Web 共用了“移动 Gate 实体”的碰撞函数，错误地把 `(4,1)` 当成障碍。现在 Gate 出口使用独立的 `canUseGateExit` 公共规则路径：忽略即将离开的 Role，只阻挡 Wall、Block 和其他 Gate。测试先失败，随后实现变绿。

## 有意保留的安全规范化差异

这些不是遗漏；每一项都有原版源码 / Bug 文档证据，并已被现有测试锁定为确定性 Web 规则。

| 原版实际行为 | Web 规范化规则 | 原因与证据 |
| --- | --- | --- |
| Role 的 Spike 死亡按缓动帧采样，死亡、移除和 Lose 可跨多个 Tick；极端情况下可能出现 win-over-death 窗口。 | 任一次行动穿过 Spike 即确定失败，优先于胜利。 | 可维护且可解；见 `08-spike-source-reaudit.md` §2、§6。 |
| 物体回 origin 前不做全局碰撞预检；同类可抛 duplicate-key，跨类型可重叠。 | origin 被占用时不提交动作并给出确定的 reset-conflict。 | 原作者 `Bug.txt` 明确记录；见 `08` §4。 |
| Rain 会穿过被挡住的可推 Goal，作者已将其列为 Bug。 | 被挡住的可推 Goal 会阻挡滑行。 | 防止不可读的穿透；`stops rain before a blocked movable goal…`。 |
| Path 段预检漏终点、负方向甚至不预检。 | 检查完整段与完整 Spike footprint。 | 避免移动 Spike 穿墙/碾人；见 `08` §5。 |
| 原版 Undo 靠部分位置数组和 Path 的反向猜测恢复。 | Undo 使用完整 immutable snapshot。 | 保证 `action → undo` 可回归验证。 |
| 原版允许损坏 Gate 索引并仅记录日志。 | 加载时拒绝缺失 Gate 链接。 | 保证关卡数据确定、可求解。 |

## 证据入口

- [玩法 Web 规则基线](04-oshi-mechanics-web-demo-spec.md)
- [Spike 时序、Path 与原版缺陷复审](08-spike-source-reaudit.md)
- [Gate 模板、贴图、材质与 Shader Graph 审计](09-gate-render-audit.md)
- [视觉 / 场景渲染审计](07-unity-visual-scene-audit.md)

