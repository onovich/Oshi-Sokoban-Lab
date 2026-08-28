# Oshi Push Studies

一个可运行的 Web 推箱子机制 demo。它复原的是 Oshi 已有的网格玩法，不包含 VN 叙事、剧情界面、原始美术或音频资产。

## 运行

```powershell
npm install
npm run dev
```

浏览器打开 Vite 输出的本地地址。使用方向键或 `WASD` 移动，`Z` 撤销，`R` 重开；也可以使用屏幕按钮。

```powershell
npm test
npm run typecheck
npm run build
```

## 已复原的玩法机制

- 一格角色的四向移动、单次推送、不可拉动与不可连推。
- Block、Wall、Goal、Gate、Spike 的任意多格 footprint，以及静态地形层。
- Terrain Goal / 编号 Goal 的全 footprint 胜利判定，和不参与胜利的 Fake Block。
- Spike：角色失败；Block、Goal、Gate 在环境回合回到各自出生点。
- Rain：仅角色滑行；相邻可推动对象仍只平移一格；滑行全路径判定尖刺。
- 可推动 Goal，以及无法推动时角色可穿过的规则。
- Gate：角色沿入射方向从连接的出口走出；出口阻塞时入口可以被推。
- Path 驱动的移动 Spike，支持 `loop`、`pingPong` 与 `once`。
- 完整状态快照的 Undo、重开，以及可选步数 / 时间限制。

十二个紧凑小关按“一个规则或技巧一个关”的方式排列：通关后保留结果并显示“下一关”按钮；每关均由状态空间搜索和一条可执行的提示路线验证存在解。

## 架构

`src/engine/` 是无 UI 依赖的纯规则内核：`createGame`、`move`、`undo`、`restart`、`tick` 是唯一的状态转换入口；`src/components/` 仅渲染状态与派发输入；`src/levels/` 只保存声明式关卡数据。这样棋盘渲染不会承载碰撞、胜负或环境回合规则。

实现遵循 TDD：先在 `src/engine/game-engine.test.ts` 写下每项规则的可观察行为，再实现最小逻辑；关卡目录和 UI 键盘流程也各有测试。

## 调研基线与范围

规则基线为 Oshi 官方公开仓库的 [`main @ 4afe6809`](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)。详细的事实、规范化的 Web 规则、已知原版 bug 与不纳入范围的未实现设想见 [调研与验收说明](research/04-oshi-mechanics-web-demo-spec.md)。

棋盘没有拷贝原始美术资产；Web 版以原创 SVG/CSS 近似 Unity 的真实运行帧、Sprite、材质与 VFX 分层。完整证据与可还原边界见 [Unity 最终画面审计](research/07-unity-visual-scene-audit.md)；其中以官方真实帧为第一基准，并更正了旧的单 Sprite 推断。

原版中尚未落地的 Enemy、Boss、多格角色、物体传送、雨天 Block 滑行、局内天气变化及其他构想均不在 demo 范围内。
