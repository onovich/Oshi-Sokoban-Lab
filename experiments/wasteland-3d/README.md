# 废土试验场 · 独立 3D 实验

这是一张独立的 Three.js 场景，用于评估 Oshi 改为 3D 后的环境、人物、推行和相机感觉。没有导入正式游戏引擎、关卡、课程或存档，不含目标判定和通关逻辑。

## 运行

在仓库根目录运行 `npm run 3d:dev`，打开 <http://127.0.0.1:5187/>。也可双击根目录的 `Open-Wasteland-3D.cmd`。正式游戏仍由 `npm run dev` 启动。

- WASD / 方向键：移动；接触货箱后持续推动。R：复位。
- 默认按屏幕方向移动；可以关闭，改为世界 X/Z 方向。
- 右键拖拽：旋转镜头；滚轮：缩放；自由观察模式下中键拖拽：平移。
- 四种预设：全景 ISO、近景跟随、俯视、透视漫游。
- 可调正交/透视、水平/俯仰角、正交半高、透视距离/FOV、固定/跟随/自由、阻尼及屏幕死区宽高。
- Confiner 可限制观察中心，或限制相机投影到地面的四角；视野大到无法收纳时明确提示，不伪装成已完成约束。金线是边界，青线是地面视野范围。
- “动作观察”可单独循环待机/走/推；预览时角色不位移。切回自动即可操控。
- “演示推行”执行真实碰撞和推动逻辑，方向键可接管；不是预制位移动画。
- 可导出相机 JSON，或保存场景 PNG。设置仅存在本次页面会话中。

## 资源与来源

参考任务 `01a077fb-6690-7ba0-b09a-69f5120ae6ed` 将 [onovich/Blade](https://github.com/onovich/Blade) 识别为 Unity 3D 角色动作/战斗原型。

本地常用项目目录没有找到 Blade。本实验按需下载到 `D:/UnityProjects/Blade`，这是定向资源快照，不是可打开的完整 Unity 项目。`asset-manifest.json` 记录固定源提交、Git blob 和 SHA256，原始 FBX、纹理、Unity 动画/控制器/预制件及对应 meta 都在该目录。

| 资源 | 来源 / 处理 |
| --- | --- |
| 人物模型 | Blade `Assets/Res_Runtime/KungFu/Mod_Role_KungFu1.fbx` |
| 人物纹理 | Blade `Tex_Role_KungFu1_Diffuse.png`；保留原白黑机偶外观 |
| Idle | Blade `Combat animations - Kung fu V1/Animations/IDLE.fbx`，战斗待机 |
| Walk | 同动画包 `IN PLACE/MOVE FORWARD IN PLACE.fbx`，武术前进步法 |
| Push | 本实验在相同骨架上新制：沿用原下肢步法，烘焙双臂/手部推姿；源仓库没有找到现成 push 文件 |
| 环境与货箱 | `tools/build_assets.py` 用 Blender 无头从几何体建模，固定随机种子 37 |

动画 FBX 的单位及参考姿势与模型不同。脚本按每帧世界骨姿转换到米，再烘焙到原角色骨架，不能直接复制局部旋转曲线。导出含 Idle、Walk、Push 三个真实骨骼动画片段。

2026-09-12 出差交接：用户要求保存并推送全部项目产物，原始定向快照已保存在本目录 `source-blade/`，含固定提交与哈希清单。建模脚本默认从仓库快照读取，也支持 `BLADE_SOURCE_ROOT` 环境变量。Blade 包含第三方资产，资源仓库的可访问性不等于单独再分发授权；正式发布前需按这些包原有许可处理。

## Blender 源文件与复现

`assets/wasteland.blend` 保留废土环境和正交 ISO 相机；`assets/blade-actor.blend` 保留人物与三个 NLA 动画轨。GLB 用于网页。`assets/collision.json` 是同一环境脚本生成的碰撞盒。

```powershell
# 已下载原始 Blade 资源后，可重新生成全部模型
& D:\Programs\Blender\blender.exe -b -t 4 --python experiments/wasteland-3d/tools/build_assets.py

# 独立实验打包 / 碰撞与相机数学检查
npm run 3d:build
node --test experiments/wasteland-3d/physics.test.mjs
```

输出目录是 `dist-wasteland-3d`。主游戏的 Vite 配置和构建入口不变。环境在浏览器按材质合并静态几何，避免数百个小物体产生数百次绘制。

## 实验边界

连续地面移动、箱体平移碰撞，没有网格吸附、连推多箱、刚体翻滚、跳跃、动态遮挡避让。Confiner 是这个 Web 实验的等价相机边界计算，不是 Unity Cinemachine 组件。原战斗姿态不等于最终废土角色；Push 是初版烘焙动作，未做针对各方向/箱高的实时手部 IK。
