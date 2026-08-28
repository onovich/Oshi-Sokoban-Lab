# Oshi Unity 视觉资源 → Web SVG 复刻依据

调研日期：2026-08-28  
核验版本：Oshi `4afe6809aaef0894b5f27b543dff84b437bebb45`

## 结论

Web 棋盘不应继续套用通用的 Unicode 符号或把每个对象染成不同格色。Oshi 的 Unity 实现本身已经采用了更合适的分层：**极简实体 Sprite / Mesh**、**材质颜色**以及**独立的 Portal / Rain 效果层**。

本项目据此重绘原创 SVG；不复制或分发原 PNG、材质或 Shader。图形构造的参考依据如下。

| Oshi 原资源 | 可核验结构 | Web SVG 对应 |
| --- | --- | --- |
| `Block/Spr_Block_001.png` + `Role/Spr_Role_001.png` | 都是单像素纯色 Sprite；对应 ScriptableObject 把 Role 定义为 `Cube`，普通 Block 为白色 mesh。 | 黄色小方块角色（内部方向切口）；带轻微明暗面的白色 Block。 |
| `Block/Spr_Block_Fake_100.png` | 单像素灰色，Fake 的数据颜色约为 `#6c6c6c`。 | 灰色实体方块，加交叉切口作为“Fake”状态笔画。 |
| `Goal/Spr_Goal_001.png` | 16×16 四角框。 | 四角 Goal 框；`G2` 作为橙色角标。 |
| `Goal/Spr_Goal_002.png` | 16×16 外框内的斜线纹。 | 地面 Goal 的金色框与斜线纹；它是地形层，不是物件的格色。 |
| `Gate/Spr_Gate_001.png` | 16×16 双层矩形框；模板有蓝、橙两种 Gate 材质。 | 蓝 / 橙双层 Gate，内置出口方向箭头。 |
| `Spike/Spr_Spike_001.png` | 16×16 红色四向 X 形刺，而非单个三角警告符。 | 红色 X 形 Spike；移动时叠加虚线路径环。 |
| `Wall/Spr_Wall_001.png` + `SO_Wall_001.asset` | 粗边空心框；数据里 `lineWidth: 0.125`。 | 高对比双层空心 Wall 框。 |
| `Shader_Portal.shadergraph` / `VFX_Rain.prefab` | Portal 和 Rain 都是独立效果资源。 | Gate 保持独立图标层；Rain 是整盘低对比斜线叠层，不替换每一格的地形底色。 |

## Web 渲染合同

1. **地形层**：普通地面、Wall 所在表面、Terrain Goal 只表达棋盘结构。
2. **实体层**：角色、Block、Fake、Goal、Gate、Spike 都使用可缩放 SVG。
3. **状态层**：Fake 用交叉切口；可推动 Goal 用四向短箭头；移动 Spike 用虚线路径环；编号使用同一橙色角标。
4. **环境层**：Rain 只有蓝色细雨纹与外框，不通过重新染色来覆盖上述信息。

实现入口为 `src/components/GameGlyph.tsx`，棋盘只负责将规则状态映射到 glyph，不包含具体路径几何。

## 一手来源

- [Oshi 官方模板资源目录](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime)
- [Block 模板](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Block)
- [Goal 模板](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Goal)
- [Gate 模板](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate)
- [Spike 模板](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Spike)
- [Wall 模板](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Wall)
- [Portal Shader Graph](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)
- [Rain VFX](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/VFX/VFX_Rain.prefab)
- [Oshi MIT 许可证](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/LICENSE)
