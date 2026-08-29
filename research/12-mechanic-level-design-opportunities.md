# Oshi 现有机制：关卡设计深挖与取舍

调研日期：2026-08-29  
范围：只审计当前 Web Demo 与本地原版源码 `D:\UnityProjects\Oshi`；不提出或实现新玩法。原版的固定公开核验基线为 [Oshi `4afe6809aaef0894b5f27b543dff84b437bebb45`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)。本地副本位于 `a41dba58d2009bcf2c30e5012cfb2f5f059b44ff`；本报告所引原版代码和资源均在本地逐行读取，公开链接固定到上述提交。

## 结论先行

当前最值得深化的不是继续添加机关，而是把现有语法发展成三条可以互相组合的课程主线：

1. **空间：刚体 footprint。** 多格 Block/Wall/Goal/Spike/Gate 不是放大的图标，而是逐 Cell 占位、逐 Cell 判定的规则。它应成为整个作品最基础、也最长期可用的难度来源。
2. **时间：每次有效行动后的环境回合。** Path Spike 让“我现在能否走”变成“我执行这次操作后，盘面会变成什么”。这比实时躲避更适合回合制推箱。
3. **拓扑：方向保持的 Gate。** Gate 不是普通瞬移；入口、出口和入射方向共同决定落点，且出口受阻时入口改为可推动实体。它能把位置、朝向与通道状态压缩进一个规则。

Spike 的**物件回出生点**是连接空间与时间的第四根支柱；Rain 是将“一次输入”扩展为一段轨迹的第五根；编号 / 可推动 Goal / Fake Block 是提高目标分配密度的第二层工具。步数 / 时间限制、Undo、动态 Wall 则更适合作为支撑与收束，而不应承担“新机制”的首课。

当前 12 关已经是合格的规则回归样本，但它们更像“词汇卡”，不是完整课程。下一轮最有价值的工作，是围绕每一条主线做“看见 → 验证 → 反转 → 利用 → 与旧规则组合”的连续小关，而不是在一关里堆满所有图标。

## 证据口径

- **[F 原版事实]**：可由原版一手代码、作者设计 / Bug 文档或 Map 资产直接推出。
- **[W Web 事实]**：可由当前 TypeScript 规则核、声明式关卡和测试直接推出。
- **[P 产品决策]**：已经由当前产品裁决覆盖原版差异的 Web 规则。
- **[D 设计推断]**：基于前面事实给出的关卡价值判断；不是原版作者明说的意图。

这一区分尤其重要：原版中有可复现的 Path 覆盖预检缺陷，也有尚未实现的 Enemy、物体传送、Rain 下 Block 滑行等构想；它们不能被误写为今天可以教给玩家的稳定规则。

## 一、现有玩法语言的实证盘点

| 机制族 | [F 原版事实] | [W / P 当前 Web 语义] | 关卡含金量 [D] |
| --- | --- | --- | --- |
| 单次推送与刚体 footprint | Role 只走单一轴；Block 逐 Cell 检查推入 footprint。原版 Shape 资产已有 1×2、2×2、L、3×2 等非矩形形状。见 [角色输入与推送](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs#L44-L95)、[Block 推动](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L64-L87)、本地 `TM_Shape_001…010.asset`。 | `shape` 是全部实体定义的一部分；Block、Goal、Gate、Spike、动态 Wall 均按完整 shape 占位。推箱和胜利都按 Cell 处理。`src/engine/types.ts:10-65`、`src/engine/game-engine.ts:37-46,85-107`。 | **最高。** 这是不增加任何特殊例外也能持续产生新推理的问题空间。 |
| Goal、编号、Fake | 所有非 Fake Block 的每个 Cell 必须落在 Terrain Goal，或编号相同的动态 Goal；Fake 仍是物体但不参与胜利。见 [Block 完成判定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs#L74-L90)、[总胜利判定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs#L298-L312)。Map 005 使用三组编号；Map 012 使用 12 个 Block 和多枚 Fake。 | `isBlockSolved` 保留全 footprint 与号码匹配；`isFake` 只影响胜利，不影响推动、阻挡、Spike 回位。`src/engine/game-engine.ts:85-95`，并有 Fake 回位契约测试 `src/engine/source-conformance.test.ts:65-86`。 | **高。** 它让“哪一个箱子去哪里”成为约束，而不是纯搬运。 |
| 可推动 Goal | 动态 Goal 有 `canPush`；可推时像物体移动，不能推时普通 Role 可走入未被 Block 覆盖的 Goal。见 [Goal 字段](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Goal/GoalEntity.cs#L13-L33)、[可走 / 软阻挡](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs#L38-L112)。 | 目标可推时推动一格；被 Block 挡住时可通过；Rain 将“被挡住的可推 Goal”视为滑行阻挡物。`src/engine/game-engine.ts:109-120,411-455`，契约见 `src/engine/game-engine.test.ts:187-215,493-557`。 | **高，但必须在静态 Goal 之后。** 一个终点同时是可重排的道路，逻辑密度很高。 |
| Spike：危险与回位 | 原作者列出“Spike 杀死 Role 和 Block”；实际运行时代码是 Role Dead，Block / Goal / Gate 在环境回合回 `originalPos`。见 [设计稿](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt#L8-L20)、[Block 回位](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs#L93-L132)、[Goal 回位](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGoalDomain.cs#L60-L99)、[Gate 回位](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGateDomain.cs#L49-L88)。 | 物件碰 Spike 会在环境结算回 origin；Player 的任意 Spike 接触则执行独立的 `resetAfterSpikeDeath`，全盘恢复到关卡初态并继续 playing。`src/engine/game-engine.ts:200-252,343-398,492-502`。这是 [P]，不复用手动 `restart`。 | **最高。** 它不是“红色禁入格”，而是可利用的状态变换器。 |
| Path / 移动 Spike | Path 保存节点、当前索引和方向，存在 circle 与 ping-pong；运行时真正 Carry 的 traveler 只有 Spike。环境回合顺序是 Block → Gate → Goal 回位，再移动 Path / Carry，随后查结果与角色死亡。见 [Path 状态机](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs#L75-L153)、[Carry 只处理 Spike](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L33-L108)、[环境顺序](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs#L91-L155)。 | 路径节点必须是相邻轴向步；有效玩家动作后每条 Path 至多推进一节点；`once` / `loop` / `pingPong` 均已实现。`src/engine/types.ts:36-41`、`src/engine/level-validation.ts:31-49`、`src/engine/game-engine.ts:254-341`。 | **最高。** 它把操作序列转化成可观察的离散节拍。 |
| Path 与 Player 的碰撞 | 原版 `CheckSpikeMovable` 明写 Role、Block、Wall、其它 Spike、Terrain Wall / Spike 都应阻挡 Path Spike；但 `GetPathCoveredGrid` 漏正向终点、负向段返回负 count，导致实际运行中经常漏检。详见 [Path 复审](11-path-spike-role-reaudit.md) §2–§4，原码见 [Path 预检](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L45-L85)。 | **[P] 当前裁决：Player 不阻挡 Path Spike。** Path Spike 可走入 Player 后触发全盘死亡重置；但 Block、墙、Terrain Spike、其它 Spike 仍会阻挡路径。`src/engine/game-engine.ts:296-313,343-354`，正/负方向与多格撞人都在 `src/engine/source-conformance.test.ts:135-223` 固定。 | **高，但必须按当前产品语义教。** 不能再设计“站在下一节点堵刺”的题；可以设计“用 Block 把轨道刹住”的题。 |
| Rain | 原版只改变 Role：紧邻可推对象时仍是一格推送，否则向输入方向滑至最后可停格或 Gate。Block Rain 滑行被作者列为未实现。见 [Role FSM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs#L44-L67)、[滑行查询](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs#L59-L88)、[设计稿未实现项](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt#L26-L32)。 | 滑行逐 Cell 寻找终点；相邻 Block/可推 Goal/Gate 仍只推一格；滑过任一 Spike 立即死亡重置。`src/engine/game-engine.ts:179-198,400-498`，回归见 `src/engine/game-engine.test.ts:153-184,366-389,493-596`。 | **高。** 一次输入不再是一步，天然适合做“停点”与“输入压缩”。 |
| Gate | Role 进入 Gate 后由出口继续沿原输入方向走出一格；出口前方空时入口不能推，出口受阻才允许推入口。只传送 Role。见 [Gate 过渡](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs#L114-L146)、[Gate 推动许可](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L11-L37)。 | Gate traversal 是原子逻辑动作；动画已拆为“到入口 / 从出口到终点”两段。出口受阻时入口可推；Block 不会穿 Gate。`src/engine/game-engine.ts:136-177,419-474`，契约见 `src/engine/source-conformance.test.ts:31-63`。 | **最高。** 它是方向依赖的拓扑，而非“远距离换位”。 |
| Undo、步数、时间 | 原版记录对象坐标并尝试反推 Path；Map 模板可启用时间 / 步数，但随附 Map 未启用。见 [Record](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRecordDomain.cs#L9-L139)、[Map 配置](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/MapTM.cs#L20-L24)、[结果优先级](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs#L257-L337)。 | Undo 是完整 immutable snapshot；限制是可选字段。`src/engine/game-engine.ts:57-68,505-532`。每个 demo 关均有 BFS 与文案 walkthrough 证明存在解。`src/levels/level-solvability.test.ts:53-104`。 | **Undo 是探索基础；限制是调味料。** 二者不应被包装成核心谜题语法。 |

原版作者自己的清单也把已实现与未实现分开：Enemy、Boss、多格 Role、Rain 下 Block 滑行、Gate 传送物都明确列为“未实现”。因此它们不属于本轮“深化现有机制”的候选。[设计稿](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt#L26-L32)

## 二、优先级：哪些值得成为章节，而非单次演示

下表的分数是 [D] 关卡设计判断，满分 5；“风险”是当前实现或读图带来的教学风险，而非源码质量评级。

| 优先级 | 机制 | 推理深度 | 组合性 | 当前风险 | 建议定位 |
| --- | --- | ---: | ---: | --- | --- |
| A1 | 多格 footprint + 目标全覆盖 | 5 | 5 | 玩家只看锚点、不看全体 Cell | 全游戏的基本语法；至少一整章，而非一关。 |
| A2 | Spike 物件回 origin | 5 | 5 | origin 冲突、玩家误解为单纯失败格 | 独特身份机制；可形成“回位改变可达性”的系列。 |
| A3 | Path Spike 的回合节拍 | 5 | 5 | 若下一个位置 / 方向不可读，会变成试错 | 第二章主线；每次有效行动推进一个节拍。 |
| A4 | Gate 方向保持 + 条件推动 | 5 | 5 | 玩家看不出出口前方为何决定入口行为 | 独立拓扑章节；视觉和首关必须强解释。 |
| B1 | Rain 轨迹与停点 | 4 | 4 | 若没有明确停点，输入结果不可预估 | 作为“输入尺度变化”章节，之后与 Gate 组合。 |
| B2 | 编号 + Goal / 多格配对 | 4 | 4 | 图例依赖、颜色和数字冲突 | 在 footprint 已掌握后引入，承担目标分配。 |
| B3 | 可推动 Goal | 4 | 4 | “可推 / 被阻挡可穿过”是状态依赖的两层语义 | 用短系列教清楚，再与 Rain / Footprint 结合。 |
| C1 | Fake Block | 3 | 4 | 很容易变成无提示欺骗 | 只作搬运工具、占位物或路径刹车，不作突然反转。 |
| C2 | 动态 Wall | 3 | 3 | 目前是静态几何对象，没有独立变化规则 | 作为 footprint 几何素材，而非独立章节。 |
| C3 | Undo | 1 | 5 | 误把撤销当解法本身 | 永远可用的实验许可，不设为机制题。 |
| D | 步数 / 时间限制 | 1 | 2 | 原版没有配置过此体验；时间还会偏离离散推理 | 只在已掌握关的“金牌 / 进阶”版本使用。 |

## 三、最有潜力的技巧链

### 1. Footprint：把“箱子”升级为刚体

**已验证的规则核。** Web `entityCells` 将任意 shape 展开为格；Block 推入、Goal 完成、Spike 接触均依赖该展开，而不是中心点。`src/engine/game-engine.ts:37-46,85-107,200-252`。原版 Shape 资产中已有 L、T/折线、矩形和非矩形组合，说明这不是以后再加的特性。

**推荐链条 [D]：**

1. **确认：** 1×2 Domino 在直线内移动，两个 Goal 必须同时覆盖。
2. **反例：** 只有“肩膀”那一格撞 Wall，整个 Block 不能推；让玩家主动得到一次可解释的 NoOp。
3. **定位：** L 形进 L 形 Goal，目标是锚点与朝向无关但 footprint 完全一致的平移对齐。
4. **空间资源：** Block 占住一格会让玩家无法绕到另一侧；难点来自推位管理，不是地图面积。
5. **组合：** 多格 Block 与编号 Goal：先确定哪个形状可服务哪个编号，再决定进场顺序。

**值得深入的命题：** “这件刚体的每一格都是它的一部分。”一张紧凑关只需让一个额外 Cell 产生决定性差异，就足以教学；不要用大棋盘把错误空间藏起来。

### 2. Spike 回位：把危险变成可预测的状态变换

**已验证的时序。** 原版的环境回合在 Path 移动前先检查 Block、Gate、Goal 是否压住 Spike。Web 保持这个顺序：`resolveTurn` 先做 `resetHazardObjects`，再 `advancePaths`。`src/engine/game-engine.ts:209-252,343-354`。这意味着“把 Block 推到**当前** Spike 上”与“让 Block 占住 Spike **下一步**将去的位置”是不同动作：前者会先回位，后者会成为路径阻挡物。

**推荐链条 [D]：**

1. **确认：** 单个 Block 入静态 Spike 后回 origin，玩家留在 Block 的另一侧（现有 `spike-05` 的核心）。
2. **利用：** 让回位本身改变推位可达性；目标不是“避开 Spike”，而是“有意触发一次正确回位”。
3. **对象差异：** 先用 Fake Block 做回位的临时家具，再用真实 Block；Fake 的“仍阻挡、却不计分”因此有正面用途。
4. **目标重排：** 可推动 Goal 碰 Spike 回 origin，令终点本身回到可用位置；只在玩家已经理解普通 Block 回位后使用。
5. **Gate 重置：** Gate 碰静态 Spike 后回 origin，能改变通路拓扑；这是高级变体，必须先画出 origin 和出口关系。

**必须避开 [R]：** 不把“origin 被占”设计成谜题答案。原版 Bug 文档明确记录重叠；Web 对这种 transition 返回确定的 reset conflict，而不是提供一条新规则。原版 [Bug.txt](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt#L1-L4)，Web `src/engine/game-engine.ts:123-145,209-251`。

### 3. Path Spike：让动作消耗节拍，而不是让玩家“等”

**现行边界必须先写死。** 当前 [P] 规定 Player 不能阻挡移动 Spike：若移动 Spike 到达 Player，整关重置。移动 Spike 仍受 Block、Wall、Terrain Spike、其它 Spike 阻挡，但**不**受 Goal / Gate 阻挡；后者已有契约测试。`src/engine/game-engine.ts:296-313`、`src/engine/source-conformance.test.ts:88-111`。

这给出一个很强的关卡语言：

```text
有效行动 = 玩家状态变化 + 环境节拍推进一次
无效行动 = NoOp，环境不推进
```

Web 的早返回确实使撞墙 / 越界 / 不可推物不消耗 Path。`src/engine/game-engine.ts:400-443,478-502`。因此“等一拍”必须通过一件有意义、可回退、不会破坏局面的行动获得；不要让玩家靠无意义地按墙来刷时间。

**推荐链条 [D]：**

1. **观察 Loop：** 只有一条环形轨道，玩家先在安全区做一件必要的来回操作，观察 Spike 每回合走一格。
2. **窗口：** 入口只在 Spike 离开后可穿过；错误进入的后果是可预期的整关重置。
3. **节拍交换：** 玩家有两条都“合法”的短操作，只能选其中一条来消耗一拍，另一条留给以后推箱。
4. **轨道刹车：** Block 放在 Spike 的**下一节点**使其停住；不要把 Block 推到 Spike 当前格（会在 Path 之前回位）。这可以替代已被产品裁决废弃的“Player 堵刺”教学。
5. **Ping-pong：** 用两端折返制造相位，且先让玩家在无生命危险的侧室预测 `A → B → C → B → A`。

**多条 Path 暂缓 [R]：** 当前 `advancePaths` 按数组依次更新 Spike；两条路线彼此阻挡时会暴露配置顺序。`src/engine/game-engine.ts:315-340` 尚无“多 Path 同时结算”的明确公开合同。除非先补该合同与 TDD，否则不要用它制造难度。

### 4. Rain：一次输入是一条轨迹

Rain 的设计价值不是“角色走得更远”，而是把传统推箱的“选择一格”变成“选择一个方向，接受直到停止点的全部后果”。Web 会检查滑过的每一格是否有 Spike，不会因为终点安全而放过中途危险。`src/engine/game-engine.ts:179-198,492-498`。

**推荐链条 [D]：**

1. **停止点：** 墙 / Block / 边界决定落点；先给一个唯一可理解的长滑。
2. **动作尺度分叉：** 相邻 Block 时，同一个方向键变回单格推送；让玩家用一次很短的题看到“人滑、物不滑”。
3. **不可穿越线：** 把 Spike 放在滑行中段，教学“轨迹”而非“终点”是危险对象。
4. **可移动终点：** 可推动 Goal 既可改变停点，又在被挡住后允许通常行走；先单独教学该二态规则，再放进 Rain。
5. **Rain × Gate：** 滑行进入 Gate 后仍按入射方向从出口落到一格外。把它设计成“空间上的急转弯”，不是装饰性的快进。

**避免 [R]：** 不使用“Rain 下 Block 滑动”或“局内天气切换”作为事实机制。它们在原版设计稿中明确未实现 / 特殊玩法构想。 [设计稿](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt#L22-L32)

### 5. Gate：方向依赖的拓扑工具

Gate 的核心式子不是 `入口 → 出口`，而是：

```text
enter(entry, direction) = exit.position + direction
```

Web `canUseGateExit` 特意不把 Role 的出发格当阻挡物，故“从出口回到自己刚离开的位置”在规则上可能合法。`src/engine/game-engine.ts:148-177`。这类回路可成为题材，但只有在玩家能看见并推导出口前方时才应使用。

**推荐链条 [D]：**

1. **确认：** 直线进入、直线出口，玩家亲眼观察方向保持。
2. **角度选择：** 同一个入口从上 / 左进入，出口分别落到不同邻格；让 Gate 首次体现方向信息。
3. **出口条件：** 出口前方被 Block / Wall 堵住，入口 Gate 才能推；“推 Gate”不是额外按钮，而是通路失效后的状态转换。
4. **可移动入口：** 推入口后改变进入坐标或出口角度，服务一个具体 Block 推位。
5. **Rain × Gate：** Rain 把入口角度固定为一次长滑的结果，Gate 把方向带到另一局部空间；这是高密度、但仍可读的二机制组合。

**避免 [R]：** 不让 Block、Goal、Spike 使用 Gate；当前契约明确 Block 不能传送。`src/engine/source-conformance.test.ts:30-44`。也不要让“出口为何堵住”藏在同色地形或难辨图标后。

### 6. 目标身份：编号、可推动 Goal、Fake Block

这是一个适合放在空间章节之后的“目标分配层”，不是先天难度来源。

**推荐链条 [D]：**

1. **编号不是颜色：** B2 只会在 G2 上完成；Terrain Goal 是无编号的通用地面目标。
2. **多格匹配：** 一个 L Block 必须整体被匹配目标覆盖，不能只让“带数字的角”压中。
3. **Goal 是道路：** 可推动 Goal 先当物体，再在不能动时表现为可以穿过的柔性层。
4. **Fake 是家具：** Fake Block 必须移动，但它不去任何 Goal；让它承担让路、卡位或 Path 刹车，而非靠灰色制造猜谜。
5. **分配 + 顺序：** 多个编号 Block 的最终 Goal 都可行，但先完成一个会占掉另一个的推位；此时才引入经典“远先近后”的排序压力。

## 四、值得优先生产的组合矩阵

| 组合 | 为什么有深度 [D] | 已知规则边界 / 生产要求 |
| --- | --- | --- |
| footprint × Terrain Goal / 编号 Goal | 同时解决形状匹配、目标分配和推位顺序，几乎不需要额外例外。 | 始终按全 footprint 验收；不要只做更大的矩形。 |
| footprint × Spike 回位 | “形状的一格先碰 Spike”足以令整个实体回 origin；玩家要规划过刺的完整刚体。 | origin 必须安全、可视；不以 reset conflict 作为谜底。 |
| Block × Path Spike | Block 可以成为轨道的离散刹车，产生“先把一件物品送到某格，才可安全推进”的因果链。 | Block 要放在下一节点；Goal / Gate 不能刹车，Player 也不再刹车。 |
| Rain × Gate | 一次方向输入同时决定长滑、入口和出口方向，形成非常干净的拓扑推理。 | 先分别教 Rain 与 Gate；完整轨迹必须可读。 |
| Rain × 可推动 Goal | Goal 既是停止装置又是可重排对象；能创造少空间的“摆停点”题。 | 以 Web 修正规则为准：被挡住的可推 Goal 阻挡滑行。 |
| Gate × 静态 Spike 回位 | Gate 是会回 origin 的通道物，能把“复位”升级为拓扑复位。 | 先给清晰 origin / 出口标记；Path Spike 穿 Gate 后的回位有环境顺序延迟，未补专门 TDD 前不作正式题。 |
| 编号 × Fake × footprint | 用少量真实任务块与大量几何家具形成“识别 + 腾挪 + 匹配”。原版 Map 012 已展示这种浓度。 | 绝不靠隐藏语义；Fake 的视觉必须在首次出现就直接说明。 |
| Path × 多条 Path | 理论组合性很高。 | 暂不生产：多 Path 的顺序与相互阻挡尚未有明确 Web 合同。 |
| 步数 / 时间 × 任意机制 | 可把已掌握的题转换成优化题。 | 只作附加挑战；原版随附 Map 没有开启过这两种限制。 |

## 五、原版地图给出的课程证据

原版并非随机堆叠实体。Map 资产本身已经给出一种“先单独介绍、后组合”的课程轮廓：

| 原版地图 | 可直接验证的配置 | 对课程的低风险读法 [D] |
| --- | --- | --- |
| 004 `A LITTLE CONFUSED` | 两个 Block，Terrain Goal，非单格 Shape 引用；`SO_Map_004.asset:15-64`。 | 在早期让 footprint 本身成为难题。 |
| 005 `…REVERSE PARKING PRACTICE` | 三个 Block、三个动态 Goal，Block/Goal 编号均为 1–3；`SO_Map_005.asset:27-80`。 | 形状 / 编号 / 推位顺序可形成一章。 |
| 006 / 007 | 都是 Rain；007 有两个不同形状 Block 与更大地图；`SO_Map_006.asset:15-66`、`SO_Map_007.asset:15-72`。 | Rain 先作为单独输入规则，再与 footprint 复用。 |
| 008 `FIRST BLOOD` | 多格 Block、Terrain Spike、Terrain Goal；`SO_Map_008.asset:15-68`。 | 先把 Spike 作为对象状态变换，而非随机惩罚。 |
| 009 `SECOND BLOOD` | 动态 Spike、8 节点 circle Path；`SO_Map_009.asset:42-78`。 | Loop Path 是静态 Spike 后的自然第二课。 |
| 011 `CYBERPUNK` | 两节点 ping-pong Spike、L Block + 单格 Block；`SO_Map_011.asset:27-89`。 | 原版想把时序和形状放在一起；但 raw Path 预检漏洞不能照搬为课程规则。 |
| 012 `WINDMILL` | 12 个 Block、多个 Fake、四个编号 Goal；`SO_Map_012.asset:28-100`。 | 适合作为识别 / 分配 / 拥挤空间的高级综合，而非首次展示 Fake。 |
| 013 `…PORTAL…` | Rain、Fake Block、两个可推动 Goal、Spike / ping-pong Path、成对 Gate；`SO_Map_013.asset:19-84`。 | 这是综合关的素材清单，不是单关应照抄的复杂度目标。应拆成前置课程后再组合。 |

地图跳转顺序也不是数值顺序，而是 `1 → 2 → 6 → 3 → 4 → 5 → 7 → 8 → 9 → 10 → 11 → 12 → 13`；这由各 Map 的 `nextMapTypeID` 可直接读出。它支持“先插入 Rain，后回到几何和组合”的课程取向，但不证明每一关的具体策划意图。

## 六、建议的扩展课程框架（不等于立即实现清单）

下面是 [D] 推荐的 24 关左右框架。每个单元均坚持“首次可直觉操作，第二关验证边界，第三关反转为工具，第四关才组合”。

1. **基础几何（1–6）：** 单推、推位、1×2、局部阻挡、L footprint、完整目标覆盖。
2. **目标身份（7–10）：** Terrain Goal、编号匹配、多格编号匹配、Fake 作为让位工具。
3. **Spike 回位（11–14）：** Block 回位、回位改变站位、Goal 回位、Footprint 过刺。
4. **路径节拍（15–18）：** Loop 观察、窗口、Ping-pong 相位、Block 轨道刹车。
5. **Rain（19–21）：** 停点、相邻推送、轨迹危险 / 可推动 Goal 停点。
6. **Gate（22–24）：** 方向保持、出口阻塞推入口、Rain × Gate 或 Gate × footprint 的一次综合。
7. **之后才做综合：** 每关最多两个新近学过的主动规则；Map 012 / 013 那种多机制密度应当是章节末挑战，而不是日常关卡。

每一小关应在开局用布局本身表达一个命题。例如：

- “这个 L Block 的每个 Cell 都要同时安全。”
- “把 Block 放到轨道的下一格，才能令 Spike 停下。”
- “滑行不会越过途中 Spike。”
- “从哪个方向进入 Gate，决定你在出口的哪一边。”

若无法用一句可检验的话说出这关的命题，它大概率只是机制堆叠而非课程。

## 七、作者工作流：怎样保证‘可解’也保证‘值得解’

当前项目已经有两道有价值的底线：关卡校验会拒绝非法 Path / Gate 引用与 hard spawn overlap（`src/engine/level-validation.ts:31-49,61-137`），每关有 BFS 和指定 walkthrough（`src/levels/level-solvability.test.ts:53-104`）。下一轮关卡生产建议在不改变规则的前提下补齐以下验收层：

1. **合法性：** `createGame(level)` 无错误，origin 回位不会产生未定义重叠。
2. **存在性：** 有界 BFS 找到胜利状态。
3. **教学路线：** 文案提示对应的动作序列可完成。
4. **机制使用证明：** 指定路线中确实发生了本关要教的状态转移，例如“Block 被 Spike 回位一次”或“Gate 的入口被推一次”，而不是被别的捷径绕过。
5. **反事实：** 给最自然的错误尝试写契约：它应当以可读的 NoOp、可预测重置或可解释的死锁失败，而不是偶然穿透。
6. **可读性检查：** Path 下一节点 / 折返方向、Gate 出口前方、Rain 停点、origin 与完整 footprint 都能从画面读出；不可把解释负担交给图例。

第 4、5 条尤其能防止“BFS 证明有解，但玩家从未学到目标机制”。它们是关卡 TDD 的测试对象，不需要把美术或提示字符串当作逻辑来源。

## 八、明确不建议用作近期关卡支柱的事项

1. **原版 Path 预检漏洞。** 正向终点和负向段漏检是代码缺陷；当前产品已裁决移动 Spike 撞 Player 后重置，不应用两种互相冲突的语义出题。参见 [Path Spike 复审](11-path-spike-role-reaudit.md) §2–§5。
2. **未实现机制。** Enemy、Boss、多格 Role、物件过 Gate、Rain 下 Block 滑动、局内天气变化都先冻结，直到有独立规则合同、视觉语言和 TDD。
3. **时间限制作为首要压力。** 它把“理解规则”的失败和“手快不快”的失败混在一起；原版现成地图也没有验证过该体验。
4. **多 Path / 多动态物的顺序谜题。** 先定义并测试并行结算，再把它当机制；不能用数组遍历顺序当隐藏答案。
5. **Fake 的信息欺骗。** Fake 该被读成“工具箱”，而不是让玩家在已经推到底后才发现白忙一场。
6. **以空间冗余代替推理。** 紧凑不等于没有安全格；一格用于观察、绕行或回位后的站位，只要改变决策，就是必要空间。

## 一手来源索引

- [原版作者设计稿](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)
- [原版 Bug 文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt)
- [原版回合主循环](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)
- [原版角色移动 / Gate](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)
- [原版网格许可与推动](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils)
- [原版 Path 状态与移动 Spike](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path)
- [原版 Map 资产](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map)
- 当前 Web 规则核：`src/engine/game-engine.ts`、`src/engine/types.ts`、`src/engine/level-validation.ts`
- 当前 Web 关卡与可解性合同：`src/levels/demo-levels.ts`、`src/levels/level-solvability.test.ts`

