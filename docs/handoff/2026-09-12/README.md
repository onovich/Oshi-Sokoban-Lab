# LearnSokoban 出差交接

快照日期：2026-09-12，Asia/Shanghai。仓库 `onovich/Oshi-Sokoban-Lab`，分支 `main`；本次整理前 HEAD 为 `24ab04d`。本次提交包含原有全部未提交项目文件、3D/原画产物和交接材料。最终提交号使用 `git log -1` 查看。

## 新电脑最短启动

安装 Git、Node.js（本机验证版本 24.13.1 / npm 11.8.0），使用新电脑自己的 GitHub 登录凭据。

```sh
git clone https://github.com/onovich/Oshi-Sokoban-Lab.git
cd Oshi-Sokoban-Lab
npm ci
npm run dev -- --host 127.0.0.1 --port 5174
```

打开 Vite 地址，开发模式可选大师课程 → 开发实验室。浏览器 origin 的 localhost 和 127.0.0.1 不共用存档。

独立实验另开终端：

```sh
npm run 3d:dev
# 废土实验 http://127.0.0.1:5187/
npx vite --config experiments/faceted-salvage/vite.config.js
# 切面废土 http://127.0.0.1:5188/
```

Windows 也可用根目录两个 Open-*.cmd。运行 Web 不需要 Blender 或 Unity，GLB 已随仓库保存。建模使用 Blender 5.2.1；Unity Humanoid 历史验收使用 2023.2.22f1，报告已保存，不需要复制 Library。

`.codex/project-git-workflow.json` 和 ops 配置、旧文档/启动器中含本机路径。新电脑先按新仓库位置更新配置；全局技能与包装脚本不随 Git 自动安装。基本 npm 命令跨平台可用，Blender 用新机实际可执行文件路径。

## 三条任务与最新状态

| 原任务 | 当前结果 | 接续依据 |
| --- | --- | --- |
| 绘制废土风3D原画方案 · `01a08d13-417a-7031-a01b-071623ac941a` | 六方向原画；选方案1切面废土；原创 Humanoid 第三版；补充角色/场景稿已部分通过，尚未应用模型 | [美术历史](history/art.md)、[实验 README](../../../experiments/faceted-salvage/README.md) |
| 制作3D废土风格实验场景 · `01a08d0f-e888-7e21-b2a2-a660147fb19a` | 独立 Three.js 场景；Blade 模型和 Idle/Walk，新增 Push；相机/推箱/碰撞 | [实验历史](history/wasteland.md)、[实验说明](../../../experiments/wasteland-3d/README.md) |
| 实现 Oshi 推箱子机制 Demo · `01a044f9-7c8f-7cf1-b970-e708f71ad085` | 规则研究、基础60关、mastery-v2 70个正式可玩盘面及开发实验库；最新雨天教学候选 LAB36 | [游戏历史](history/game.md)、[课程地图](../../wayfinder/mastery-curriculum/map.md) |

本次应用任务列表显示该 workspace 的其他当前任务只有本交接任务。历史档案覆盖三个指定主任务及本机可发现的同 ID 续写文件（共15个 rollout）；不是全局其他项目会话备份。只抽取用户文字和助手最终回复，保留来源文件名；工具调用、推理、内嵌图片及账户配置不导出。旧回答可能已经作废，不能当作当前规范。旧截图绝对路径可能无法打开，应优先使用下面的仓库资产。

## 游戏：已知结论和待办

核心是教学与推理，不用堆地图、物件或步数冒充难度；事件必要性、求解器获胜不等于玩家学会。作者反馈不是陌生玩家盲测。冻结关、稳定 ID、既有存档不要随便重排；实验不自动升级正式课程。动态 Path Spike 不进入当前主课程。依据 [设计指南](../../high-difficulty/design-guide.md)、[试玩协议](../../playtest-protocol.md)、[课程地图](../../wayfinder/mastery-curriculum/map.md)。

- LAB33《候岸》仍是迁移目标；玩家卡住涉及临时停点、小块让路、横块经过、小块再调整的相互依赖，不能简单归因于急着完成小块。
- LAB34《驻岸》被否决：开局多数目标已完成、像残局，没有教会候岸；转历史实验。
- LAB35《借泊》13步通关，无撤销/重开/演示，作者觉得简单且无具体收获。它允许小块先完成、再独立处理横块，削掉了核心依赖；已转历史实验。
- LAB36《交岸》已实现并有反事实测试，目标 D4 未校准，尚待作者试玩。详见 [交岸](../../high-difficulty/rs06-rain-handoff.md)。先36再33，不提前给按键答案；若仍无迁移，重新分析核心冲突，不继续用同类切片凑数。
- 新增 RS02/04/05/06 的代码、测试和说明已保存。其他长期任务与验收闸门按课程地图和 tickets 接续，不将设计目标难度当实测。
- 浅水模拟当前暂停：Board 不挂载 WaterSurface，只保留雨线/落点飞溅；shader/model 实验仍保留，不自动重新启用。见 [水面记录](../../shallow-water-rendering.md)。

## 美术：不可遗失的用户修正

风格基准为 `experiments/wasteland-art-directions-20260911/01-faceted.png`，成年正常比例人形机械人、正交 ISO、切面废土。程序建模优先薄装甲轮廓、关节留空、合理连接，不能只堆螺丝或浮动碎片。

采用清单：

- 角色 `art-review/turnaround-v4.png` 与 `joints-v5.png`，详见 [角色采用范围](../../../experiments/faceted-salvage/art-review/ACCEPTED.md)。v5/v6 三视图改了背板，不采用。
- 场景 `scene-art-review/scene-kit-v2.png`；物件 `gameplay-props-v4.png`，详见 [场景采用范围](../../../experiments/faceted-salvage/scene-art-review/ACCEPTED.md)。物件 v2 的旧通过结论撤销，v3 拒绝；v4 仅为 L/Goal 专项，不能声称全部物件重验完成。
- L 箱由三个标准 cube 拼成，允许接缝、共用一个逻辑实体位移；占格 `#./##`。禁止再要求一体异形外壳。
- 所有水平数字统一世界方向；Goal 与箱顶保持一致，非朝屏幕 billboard。
- 可移动 Goal 是同一完整立方体：可推时升到地上，与普通箱同高；可穿透时整块下沉，顶面齐地。不能缩扁代替下沉，不自造按钮或状态触发条件。这是待实现外观。
- Gate 为低矮可移动端点、按 nextGateId 链接并保持输入方向；Spike 表达回位而非永久销毁；Rain 是全关滑行，不是局部水格。

下一步按 [MODEL-GAPS](../../../experiments/faceted-salvage/art-review/MODEL-GAPS.md) 更新模型，保持骨架/动作兼容，重新做 Blender 正侧背和运动间隙检查。机关稿仍无 PNG，按 `devices-v1-prompt.txt` 补图并独立验收。已通过原画不等于模型已完成，也不是工程精确尺寸。

## 产物与复现

[资产清单](assets-manifest.json)记录108项关键实验资产/源文件的路径、大小和 SHA256。克隆后可执行 `python scripts/verify-handoff-assets.py` 检查传输完整性；以后主动修改资产后，旧快照哈希不匹配是预期现象。

`experiments/faceted-salvage/` 保留完整 blend、GLB、T-pose/动画 FBX、52骨映射、Unity/几何验证报告、动作来源 SHA256、脚本、历次原画/提示词/验收、v1/v2 模型历史和第三版实渲图。`experiments/wasteland-3d/` 保留环境/人物 blend、运行模型、碰撞、相机代码和测试。

Blade 原始定向快照原在旧机 `D:/UnityProjects/Blade`，本次复制到 `experiments/wasteland-3d/source-blade/`，附固定提交 `8449b5c2698c49b02c666554732633887fc85c4f`、Git blob 与 SHA256 清单。建模脚本现在默认读仓库快照，可用 `BLADE_SOURCE_ROOT` 覆盖，无需依赖旧 D 盘。它不是完整 Unity 项目。Idle/Walk 来自 Blade，Push 是本实验新制；切面机械人只复用动作/骨架、不复用人物网格。沿用资源原有许可说明，本次保存不等于新增许可授权。

```sh
node --test experiments/wasteland-3d/physics.test.mjs experiments/faceted-salvage/movement.test.js
npm run 3d:build
npx vite build --config experiments/faceted-salvage/vite.config.js
npx vitest run --maxWorkers=2
npm run typecheck
npm run build
```

Blender 从仓库根目录执行：`blender -b --python experiments/faceted-salvage/tools/build_scene.py -- --render`。重建会覆盖生成资产，手工改动先另存。运行不要求重建。

## 迁移边界与缺口

已保存游戏代码、文档、工作产物和可读历史；没有迁移 Codex 账户数据库或保证旧 task 在新电脑侧栏出现。新任务读此指南即可接手。

浏览器 CUA 连接失败，未取得最新 localStorage：关卡进度、试玩原始路线和当前未完成棋盘没有本次实时快照。已有路线分析在 docs/playtests 和上述历史中，尤其借泊13步记录与候岸诊断。新电脑可直接从开发实验室选 LAB36；不能把新浏览器的空存档视作旧试玩证据。3D 相机设置本来只保存在页面会话中。

node_modules、dist、Unity 验证工程缓存、日志、blend1、PID 按 .gitignore 排除，可重建；验证报告、原始模型和所需 source-blade 已保存。历史消息中的临时截图不是全部可迁移产物，采用图均以仓库路径为准。

## 给新任务的提示词

> 请接手续做 LearnSokoban。先读 HANDOFF.md 和 docs/handoff/2026-09-12/README.md，再读所选方向的 ACCEPTED.md 或课程地图。说明已完成、未完成、最新用户否决项；保持实验与正式课程边界。不要把历史旧稿或机器验证当用户验收，不依赖旧电脑路径。默认继续由我指定的方向；游戏方向从 LAB36→LAB33 的教学迁移验证开始，美术方向从已通过参考落实模型及补机关稿开始。

建议技能：GitFlow/project-git-workflow（提交与验证）、handoff（更新交接）；规则或关卡改动用 tdd，图像生成用 imagegen，难点诊断用 diagnosing-bugs。新机没有技能时先安装或阅读仓库操作说明，技能名称不是运行依赖。
