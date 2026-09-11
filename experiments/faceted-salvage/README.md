# 切面废土 · 第三版

最新补充原画已经过 subagent 出稿、主 agent 多轮退回和验收：采用 [角色三视图 v4](art-review/turnaround-v4.png) 与 [关节运动稿 v5](art-review/joints-v5.png)。见 [采用范围](art-review/ACCEPTED.md) 和 [逐版验收记录](art-review/REVIEW.md)。这些稿件尚未应用到当前 Demo 模型。

后续补充：结构细节稿已重试成功，见 [construction-study-v1.png](construction-study-v1.png) 和 [尺寸说明](CONSTRUCTION-STUDY.md)。新稿尚未应用到第三版模型。

独立的美术、Humanoid 动画与连续推箱实验，参考 `../wasteland-art-directions-20260911/01-faceted.png`。未接入正式游戏关卡、胜负、传送或尖刺重置规则。

第三版继续细化肩膝肘的连接件、薄盖板、六角紧固件、背部检修盖与分段液压杆；墙体改成连续断裂的混凝土网格，增加露筋、剥落、钢柱锚固与斜撑；箱体增加凹板、提手、铆钉和加强筋。保留原有骨架与动作、移动和推箱功能。结构尺寸、连接方式及未完成项见 [STRUCTURE-V3.md](STRUCTURE-V3.md)。

实际模型近景：robot-detail.png、robot-back.png、robot-head.png；全景：blender-preview.png。上一版渲染与脚本保存在 revisions/v2/。细节稿曾通过内置 image_gen 尝试两次，均遇到网络错误；交付近景为 Blender 实际几何渲染。

## 运行

双击项目根目录的 Open-Faceted-Salvage.cmd，打开 http://127.0.0.1:5188/ 。

- WASD / 方向键移动，接触箱面后继续按方向即可推动。
- 单箱、L 形箱和空心箱均可推动；R 复位角色和全部箱子。
- 「演示推箱」自动演示并切到近景跟随，方向键可接管。
- 右键旋转、滚轮缩放；自由观察模式中键平移。
- 动作观察可分别预览待机、行走和推行。

箱体不能穿墙、离开场地或穿过其他箱体。L 形箱按三个单元的完整形状碰撞，空心箱按外轮廓碰撞。不支持旋转、拉箱或链式推动。

## 模型与动作

第二版重做人体比例、楔形头盔、收腰胸甲、分层关节、手指和装甲板；场景加入破损混凝土、钢梁、碎石、剥落色块及不规则湿地。采用顶点色、平面法线、实时阴影和 SSAO。

全部网格通过 Blender 无头脚本生成。只加载参考任务的骨架与动作，没有加载其人物网格或纹理。

Humanoid 是骨架与重定向标准，不规定模型画风。自建骨架采用 52 根标准映射骨骼和 T-pose，已通过 Unity 实际导入验证：Avatar 有效且为 Humanoid。机械装甲使用刚性单骨骼权重。

动作来自参考任务 01a08d0f-e888-7e21-b2a2-a660147fb19a 的 ../wasteland-3d/assets/blade-actor.blend。Idle / Walk 来自该任务使用的 Blade KungFu 动作，保留其战斗姿态。Push 是参考任务编制的推行片段，使用原行走下肢节奏，并非 Blade 原包提供的推箱动作。本次按解剖朝向重定向到自建骨架，做脚底高度与推行手掌接触校正。

assets 中包含：

- faceted-salvage.blend：完整可编辑场景与角色。
- robot.glb：原创机械人及 Idle / Walk / Push。
- environment.glb、crate.glb、l-cargo.glb、dummy.glb：环境及分离箱体。
- SalvageHumanoid-Tpose.fbx、SalvageHumanoid-Animated.fbx：标准骨架模型及动画版。
- humanoid-map.json、humanoid-validation.json：映射和 Unity 验证报告。
- motion-provenance.json：动作来源、源文件 SHA256 和重定向记录。
- collision.json：与建模坐标一致的碰撞数据。

## 重建与验证

```powershell
& 'D:\Programs\Blender\blender.exe' -b --python experiments/faceted-salvage/tools/build_scene.py -- --render
node --test experiments/faceted-salvage/movement.test.js
npx vite build --config experiments/faceted-salvage/vite.config.js
```

固定随机种子 701；重建覆盖本实验资产，手工修改前请另存副本。省略 -- --render 跳过离线预览。预览在 blender-preview.png 和 robot-detail.png。Unity 验证入口为 unity/ValidateHumanoid.cs，第一版备份在 revisions/v1/。

画面是程序建模的风格化近似，尚未实现运行时足部锁定、墙体自动淡出及针对任意箱高的动态手部 IK。详细验收见 VALIDATION.md。
