# Oshi 旧项目静态分析与后续迭代建议

分析日期：2026-08-26  
静态快照：`D:\UnityProjects\Oshi`  远端：[`onovich/Oshi`](https://github.com/onovich/Oshi)  
HEAD：`a41dba58d2009bcf2c30e5012cfb2f5f059b44ff`（2024-05-26，`main` 与 `origin/main` 一致）  
Unity：`2022.3.7f1c1`（`ProjectSettings/ProjectVersion.txt`）

> 本文是静态研究，不启动 Unity、不打开 Unity Editor、不导入或运行项目。证据来自 C#、Unity 序列化 YAML、项目文档、提交历史和远端仓库页面。所有判断分为：**事实**、**高置信推断**、**低置信推断**、**未知**。

## 1. 先给结论

Oshi 最值得保留的核心不是“十几种机制”这个数量，而是下面这个组合：

> **玩家每次输入产生一个离散状态变化；随后环境回合按可预测顺序移动/复位危险物；所有多格实体都由实际 Cell 占位；玩家可以用 Undo 回到上一个逻辑状态。**

这套骨架已经比普通推箱原型更接近可形成独立身份的逻辑解谜游戏。它同时提供了三种可以做出高级关卡的资源：

1. **空间资源**：Block、Goal、Wall、Spike、Gate 都可以由多个格子组成，推理对象不是一个点而是一个 footprint。
2. **时间资源**：玩家回合和环境回合分离，移动 Spike/Path 可以成为“每一步都会变化的约束”，而不是实时反应游戏。
3. **状态资源**：Spike 对 Block/Goal/Gate 的“复位”以及 Undo，让设计者可以制造“可犯错但可读、可逆、可验证”的结构。

我建议后续采用“聚焦重制”路线：先把 **多格实体 + 可预测环境回合 + Undo** 做成一套严谨的逻辑语言，再把 Gate 作为第二章机制，暂时不要继续扩展 Enemy、Boss、RPG、潜行、三消、磁铁、蛇等大系统。原因不是这些想法没有趣味，而是它们会在当前状态模型尚未稳定时同时扩大搜索空间、教学成本和验证成本。

## 2. 分析边界与项目快照

### 2.1 仓库与可复现信息

| 项目 | 事实 |
|---|---|
| 本地路径 | `D:\UnityProjects\Oshi`，已存在；不是本次新建的副本 |
| Git 远端 | `git@github.com:onovich/Oshi.git`，与用户给出的仓库一致 |
| 工作树 | `main...origin/main`，静态阅读前无未提交改动 |
| HEAD | `a41dba5`：`<doc> check: BUG` |
| 最后提交 | 2024-05-26；仓库当前主线之后没有新的本地提交可供分析 |
| Unity | `2022.3.7f1c1` |
| 代码规模 | `Assets`（排除 Sirenix/TextMesh Pro 等第三方内容）约 141 个 C# 文件、约 7,982 行 |
| 主要依赖 | Addressables 1.21.20、URP 14.0.9、TextMesh Pro 3.0.8、Tri-Inspector、GameFunctions、Loom、LitIO、Capsule、Swing、Prism、Vista |
| 仓库公开描述 | README 将它称为 “A Sokobanlike Game In Development”，并说项目叠加了十几种机制，但仍在开发中 |

入口证据：[`README.md`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/README.md)、[`ProjectVersion.txt`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/ProjectSettings/ProjectVersion.txt)、[`Packages/manifest.json`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Packages/manifest.json)。

### 2.2 静态分析没有做的事

- 没有启动 Unity、没有执行场景、没有验证运行时画面或实际关卡可解性。
- 没有安装/解析外部 Git 包，也没有假设包内行为；这里只使用项目调用它们的接口作为架构证据。
- 没有把 Git 历史中的旧代码当作当前实现；历史只用来还原设计意图和演化顺序。
- 资产中的 PNG、材质、音频只按引用关系和命名分析，没有进行视觉/听觉审美判断。
- 没有穷举证明某种机制在全世界没有出现过；“创新”只表示在 Oshi 的代码/文档语境中有清晰的独特组合，或尚未完成的设计方向。

## 3. 设计思路还原

### 3.1 玩家看到的游戏循环

**事实**：`Main` 负责注入输入、UI、VFX、相机、声音、Addressables 和数据库上下文，然后由 `GameBusiness.Tick` 驱动整个游戏。`GameFSMComponent` 定义了 `NotInGame → FadingIn → PlayerTurn → EnvirTurn → MapOver/FadingOut/GameOver` 状态。

核心顺序可以还原为：

```text
读取输入
  ↓
PlayerTurn：Role 尝试走一格/滑行一段，必要时推动一个实体
  ↓（移动动画完成）
EnvirTurn：Block/Goal/Gate 检查 Spike 复位；Path 移动；Path 携带 Traveler
  ↓
检查玩家死亡、限时/步数、所有非 Fake Block 是否都在目标上
  ↓
进入下一次 PlayerTurn，或进入 Win/Lose 的过渡状态
```

代码证据：[`GameBusiness.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)、[`GameFSMComponent.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Entities_Game/Game/GameFSMComponent.cs)、[`GameGameDomain.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Domains/GameGameDomain.cs)。

**高置信推断**：你当时真正想做的是“有动画表现的离散回合制推箱”，而不是把实时动作游戏加上箱子。Path 虽然用 easing 动画移动，但它只在 EnvirTurn 结算；Undo 也以回合状态为单位。这使得 Oshi 可以把移动刺、雨天、传送门等机制纳入严肃的逻辑推理。

### 3.2 空间模型：每个实体真正占有 Cell

**事实**：`ShapeTM` 存储 `sizeInt` 和实际 `cells`；Block、Wall、Goal、Spike、Gate 生成各自的 `ShapeModel` 和 `CellMod`。各 Repository 同时保存“实体索引”和“每个 Cell 坐标到实体”的映射。

```text
Template（ScriptableObject）
  ShapeTM：[(0,0), (1,0), ...]
       ↓ GameFactory / Game*Domain
Runtime Entity + CellSlotComponent
       ↓
Repository.posMap：每个被占用格 → 对应实体
```

这不是仅仅改变美术尺寸。`GridUtils_Pushable.CheckBlockPushable` 会遍历 Block 的每个 Cell，检查推入后的 footprint 是否越界、撞墙、撞其他 Block、撞 Goal/Gate/Spike；`CheckAllInGoal` 也按每格检查目标匹配。

代码证据：[`ShapeTM.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Infra_Templates/Model/ShapeTM.cs)、[`GameFactory.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/GameFactory.cs)、[`GridUtils_Pushable.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs)、[`BlockRepository.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Repos/BlockRepository.cs)。

**高置信推断**：多格实体是 Oshi 最扎实的原创潜力。它能自然产生“不能只看箱子中心”“必须先为整个形状创造转身/停靠空间”“一个 Cell 先进入目标但整个实体仍未完成”等推理，而不是靠额外规则制造复杂度。

### 3.3 静态 Terrain 与动态 Cell 的拆分

**事实**：设计文档明确规定：静态 Wall/Spike/Goal 放进 Map 的 Tilemap/Terrain，动态 Wall/Spike/Goal 用 Cell 实体存进 Context；`MapEntity` 维护三套 Terrain 字典，运行时实体由各自 Repository 管理。

**高置信推断**：这个拆分是为了让关卡作者能快速铺大面积静态地形，同时保留动态物体的实体行为。它解决了“每个静态地面都要生成 GameObject”的工程问题，但代价是所有规则都要反复写成“动态实体或静态 Terrain”的并行判断。未来机制越多，这个边界越容易产生遗漏。

设计来源：当前 [`Assets/Document/设计.txt`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)、[`MapEntity.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2f5f059b44ff/Assets/Scripts_Runtime/Entities_Game/Map/MapEntity.cs)。

### 3.4 作者工具与关卡生产观

**事实**：`MapEditorEntity.Bake` 把场景中的 Spawn Point、Tilemap、Block、Wall、Goal、Spike、Path、Gate 烘焙为 `MapTM` 数组，并将 MapTM 标记为 Addressable。`MapEM` 负责把一组 MapTM 串成 `nextMapTypeID` 顺序。编辑器 Prefab 的命名已经写出了关卡课程：

```text
001 FirstClass
002 FirstTrick
003 SecondTrick
004 FirstPuzzle
005 SecondPuzzle
006 FirstRain
007 SecondRain
008 FirstBlood
009 SecondBlood
010 FirstError
011 SecondError
012 Windmill
013 Gate
```

**高置信推断**：你已经在用“先教学，再变式，再综合”的关卡章节思维，而不是随机堆关卡。命名中的 `First/Second` 和 `Trick/Puzzle/Rain/Blood/Error` 说明你希望每个新机制至少有第一次介绍和第二次运用。

证据：[`MapEditorEntity.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Modifier/MapEditorEntity.cs)、[`MapEM.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Modifier/EM/MapEM.cs)、[`Resources_Modifier/SpawnEM`](https://github.com/onovich/Oshi/tree/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Modifier/SpawnEM)。

## 4. 当前已实现的机制谱系

### 4.1 实现状态矩阵

| 机制 | 当前证据 | 状态 | 关卡价值 | 结论 |
|---|---|---|---|---|
| 单格/多格 Block、Wall、Goal、Spike、Gate | `ShapeTM`、各 Entity、各 Repository | 已实现 | footprint、空间规划、整体目标 | 应作为核心身份保留 |
| Role 推 Block | `GameRoleFSMController`、`GameRoleDomain` | 已实现 | 基础推箱语法 | 已有稳定骨架 |
| 静态 Terrain Wall/Goal/Spike | `MapEntity` + `MapTM` | 已实现 | 低成本绘制固定约束 | 需要统一查询层 |
| Spike 杀死 Role、复位 Block | `CheckAndApplyDead`、`CheckAndResetBlock` | 已实现 | 可读的失败/复位、路线规划 | 很适合配合 Undo |
| Spike 复位 Goal/Gate | `GameGoalDomain`、`GameGateDomain` | 已实现 | 把危险物变成“复位工具”或节奏门槛 | 需明确是否是惩罚还是机制 |
| Fake Block | `block.isFake`，通关时跳过 | 已实现 | 视觉障碍、华容道式腾挪 | 不能让它成为无提示的假信息 |
| 编号 Block/Goal | Spawn 数组中的 `number`，`CheckAllInGoal` 比对 | 已实现 | 目标分配、顺序、颜色/数字语义 | 可成为第二章逻辑语言 |
| 可推动 Goal | `goal.canPush` + `CheckGoalPushable` | 已实现 | 目标既是目的又是可移动障碍 | 雨天边界条件仍有已记录 Bug |
| Gate 传送 Role | `GameRoleDomain.ApplyEasingMove`、Gate Repository | 已实现 | 非局部空间、出口阻塞时推入口 | 适合后续独立章节 |
| Gate 推动 | `CheckGatePushable`：下一个 Gate 被阻塞时才可推 | 已实现 | “通道/物体状态”双重语义 | 当前规则必须用图示明确 |
| Rain：Role 滑行 | `WeatherType.Rain`、`TryGetLastWalkableGrid` | 已实现 | 把一次输入变成整段位移 | 需要先修规则说明/边界测试 |
| Rain：Block 滑行 | 设计文档列为未实现 | 未实现 | 会显著改变推理模型 | 先不要做，避免两套滑行语法同时出现 |
| Path 携带 Spike | `PathModel`、`GamePathDomain` | 已实现但只支持 Spike | 环境回合、可预测动态危险 | 应先做静态模拟器 |
| Path 携带 Block/Goal/Wall | 编辑器 API 能选择这些类型，但运行逻辑只处理 Spike | 半实现 | 可产生移动墙/移动箱 | 当前应标为不可用，而不是隐藏支持 |
| Undo | `GameRecordDomain`、`RecordModel`、Z 键 | 已实现 | 允许实验，扩大可设计空间 | 应升级为完整逻辑快照 |
| Enemy/Boss | 只有 `EnemyTM`/`BossTM` 空壳和 `AllyStatus` 等枚举 | 未实现 | 追逐、互相摧毁、视线 | 暂不投入，成本远高于当前收益 |
| 扫雷式 Cell 爆炸/Block 裁剪 | 仅在历史设计文档出现，当前无代码 | 概念阶段 | 真正有 Oshi 特色的形状变化 | 可作为第三章候选，但需先做纸面规则 |
| 单局内天气变化 | 历史文档有想法，当前天气只在 NewGame 按 MapTM 设置 | 未实现 | 规则环境转换 | 不要在未定义事件模型前加入 |
| 多场景/镜像/多 Constraint | 历史文档有想法，当前只有一个 MapEntity 和一个 mapSize | 未实现 | 拓扑/空间折叠 | 适合大版本重制，不适合修补当前架构 |
| 点亮、按钮、磁铁、蛇、消失地面 | 仅头脑风暴 | 未实现 | 各自可成为独立游戏 | 应进入候选池，不应同时排进主线 |

当前设计文档把大量方向明确写成“未实现/头脑风暴”，这比代码里留下模糊残片更有价值：它让后续可以清楚区分原始愿景和已经验证过的内容。参见历史设计快照：[`4d177cd`](https://github.com/onovich/Oshi/blob/4d177cd/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)、[`6b53488`](https://github.com/onovich/Oshi/blob/6b53488/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)、[`e25221e`](https://github.com/onovich/Oshi/blob/e25221e/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)。

### 4.2 当前关卡数据透露的课程

从 `SO_Map_001` 到 `SO_Map_013` 的序列化数据可以静态读出以下结构：

| 关卡 | 数据事实 | 低风险的设计解读 |
|---|---|---|
| 001 `SAY HELLO` | 3×3，1 个单格 Block，1 个动态 Goal | 最小推箱语法；`FirstClass` 支持“第一次学习”解读 |
| 002 `EVERY BEGINNING IS EASY` | 3×5，1 Block、1 Goal、4 个 Terrain Wall | 把边界/墙引入一个仍然极小的空间 |
| 003 `WARM-UP EXERCISES` | 3 个单格 Block、3 个 Terrain Goal、8 个 Terrain Wall | 从单目标变成整体配置/顺序问题 |
| 004 `A LITTLE CONFUSED` | Block 使用三个 Cell 的不同形状，6 个 Terrain Goal | 第一次真正利用多格形状的 footprint |
| 005 `...REVERSE PARKING PRACTICE` | 3 个 Block、3 个动态 Goal，Block/Goal 数字为 1/2/3，形状有 L 型 | 编号匹配 + 进入目标的顺序/倒车感 |
| 006 `...RAINING...` | Rain，2 Blocks，2 Terrain Goal，1 Wall | 第一次把角色移动从“一格”改为滑行 |
| 007 `...FIGURE SKATER` | Rain，两个不同形状 Block，四格 Terrain Goal | 把滑行和多格形状组合 |
| 008 `FIRST BLOOD` | 1 个多格 Block、2 个 Terrain Spike、3 个 Terrain Goal | 第一次以 Spike 作为风险约束 |
| 009 `SECOND BLOOD` | 1 个动态 Spike，沿 8 点闭环 Path 移动 | 第一次让环境在回合后改变 |
| 010 `TIME TRAVELER` | 3 Blocks、静态 Spike/Goal，没有 Path | 名称与 Undo 的时间主题吻合，但资产本身不足以证明具体谜题意图 |
| 011 `CYBERPUNK` | 动态 Spike 沿两点 PingPong Path，2 Blocks | 再次使用移动危险，验证等待/预测而非单次教学 |
| 012 `WINDMILL` | 12 Blocks，4 个编号 Goal；`blockIsFakeArr` 表明大量 Block 是 Fake，四个真实 Block 的编号为 1–4 | 用大量视觉实体隐藏少数真正目标，形成“识别 + 匹配 + 空间腾挪”综合关 |
| 013 `...PORTAL...` | Rain，3 Blocks（含 Fake）、2 个可推动 Goal、1 Spike、2 个互联 Gate、Spike Path | 当前主线的机制综合/终局候选；同时承担 Gate、Rain、Fake、Pushable Goal、Moving Spike |

**事实**：`MapEM` 会根据数组顺序写入下一关，当前正式路线是 `1 → 2 → 6 → 3 → 4 → 5 → 7 → 8 → 9 → 10 → 11 → 12 → 13`，而不是数字排序。  
**高置信推断**：路线先插入 Rain（2 后到 6），再回到普通推箱和多格，说明你试图让新规则先单独出现，再在后面组合，而不是把编号当作唯一章节顺序。  
**低置信推断**：`TIME TRAVELER` 可能意在介绍 Undo；因为当前 MapTM 没有时间实体，不能把这个解释写成事实。

证据：[`MapTM.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Infra_Templates/Model/MapTM.cs)、[`MapEM.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30b44ff/Assets/Scripts_Modifier/EM/MapEM.cs)、[`Templates_Runtime/Map`](https://github.com/onovich/Oshi/tree/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Map)。

## 5. 真正有潜力的创新点

### 5.1 “Cell 是逻辑实体”而不只是美术拼块

**事实**：所有多格对象都被拆成 Cell，Repository 按 Cell 坐标索引；推送、占用、目标检测、Spike 检测都遍历实际 Cell。  
**高置信推断**：这已经形成一个可扩展的“多格逻辑语法”，比在单格箱子上不断叠加颜色规则更有深度。

能产生的关卡问题：

- 一个 L 型 Block 的凹口是否能容纳另一个对象，而不是只问“中心格能不能进”。
- 目标区域是否必须连续、是否允许同一个多格 Goal 与多个实体错位覆盖。
- 一个移动方向可能让形状的某一格进入合法位置，但另一格撞墙；玩家要学会把整个 footprint 当作一个刚体。
- 如果未来真的做“Cell 裁剪”，裁剪应该改变实体形状状态，而不是简单把 Sprite 隐藏掉。

设计建议：把多格规则写成正式的“形状公理”：平移不旋转、哪些形状可转、形状变化是否消耗环境回合、目标按 Cell 还是按实体判断。没有公理之前，不要加入更多形状。

### 5.2 玩家回合/环境回合 + 可预测移动危险

**事实**：`EnvirTurn` 先处理复位，再推进 Path，再携带 Traveler；Path 目前实际只对 Spike 实现。  
**高置信推断**：这是 Oshi 最适合发展成 Jonathan Blow 式“发现规则—验证规则—组合规则”的部分。移动 Spike 若节点、方向、速度和回合结算全部可见，就可以让玩家推理一个有限状态机，而不是靠反应速度躲避。

必须坚持的边界：

- 每次环境动作只发生一次，或者明确规定一次输入会推进多少个 Path 节点。
- Path 节点、当前方向、下一次环境位置在关卡中可见或可由规则稳定推导。
- 环境移动不能依赖帧率；逻辑位置与动画位置分离。
- Undo 必须把环境状态一起撤回，否则玩家无法把失败归因于自己的决策。

### 5.3 Spike 的“复位”而不是单纯销毁

**事实**：Role 遇 Spike 进入 Dead；Block、Goal、Gate 遇 Spike 则回到 `originalPos`，触发 VFX 和相机震动。  
**高置信推断**：这可以成为 Oshi 的独特语义：危险物不是单纯“禁止进入”，而是一个会把对象送回起点的状态变换器。它允许做“先把箱子推过危险区，再利用复位改变可达性”的关卡。

风险：当前复位点被占用时会重叠；`Assets/Document/Bug.txt` 已记录这个问题。若保留复位机制，必须先确定复位的数学语义：

```text
失败动作 = 该实体回到原位？
         = 整个关联组回到上一个合法状态？
         = 实体进入暂存区，等待起点释放？
```

推荐使用第三种或完整回合回退，不要让“复位”产生未定义的重叠。

### 5.4 可推动 Goal、编号匹配和 Fake Block 的组合

**事实**：Goal 可以由关卡 SpawnTM 决定 `canPush`；Block/Goal 可有编号；Fake Block 在通关检查中跳过。  
**高置信推断**：这组机制能表达“目标同时是道路上的物体”“目标身份必须匹配”“视觉上的箱子不一定是任务箱子”，其逻辑密度高于单纯增加敌人。

推荐的语义分层：

- 普通 Goal：静态目的地，不能推。
- Pushable Goal：可移动的地形/家具，只有在特定条件下成为最终目标。
- Numbered Goal：只接受同号 Block；颜色只做辅助表达，数字/符号才是逻辑信息。
- Fake Block：明确用材质或形状表达“不会计入完成”，不要作为突然反转。

### 5.5 Gate 的非局部空间 + 条件性推动

**事实**：Role 走入未阻塞 Gate 后会继续向对应 Gate 传送；当下一个 Gate 的前方不可用时，入口 Gate 可以作为被推动对象。当前设计文档历史版本还明确写过“入口不可推、出口可推、出口被堵死时入口可推、入口/出口表现层用遮罩”。  
**高置信推断**：Gate 不是普通传送门，它把“位置”与“通道状态”绑定：同一个入口在不同出口状态下可能是传送点，也可能是可推动障碍。这是很强的逻辑机制，但必须让玩家看懂“为什么现在 Gate 能推”。

证据：[`GameRoleDomain.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs)、[`GridUtils_Movable.cs`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Movable.cs)、[`a89898a`](https://github.com/onovich/Oshi/blob/a89898a/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)。

## 6. 未完成方向的取舍

### 6.1 适合近期做

1. **逻辑状态模型与 Undo 重构**：这是所有后续机制的地基。
2. **移动 Spike 的正式关卡语言**：现有代码和关卡已经有最小闭环。
3. **多格实体的形状验证器**：让所有形状/目标/墙体组合在导入时可检查。
4. **Gate 独立章节**：先只允许 Role 传送，Gate 自身的条件推动作为后半段变式。
5. **编号 Goal 的生产规则**：明确一号一目标、是否允许未编号目标、目标覆盖/重叠如何判定。

### 6.2 适合后续原型，不应直接并入主线

- **Cell 裁剪/扫雷**：这是最有原始文档证据的潜在独特机制，但它要求形状可变、Cell 生命状态和 Undo 完整一致。先做纸面/纯 C# 原型。
- **单局内天气转换**：有设计意图，但需要事件/规则层；不要继续把 `Map.weatherType` 当作全局静态字段硬改。
- **多场景/镜像/数组 Constraint**：可形成空间拓扑创新，但需要把地图从单一矩形边界提升为多个局部坐标域。

### 6.3 建议暂缓或删除出第一版范围

- Enemy、Boss、视线、攻击和 AI。
- 三消、合成、RPG、潜行、蛇、磁铁、消失地面、打雷等与推箱核心无直接共用状态语言的系统。

这些不是永远不能做，而是它们会把 Oshi 从“可验证的逻辑系统”推向“多个游戏原型的集合”。在当前没有 headless solver、没有单元测试、没有统一规则层的前提下，同时扩展它们会使每个关卡的失败原因不可诊断。

## 7. 当前技术/设计瓶颈

### 7.1 必须优先处理的状态一致性

**事实**：实体的可见位置在 `Transform`，占用查询在 Repository 的 `posMap`；移动动画过程中 Repository 通常仍保留回合开始位置，直到移动完成才更新。  
**高置信推断**：这是“有动画的离散逻辑”目前最大的耦合点。它让环境阶段可以避免读取中间位置，但 Path、Teleport、Undo、Spike 检测一旦跨阶段，就容易出现表现位置和逻辑位置不一致。

建议：建立纯数据的 `LogicalState`：

```text
LogicalState
  role position / step / moving-or-not
  block: id, shape, position, fake, number
  goal/gate/spike positions and state
  path: current node, direction, phase
  weather / switches / map-local flags
```

先在逻辑状态上执行 `ApplyPlayerAction`、`ApplyEnvironmentTurn`、`Undo` 和 `IsSolved`，Unity Transform 只负责把状态插值显示出来。这样才能写求解器和自动验证器。

### 7.2 Undo 不是完整快照

**事实**：`RecordModel` 记录 Role、Block、Gate、Goal、Spike 坐标；Undo 另外尝试回退 Path 索引，但没有记录天气、Path 的完整方向/节点状态、实体是否处于动画/传送中、角色 step、未来的开关或形状状态。

**高置信推断**：当前 Undo 对已有几个关卡可工作，但每加一种状态变量就会出现“玩家按 Z 后只回了一半”的风险。`git log` 中已经出现多次 Undo/传送/路径相关修复，说明它是高频维护点：[`d233ddf`](https://github.com/onovich/Oshi/commit/d233ddf)、[`384ecf7`](https://github.com/onovich/Oshi/commit/384ecf7)、[`24f48a5`](https://github.com/onovich/Oshi/commit/24f48a5)、[`f7cc7aa`](https://github.com/onovich/Oshi/commit/f7cc7aa)。

建议：Undo 只允许发生在逻辑回合边界；每次快照包含所有会影响未来可达性的变量。不要在正在移动或正在传送时“尽量恢复”。

### 7.3 规则查询已开始分叉

**事实**：`GridUtils_Has`、`GridUtils_Pushable`、`GridUtils_Movable` 同时判断动态实体和 Terrain，并包含正常移动、推送、雨天滑行、Gate 阻塞等多套条件。当前 `HasNoPropButGoal` 的布尔表达式还存在 `&&`/`||` 优先级容易误读的问题；`GridUtils_Constraint.CheckConstraint` 对 `constraintCenter` 的计算也值得重新核对，当前地图大多以原点为中心，可能暂时掩盖了问题。

建议：把规则拆为可测试的纯函数：

- `FootprintAt(entity, position)`
- `CellOccupancy(position)`：wall/block/goal/gate/spike/terrain 的统一层
- `CanEnter(action)`
- `CanPush(entity, direction)`
- `EnvironmentTransition(state)`
- `ResetByHazard(state, entity)`

每个函数用 1×1、L 型、凹型、边界、叠加 Goal、Spike、Gate 做表驱动测试。先修正语义，再修代码风格。

### 7.4 编辑器烘焙缺少静态验证

**事实**：`MapEditorEntity` 主要把数组写入 MapTM；它没有看到针对“数组长度相同”“索引唯一”“实体初始重叠”“Gate 引用目标存在”“Path Traveler 类型在运行时受支持”“至少一个非 Fake Block 对应可达 Goal”的完整验证。

建议在 Bake 后新增一个不依赖 Unity 运行的 Validator，至少检查：

- 所有实体 footprint 不越界、不与不可重叠对象冲突。
- `blockIndexArr`、位置、数字、Fake 标记长度一致。
- Goal 的数量/编号与非 Fake Block 的可完成性一致。
- Gate next index 存在且不是自身，Path traveler 在运行时确实有实现。
- 每个动态 Spike 的 Path 节点都在边界内，回合移动不会无声越界。
- 地图有至少一个角色出生点，且出生点不是 Wall/Terrain Wall。
- 用静态 BFS/反向推送检查至少存在一条候选解；复杂机制再交给完整求解器。

### 7.5 “机制数量”正在超过“规则语言”

**事实**：README 说有十几种机制；设计文档先后列出敌人、Boss、潜行、三消、合成、扫雷裁剪、天气变化、点亮、按钮、多场景、磁铁、蛇等，但真正进入主线的实现只有其中一部分。

**高置信推断**：未完成的主要原因更可能是范围和验证成本，而不是缺少想法。当前每新增一个机制，都要同时回答：它如何进入 Cell/Repository、何时在 Player/Environment Turn 生效、如何被 Undo、如何被 MapTM 烘焙、如何教学和自动验证。若没有一个统一规则层，内容量会指数级增加。

## 8. 三条后续迭代路线

### 路线 A：保守完成原始愿景

**核心承诺**：把现有 001–013 主线做成稳定、可发布的多机制推箱。

**保留**：多格实体、Terrain、编号目标、Fake、Rain、Moving Spike、Gate、Undo。  
**删减**：Enemy/Boss、三消/合成、RPG、点亮、蛇、磁铁。  
**技术切片**：统一 LogicalState → 回合快照 → 关卡 Validator → 重做 001–013 → 做 Gate 章。  
**风险**：机制较多但主题可能分散；旧架构迁移成本不低。  
**验证关卡**：每个机制 2 关，最终一关只组合此前已经独立教学过的两种机制，不超过三种。

适合目标：想把旧项目尽快变成一个完整小作品。  
不适合目标：想追求非常纯粹的“每一关都围绕一个深洞察”的解谜标准。

### 路线 B：聚焦最强创新点（推荐）

**核心承诺**：Oshi 是“可回退的回合制多格推箱”：玩家安排空间，环境按可预测路径改变状态，Undo 让玩家研究而不是受罚。

**保留**：多格 Block/Goal、Spike 复位、移动 Spike、完整 Undo；Gate 延后到第二章。  
**删减**：第一版不做 Enemy/Boss、Rain Block、动态天气、形状旋转、所有非确定性系统。  
**技术切片**：

1. 用纯逻辑状态重写 1×1 推箱。
2. 加入三格 L 型 footprint。
3. 加入 Spike 复位，定义复位冲突规则。
4. 加入一个有可见 Node 的 Moving Spike。
5. 加入完整 Undo/重做和求解器。
6. 用 12–18 关重新编排教学。

**风险**：需要接受“少机制、深关卡”的产品取向；不能用大量视觉效果掩盖关卡洞察不足。  
**验证关卡**：每个新机制先做 3 关——纯教学、一次变式、与旧机制组合；如果第三关仍只能靠试错，不进入主线。

### 路线 C：忠于原始基因的大胆扩展

**核心承诺**：把“Cell 会改变形状/状态”做成 Oshi 的核心世界观。

候选主机制：Block 的某些 Cell 在满足确定性条件时被 Spike/雷区裁剪，实体从 L 型变成残片；残片可以重新组合或被目标吸收。历史设计文档明确写过“利用扫雷机制，当组合的 Block 揭示必有雷时，把 Cell 爆掉，利用这一点进行 Block 裁剪”。

**保留**：Cell、形状、回合、Undo、编号目标。  
**删减**：Rain、Gate、Enemy/Boss 先全部移除。  
**技术切片**：先做纯数据的形状变化与目标检查，再做一个“固定雷区 + 只允许一种裁剪”的 5 关 demo；不要一开始实现完整扫雷。  
**风险**：如果 Cell 裁剪触发条件不可见，玩家会认为是随机惩罚；如果每次形状变化都增加状态分支，求解难度会迅速失控。  
**验证关卡**：玩家必须能在动作前预测“下一次会失去哪一个 Cell”，且 Undo 能完整恢复形状、位置、编号和目标状态。

这条路线的原创潜力最高，但不应作为恢复旧项目的第一步；它更像 Oshi 2 或独立 Vertical Slice。

## 9. 推荐的关卡设计骨架

下面是基于当前规则的原创草案，不是对仓库已有关卡的复刻。符号约定：`R`=Role，`B`=普通 Block，`b`=多格 Block 的 Cell，`G`=Goal，`#`=Wall，`^`=Spike，`*`=Moving Spike Path 节点，`o`/`O`=一对 Gate。图只表达逻辑关系，实际尺寸和坐标需由 Validator 重建。

### 9.1 关卡一：整体 footprint 先于中心格

目标：只教会“L 型 Block 的三个 Cell 必须同时合法”，不引入移动危险。

```text
#######
#R...##
#..B..#       B = (0,1),(1,1),(1,0)
#..GG.#       G 区是一个可容纳三格形状的静态目标区
#..#..#
#.....#
#######
```

设计假设：玩家会从“把中心推到目标”转向“为整个形状寻找进入方向”。  
错误路径：看似中心进入目标，但 L 的凸出 Cell 被 `#` 卡住；失败原因必须可从图上预见。  
验证：提供一个镜像变式，让同一个洞察在另一侧成立；不要依赖更多墙来制造随机死锁。

### 9.2 关卡二：移动 Spike 是环境定理，而不是反应测试

目标：教学 PlayerTurn → EnvirTurn 的顺序，以及“每次玩家动作后 Spike 前进一节点”。

```text
#########
#R..B...#
#..*--*-#   *--* 是可见的两/三节点路径
#...^..G#   ^ 是静态 Spike，G 是目标区
#.......#
#########
```

设计假设：玩家先让 Block 停在一个安全位置，再利用环境回合改变 Moving Spike 的位置。  
关键要求：节点、当前方向、下一格都可见；不能要求玩家用动画速度估算。  
组合变式：把 Moving Spike 只用于“暂时封路”，而不是直接杀死 Role；玩家要等待/安排一个安全的环境状态。  
验证：Undo 一次必须同时恢复 Role、Block、Spike 当前节点和方向。

### 9.3 关卡三：复位危险物是空间操作

目标：让玩家发现 Spike 对 Block 的作用是“回到出生点”，而不是普通死亡。

```text
########
#R..B..#
#..##^G#
#..B...#   下方 B 是另一个需要先清开的 Block
#......#
########
```

设计假设：玩家先把上方 Block 推到 Spike，观察它回到原位，获得一个可重复的空间变换；随后必须先移动下方 Block，才能让复位后的 Block 不与别的实体重叠。  
必须明确：如果复位点被占用，关卡应判定为不可执行、进入暂存区，或直接回到上一个逻辑快照；不能产生重叠。  
验证：做一个不需要 Undo 的版本，再做一个必须 Undo 才能比较两条路线的版本；这样可以区分“机制理解”和“回退便利”。

### 9.4 关卡四：编号目标是分配问题，不是颜色记忆

目标：利用 Oshi 已实现的数字匹配，让玩家推断先后顺序。

```text
#########
#R..1B..#   B=1
#..2...G#   G=2
#...B...#   B=2（位置故意靠近另一目标）
#G...1..#
#########
```

这里 `1/2` 只是逻辑标记；实际关卡应把相同编号用清晰但不依赖颜色的符号表示。  
关键洞察：先放入会堵住通道的目标，再处理需要绕行的目标；如果玩家只按最近距离匹配，会得到一个可解释的错误分支。  
验证：所有目标的编号必须在地图资产和 Validator 中一致，禁止“目标看起来对但运行时按 Terrain 忽略编号”的双重语义。

### 9.5 Gate 章节终局：传送与推动的同一对象

目标：教学 Gate 在出口通畅时是传送关系，在出口被堵时是可推动实体。

```text
##########
#R..o....#    o = 入口
#...#..B.#
#....O.G.#    O = 出口，B 暂时堵住出口前方
#........#
##########
```

先做两个独立关卡：

1. 出口畅通：玩家只观察传送方向和落点。
2. 出口被 Block/Wall 阻塞：玩家发现 Gate 变为可推物体。

最后才组合二者。Gate 的可推条件必须有稳定视觉表达；否则玩家会把行为差异当作 Bug，而不是规则发现。

## 10. 下一步实现顺序（下一次打开 Unity 之前）

### 阶段 0：不动 Unity 的逻辑验证

1. 用一个独立的纯 C# 或其他可执行的最小状态模型实现 1×1 Block 推送、目标检查、Spike 复位和 Undo。
2. 把 `SO_Map_001`、`005`、`009`、`013` 的必要数据静态导出为测试输入；不加载 Unity Asset API。
3. 写状态不变量：实体 footprint 不重叠、所有坐标在约束内、每个 Repository 映射可重建、Undo 后状态哈希一致。
4. 加一个最小 BFS 求解器，先只求 PlayerTurn；再加入一个固定 Moving Spike 的 EnvironmentTurn。
5. 验证 `Path` 的当前节点、方向和 ping-pong 边界；把每个回合的环境结果打印成文本。

### 阶段 1：重做 6 关 Vertical Slice

1. 单格基础关。
2. L 型 Block 关。
3. 多格 Block + 多格 Goal 关。
4. Spike 复位关。
5. Moving Spike 关。
6. 上述机制的综合关。

每关都要保存：最短解、所有等价解的差异、第一次新机制出现的动作、玩家最容易误判的状态、是否能从视觉判断死锁。

### 阶段 2：再决定 Gate 或 Cell 裁剪

- 如果多格 + 环境回合已经产生足够多的高质量关卡，Gate 作为后续章节。
- 如果多格形状仍只是“更大的箱子”，优先做 Cell 裁剪原型，而不是继续加门、敌人或天气。
- 如果没有办法为机制写出独立的求解器/验证器，就不要把它加入主线。

## 11. 事实/推断/未知清单

### 事实

- 仓库是 Unity 2022.3.7f1c1 的 Sokobanlike 项目，当前 HEAD 为 `a41dba5`。
- 项目有可运行的基础回合、推送、Goal、Spike、Rain、Path、Fake、编号、Pushable Goal、Gate、Undo 代码路径。
- MapTM 是数据驱动的关卡描述；MapEditorEntity 把场景编辑内容烘焙为 MapTM；MapEM 写入关卡顺序。
- Path 运行时只对 Spike 实现了移动检测/携带。
- Enemy、Boss、PortalTM、KeyTM、ButtonTM 等多数只是类型空壳或枚举，没有完整运行路径。
- `Assets/Document/设计.txt` 与 Git 历史明确记录了许多未完成机制和关卡意图。

### 高置信推断

- Oshi 的核心设计思路是“多格 Cell 逻辑 + 回合制环境变化 + 复位/Undo”，而不是单纯添加很多道具。
- 关卡顺序是有意组织的课程：FirstClass → Trick → Puzzle → Rain/Blood/Error → 综合关。
- 当前未完成的首要原因是机制范围超过了状态模型、Undo、编辑器验证和关卡生产能力，而不是缺少创意。
- 最有希望的复兴路线是收窄为一个有严格规则语言的逻辑解谜，而不是把所有历史头脑风暴都补齐。

### 低置信推断

- `TIME TRAVELER` 很可能是 Undo 主题关，但当前 MapTM 不能单独证明这一点。
- `WINDMILL` 可能把 12 个 Block 的环形布局用于旋转/风车式空间认知；能确定的是其数据使用了 12 个 Block、Fake 标记和 1–4 编号目标，不能从静态文件证明实际谜题体验。
- 某些动态 Goal/Gate 的行为可能在早期迭代中承担了你想要的“目标本身也是机关”角色，但需要运行体验或更多设计记录才能确认。

### 未知

- 当前所有正式关卡是否都可解、最短解是多少、是否存在不公平的死锁。
- 是否有尚未提交到仓库的 Unity 场景、设计笔记或外部关卡草稿。
- 外部包的具体版本行为是否会影响 Addressables、动画、存档或编辑器工具。
- 你当时对“扫雷裁剪”“动态天气”“镜像场景”的最终规则定义。

## 12. 参考来源

所有核心结论优先引用项目自身的一手资料：

- [Oshi README（项目自述）](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/README.md)
- [当前设计文档](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)
- [当前 Bug 文档](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Document/Bug.txt)
- [GameBusiness：玩家回合/环境回合主循环](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/GameBusiness.cs)
- [GameRoleFSMController：移动、推送、雨天路径](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Controllers/GameRoleFSMController.cs)
- [GameRecordDomain：Undo 快照和回退](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Domains/GameRecordDomain.cs)
- [GamePathDomain / PathModel：移动 Spike 与环境 Path](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Domains/GamePathDomain.cs)
- [MapTM：关卡数据结构](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Infra_Templates/Model/MapTM.cs)
- [MapEditorEntity：场景到 MapTM 的烘焙](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Modifier/MapEditorEntity.cs)
- [GridUtils_Pushable：多格实体推送条件](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs)
- [0.3.0：加入 Z Undo](https://github.com/onovich/Oshi/commit/d233ddf)
- [加入移动 Path](https://github.com/onovich/Oshi/commit/2fcce56)
- [加入 Rain 滑行](https://github.com/onovich/Oshi/commit/950af04)
- [加入编号匹配](https://github.com/onovich/Oshi/commit/7650d50)
- [加入 Gate/Portal 传送](https://github.com/onovich/Oshi/commit/f062efe)
- [历史设计文档：早期 Enemy/Boss/三消/合成等愿景](https://github.com/onovich/Oshi/blob/4d177cd/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)
- [历史设计文档：扫雷裁剪、点亮、多场景、动态天气等方向](https://github.com/onovich/Oshi/blob/f313bfc/Assets/Document/%E8%AE%BE%E8%AE%A1.txt)

