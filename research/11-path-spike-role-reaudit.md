# Oshi Path Spike 与角色：Map 011 严格源码复审

调研日期：2026-08-28  
官方核验版本：[Oshi `4afe6809aaef0894b5f27b543dff84b437bebb45`](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)  
本地审计副本：`D:\UnityProjects\Oshi`，提交 `a41dba58d2009bcf2c30e5012cfb2f5f059b44ff`。  

范围：只回答“Ping-pong Path Spike、角色碰刺、角色能否阻挡移动 Spike、Map 011”的问题；不修改 Web 实现。

## 结论先行

1. **角色与任何 Spike（Terrain 或动态 Spike）同格会死亡。** 这是作者的明确设计，也由移动许可和死亡检测两段代码共同实现；因此“玩家主动走进尖刺却不失败”不是原版规则。
2. **Path Spike 的设计意图是被角色阻挡。** `CheckSpikeMovable` 明确把 `roleRepo.Has(point)` 纳入否决条件。
3. **但原版的预检实现有确定缺陷，Map 011 的两个节点恰好会触发它。** 正向段不检查终点；负向段根本不检查。因此原版在“角色站在下一节点”时可能仍把 Spike 移进角色，随后死亡检测将角色标记为 Dead。
4. 作为“贴近作者 Path 预检意图”的 Web 方案，可以采用：**角色进入当前 Spike 格会失败；角色占据 Path Spike 的下一个覆盖格则 Spike 停在原地，不与角色重叠、不会因那次被阻挡的移动而失败。** 这实现作者写出的机制意图，修复的是原版的路径覆盖 bug，而不是把 Spike 改成无害物。该建议已被下方的产品决策覆盖，不是当前 Web Demo 的行为。

## Web Demo 实现决策（2026-08-28，覆盖上述建议）

用户明确选择了一个可预测但不同于原版作者预检意图的规则：

- Path Spike **不**把角色当作移动阻挡物；它会进入角色所在格。
- 任意 Spike 与角色重叠都会触发“死亡重置”：角色、Block、Goal、Gate、动态 Spike、Path 进度、步数、计时与 Undo 历史回到关卡初始状态，游戏继续处于 playing。
- 该死亡重置由独立实现承载，不调用手动 `restart`；以后两类重置可以自然分化。

因此本报告的原版源码结论仍有效，但第五节的“Web 安全规则”仅保留为源码对齐方案的记录，不能当作当前 Demo 的玩法说明。

## 证据等级与版本核验

- **已验证**：可由固定官方提交的源码或资源逐行直接推出。
- **控制流推断**：由这些已验证调用顺序组合得出，未把 Unity 编辑器实机录制当成证据。
- 本地副本落后官方 HEAD 一个文档提交；本报告逐项读取的 `GamePathDomain.cs`、`GameRoleDomain.cs`、`GridUtils.cs`、`PathModel.cs`、`SO_Map_011.asset` 与 `设计.txt` 均已逐文件按规范化换行与官方固定提交比对一致。因此本地行号可作为该官方版本的定位依据。

## 一、角色主动进入静态 / 动态 Spike：会死亡

### 意图规则

作者的设计稿在“已实现”列表中直接写明：`Spike 杀死 Role 和 Block`。动态与 Terrain 的 Spike 只是存储层不同，不是两种伤害语义。

- 本地：`D:\UnityProjects\Oshi\Assets\Document\设计.txt:3-15`
- 官方：[设计.txt:3-15](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt#L3-L15)

### 原始代码实际行为

`TryGetNextWalkableGrid` 把 Spike 列入**可进入**条件，而不是墙；因此角色可以开始走入 Spike。随后 `CheckAndApplyAllRoleDead` 对每个 Role 的所有 footprint cell 查询动态 Spike repository 和 Terrain Spike，命中即调用 `FSM_EnterDead()`。

- 可走性与 Spike 分支：本地 `...\Business_Game\Utils\GridUtils.cs:30-51`；官方：[GridUtils.cs:30-51](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs#L30-L51)
- 动态 / Terrain Spike 的统一查询：本地 `...\Business_Game\Utils\GridUtils_Has.cs:87-90`；官方：[GridUtils_Has.cs:87-90](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs#L87-L90)
- 死亡检查：本地 `...\Business_Game\Domains\GameRoleDomain.cs:178-203`；官方：[GameRoleDomain.cs:178-203](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs#L178-L203)
- 角色当前位置以 `RoundToVector2Int()` 从 Transform 取整：本地 `...\Entities_Game\Role\RoleEntity.cs:46-70`；官方：[RoleEntity.cs:46-70](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Role/RoleEntity.cs#L46-L70)

所以“可进入”不等于“安全”：原作是允许移动动画进入，再按帧取整采样并死亡。Web 采用一次回合原子结算可以更确定地表达为“走进当前 Spike 格即失败”，但不应把这一点删掉。

## 二、Path Spike 是否会被角色挡住

### 意图规则：会

每个环境回合，Path 在推进前调用 `CheckTravelerMovable`。针对 Spike traveler，`CheckSpikeMovable` 逐候选点否决其它 Spike、Block、Wall、**Role**、Terrain Wall 和 Terrain Spike；这里的 `!ctx.roleRepo.Has(point)` 是直接、无歧义的角色阻挡意图。

- 预检与 Role 分支：本地 `...\Business_Game\Domains\GamePathDomain.cs:33-86`；官方：[GamePathDomain.cs:33-86](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L33-L86)
- Role repository 是基于离散坐标的占用表：本地 `...\Business_Game\Repos\RoleRepository.cs:19-35`；官方：[RoleRepository.cs:19-35](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Repos/RoleRepository.cs#L19-L35)

若预检失败，`ApplyMoving` 以 `isEnd = true` 返回而**不**调用 `PushIndexToNext()`；接着 `CarrySpike` 只会把 Spike 保持在已有的 `pathCarPos`。这说明暂停而非穿透才是该分支的预期语义。

- 未推进 node index 的分支：本地 `...\Business_Game\Domains\GamePathDomain.cs:33-43`；官方：[GamePathDomain.cs:33-43](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L33-L43)
- Carry 写回 Spike 位置：本地 `...\Business_Game\Domains\GamePathDomain.cs:88-108`；官方：[GamePathDomain.cs:88-108](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L88-L108)

### 原始代码实际行为：终点与负向段没有被可靠预检

预检先让 `GridUtils.GetPathCoveredGrid(start, end, temp)` 生成候选格，再仅遍历 `[0, count)`。该函数的实现存在三个机械问题：

| 段 | `GetPathCoveredGrid` 的返回 | 实际后果 |
| --- | --- | --- |
| 正向相邻 `(1,0)` / `(0,1)` | 只有起点；终点被排除 | 角色站在**下一节点**时，预检看不到它。 |
| 任意负向轴向段 | `count` 为负；调用方循环零次 | 完全没有预检。 |
| 斜向 / 多格段 | x、y 两轮写同一临时数组，且不包含最终 endpoint | 既不是完整 segment，也没有按 Spike 自身 footprint 展开。 |

- 覆盖格函数：本地 `...\Business_Game\Utils\GridUtils.cs:19-28`；官方：[GridUtils.cs:19-28](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs#L19-L28)
- 调用方只检查 `i < count`：本地 `...\Business_Game\Domains\GamePathDomain.cs:57-63`；官方：[GamePathDomain.cs:57-63](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs#L57-L63)

这是**源码实际 bug**，不是可以从设计稿推导出的机制。它也解释了“本应站在下一节点挡住 Spike，却被 Spike 撞到并失败”的现象。

### 为什么会变成失败

环境回合先执行 Path 的移动与 `CarrySpike`，随后才统一执行 Role 的死亡检查。因此一旦上述预检漏洞让 Spike 更新到角色的离散坐标，`CheckAndApplyAllRoleDead` 在同一 `PreTick` 尾部就会将角色置为 Dead。

- 环境顺序（Block → Gate → Goal → Path → Carry）及死亡检查的位置：本地 `...\Business_Game\GameBusiness.cs:91-155`；官方：[GameBusiness.cs:91-155](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs#L91-L155)

严格说，原版并不是“角色碰尖刺不死”；而是“**Path 本应先被角色挡住，但覆盖预检写错时，Spike 仍会撞到角色；碰撞当然仍然致死**”。

## 三、Ping-pong 正向 / 负向的精确影响

`PathModel` 初始 `nodeIndexDir = 1`。到达 Ping-pong 末端时，`ClampIndex` 把下一 index 反射到倒数第二个节点，并把方向改成 `-1`；到达起点外侧时同理改回 `+1`。

- 初始方向、路径位置与缓动：本地 `...\Entities_Game\Path\PathModel.cs:43-45, 75-108`；官方：[PathModel.cs:43-45](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs#L43-L108)
- Ping-pong 反射：本地 `...\Entities_Game\Path\PathModel.cs:115-153`；官方：[PathModel.cs:115-153](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs#L115-L153)

对两个节点 `A → B` 的 Ping-pong Path：

1. `A → B` 是正向相邻段，原始预检仅检查 `A`，漏 `B`。
2. `B → A` 的方向变为负，`count = -1`，预检循环一次也不执行。

因此双节点 Ping-pong 的**两个方向都无法保证角色阻挡**。这不是推测，而是上述函数对 `(+1,0)` 与 `(-1,0)` 的直接代入结果。

## 四、官方 Map 011 的实际配置

`SO_Map_011.asset` 是 type 11、`4 × 5` 的 clear-weather 地图，不是当前 Web 的简化教学地图。

| 配置 | 官方 Map 011 的值 | 证据 |
| --- | --- | --- |
| Owner spawn | `(-1, 1)` | asset `:24-26` |
| 动态 Spike | index `1`，初始 `(-2, -1)` | asset `:44-48` |
| Path traveler | `EntityType.Spike (4)`，traveler index `1` | asset `:53-61`；[EntityType.cs:3-11](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Common/Enum/EntityType.cs#L3-L11) |
| Path nodes | `(-2, -1) → (-1, -1)` | asset `:57-59` |
| Loop mode | circle `false`，ping-pong `true` | asset `:62-63` |
| Path motion duration | `0.2` 秒 | [SO_Path_001.asset:15-21](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Path/SO_Path_001.asset#L15-L21) |
| 目标层 | `(-1,-1)` 是 Terrain Goal；此外另有三格 Terrain Goal | asset `:80-89` |
| Blocks | 一个 L 形 `SO_Block_005` 锚点 `(-1,-1)`，一个单格 `SO_Block_006` 锚点 `(0,1)` | asset `:27-35`；[Shape 005](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Shape/TM_Shape_005.asset#L15-L19)、[Shape 006](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Shape/TM_Shape_006.asset#L15-L17) |

- 本地 asset：`D:\UnityProjects\Oshi\Assets\Templates_Runtime\Map\SO_Map_011.asset:15-89`
- 官方：[SO_Map_011.asset:15-89](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map/SO_Map_011.asset#L15-L89)

所以 Map 011 的 Path 是恰好触发上述两类预检漏洞的二节点横向 Ping-pong：初始 `(-2,-1) → (-1,-1)` 漏终点，反向 `(-1,-1) → (-2,-1)` 又完全漏检。当前 Web `path-pingpong-11` 是另行设计的 `4 × 3` 教学关，不是此官方地图的逐格复制；如果它声称“角色站到下一节点时会挡住 Spike”，则应表现作者意图而不是继承 Map 011 的实现漏洞。

**控制流 / 配置推断（高置信）：** 把 L 形 Block 005 从其初始锚点 `(-1,-1)` 平移到 `(-1,-2)`，其 footprint 恰覆盖 `(-1,-1)`、`(0,-1)`、`(0,-2)` 三个 Terrain Goal；余下单格 Block 的匹配 Goal 是 `(-1,2)`。这会使已完成的 L Block 占据 Spike 的右端 node `(-1,-1)`。结合 `CheckSpikeMovable` 的 Block 否决分支，Map 011 的策划明显依赖“可用角色 / Block 停住 Path Spike”，而非让 Path Spike 穿透占用物。

## 五、建议 Web 安全规则（源码对齐选项；已被当前产品决策覆盖）

| 规则 | 建议行为 | 与原版的关系 |
| --- | --- | --- |
| 角色主动进入当前 Spike footprint | 失败 | 保留设计稿与死亡检测的危险语义。 |
| Path Spike 计划进入角色 footprint | Path 停在当前 node；不提交 path index / direction；角色不死 | 实现 `CheckSpikeMovable` 的明确阻挡意图，修复 endpoint / negative 覆盖漏洞。 |
| Path 行进预检 | 枚举从下一 cell 到终点的完整 segment，正反方向一致；对移动 Spike 的每个 shape cell 做检查 | 修复 `GetPathCoveredGrid` 的方向、终点和多格问题。 |
| 成功移动 Path 后 | 保留一次防御性 Spike-vs-player 检查 | 防止未来异步/动画状态产生非法重叠；正常规则下不应命中。 |
| 教学文案 | 明写“进入尖刺当前格会失败；占据它**下一步会进入的格**则令它停住。” | 避免把“阻挡移动尖刺”误读成“尖刺无伤害”。 |

建议对应的公共 TDD 合同：

1. `player entering a stationary terrain or dynamic spike loses`。
2. `path spike pauses before a player at its positive-direction endpoint`。
3. `path spike pauses before a player at its negative-direction endpoint`。
4. `a paused ping-pong path does not advance its node or flip its direction`。
5. `a path spike checks every swept footprint cell for multi-cell travelers`。

这些用例应标为 `safe` / `intended`；如果日后需要考古复刻 raw Unity bug，再独立标为 `legacy`，不要让一个默认规则同时代表两者。

## 一手来源索引

- [官方固定提交](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)
- [设计稿](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)
- [Path 预检与移动](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)
- [Path 覆盖格函数与可走 Spike](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils.cs)
- [角色死亡检测](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)
- [环境回合顺序](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)
- [Ping-pong Path 状态机](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Path/PathModel.cs)
- [Map 011](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map/SO_Map_011.asset)
