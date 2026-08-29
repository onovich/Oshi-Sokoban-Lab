# Oshi Unity Spike 机制：严格源码复审

调研日期：2026-08-28  
官方核验版本：[Oshi <code>4afe6809aaef0894b5f27b543dff84b437bebb45</code>](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)  
本地 Unity 审计副本：<code>D:\UnityProjects\Oshi</code>，提交 <code>a41dba58d2009bcf2c30e5012cfb2f5f059b44ff</code>  
范围：仅审计原版 Unity 的 Spike、移动、环境回合、Path 与结算代码；不含 VN 叙事。

## 审计边界与结论等级

本地副本比官方固定提交少一个后续文档提交；本报告涉及的 16 个运行时文件逐个 SHA-256 比对一致。因此下文的本地行号也是该官方提交的代码行号。

- **已验证**：可从固定版本源码直接逐行推出。
- **控制流推断**：由已验证调用次序组成，但未在 Unity 编辑器中录制一帧实机回放。
- **Web 差异**：审计时 <code>D:\LabProjects\LearnSokoban\src\engine\game-engine.ts</code> 的实际实现；工作树可继续变化，行号只描述本次审计快照。

最重要的结论是：原版并不存在一个“角色/物体进入 Spike 后立即、原子地结算”的统一规则。角色死亡、物体重置、Path Spike、胜负判断分别处于不同阶段，并且有多个可观察的时序漏洞。若 Web Demo 的目标是**忠实还原源码**，不能把这些流程合并为一次安全的回合结算；若目标是**可维护的规则化版本**，则应明确把下面标注的漏洞作为有意修正，而不是称为原作行为。

## 一、每个 Tick 的真实顺序

本地：<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Business_Game\GameBusiness.cs:51-73, 85-155</code>  
官方：[GameBusiness.cs:51-155](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs#L51-L155)

| 阶段 | 已验证的动作 | 与 Spike 的关系 |
| --- | --- | --- |
| <code>Tick</code> | Input → <code>PreTick</code> → 0.01 秒 Physics → <code>LateTick</code> | Spike 的核心逻辑都在每帧一次的 <code>PreTick</code>，不是 Physics 碰撞回调。 |
| 玩家回合 | 只调 Role FSM。移动结束的回调会进入环境回合。 | Role 可以先移动到 Spike；死亡检查不在移动前。 |
| 环境回合 | **Block → Gate → Goal → Path 动画 → Path 携带 Traveler →（所有 Path 结束则）玩家回合 → 胜负检查**。 | 物体先重置、移动 Spike 后移动；Role 死亡检查甚至晚于胜负检查。 |
| 所有游戏状态分支之后 | <code>CheckAndApplyAllRoleDead</code>，随后仅清理 <code>needTearDown</code> 的 Role。 | 动态 Spike 接触 Role 后，本帧只会令 FSM 进入 Dead；不一定立刻从 repo 删除。 |

同类对象在环境回合中通过各 repository 的 <code>all.Values.CopyTo</code> 取出；代码没有定义“同类多个重置物”的全局原子提交或连锁优先级。本地 Block repository 证据：<code>...Business_Game\Repos\BlockRepository.cs:37-57</code>；官方：[BlockRepository.cs:37-57](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Repos/BlockRepository.cs#L37-L57)。

## 二、分支 A：Player 进入动态 / Terrain Spike

### A1. 普通移动与 Rain 滑行都允许接触 Spike

**已验证。** <code>TryGetNextWalkableGrid</code> 把动态 Spike 或 Terrain Spike 合并为 <code>isSpike</code>，并直接纳入可走条件；源码注释也把“有物体，是刺”列为可走条件。

- 本地：<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Business_Game\Utils\GridUtils.cs:30-51</code>
- 官方：[GridUtils.cs:30-51](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs#L30-L51)
- 两类 Spike 的统一查询：本地 <code>...Business_Game\Utils\GridUtils_Has.cs:87-90</code>；官方：[GridUtils_Has.cs:87-90](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs#L87-L90)。

Rain 不是“每经过一格做一个离散死亡检查”。Rain 时先做相邻格可走判定，再在前方不是可推物时调用滑行终点扫描；该扫描只把 Block、可推 Goal/Gate、Wall、Gate 与边界视为终点，**完全不把 Spike 视为阻挡**。

- 本地：<code>...Business_Game\Controllers\GameRoleFSMController.cs:47-67</code>、<code>...Business_Game\Utils\GridUtils.cs:54-94</code>
- 官方：[Rain 分支](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs#L47-L67)、[滑行终点扫描](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs#L54-L94)。

### A2. 碰刺检测发生在缓动之后，且按帧取整

**已验证。** Role 的位置先由缓动写入 Transform；<code>RoleEntity.PosInt</code> 是 Transform 位置的 <code>RoundToVector2Int()</code>。每个 <code>PreTick</code> 的最后才逐个检查 Role 的整个 size footprint 是否命中动态或 Terrain Spike。

- 位置与取整：本地 <code>...Entities_Game\Role\RoleEntity.cs:46-65</code>；官方：[RoleEntity.cs:46-65](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Role/RoleEntity.cs#L46-L65)。
- 缓动写位置：本地 <code>...Business_Game\Domains\GameRoleDomain.cs:114-145</code>；官方：[GameRoleDomain.cs:114-145](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs#L114-L145)。
- 统一死亡检测：本地 <code>...Business_Game\Domains\GameRoleDomain.cs:178-203</code>；官方：[GameRoleDomain.cs:178-203](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs#L178-L203)。

因此，源码事实是“**缓动期间按帧、按取整后的当前坐标采样**”，而不是“Rain 的离散路径中只要经过任意 Spike 必死”。后者可作为 Web 的确定性修正规则，但不能当作原版的逐格机制。

### A3. Dead、拆除和 Lose 不在同一时刻

**已验证的流程：**

1. 移动结束时，Role FSM 先递增步数、进入 Idle，并调用 <code>EnvirTurn_Enter</code>。本地 <code>...GameRoleFSMController.cs:98-111</code>；官方：[GameRoleFSMController.cs:98-111](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs#L98-L111)。
2. 同一 <code>PreTick</code> 尾部的 Spike 检查才将 Role 设为 Dead；<code>FSM_EnterDead</code> 不会立刻销毁实体。官方：[RoleEntity.cs:136-141](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Role/RoleEntity.cs#L136-L141)。
3. 只有下次**玩家回合**的 Role FSM 执行 Dead 分支，才设置 <code>needTearDown = true</code>；之后本帧末尾 <code>CheckAndUnSpawn</code> 才会移除 Role。官方：[Dead FSM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs#L114-L128)、[UnSpawn](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs#L20-L29)。
4. <code>ApplyCheckGameResult</code> 的 Lose 条件只检查 owner 是否已经从 repo 移除；它不检查 Role FSM 是否为 Dead。官方：[GameGameDomain.cs:257-296](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs#L257-L296)。

**控制流推断（高置信）：** 若一次结束移动同时完成所有 Block 的 Goal 条件并让 Role 落入 Spike，下一环境帧会先执行胜负检查，owner 仍在 repo 中；代码因而允许先进入 Win。之后游戏状态不再是 PlayerTurn，Dead FSM 的拆除路径也不会照常运行。这不是“Player 碰刺立即 Lose”的行为，而是源码顺序造成的 win-over-death 窗口。

## 三、分支 B：Block / Goal / Gate 进入 Spike

### B1. 推入 Spike 是允许的

**已验证。** 三种可推动实体的可推判定都把 Spike 当作目标落点的允许条件。

| 实体 | 精确源码规则 | 特别注意 |
| --- | --- | --- |
| Block | 每个 footprint cell 需在边界内，且可为空、仅 Goal 或 Spike。 | 本地 <code>...GridUtils_Pushable.cs:62-89</code>；官方：[Block push](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L62-L89)。 |
| Gate | 先要求“下一 Gate 不可移动”，然后每个 cell 可为空、Goal 或 Spike。 | 本地 <code>...GridUtils_Pushable.cs:8-34</code>；官方：[Gate push](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L8-L34)。 |
| 可推 Goal | <code>canPush</code> 为真后，源码条件为 <code>constraint && noProp || hasSpike</code>。 | 本地 <code>...GridUtils_Pushable.cs:36-60</code>；官方：[Goal push](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L36-L60)。按 C# 优先级，<code>hasSpike</code> 不受前段边界条件约束，这是源码的额外异常分支。 |

### B2. 重置条件、对象范围与准确次序

**已验证。** 动态 Block、Goal、Gate 各自检查其全部 cell footprint；任一 cell 接触动态或 Terrain Spike 即重置到初始化时保存的 <code>originalPos</code>。它们还共同有一个常被遗漏的前置条件：**owner 必须存在且 Role FSM 恰为 Idle。** owner 正在 Moving、已经 Dead 或已经移除时都直接 return，不重置。

| 对象 | 本地源文件与行段 | 官方一手证据 |
| --- | --- | --- |
| Block（含 Fake Block；代码没有排除 <code>isFake</code>） | <code>...Business_Game\Domains\GameBlockDomain.cs:93-134</code> | [GameBlockDomain.cs:93-134](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs#L93-L134) |
| 动态 Goal | <code>...Business_Game\Domains\GameGoalDomain.cs:60-101</code> | [GameGoalDomain.cs:60-101](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGoalDomain.cs#L60-L101) |
| 动态 Gate | <code>...Business_Game\Domains\GameGateDomain.cs:49-90</code> | [GameGateDomain.cs:49-90](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGateDomain.cs#L49-L90) |
| 出生点记录 | <code>...Business_Game\GameFactory.cs:171-173, 266-268, 326-328</code> | [Goal](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs#L171-L173)、[Gate](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs#L266-L268)、[Block](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs#L326-L328) |

环境回合的跨种类顺序固定为 Block → Gate → Goal；随后才开始 Path。也就是说，Path Spike 在本帧后半程撞进一个对象时，该对象最早在**下一次**符合 Idle-owner 条件的环境回合才有机会重置。

## 四、出生点被占用：原版没有安全重置

**已验证。** 三个 <code>Reset*</code> 函数都没有预检：先把 Transform 位置设为 <code>originalPos</code>，再只更新各自类型的 repository。以 Block 为例：

- 本地：<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Business_Game\Domains\GameBlockDomain.cs:110-122</code>
- 官方：[ResetBlock](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs#L110-L122)。

各 repository 先移除旧 cell，再对新 cell 直接调用 <code>Dictionary.Add</code>，并未查询其它类型的 repository：

- Block：本地 <code>...Business_Game\Repos\BlockRepository.cs:47-56</code>；官方：[BlockRepository.cs:47-56](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Repos/BlockRepository.cs#L47-L56)。
- Goal：本地 <code>...Business_Game\Repos\GoalRepository.cs:47-56</code>；官方：[GoalRepository.cs:47-56](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Repos/GoalRepository.cs#L47-L56)。
- Gate：本地 <code>...Business_Game\Repos\GateRepository.cs:47-56</code>；官方：[GateRepository.cs:47-56](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Repos/GateRepository.cs#L47-L56)。

精确后果：

1. 出生点与 Role、不同种类实体、Terrain、Spike 重叠时，没有全局冲突检查，会留下逻辑/表现重叠。
2. 出生点与**同类**实体重叠时，新 cell 的 <code>Dictionary.Add</code> 会出现重复键异常；不存在暂存格、等待、原子回滚或连锁重置。
3. 由于位置先写回出生点，重置 VFX 也在出生点产生，而非踩刺点。

这不是推测：作者自己的未解决 Bug 文档已明确写出 Block/Gate/Goal 踩 Spike 后若出生点被占用会产生逻辑和表现重叠，并只提出“暂存格或连锁重置”为待实施方案。  
本地：<code>D:\UnityProjects\Oshi\Assets\Document\Bug.txt:1-3</code>；官方：[Bug.txt:1-3](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt#L1-L3)。

## 五、分支 C：移动 Path Spike 接触 Role / Block / Goal / Gate

### C1. 意图中的阻挡名单与实际检查时机

**已验证。** 每环境帧，Path 先尝试移动，随后才把 <code>pathCarPos</code> 写入 Spike Transform 与 Spike repository；而 Role 死亡检查在整个环境分支之后。

- Path 推进/预检：本地 <code>...Business_Game\Domains\GamePathDomain.cs:33-86</code>；官方：[GamePathDomain.cs:33-86](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L33-L86)。
- 携带 Spike：本地 <code>...GamePathDomain.cs:88-108</code>；官方：[GamePathDomain.cs:88-108](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L88-L108)。
- Path 位置是缓动的 <code>pathCarPos</code>：本地 <code>...Entities_Game\Path\PathModel.cs:75-108</code>；官方：[PathModel.cs:75-108](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs#L75-L108)。

<code>CheckSpikeMovable</code> 的意图是阻止移动 Spike 进入“其它动态 Spike、Block、Wall、Role、Terrain Wall、Terrain Spike”。**Goal 和 Gate 不在名单内。** 即使预检正确，移动 Spike 也允许与 Goal/Gate 共格。

### C2. <code>GetPathCoveredGrid</code> 使预检不能可靠地保护终点

**已验证。** 预检调用的辅助函数是：

~~~csharp
var dir = end - start;
for (int i = 0; i < dir.x; i++) result[i] = new Vector2Int(start.x + i, start.y);
for (int i = 0; i < dir.y; i++) result[i] = new Vector2Int(start.x, start.y + i);
return dir.x + dir.y;
~~~

本地：<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Business_Game\Utils\GridUtils.cs:19-28</code>；官方：[GridUtils.cs:19-28](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs#L19-L28)。

由这段实际实现直接得到：

- 相邻正向移动 <code>(1,0)</code> 或 <code>(0,1)</code> 时，返回的只有**起点**，没有终点；终点 Role / Block / Wall / Spike 因而不参与预检。
- 任一负向轴向移动时，返回 count 为负；调用方的 <code>for (i = 0; i &lt; count; i++)</code> 不运行，完全跳过预检。
- 斜向/多格情况会覆盖临时数组元素且仍不形成完整 segment；<code>CheckSpikeMovable</code> 也只检查单一 anchor，没有按移动 Spike 自身 footprint 展开。

官方地图并非只使用“安全的正向”路径。<code>SO_Map_009.asset</code> 让 Spike 从 <code>(1,0)</code> 前往 <code>(1,-1)</code>，正好是 count <code>-1</code> 的分支。

- 本地：<code>D:\UnityProjects\Oshi\Assets\Templates_Runtime\Map\SO_Map_009.asset:42-69</code>
- 官方：[SO_Map_009.asset:42-69](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map/SO_Map_009.asset#L42-L69)。

所以“Path 前方遇到 Role / Block / Wall 必停止”只能描述作者在 <code>CheckSpikeMovable</code> 中表达的**意图**，不是可靠的原版实际行为。预检漏过终点或负向段后，<code>CarrySpike</code> 仍直接更新 dynamic Spike；同一 <code>PreTick</code> 尾部会发现 Role 踩刺并进入 Dead。对 Block/Goal/Gate 而言，因其重置阶段已经在本环境帧更早执行，重置至少延后到后续环境回合，且仍受 Idle-owner 限制。

## 六、当前 Web 引擎的已确认误还原点

审计快照：<code>D:\LabProjects\LearnSokoban\src\engine\game-engine.ts</code>（工作树含并行修改；下列行号为阅读时的文件内容）。

| Web 当前实现 | 原版 Unity 实际 | 影响 / 还原选择 |
| --- | --- | --- |
| <code>resolveTurn</code> 在 <code>:328-339</code> 先因 Player 接触静态/动态 Spike 直接 <code>lost</code>，再做 step/win。 | Role 只是先 Dead；环境结算先于死亡检查，Lose 要等 owner 移除。 | Web 消除了源码的延迟死亡和 win-over-death 窗口。若追求可玩性，这是合理修正；若声称源码复刻，必须改成显式的时序策略。 |
| <code>resetHazardObjects</code> 在 <code>:193-235</code> 总是执行，并通过 <code>canPlaceBlock</code> / <code>canPlaceGate</code> / <code>canResetGoal</code>（<code>:97-146</code>）预检，冲突时返回 event 且不改变状态。 | 原版只在 owner Idle 时重置，且无预检；跨类型重叠、同类 <code>Dictionary.Add</code> 异常。 | 目前是安全的“规范化规则”，不是原版。还应补上 owner-FSM 相当物，或明确不复刻这一 bug。 |
| <code>cellsAlongPath</code>（<code>:264-278</code>）包含终点；<code>canMovePathSpike</code>（<code>:280-298</code>）逐段、逐 footprint、含边界预检。 | 原版 <code>GetPathCoveredGrid</code> 漏终点、负向不检查，也不展开 traveler footprint。 | 当前 Web 正确地阻止了原版可能发生的 Path Spike 撞 Role/Block/Wall。建议保持为“safe”模式，并另设 <code>legacySpikePathBugs</code> 才能严格模拟原版。 |
| <code>advancePaths</code>（<code>:300-326</code>）一个玩家回合瞬移一个完整 Path 节点。 | Unity 在多个环境帧中对 <code>pathCarPos</code> 缓动、每帧更新 Spike repo，并每帧采样 Role Spike。 | 当前缺少原版的动画期间接触时机；需要可测试的环境帧状态机，不能只用一次原子变换。 |
| <code>traversedCells</code>（<code>:461-467</code>）为 Rain / Gate 路径补齐每一个经过格并立即判死。 | 原版 Rain 没有逐格 Spike 扫描，而是连续缓动后按帧、按位置取整采样。 | Web 更确定且更容易测试，但和原版的采样语义不同。 |

## 七、给 TDD 的最小回归矩阵

这些不是新的设计要求，而是将上述一手证据转为可锁定的回归案例。建议测试名称明确区分 <code>legacy</code> 与 <code>safe</code>，避免一个布尔条件同时承担“原作忠实”和“修正漏洞”两种语义。

1. <code>legacy: player may enter a static or dynamic spike; death is marked after movement sampling, not move legality</code>。
2. <code>legacy: rain path does not use an explicit per-cell spike traversal rule</code>。
3. <code>legacy: block, gate, goal reset only when owner is Idle; order is block → gate → goal → path</code>。
4. <code>legacy: reset attempts origin without global occupancy preflight</code>，另有 <code>safe: occupied origin produces a deterministic conflict policy</code>。
5. <code>legacy: positive path segment checks start but not end; negative segment performs no preflight</code>。
6. <code>safe: path spike checks every destination footprint cell and resolves player death before win</code>。
7. <code>legacy: a completed-goal / player-spike sequence preserves the source ordering (result before role-death check)</code>；此例应标注为控制流回归，而非已录制实机行为。

## 一手来源索引

- [官方固定提交](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)
- [GameBusiness：回合/环境/死亡顺序](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)
- [Role FSM：移动与 Dead 拆除时机](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)
- [Role Domain：缓动、Spike 检测和 UnSpawn](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)
- [Grid Utils：可走、Rain 滑行、Path 覆盖格](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs)
- [Pushable：Block / Goal / Gate 推入 Spike](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs)
- [Path Domain：移动 Spike 预检与携带](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)
- [Game result：Lose / Win 判定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs)
- [作者记录的出生点占用 bug](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/Bug.txt)
