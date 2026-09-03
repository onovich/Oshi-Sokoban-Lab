# Oshi-Sokoban-Lab

[English](README.md)

这是由 Oshi 原作者创建的可游玩 Web 机制实验室，用于还原并拓展 Oshi 的网格推箱子玩法。项目只聚焦推箱子玩法层，不包含视觉小说叙事及原始美术、音频资源，并以测试驱动的方式研究机制还原与关卡设计。

![Oshi-Sokoban-Lab 社交预览图：暗场网格推箱子棋盘，包含方块与成对 Gate](docs/social-preview-v2.svg)

## 本地试玩

仓库当前没有托管的公开版本。安装 Node.js 与 npm 后，运行：

```powershell
npm install
npm run dev
```

在浏览器中打开 Vite 输出的本地地址。

## 玩法

- 选择关卡、阅读开局说明，然后点击 **开始关卡**。
- 使用方向键或 `W`、`A`、`S`、`D` 移动；屏幕上的方向按钮提供相同输入。
- 按 `Z` 撤销，按 `R` 重开。
- 通关后会保留已解开的棋盘，并明确显示 **下一关** 按钮。
- `npm run dev` 为开发测试模式，可在作者工具中切换基础课程、大师课程和实验室，并任意选关；生产构建仍遵守课程前置关系。

## 已包含内容

- 两套相互隔离的课程目录：生产默认使用作者已验收的 60 关基础课程；开发模式提供 `mastery-v2` 草案，目前在固定的五幕 120 槽蓝图中开放 70 个可玩正式关。
- 10 个已经机器验收的「推侧 × Footprint」掌握弧候选关（P1–P10）。其中 D3–D8 只是设计目标，只有满足规定样本量的盲测后才会成为实测难度。
- 3 个尚未验收的 Spike 销毁／重生原型只存在于开发实验室，不计入任一正式课程进度。
- 一个纯状态机规则内核，处理角色移动、推送、多格实体、地面 Goal 与 Spike、可推动 Goal、成对 Gate、撤销、重开，以及可选步数／时间限制。
- 一套经源码审计的规则模型，覆盖编号 Goal、Fake Block、Rain、Gate 拓扑与 Spike 重置。Path 驱动的移动 Spike 在动态状态可静态读取前不进入主课程。
- 与网格完全对齐的 CSS/SVG 渲染；棋盘与规则图例共用同一套视觉符号，并包含位移动画、两段式 Gate 穿行，以及三阶段 Spike 销毁／重生演出。
- 测试先行的作者工作流：类型化证明条件、已验收关指纹、稳定 ID 存档、复用真实规则的 A*／Dijkstra 搜索、明确的预算耗尽、替代宏策略检测、死锁剪枝、命题反事实、变异审计、解法回放与界面流程。

## 开发

```powershell
npm test
npm run typecheck
npm run build
```

项目使用 React、TypeScript 与 Vite。规则内核位于 [`src/engine`](src/engine)；声明式关卡族位于 [`src/levels`](src/levels)；UI 只负责渲染状态和派发玩家输入。

## 状态与范围

生产环境仍默认使用作者已验收的 60 关基础课程。`mastery-v2` 草案目前由这 60 个冻结关和 P1–P10 组成，共 70 个可玩正式盘面；10 个新关均可由求解器回放，声明的证明条件不可绕过，且当前删除／封墙变异审计没有发现未标注的冗余盘面元素。这只是机器验收里程碑，并不能证明 P10 已经达到真人 D8 难度。

其余 50 个蓝图槽不会被未经验证的填充关占满。实施闸门要求先校准 P1–P6 的难度与技巧迁移，再校准 P7–P10，之后才制作 P11–P12；P12 通过作者验收与专家盲测后，才横向扩写 H/G/I/R/T/S/C/U。早期 Spike 原型继续留在实验室，正式蓝图则在第 70–75 槽揭示「回位是远程移动」之前，预留 8 个彼此有间隔、只把 Spike 当辅助障碍的桥接关。Path Spike 仍不进入本轮教学路线。本仓库是 Oshi 原作者用于研究机制和关卡设计的实验室，并非完整 Web 移植版。

## 调研依据

实现依据原作者公开的 Oshi 源码快照 [`main @ 4afe6809`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45) 核对。证据与后续工作可参阅 [Web demo 规格](research/04-oshi-mechanics-web-demo-spec.md)、[机制一致性审计](research/10-mechanics-conformance-audit.md)、[Witness / SSR 设计研究](research/15-witness-ssr-level-design-study.md)、[大师课程实施地图](docs/wayfinder/mastery-curriculum/map.md)、[120 槽蓝图](src/course/mastery-blueprint.ts)、[历史 63 盘面基础课程文档](docs/level-family-curriculum-plan.md) 与 [盲测协议](docs/playtest-protocol.md)。

## 许可证

本仓库目前未包含开源许可证。
