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

## 已包含内容

- 63 个紧凑候选关，分为 21 个三关组：先建立规则，再用单变量对照划定边界，最后推演更深一层的规则后果。
- 一个纯状态机规则内核，处理角色移动、推送、多格实体、地面 Goal 与 Spike、可推动 Goal、成对 Gate、撤销、重开，以及可选步数／时间限制。
- 一套经源码审计的规则模型，覆盖编号 Goal、Fake Block、Rain、Gate 拓扑与 Spike 重置。Path 驱动的移动 Spike 在动态状态可静态读取前不进入主课程。
- 与网格完全对齐的 CSS/SVG 渲染；棋盘与规则图例共用同一套视觉符号，并包含位移动画、两段式 Gate 穿行，以及三阶段 Spike 销毁／重生演出。
- 测试先行的关卡工作流：类型化领域事件、源码一致性、分支进度、有界状态空间可解性、命题绕过、解法回放与界面流程均有自动测试。

## 开发

```powershell
npm test
npm run typecheck
npm run build
```

项目使用 React、TypeScript 与 Vite。规则内核位于 [`src/engine`](src/engine)；声明式关卡族位于 [`src/levels`](src/levels)；UI 只负责渲染状态和派发玩家输入。

## 状态与范围

可游玩的核心流程与 63 个课程盘面已经实现为自动化候选池。当前每关都由求解器证明有解，并核查声明的关键事件不可绕过。原先的 60 关课程（顺延后为当前 01–18 与 22–63）已经由作者完整游玩并验收；新增的 Spike 前导关 19–21 仍待作者验收。陌生玩家盲测是另一道独立门槛，完成前这些盘面仍不是最终定稿。Path Spike 会刻意排除在主教学路线之外。本仓库是原作者用于研究机制和关卡设计的实验室，并非 Oshi 的完整 Web 移植版。

## 调研依据

实现依据原作者公开的 Oshi 源码快照 [`main @ 4afe6809`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45) 核对。证据与后续工作可参阅 [Web demo 规格](research/04-oshi-mechanics-web-demo-spec.md)、[机制一致性审计](research/10-mechanics-conformance-audit.md)、[Witness / SSR 设计研究](research/15-witness-ssr-level-design-study.md)、[63 关课程](docs/level-family-curriculum-plan.md) 与 [盲测协议](docs/playtest-protocol.md)。

## 许可证

本仓库目前未包含开源许可证。
