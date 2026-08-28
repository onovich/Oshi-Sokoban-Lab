# Oshi 推箱子玩法复原：Web Demo 规则基线与 TDD 验收

调研日期：2026-08-28  
目标版本：官方 [`main` @ `4afe6809`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)（当前公开仓库）  
比较基线：本项目已有分析使用的 `a41dba58` Unity 快照；官方当前提交是 [README / cover 的文档更新](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)，逐文件比对后核心玩法代码与该快照相同。  
范围：只复原可玩的推箱子系统；不包含 VN 叙事、剧情 UI、音画资产、登录/存档界面。

> 标记约定：**事实**来自作者公开仓库的代码或文档；**高置信推断**是由代码控制流直接得出的运行时结论；**Web 规则**是为了做出可维护、可测试的 demo 而作出的明确产品决定，不把已知实现缺陷伪装成规则。

## 1. 结论与边界

**事实**：Oshi 自述为仍在开发中的类推箱逻辑游戏，核心是「推」，并已叠加十余种机制。[官方 README](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/README.md)  
**事实**：作者的设计文档是最直接的机制边界：已实现部分包含移动/推块、Wall、Spike、Goal、多格对象、Path、仅影响 Role 的 Rain、Fake Block、可推动 Goal、编号匹配与 Gate；同时明确列出了未实现内容。[设计文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)

因此，「完整机制」在本 demo 中应当指下表的 **已实现且有运行时代码的机制**，而不是作者的头脑风暴或未来设想。

| 范围项 | 状态 | Web demo 处理 | 主要证据 |
|---|---|---|---|
| 单格 Role 的四向移动、推 Block、不能拉/不能连推 | 已实现 | 必须实现 | [角色 FSM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)、[网格判定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs) |
| Block / Wall / Spike / Goal 的多格 footprint | 已实现 | 必须实现；所有平移逐格验证 | [形状模板](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/ShapeTM.cs)、[实体工厂](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs) |
| 静态 Terrain Wall / Goal / Spike 与动态同类物体 | 已实现 | 必须实现为关卡数据的两层表达 | [设计文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)、[地图模板](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/MapTM.cs) |
| Goal、编号匹配、Fake Block、胜利检测 | 已实现 | 必须实现 | [Block / Goal 规则](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs)、[结果检测](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs) |
| Spike：Role 死亡；Block / 可动 Goal / Gate 回出生点 | 已实现 | 必须实现，并通过关卡校验避免已知重叠缺陷 | [角色危险检测](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)、[Block 重置](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs) |
| Rain：只有 Role 滑行；遇到可推物时按一次普通推动处理 | 已实现 | 必须实现 | [角色 FSM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)、[滑行终点](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs) |
| Path 驱动的移动 Spike、环形与 ping-pong 路线 | 已实现，但 Traveler 实际只有 Spike | 必须实现为「移动 Spike」；不要泛化宣称能移动其他物体 | [Path 规则](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)、[Path 状态](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs) |
| Gate：仅 Role 传送；出口被阻塞时入口可被推 | 已实现 | 必须实现 | [Gate 规则](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGateDomain.cs)、[Gate 可移动性](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Movable.cs) |
| Undo、重开、可选步数/时间限制 | 有运行时代码；现有关卡均未启用限制 | Undo / 重开必须实现；限制实现为可选关卡字段并单测 | [记录与 Undo](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRecordDomain.cs)、[输入绑定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Main.cs) |
| Enemy、Boss、多格 Role、Rain 下 Block 滑动、物体传送、局内天气变化、扫雷裁剪/旋转/机关/磁铁等 | 明确未实现或仅构想 | 不纳入本 demo | [设计文档的“未实现/特殊玩法/头脑风暴”段落](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt) |

## 2. 可复原的状态模型

**事实**：每个可多格实体由一个原点和一组局部 cell 组成；运行时以每个 cell 的坐标做占用查询。形状在加载时被复制进实体，现有运行时代码没有旋转形状的动作。[`ShapeTM`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/ShapeTM.cs)、[`GameFactory`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs)

Web 核心应使用下列**纯数据**状态，而不是让 DOM / Canvas 位置承担规则真相：

```text
GameState
  board: bounds, terrainWalls, terrainGoals, terrainSpikes, weather
  player: { cell }                         // demo 固定为 1×1
  blocks: [{ id, origin, cells, number, fake, spawnOrigin }]
  goals:  [{ id, origin, cells, number, pushable, spawnOrigin }]
  gates:  [{ id, origin, cells, nextGateId, spawnOrigin }]
  walls:  [{ id, origin, cells }]
  spikes: [{ id, origin, cells }]
  paths:  [{ id, travelerSpikeId, nodes, cursor, direction, loopMode }]
  turn: { steps, elapsed, result }
  history: GameState[]                     // 每次有效行动前的完整快照
```

**Web 规则**：`footprint(entity) = { entity.origin + localCell }`，所有实体只做平移、不旋转；一个动作的候选位置必须先对**整个** footprint 校验，再一次性提交。这个规则保留了 Oshi 的多格解谜意图，同时避免「中心格合法、边缘格穿墙」的实现漏洞。

### 2.1 语义层与碰撞层

| Cell / 对象 | Role 的默认交互 | Block 的交互 | 备注 |
|---|---|---|---|
| Wall（Terrain 或动态） | 不可进入 | 不可进入 | 硬阻挡。 |
| Goal（Terrain） | 可经过 | 可覆盖 | 是终点地面，不要求所有 Goal 都被覆盖。 |
| Goal（动态、不可推） | 可经过 | 可覆盖 | 编号必须与 Block 一致才对该 Block 算目标。 |
| Goal（动态、可推） | 可推时推动；在普通地面上不可推且未被 Block 覆盖时可穿过 | 可覆盖 | 这是作者文档写明的「被阻塞时可穿透」规则。 |
| Spike（Terrain 或动态） | 可进入，但会死亡/失败 | 可进入；环境回合重置 Block | Goal / Gate 也会按同样方式重置。 |
| Gate | 出口可用则传送；出口阻塞则可能可推 | Block 不传送、不进入 | Gate 的特殊规则见第 5 节。 |
| Block | 可从相邻格推一格；不能拉，不能推动一串 | 与其他 Block / Wall / Gate 互斥 | Block 可与 Goal、Spike 重叠。 |

表中 Role/Block 的大部分行为可由 [`GridUtils`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs)、[`GridUtils_Has`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs) 和 [`GridUtils_Pushable`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs) 验证。表中对 Spike 和目标层的规范化表达见第 6 节：它保留可玩规则，不复制已知的运算符优先级缺陷。

## 3. 回合、输入与结果

**事实**：源工程是离散的 `PlayerTurn → EnvirTurn` 状态机；角色行动完成后才进入环境回合。环境回合按 Block 重置、Gate 重置、Goal 重置、Path 移动/携带 Traveler 的顺序执行。[主循环](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)

**事实**：原版键盘为 `WASD` 或方向键移动，`Z` Undo，`R` 重开，`Esc` 退出。[`Main.cs`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Main.cs)

**Web 规则**：把一次有效的玩家输入建模为一次原子 transaction，动画只渲染 transaction 的前后状态。建议固定如下优先级，以免浏览器帧率改变谜题结果：

```text
1. 接受一个四向动作；非法/撞墙/不可推动作是 NoOp，不增加步数、不推进环境。
2. 在提交动作前保存完整 GameState 快照。
3. 执行正常走、一次推动、Rain 滑行或 Gate 转移；一次有效命令只记 1 步。
4. 若 Role 已触碰 Spike，判负；否则进入环境回合。
5. 环境回合：按 Block → Gate → Goal 检查 Spike 并重置；每条可移动 Path 前进一个节点。
6. 再解析动态 Spike 与 Role 的碰撞；碰撞则判负。
7. 依次检查可选限制与通关；无结果则回到玩家回合。
```

第 5 步的对象顺序是**事实**；第 4、6、7 步把原工程的动画期间轮询收束成可测试的离散优先级，是 **Web 规则**。原工程在环境结果检查之后才统一检查 Role 的 Spike 状态，容易因动画时序造成不稳定结果；Web demo 不应把这种时序泄漏变成关卡规则。[主循环](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)

## 4. 基础推箱、多格与通关

### 4.1 移动与推动

**事实**：输入只允许单一轴；角色先判断前方一格是否可走，再优先尝试 Block、Goal、Gate 的推动。Block 的完整 footprint 会逐格检查边界、墙、其他 Block、Goal/Gate/Spike 等占用。[角色 FSM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)、[Block 推动判定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs)

**高置信推断**：没有任何「拉回」「旋转」「一次推动多个 Block」的状态转移；因此它们不能作为“默认推箱体验”被加入。多格 Block 在平移中允许新 footprint 与自身旧 footprint 重叠，这是刚体平移所必需的。

**Web 规则**：Block 推动的合法条件为：玩家紧贴任一 Block cell 的反方向；Block 的新 footprint 在边界内，且每个新 cell 不与 Wall、其他 Block、Gate 或非地面实体重叠；Goal 与 Spike 允许作为覆盖层。一次命令只令 Block 平移一格，Block 不会在 Rain 中继续滑行。

### 4.2 Goal、编号与 Fake Block

**事实**：一个非 Fake Block 只有当它的**每个** cell 都落在 Terrain Goal，或落在编号等于该 Block 编号的动态 Goal 上时，才算完成；地图所有非 Fake Block 都完成即胜利。Goal 可以多余，源码没有要求每个 Goal 都必须被占用。Fake Block 仍然存在、可推、可触发危险，但被胜利检查跳过。[`GameBlockDomain.CheckAllInGoal`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs)、[`GameGameDomain.CheckInGoal`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs)

可测试的形式化条件是：

```text
covered(blockCell, block) =
  blockCell ∈ terrainGoals
  OR ∃ dynamicGoal: blockCell ∈ footprint(dynamicGoal)
                     AND dynamicGoal.number = block.number

solved(block) = block.fake OR ∀ cell ∈ footprint(block): covered(cell, block)
won(state) = ∀ block ∈ state.blocks: solved(block)
```

**事实**：`0` 是未显示的默认编号；动态 Goal 与 Block 都以同一数值比较，Terrain Goal 不做编号比较。[`GameFactory`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs)、[`GameBlockDomain`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs)

## 5. 特殊机制的精确定义

### 5.1 Spike 与重置

**事实**：任一 Role 覆盖 Spike（静态或动态）即进入 Dead 并使本局失败；任一 Block、Goal、Gate 的任一 cell 覆盖 Spike 时，会回到各自的 `originalPos`。重置在环境回合中执行。[Role 危险](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)、[Goal 重置](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGoalDomain.cs)、[Gate 重置](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGateDomain.cs)

**Web 规则**：重置的对象在该次环境回合一次性回出生 origin；不采用逐帧碰撞，也不把 Block 销毁。关卡校验和每次 transition 都必须拒绝会让出生 footprint 与别的实体重叠的非法状态，并在开发期明确报错。作者已记录原工程在出生点被占用时会产生逻辑/画面重叠，提出的解决方向仍未落地。[已知 Bug](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt)

### 5.2 可推动 Goal

**事实**：动态 Goal 有 `canPush` 字段。可推动时，玩家可将其平移一格；不可推动或不能继续平移时，普通状态下的玩家可进入没有 Block 覆盖的 Goal cell。作者文档概括为「可推动的 Goal，被阻塞时可穿透」。[`GoalEntity`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Goal/GoalEntity.cs)、[网格可走性](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs)、[设计文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)

**Web 规则**：保持这个非经典推箱规则，但要求可推动 Goal 的多格 footprint 也能正确平移；被 Block 覆盖时不允许 Role 穿过。Rain 中的阻塞 Goal 按第 6 节的已知 Bug 修正为滑行障碍，而不是穿透。

### 5.3 Rain（滑冰）

**事实**：Rain 只改变 Role。若相邻格是可推动 Block / Goal / Gate，Role 做一次普通的一格推动；否则 Role 会沿输入方向滑到最后一个可停 cell，或滑入可用 Gate。Block 的 Rain 滑行被作者明确列为未实现。[角色 FSM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)、[滑行算法](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs)、[设计文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)

**Web 规则**：在纯逻辑层按 cell 逐个扫描滑行路径；墙、Block、可推动 Goal、可推动 Gate、边界会让 Role 停在前一格；可用 Gate 是滑行落点并随后传送。静态 Goal 仍是可滑过地面。若第一格就是不可推障碍，动作是 NoOp；不产生环境回合。所有经过的 Spike 都要判定死亡，不能只检查最终格。

### 5.4 Gate（传送门）

**事实**：Gate 用 `nextGateIndex` 指向另一个 Gate。Role 进入入口后，在出口 Gate 位置继续沿**原输入方向**走出一格；出口前方可用时入口不可以推。若出口前方被阻塞，入口 Gate 本身在其前方空间合法时可被玩家推一格。Gate 只传送 Role，物体传送被作者列为未实现。[角色传送实现](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)、[Gate 推动判定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs)、[设计文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)

**Web 规则**：关卡格式允许有向 Gate 链接，但 demo 作者工具必须拒绝不存在的目标 Gate；推荐正式关卡使用成对互指 Gate。将「传送至出口再向入射方向走一格」作为一个原子玩家行动，不让中间出口位置接收额外输入；Block、Goal、Spike 都不能借 Gate 传送。

### 5.5 Path 与移动 Spike

**事实**：每个 Path 保存节点、当前节点、方向、环形或 ping-pong 标志；环境回合会让它的 Traveler 向下一节点移动。真正有 `ApplyCarryTraveler` 实现的唯一类型是 Spike；非 Spike 的 Traveler 配置不会移动实体。[`PathModel`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs)、[`GamePathDomain`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)

**事实**：源代码在 Path 前方遇到其他 Spike、Block、Wall、Role、Terrain Wall 或 Terrain Spike 时会停止当前路线，不会碾压这些对象；Goal 与 Gate 不在该阻挡清单中。环形路线首尾相接，ping-pong 路线在端点反转方向。[`GamePathDomain`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)、[`PathModel.ClampIndex`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs)

**Web 规则**：每条路线在一次环境回合最多原子前进一个相邻节点；若任一路径被阻挡，该条路径保持 cursor/方向不变，其他路径照常结算。编辑器校验要求节点为边界内、轴对齐的单位步，且移动 Spike 的**完整 footprint**全程不和阻挡物重叠。这样保持「死轨道、Traveler 硬跟随 Path」的作者意图，又不继承原代码对负方向、终点和多格 Traveler 的脆弱实现。[设计文档备忘](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)

### 5.6 Undo、重开与限制

**事实**：原工程在每次角色移动开始前记录玩家、Block、Gate、Goal、Spike 的位置；`Z` 弹出一条记录，尝试恢复 Path，并回到玩家回合。`R` 重开当前地图。[记录逻辑](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRecordDomain.cs)、[输入绑定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Main.cs)

**事实**：地图模板存在 `limitedByTime` / `limitedByStep`，结果检测会先检查时间、再检查步数、最后检查胜利；当前随附 Map 资产均设为未启用，因此没有关卡数据验证这些限制的体验。[`MapTM`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/MapTM.cs)、[结果检测](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs)

**Web 规则**：Undo 必须恢复整份 `GameState`，包括步数、限制计时、Path cursor 与方向、所有动态对象、当前结果；撤销后重新渲染，而不是对现有 DOM 局部倒放。步数按有效玩家动作计，Gate 整段转移和 Rain 整段滑行各计一次。时间限制若展示，采用真正的暂停/恢复可控倒计时；若追求当前关卡的严格复原，可不在 demo level 启用它。

## 6. 源码事实与不可照抄的缺陷

下表是实现前必须显式决策的地方。左列不是推测；右列是为了 TDD 和可维护性而建议采用的规则合同。

| 已验证现象 | 证据与等级 | Web demo 决策 |
|---|---|---|
| 文档写「Spike 杀死 Role 和 Block」，但运行时代码实际让 Block / Goal / Gate 回 `originalPos`。 | **事实**：设计文档与 [Block / Goal / Gate 重置代码](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs) 冲突。 | 以运行时代码为准：Role 判负，对象回出生点。 |
| 重置出生点被占用会重叠。 | **事实**：作者的 [Bug 文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt) 明确记录。 | 关卡校验与 transition 都拒绝并报告该非法状态；不臆造暂存区/连锁重置新机制。 |
| Rain 中被阻塞的可推动 Goal 会被滑行穿透，作者明确把它记为 Bug。 | **事实**：[Bug 文档](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt)。 | 把它作为滑行障碍；这是已记录的修正规则。 |
| `CheckGoalPushable` 与 `HasNoPropButGoal` 的 `&&` / `||` 没有括号；Goal / Gate 的多格自身重叠也没有像 Block 一样跳过。 | **事实 + 高置信推断**：可直接阅读 [推动条件](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs) 与 [占用条件](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs)。 | 所有可动 footprint 统一「忽略自身旧 footprint、再检查完整新 footprint」；边界条件始终与其它条件用括号组合。 |
| Undo 快照没有步数、天气、Path cursor/方向等完整状态；Path 是靠事后 `Undo()` 猜回去。 | **事实**：[RecordModel](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Record/RecordModel.cs) 与 [Undo 代码](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRecordDomain.cs)。 | 深拷贝完整纯状态；Undo round-trip 是硬性测试。 |
| Path 数据模型可填写多种 EntityType，但真正携带逻辑只有 Spike。 | **事实**：[GamePathDomain](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)。 | 关卡 schema 只允许 `travelerKind: "spike"`；其他值为验证错误。 |
| 时间限制在环境阶段采样，且随附地图没有启用时间/步数限制。 | **事实**：[主循环](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)、[地图资产目录](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map)。 | 作为可选扩展单测；核心展示关不依赖它，避免把帧率当谜题规则。 |

## 7. TDD 验收清单

先给 `game-core` 写失败测试，再写 transition；渲染器只能消费状态与事件。下列测试覆盖每一条已实现规则，适合成为 demo 的 Definition of Done。

| 测试组 | 最小断言 |
|---|---|
| `movement` | 四向移动只接受一轴；撞 Wall / 越界 / 不可推 Block 是 NoOp；不能拉 Block；不能一次推两 Block。 |
| `footprint` | L 型 Block 只要任一目标 cell 撞 Wall / 其他 Block 就不能移动；与自身旧 cell 的平移重叠合法；形状绝不旋转。 |
| `goals` | Terrain Goal 覆盖即有效；动态 Goal 必须编号一致；多格 Block 必须所有 cell 覆盖；多余 Goal 不妨碍胜利；Fake Block 不计胜利但仍阻挡。 |
| `pushable-goal` | 可移动时被推一格；普通模式中不可移动且未被 Block 覆盖时 Role 穿过；多格 Goal 的自重叠不误判为碰撞。 |
| `spikes` | Role 任一 cell 入 Spike 判负；Block / Goal / Gate 任一 cell 入 Spike 在环境回合回出生点；出生点冲突作为非法状态被拒绝并报告。 |
| `rain` | 普通地面一令一格；Rain 一令滑至合法终点；相邻可推对象只推一格且 Block 不滑；被阻塞的可推 Goal 阻止滑行；经过 Spike 也判负。 |
| `gates` | 出口前方可用时，Role 从出口按入射方向走出；出口阻塞且入口前方合法时入口 Gate 被推；Block / Goal / Spike 不传送；无效链接拒绝加载。 |
| `paths` | 每个环境回合一节点；circle 首尾循环；ping-pong 端点反向；阻挡时当前 Path 不动；只有 Spike 可作为 Traveler；移动 Spike 的全 footprint 均要预检。 |
| `history` | 对普通推、Rain、Gate、Path 各做一次 `before → action → undo`，断言完整结构相等（包括步数、所有 origin、path cursor/direction、结果）。 |
| `limits` | 启用步数/时间时明确验算优先级；暂停或结果后不继续扣时间；未启用时不得影响解法。 |
| `integration` | 至少一关同时覆盖 Rain、可推 Goal、Fake Block、Gate、移动 Spike 与 Undo；其通关状态与重复执行同一动作序列完全一致。 |

建议再加两个性质测试：

- 任意 `NoOp` 后状态深相等，且不会令 Path 前进。
- 对任意有效动作 `s`，若没有到达不可撤销的结果，则 `undo(apply(s, action))` 与 `s` 深相等。

## 8. Web 架构落点

**Web 规则**：建议将 TypeScript 项目按下面的边界实现。它不是原 Unity 的逐类搬运，而是把同一玩法拆成可验证模块。

```text
src/game/model/        坐标、shape、关卡 schema、GameState、事件类型
src/game/rules/        footprint、occupancy、canMove、canPush、goal/hazard/path 纯函数
src/game/transition/   applyAction、applyEnvironmentTurn、resolveOutcome、undo
src/game/levels/       JSON/TS 关卡数据与 validator
src/game/history/      完整快照栈（无 DOM 引用）
src/app/               键盘/按钮适配、动画队列、Canvas 或 DOM 渲染、音效
tests/game/            上节表驱动单元测试与集成测试
```

关键边界是：`applyAction(state, direction)` 和 `undo(state)` 均为确定性的纯函数；`src/app` 永不自行判断碰撞、胜负或 Path。这样可以让动画、键盘连发、移动端按钮、重放和日后关卡编辑器共享同一个规则核。

## 9. 建议的 demo 机制关顺序

不需要复刻 VN 或全部原始关卡；采用 12 个紧凑教学关，每关只强调一个规则或技巧。原始资产中可用于交叉检查的代表关包括 004（多格）、005（编号）、006/007（Rain）、008（Spike）、009/011（Path）、012（Fake）和 013（Gate + Rain + 可推 Goal + Path）。[原始 Map 资产目录](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map)

1. 单次推送与 Terrain Goal。
2. 多格 Block / Wall，验证完整 footprint。
3. B2 / G2 编号匹配。
4. Fake Block 不计入胜利。
5. Spike 让 Block 回出生点。
6. Rain 下的滑行与一次推动。
7. 可推动 Goal，以及被阻挡时穿过。
8. Gate 传送与方向保持。
9. Gate 出口被阻塞时的入口推动。
10. Loop 路径尖刺的时机。
11. Ping-pong 路径尖刺的阻挡。
12. 步数限制与最短路径。

每关在测试中同时通过有界状态空间搜索和显式 walkthrough 的执行验证；这样“有解”是持续回归属性，而非文档宣称。

## 10. 来源

- [Oshi 官方仓库（当前 main）](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)
- [README：项目自述与开发状态](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/README.md)
- [设计文档：已实现、未实现与未来构想的作者边界](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)
- [Bug 文档：重置重叠与 Rain/Goal 例外](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt)
- [主回合循环](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)
- [角色移动 / Rain / 推送](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)
- [网格移动、占用和推动条件](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils)
- [Block、Goal、Gate、Path、Undo 与结果规则](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains)
- [地图、形状与当前关卡资产](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime)
