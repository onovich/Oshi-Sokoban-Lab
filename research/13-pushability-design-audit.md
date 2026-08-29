# Oshi：以「何时可推」为核心的机制审计

调研日期：2026-08-29
范围：本地原版源码 `D:\UnityProjects\Oshi` 与当前 Web 规则核；不修改游戏规则或关卡。原版公开核验基线为 [Oshi `4afe6809aaef0894b5f27b543dff84b437bebb45`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)。

## 结论

“可不可以推”不应被当成每种图标各自背一条例外，而应成为一条统一的关卡语法：**角色面对一个物件时，盘面状态决定它现在是硬障碍、可推物、可穿过的地面、传送入口，还是一次会触发回位的状态转换。**

最适合优先生产的不是 Path Spike，而是下面四级可读、静态可推演的条件：

1. **整块占格是否放得下。** Block / Fake Block 的每一个格都必须能前移；这是最基础的“空间许可”。
2. **物件是否切换了模式。** 可推动 Goal 在前方可放下时是可推物，放不下时反而可穿过；这是“物件 / 地面”的状态切换。
3. **远处条件是否改变眼前物件。** Gate 出口可通时是通道；出口沿入射方向受阻时，入口才成为可推物；这是“远端许可”。
4. **允许前移是否仍会改变状态。** Block / Goal / Gate 可以进入 Spike，但环境结算会使它回 origin；这不是禁推，而是“推入后发生可预测变换”。

Path Spike 不适合作为近期主线：它依赖行动后的环境回合，静态读盘成本高；当前产品又规定 Player 不会挡住它、碰到即整盘死亡重置。应降为后期选修，或等到有明确“下一步预览”再重估。

## 证据口径

- **[F] 原版事实**：原版一手源码可直接验证。
- **[W] Web 事实**：当前 TypeScript 规则核可直接验证。
- **[P] 产品裁决**：当前 Web 已刻意覆盖原版差异的规则。
- **[D] 设计推断**：基于上述规则给出的课程建议。

## “每一格都是物体的一部分”是什么

把 L 形 Block 想成一张不能旋转的三脚沙发，而不是一个中心点带了大图标的箱子：

```text
■□        往右推一格后，三块实体格都会一起往右移。
■■        只要最突出的那一格会撞墙，整张沙发都推不动。
```

同理，通关不是把“沙发中心”对准 Goal，而是每一块实体格都要落在合法 Goal 上。一个很紧凑的教学关只需在 L 的“肩膀”前放一面墙：主格和另一只脚前方明明是空地，但整物仍不可推。玩家因此学到要看轮廓，不是看锚点。

[F] 原版 Block 会逐 Cell 检查下一个整块占格，且会跳过与自身旧占格重叠的格；`GridUtils_Pushable.cs:62-89`。
[W] Web 也由 `entityCells` 展开 shape，随后对候选整块占格逐格检查；`src/engine/game-engine.ts:37-46,97-107`。胜利同样检查每一格；`src/engine/game-engine.ts:85-95`。

## 当前可推性矩阵

| 模块 | 何时可推 / 可用 | 何时不可推或改为别的行为 | 适合教学的命题 |
| --- | --- | --- | --- |
| 真 Block | [W] 整个下一整块占格在盘内，且不撞 Wall、Player、其他 Block、Gate。Goal 与 Spike 可以占在目标格上。 | 任何一格撞上述硬物，整次输入 NoOp；不能连续推两件 Block。 | “不是前面这一格空就能推，而是整件东西都要能放下。” |
| Fake Block | 与真 Block 的物理推送条件完全相同。 | 同样是硬障碍；区别不在可推性，而在它永远不参与胜利。 | “它是家具，不是任务物。”可用来清道、留推位、做刹车。 |
| 可推动 Goal | [W] `movable=true` 且下一整块占格可放下时，像物体一样被推一格。 | [W] 若不能再推，角色会走进该 Goal；它从“可推动物”切换为可站的 Goal 层，而不是硬墙。 | “终点也能改造道路；推不动时反而可以穿过。” |
| 静态 / Terrain Goal | 不可推。 | 角色可进入；若有 Block 覆盖，Block 的物理规则优先。 | 先学它是地面目标，再引入可推动 Goal 的对照。 |
| 已链接 Gate | [W] 其配对出口沿**当前入射方向**的一格在盘内，且不撞 Wall、Block、其他 Gate 时，角色通过；这时不是推。 | 当上述出口落点受阻，入口不再能传送；若入口 Gate 的完整下一整块占格又能放下，入口才可推。两者都不成立则 NoOp。 | “眼前这扇门能否推，取决于远处出口那一格。” |
| Wall / dynamicWall | 不可推，始终是硬阻挡。 | 当前 Web 的 `dynamicWall` 只是形状化的墙，并无独立动态或可推动规则。 | 可作整块占格轮廓题的几何素材，不应先包装成单独机关。 |
| Terrain / 动态 Spike | 角色不能推 Spike。Block、Goal、Gate 可以进入 Spike 格。 | [P] Player 接触任一 Spike 后整盘回到初态；物件接触 Spike 后在环境结算回各自 origin。 | “我可以把物推进去，但结果不是停在那里，而是回到出生地。” |
| Path Spike | 不由角色推动；它在每次有效行动后自行走一步。 | [P] Player 不会阻挡它；若走入 Player，触发死亡重置。Block、Wall、Terrain Spike、其它 Spike 会让它停住。 | 后期时序挑战；近期不作为主要可推性课程。 |
| Rain | 不是物件，而是改变一次输入的移动尺度：没有紧邻可行动物时，角色滑到停止点。 | 紧邻 Block、可推动 Goal、Gate 时，改走各自的推送 / 通过判断。 | “同一方向键的结果取决于你面对的物件状态。” |

### 原版与 Web 的关键来源

- [F] 原版 Block 的完整形状许可与 Goal / Spike 例外：[`GridUtils_Pushable.cs#L62-L89`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L62-L89)。
- [F] 原版 Goal 的 `canPush`、被阻塞后可走入：[`GridUtils_Pushable.cs#L36-L60`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L36-L60)、[`GridUtils_Has.cs#L93-L114`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Has.cs#L93-L114)。
- [F] 原版 Gate 的“出口阻塞才可推入口”规则：[ `GridUtils_Pushable.cs#L8-L34` ](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Utils/GridUtils_Pushable.cs#L8-L34)；方向保持的穿门行为：[ `GameRoleDomain.cs#L126-L144` ](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameRoleDomain.cs#L126-L144)。
- [F] 原版物件碰 Spike 回 origin：[ `GameBlockDomain.cs#L93-L133` ](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs#L93-L133)。
- [W/P] Web 的 Block / Goal / Gate 行为集中于 `src/engine/game-engine.ts:97-177,411-502`；Spike 的物件回位、Player 死亡重置与 Path 阻挡条件集中于 `src/engine/game-engine.ts:200-354`。

## 应如何围绕“何时可推”做关卡

建议把课程从“认识图标”改成“验证一个条件”的短链，每关只改变一个判断因素：

1. **L 形 Block 的肩膀撞墙：** 看见一个空主格仍不可推，学整块占格。
2. **L 形 Block 的自重叠：** 沿自身轮廓平移仍可推，学“不是每个旧格都要腾空”。
3. **Fake 的对照：** 可推条件完全相同，但把它送上 Goal 没有意义，学物理身份与胜利身份分离。
4. **可推动 Goal：** 前方空，推它；让玩家先把它当作物件。
5. **被堵的可推动 Goal：** 前方被墙堵住，改从 Goal 上走过；让玩家亲见状态切换，而不是读图例。
6. **Spike 回位：** 把 Block 推进 Spike，主动利用回 origin 改变绕行路线。
7. **Gate 可通：** 出口前方清空，按一个方向穿过去，学“入口 + 入射方向 + 出口”。
8. **Gate 可推：** 只堵出口前方，同时让入口前方有空间；同一扇 Gate 从通道变成可推物。
9. **二选一综合：** 先决定是保持 Gate 可通，还是故意堵出口来移动入口；谜底不应依赖任何隐藏的远端格。

这条链的共同原则是：**玩家在按键前，就应该能从棋盘上枚举出那个条件。** 每一关先让他看见一个“为什么不能推 / 为什么现在能推”的明确原因，下一关再要求主动制造该原因。

## 设计与验收准则

### 将可推性写成四格合同

任何新关在 TDD 中都应为关键模块写下四种预期，而不是只验证“有解”：

1. 满足条件时：输入后谁移动、移动几格。
2. 不满足条件时：NoOp、穿过、传送还是触发回位。
3. 条件改变后：同一输入为何变成另一种结果。
4. 整块占格：任意一格受阻时，整件多格物的结果是否正确。

Gate 还要测试“出口清空 → 可通过”“出口堵住且入口前方清空 → 可推”“两处都不满足 → NoOp”三态。Goal 则要测试“可推”“被阻挡可穿过”“静态可穿过”三态。这样可以防止规则被图标和文案掩盖。

### 读图准则 [D]

- 条件的原因必须在画面中可见：Gate 要能看清出口、出口前方和入射方向；Goal 要能看清可移动性；多格物要能看清每个实体格。
- 不要只用底色表达状态；形状、箭头、连接线和局部预览比色块更适合表达“将要发生什么”。
- 对条件式可推物，靠近时可给轻量预览（例如可推方向 / Gate 的出口落点），但它应解释规则，不替玩家求解。

## Path Spike 的重新定位

用户当前判断成立：[D] 在没有动态预览时，Path Spike 的下一步需要把“我按下一个键”“环境动作”“碰撞结果”串起来推算，读盘成本明显高于上述静态条件题。它不应与整块占格、Spike 回位、Gate、Goal 并列为近期主线。

若以后重启这一方向，先满足三个前置条件：一条路径、相邻单格节点、明确显示下一节点 / 折返方向；并坚持 [P] Player 不会挡刺，而让 Block 作为可读的轨道阻挡物。多条 Path 的数组结算顺序目前没有独立合同，不应用作关卡难度来源。
