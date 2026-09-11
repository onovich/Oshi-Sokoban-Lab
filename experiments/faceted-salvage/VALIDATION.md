# 第三版验证记录（2026-09-12）

- Blender 无头完成三轮几何细化与预览复查，最终日志 blender-build-v3-final.log，最终构建约 2 分 15 秒。
- 修复装甲外悬空剥落片、箱体新增面板遮住编号的问题。另用 render_details.py 渲染实际背部与头肩近景。
- 最终 T-pose FBX 经 Unity 无头重新导入：valid=true、human=true、mappedBones=52、errors=[]。
- validate_assets.mjs 检查五个 GLB：顶点色存在、位置边界为有限数值；角色为一个网格、52 个蒙皮关节，Idle / Walk / Push 动画完整，无 Blade / Mannequin 节点。结果在 assets/geometry-validation.json。
- 角色 62,602 三角面、约 7.25 MB；环境 113,510 三角面、约 12.06 MB。适用于当前单角色本地实验，未做移动端性能基准。
- 7 项移动与推箱测试通过，独立 Vite 构建通过，主包体积提示仍存在。
- 最终浏览器回归：编号可见，推行预览手掌贴住箱面；自动演示将 3 号箱从 z=0.80 推到 z=-4.24；错误与警告日志为空，本机近景显示约 60 FPS。
- 细节稿内置图像生成两次均网络失败，没有使用生成图作为建模验证依据。结构参数记录在 STRUCTURE-V3.md。

## 第二版基线

- Blender 5.2.1 无头生成资产并完成 Cycles 全景与角色近景渲染。
- Unity 2023.2.22f1 batchmode / nographics 实际导入 T-pose FBX：valid=true、human=true、mappedBones=52、errors=[]。报告在 assets/humanoid-validation.json。
- 浏览器成功加载环境、原创机械人和三类动态箱体；Idle / Walk / Push 三个片段存在，浏览器错误与警告日志为空。
- 实际点击演示推箱：角色到达 (-0.80,-3.00)，3 号箱从 (-0.80,0.80) 移动到 (-0.80,-4.24)，结束后回到待机。近景推行预览检查手掌与箱面接触。
- 7 项自动测试通过：出生点与真实推箱路线、箱体撞墙防穿透、箱体互阻与复位、L 形完整轮廓阻挡、固定障碍防穿透、沿墙滑动与边界、相机范围约束。
- 独立 Vite 生产构建通过，主包超过 500 kB 的体积提示仍存在。
- 本机浏览器观察约 60 FPS，未进行跨设备性能测试。

仅验证独立实验，未验收正式游戏玩法。Push 来自参考任务编制动作，不是 Blade 原包推箱片段；人物网格和纹理未复用。
