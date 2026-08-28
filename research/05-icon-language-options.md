# Oshi Web Demo：棋盘图标语言备选

调研日期：2026-08-28  
范围：为 LearnSokoban 的棋盘重绘一套**不依赖格子着色才可读**的图标语言；这里不决定最终方案，而是为可并排比较的 HTML 提供可实施的候选方向。所有外部事实均来自图标库、W3C 或 Oshi 作者的官方仓库。

## 结论先行

用户的判断是正确的：格子底色和图标应被视为两条不同的视觉通道。建议把它们固定为下列合同，而不是让每一种机制同时改变图标和格色：

| 视觉通道 | 只负责表达 | 例子 |
|---|---|---|
| 格子 / 棋盘底层 | 地形或全局环境 | 普通地面；Rain 时的整盘雨幕 / 天气栏，而**不是**每格染成另一种「物件色」 |
| 图标轮廓 | 这个格上「是什么」 | 人、箱、目标、墙、刺、Gate |
| 图标内部形状 / 线型 | 规则状态 | 虚线箱 = Fake；带推箭头的圆靶 = 可推动 Goal；锯齿 + 路径 = 移动 Spike |
| 小徽章 / 文字 | 身份与关系 | `2` 在 Block 和 Goal 上使用同一种角标外框，表示 `B2 ↔ G2` 的匹配关系 |
| 连接线、重复图样、轻动画 | 跨格关系或时间 | 两个 Gate 的同款环纹；Path 的虚线轨迹；Rain 的低透明度雨线 |

这也符合 W3C 的要求：颜色不能是区分信息的唯一手段，应与形状或文字一起表达；需要理解的非文字图形对相邻背景应达到至少 3:1 对比度。[W3C：Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) / [W3C：Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)

因此，不管选下面哪一种视觉方向，比较页都应让**所有格子保持同一张中性地面**；只把 Rain 做成棋盘上方的细雨叠层 / 顶部天气提示。这样可以同时展示 Rain、Goal、Gate 和 Spike，而不会让「蓝色格」既可能是天气、也可能是 Gate 或 Goal。

## 可复用来源与许可

| 来源 | 一手事实 | 适合的接入方式 | 许可注意 |
|---|---|---|---|
| [Lucide React](https://lucide.dev/guide/react) | 每个图标是可按 `size`、`color`、`strokeWidth` 调整的独立、优化 inline SVG React 组件，并且按导入 tree-shake。 | 很适合本项目 React + TypeScript；使用少量命名组件，或拿 SVG 路径作为自定义图标的基底。 | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE)；其许可证还列出了从 Feather 派生的图标及相应 MIT 通知，若分发原始资产应保留上游通知。 |
| [Tabler Icons](https://github.com/tabler/tabler-icons/blob/main/packages/icons/README.md) | 官方 README 声明所有图标建于 `24×24` 网格、`2px` stroke，提供 outline / filled、inline SVG 和 React 包。 | 适合作为「工程图 / 线路图」式的统一细线方案；可直接用 `@tabler/icons-react`。 | [MIT](https://github.com/tabler/tabler-icons/blob/main/LICENSE)。 |
| [Phosphor Core](https://github.com/phosphor-icons/core) | 官方包把 SVG 按 `/assets/<weight>/` 暴露；其 [React 包](https://github.com/phosphor-icons/react) 说明了同一图标的多种 weight。 | 适合将「物件类别」和「状态」做成两层：同一形状切换 regular / duotone / fill。 | [MIT](https://github.com/phosphor-icons/core/blob/main/LICENSE)。 |
| [Heroicons](https://github.com/tailwindlabs/heroicons) | 官方仓库提供 `20` / `24` 尺寸及 outline / solid 两组 SVG。 | 适合小格子下优先识别轮廓的实心棋子，也适合控制条按钮。 | [MIT](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE)。 |
| [Oshi Unity 原仓库](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime) | 原项目实际随仓库提供 Block、Fake Block、Goal、Gate、Role、Spike、Wall 的 PNG 模板；还包含 [Portal Shader Graph](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph) 和 [Rain VFX prefab](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/VFX/VFX_Rain.prefab)。 | 可把其「实体 sprite + 环境 VFX / Gate 动效」的分层方式作为方向 E 的结构参照；不必复制像素资产。 | 原仓库为 [MIT](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/LICENSE)。若直接拷贝原 PNG / Shader，须带上该版权与许可证；只借鉴抽象语法仍建议在项目说明中标明灵感来源。 |

## 可复用的命名对照

以下名称在各库官方源码中可直接找到；它们是**候选词汇**，不是要求把通用图标生搬硬套。对于 Oshi 专有规则（Fake、可推动 Goal、编号匹配、成对 Gate、移动 Spike），应以两三个基础 SVG 组合为一个本项目的语义图标。

| 游戏语义 | Lucide 候选 | Tabler 候选 | Phosphor 候选 | Heroicons 候选 / 缺口 |
|---|---|---|---|---|
| 玩家 | [`UserRound`](https://github.com/lucide-icons/lucide/blob/main/icons/user-round.svg) | [`IconUser`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/user.svg) | [`PersonSimple`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/person-simple-duotone.svg) | [`UserIcon`](https://github.com/tailwindlabs/heroicons/blob/master/src/24/solid/user.svg) |
| 正常 Block | [`Package`](https://github.com/lucide-icons/lucide/blob/main/icons/package.svg) | [`IconBox`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/box.svg) | [`Package`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/package-duotone.svg) | [`CubeIcon`](https://github.com/tailwindlabs/heroicons/blob/master/src/24/solid/cube.svg) |
| Goal | [`Target`](https://github.com/lucide-icons/lucide/blob/main/icons/target.svg) | [`IconTarget`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/target.svg) | [`Target`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/target-duotone.svg) | 自绘「靶心 / 凹槽」更清楚；Heroicons 无需强行替代 |
| Wall | [`BrickWall`](https://github.com/lucide-icons/lucide/blob/main/icons/brick-wall.svg) | [`IconWall`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/wall.svg) | [`Wall`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/wall-duotone.svg) | 自绘砖块边框较合适 |
| Rain | [`CloudRain`](https://github.com/lucide-icons/lucide/blob/main/icons/cloud-rain.svg) | [`IconCloudRain`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/cloud-rain.svg) | [`CloudRain`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/cloud-rain-duotone.svg) | [`CloudIcon`](https://github.com/tailwindlabs/heroicons/blob/master/src/24/solid/cloud.svg) + 三条自绘雨线 |
| Spike / 危险 | [`TriangleAlert`](https://github.com/lucide-icons/lucide/blob/main/icons/triangle-alert.svg) | [`IconAlertTriangle`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/alert-triangle.svg) | [`WarningDiamond`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/warning-diamond-duotone.svg) | [`ExclamationTriangleIcon`](https://github.com/tailwindlabs/heroicons/blob/master/src/24/solid/exclamation-triangle.svg)；游戏内建议改为三根明确尖刺 |
| Gate / Path | [`DoorOpen`](https://github.com/lucide-icons/lucide/blob/main/icons/door-open.svg) + [`Route`](https://github.com/lucide-icons/lucide/blob/main/icons/route.svg) | [`IconDoor`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/door.svg) + [`IconRoute`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/route.svg) | [`DoorOpen`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/door-open-duotone.svg) + [`Path`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/path-duotone.svg) | 自绘双环 / 出口箭头；Heroicons 更适合只放 [`ArrowPathIcon`](https://github.com/tailwindlabs/heroicons/blob/master/src/24/solid/arrow-path.svg) 作关系标记 |
| Undo / Restart | [`Undo2`](https://github.com/lucide-icons/lucide/blob/main/icons/undo-2.svg) / [`RotateCcw`](https://github.com/lucide-icons/lucide/blob/main/icons/rotate-ccw.svg) | [`IconArrowBackUp`](https://github.com/tabler/tabler-icons/blob/main/icons/outline/arrow-back-up.svg) | [`ArrowCounterClockwise`](https://github.com/phosphor-icons/core/blob/main/assets/duotone/arrow-counter-clockwise-duotone.svg) | [`ArrowUturnLeftIcon`](https://github.com/tailwindlabs/heroicons/blob/master/src/24/solid/arrow-uturn-left.svg) / `ArrowPathIcon` |

## 五个可在同一 HTML 中比较的方向

### A. Lucide「清晰逻辑线」

**核心语言**：24px 单色 outline，统一 round cap / round join；每个格中的图标是名词，状态是小型第二笔画或角标。

- **棋子**：`UserRound`、`Package`、`Target`、`BrickWall`、`TriangleAlert`、`DoorOpen`，均采用相同深色描边；`B2` / `G2` 是同样的圆角小牌而不是以不同颜色配对。
- **Oshi 专有组合**：Fake Block = `Package` 的虚线 / 断缝版；可推动 Goal = `Target + 4 向短箭头`；移动 Spike = `三尖刺 + Route`；Gate = `DoorOpen + 出口箭头`。
- **Rain**：只在棋盘顶层叠加稀疏、低对比的斜雨线，角落再给一个 `CloudRain` 状态章；格子仍是中性底色。
- **最适合**：12 个教学关、手机和键盘并用、需让玩家第一次看到就知道「这是什么」的基础机制。
- **取舍**：整体最易读、最低实现风险，但氛围感最克制；小于约 28px 时需要加粗 stroke 或简化内部细节。

### B. Tabler「棋盘工程图」

**核心语言**：严格的 24px / 2px 工程线稿；把地面留白、对象画得像布置在蓝图上的操作件。

- **棋子**：`IconBox` 作为 Block，`IconTarget` 作为 Goal，`IconWall` 是实体砖墙，`IconDoor + IconRoute` 表示 Gate；Path 用点划线路径，能直接把路线和移动尖刺的关系读出来。
- **Oshi 专有组合**：Fake 用交叉虚线框（不是另一种颜色）；可推动性用图标外的一小段四向箭头；编号放左上角小方签；Gate 成对使用相同的两道刻痕或相同编号。
- **Rain**：天气是棋盘边框外的图层，采用 `IconCloudRain`，不改变任何 cell 的填充。
- **最适合**：多格 footprint、Gate 关系、Loop / Ping-pong Path 等「空间规则」关；适合将轨迹也画上棋盘。
- **取舍**：信息密度最高，适合研究型 demo；人物和箱子会比实心棋子更“技术图”，在很小格子中需控制细节数量。

### C. Phosphor「双层棋子」

**核心语言**：同一 icon family 的 `regular`、`duotone`、`fill` 作为**状态深度**，不借格子颜色。轮廓定义种类，内层半透明填充或实体填充定义可动/正在激活。

- **棋子**：常态 Block / Goal / Wall 用 regular；可推动 Goal、可推动 Gate、当前移动 Spike 用 duotone；胜利时仅把已完成的 Block 改为 fill，而不改变地板。
- **Oshi 专有组合**：Fake Block = regular `Package` + 一道斜向缺口；编号 = 显式文本角标；未激活 Gate = regular `DoorOpen`，入口/出口有同款环形内纹；移动路线则以 `Path` 叠到 Spike 后方。
- **Rain**：`CloudRain` 置于状态栏，再在棋盘整体上覆盖很淡的降雨纹理；停在雨关时，除环境层之外一律不更改物件颜色。
- **最适合**：需要突出「可推动 / 已完成 / 正在移动」这类状态转换，又希望减轻说明面板依赖的关。
- **取舍**：四种字重很适合状态，但须固定同一种切换契约；不要让 duotone 的“第二色”承担唯一语义，形状/线型也必须同时改变。

### D. Heroicons「实心棋子」

**核心语言**：24px solid silhouette；优先让每个格在远距离也能一眼认出“人、立方体、危险”。复杂规则用自绘小图形，不硬凑成通用 UI 图标。

- **棋子**：`UserIcon` 是玩家，`CubeIcon` 是 Block，`CubeTransparentIcon` 可用作 Fake 的起点；危险采用三角轮廓内的三根刺而不是只放警告感叹号。
- **自绘补齐**：Goal 画同心靶心；Wall 画砖块；Gate 是两个相同的椭圆门框和朝出口的短箭头；Path 是 2–3 个连接点。这些都比不相干的通用语义更直观。
- **Rain**：`CloudIcon` 加雨线只存在于棋盘顶部遮罩；雨天物理规则通过雨线 + 一次性教学提示表达，不“染蓝所有方格”。
- **最适合**：格子小、触屏优先、强调第一眼辨识的主游戏视图；同时可把 Heroicons 用在侧栏控制按钮。
- **取舍**：最像传统益智游戏棋子，但必须自建 Oshi 专属 `Goal`、`Gate`、`Path` SVG primitives；不宜把纯 Heroicons 当完整棋盘词汇表。

### E. Oshi「原作氛围 + Web 降级」

**核心语言**：借原 Unity 的“sprite 实体层 + 独立 VFX / Portal 动效层”的结构，而不是拿底色给每个类别编码。

- **可参照的原始资源**：官方目录中可见 [Block 与 Fake Block](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Block)、[Goal](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Goal)、[Gate](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate)、[Spike](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Spike) 和 [Role / Wall](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime)。
- **Web 落地**：重画成原创 SVG sprite；Portal 用不依赖 WebGL 的 SVG 双环轻微旋转 / CSS mask 动画，`prefers-reduced-motion` 时保持静态双环 + 出口箭头；Rain 用整盘淡雨幕而不是 cell fill。
- **最适合**：Gate、Rain、失败 / 重置、移动 Spike 等需要“动态状态感”的关；在机制教学完整后作为主题皮肤。
- **取舍**：最接近原作气质，但动效不能成为信息的唯一来源；需要给静态首帧足够强的 Gate、雨、危险轮廓。若直接复用原 PNG / Shader，必须保留 Oshi 的 MIT notice。

## 供比较页共用的验收样本

四至五套方案应在同一份 HTML 中展示同一张小棋盘和同一组 glyph，不让关卡结构差异干扰选择。最少包含：

1. 玩家、Block、Fake Block、Terrain Goal、`B2`、`G2`、可推动 Goal。
2. Wall、静态 Spike、沿简短 Path 移动的 Spike、成对 Gate（标出出口方向）。
3. Rain 开关前后：只允许出现 / 消失全盘雨层与天气章；禁止把 Goal、Gate、普通地面改成机制专属格色。
4. 完成态、焦点态、`prefers-reduced-motion` 静态态；需要理解的轮廓都在中性地面上可见。

建议以 **B（Tabler）/ C（Phosphor）/ A（Lucide）/ D（Heroicons）** 作为首轮四栏；E 作为“原作氛围”附加栏。若只选一个生产方案，优先 B：它的可核验词汇对 Wall、Target、Cloud Rain、Route 等棋盘语义覆盖最完整；C 则最适合以后把动态对象状态做得更细而不滥用格色。

## 落地约束（提案）

- 将图标渲染抽象为 `GameGlyph(kind, modifiers)`：`kind` 决定轮廓，`modifiers` 决定 `fake | pushable | numbered | moving | solved | paired` 的附加笔画 / 角标。关卡和规则引擎不应知道具体 SVG 库。
- 背景变量只保留 `floor` 与 `weather`；对象的类别不可通过 `.cell--goal`、`.cell--gate` 等背景色传达。若 Goal 作为 terrain 仍需要被看见，使用目标图标的同心环或边缘凹槽。
- `B2` 与 `G2` 都须保留显式的 `2` 和相同的徽章形；颜色可作强化，不能是匹配的唯一线索。
- 视觉回归应覆盖高对比模式、色觉缺陷模拟、`prefers-reduced-motion` 与 320px 宽度；在中性背景上对关键 SVG 轮廓检验至少 3:1 的非文字对比。

## 来源

- [W3C WCAG 2.2：Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [W3C WCAG 2.2：Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [Lucide React 官方文档](https://lucide.dev/guide/react) 与 [许可证](https://github.com/lucide-icons/lucide/blob/main/LICENSE)
- [Tabler Icons 官方 README（网格、stroke、输出格式）](https://github.com/tabler/tabler-icons/blob/main/packages/icons/README.md) 与 [许可证](https://github.com/tabler/tabler-icons/blob/main/LICENSE)
- [Phosphor Core 官方仓库](https://github.com/phosphor-icons/core)、[React weight 文档](https://github.com/phosphor-icons/react) 与 [许可证](https://github.com/phosphor-icons/core/blob/main/LICENSE)
- [Heroicons 官方仓库](https://github.com/tailwindlabs/heroicons) 与 [许可证](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE)
- [Oshi 官方资源目录](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime)、[Portal Shader Graph](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)、[Rain VFX](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/VFX/VFX_Rain.prefab) 与 [MIT 许可证](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/LICENSE)
