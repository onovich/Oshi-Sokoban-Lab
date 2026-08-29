# Oshi Unity Gate：视觉与渲染一手源码审计

调研日期：2026-08-28  
官方核验版本：[Oshi <code>4afe6809aaef0894b5f27b543dff84b437bebb45</code>](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)  
本地审计副本：<code>D:\UnityProjects\Oshi</code>，提交 <code>a41dba58d2009bcf2c30e5012cfb2f5f059b44ff</code>  
范围：只审计原版 Unity Gate 的模板、运行时 Renderer 绑定、材质 / Shader、纹理与可用视觉证据；不改动 Web 应用代码。

## 结论先行

原版 Gate 不是“带箭头的门”、也不是“双层空心矩形”。当前两种 Gate 都是一个 1×1 逻辑格上的**外侧细矩形边框 + 中央实心能量窗**：

- 同一张 16×16 白色 alpha Sprite 同时做 SpriteRenderer 的图形和 Portal Shader 的 <code>_Mask</code>。
- 像素审计结果：透明外边距 1px；外框为 <code>x/y = 1..14</code> 的 1px 空心方框；中央为 <code>x/y = 3..12</code> 的 **10×10 实心方块**；两者隔着 1px 透明沟。152 个非透明像素均为 <code>#FFFFFF</code>。因此 Web 不应把中心画成第二个轮廓。
- Orange Gate 与 Blue Gate 共享 Sprite、shape、白色主纹理、Portal Shader、速度 / 密度 / 强度参数；可见差异的主要一手来源是各自的 HDR <code>_Color</code> 材质参数。
- 运行时 Gate 根 Prefab 没有 Renderer。每个 shape cell 运行时实例化一个 <code>Mod_Cell</code>，实际 SpriteRenderer 在该 cell 的 <code>mesh</code> 子物体上；目前两种 Gate 都是一格，但代码本身按 shape 的每个 cell 重复生成。
- Portal 的动态不是 C# 每帧改材质，而是 Shader Graph 自己将 <code>Time × _Speed</code> 输入 Twirl，再驱动 Voronoi 细胞图案。源码没有 Gate 专用 Animator、视频纹理或方向图标。

## 证据强度与边界

| 等级 | 已确认内容 | 边界 |
| --- | --- | --- |
| A：一手绑定 | GateTM、实体 Prefab、<code>Mod_Cell</code>、材质、Shader Graph 和纹理 GUID 的完整链路。 | 可以确定几何、层级、纹理、参数和程序化动画结构。 |
| A：二进制资源审计 | 本地 <code>Spr_Gate_001.png</code> 的尺寸、alpha 像素位置与白色像素值。 | 它证明 mask 的形状，不证明 URP / 后期后每一帧的颜色。 |
| B：控制流推断 | 高 HDR 数值与项目全局 Bloom 说明 Gate 可能出现柔光。 | 仓库没有 Gate 的运行时截图，不能宣称精确 glow 半径、透明度或色调映射。 |

特别注意：Blue TM 的 <code>meshColor.a = 0</code>，而两个 Portal Material 的序列化 <code>_Color.a = 0</code>。Shader Graph 将一个向量乘积同时连接到 BaseColor 和 Alpha，但仓库没有生成后的 HLSL / 实机 Gate 帧来证实 Unity 的类型转换结果。**不要把这些序列化 alpha 直接翻译为 CSS <code>opacity: 0</code>。** 可确认的颜色依据应是 HDR <code>_Color</code> 的 RGB 比例和 shader 的 mask / 动画结构。

## 一、从 GateTM 到实际 SpriteRenderer 的绑定链

~~~text
SO_Gate_Orange_001 / SO_Gate_Blue_002  (GateTM)
  ├─ mesh       → Spr_Gate_001.png
  ├─ meshColor  → CellMod.SpriteRenderer.color
  ├─ meshMaterial → CellMod.SpriteRenderer.material
  └─ shapeArr   → 每一个 shape cell
                       ↓
GameFactory.Gate_Spawn → Entity_Gate（仅 GateEntity + cell_root）
                       ↓
GameGateDomain.Spawn  → GameCellDomain.Spawn(false)
                       ↓
Mod_Cell / 子物体 mesh 的 SpriteRenderer
  ├─ sprite = GateTM.mesh
  ├─ sorting layer = Gate
  ├─ color = GateTM.meshColor
  └─ material = GateTM.meshMaterial
~~~

### 1. GateTM 的数据合同

<code>GateTM</code> 只声明 <code>typeID</code>、名称、<code>Sprite mesh</code>、<code>Color meshColor</code>、<code>Material meshMaterial</code> 和 <code>ShapeTM[]</code>。

- 本地：<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Infra_Templates\Model\GateTM.cs:6-15</code>
- 官方：[GateTM.cs:6-15](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/GateTM.cs#L6-L15)

这两个模板并非只在编辑器中留存：<code>TM_Gate</code> Addressables group 以 <code>SO_Gate_Orange_001</code> 和 <code>SO_Gate_Blue_002</code> 为条目，<code>TemplateInfra</code> 用标签 <code>TM_Gate</code> 异步加载全部 <code>GateTM</code> 并加入运行时模板上下文。

- 本地：<code>D:\UnityProjects\Oshi\Assets\AddressableSetting\AssetGroups\TM_Gate.asset:13-31</code>、<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Infra_Templates\TemplateInfra.cs:90-97</code>
- 官方：[TM_Gate.asset:13-31](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/AddressableSetting/AssetGroups/TM_Gate.asset#L13-L31)、[TemplateInfra.cs:90-97](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/TemplateInfra.cs#L90-L97)。

当前有两个实际模板：

| 模板 | 绑定的 Sprite / Material | 形状与明确数据 |
| --- | --- | --- |
| Orange Gate，<code>typeID: 1</code> | <code>Spr_Gate_001.png</code> + <code>Mat_Portal_Orange.mat</code> | <code>meshColor = (1,1,1,1)</code>，shape 是 1×1、一格 <code>(0,0)</code>。 |
| Blue Gate，<code>typeID: 2</code> | 同一 Sprite + <code>Mat_Portal_Blue.mat</code> | <code>meshColor = (1,1,1,0)</code>，shape 同样为 1×1、一格 <code>(0,0)</code>。 |

- 本地：<code>D:\UnityProjects\Oshi\Assets\Templates_Runtime\Gate\SO_Gate_Orange_001.asset:13-21</code>、<code>...\SO_Gate_Blue_002.asset:13-21</code>、<code>...\Templates_Runtime\Shape\TM_Shape_006.asset:13-17</code>
- 官方：[Orange TM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/SO_Gate_Orange_001.asset#L13-L21)、[Blue TM](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/SO_Gate_Blue_002.asset#L13-L21)、[Shape 006](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Shape/TM_Shape_006.asset#L13-L17)。

Map 013 实际引用 Orange 和 Blue 两个模板，并把它们互相连为 next gate；这证明两个视觉变体不是未使用的库存资源。

- 本地：<code>D:\UnityProjects\Oshi\Assets\Templates_Runtime\Map\SO_Map_013.asset:55-62</code>
- 官方：[SO_Map_013.asset:55-62](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Map/SO_Map_013.asset#L55-L62)。

### 2. Gate 根对象只是容器，真正 Renderer 在生成的 cell

<code>GameFactory.Gate_Spawn</code> 通过 <code>Entity_GetGate()</code> 实例化 Gate 根对象、复制 shape；随后 <code>GameGateDomain.Spawn</code> 遍历 shape，逐 cell 创建 <code>Mod_Cell</code>，并按固定次序设置 Sprite、排序层、颜色和材质。

- Gate 根创建与 shape：本地 <code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Business_Game\GameFactory.cs:242-289</code>；官方：[GameFactory.cs:242-289](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/GameFactory.cs#L242-L289)。
- 逐 cell 的四项绑定：本地 <code>...\Business_Game\Domains\GameGateDomain.cs:7-36</code>；官方：[GameGateDomain.cs:7-36](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGateDomain.cs#L7-L36)。
- <code>Entity_Gate.prefab</code> 只含 GateEntity 与 <code>cell_root</code> Transform，没有 SpriteRenderer：本地 <code>D:\UnityProjects\Oshi\Assets\Resources_Runtime\Entities\Entity_Gate.prefab:1-84</code>；官方：[Entity_Gate.prefab](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Entities/Entity_Gate.prefab)。
- <code>Mod_Cell.prefab</code> 的 <code>mesh</code> 子物体才持有 SpriteRenderer：本地 <code>D:\UnityProjects\Oshi\Assets\Resources_Runtime\Mods\Mod_Cell.prefab:35-134</code>；官方：[Mod_Cell.prefab](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Mods/Mod_Cell.prefab)。
- <code>CellMod</code> 的实际属性赋值：本地 <code>...\Entities_Game\Cell\CellMod.cs:48-65</code>；官方：[CellMod.cs:48-65](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Cell/CellMod.cs#L48-L65)。

排序层也不是猜测：<code>GameGateDomain</code> 显式设为 <code>Gate</code>；项目层表将 Gate 放在 Spike 之后、Role 和 Wall 之前。

- 本地：<code>D:\UnityProjects\Oshi\Assets\Scripts_Runtime\Common\Const\SortingLayerConst.cs:5-13</code>、<code>D:\UnityProjects\Oshi\ProjectSettings\TagManager.asset:43-75</code>
- 官方：[SortingLayerConst.cs:5-13](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Common/Const/SortingLayerConst.cs#L5-L13)、[TagManager.asset:43-75](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/ProjectSettings/TagManager.asset#L43-L75)。

## 二、Sprite / Mask 的真实几何

资源：<code>D:\UnityProjects\Oshi\Assets\Templates_Runtime\Gate\Spr_Gate_001.png</code>。  
官方：[Spr_Gate_001.png](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/Spr_Gate_001.png)。

对该 PNG 进行本地只读像素审计所得：

| 项目 | 已验证值 | Web 含义 |
| --- | --- | --- |
| 尺寸 | 16×16 px | 设计坐标可直接按 16 单位建 SVG viewBox。 |
| 不透明像素 | 152 个，全部 <code>RGBA(255,255,255,255)</code> | 原始图形不携带蓝 / 橙色；颜色来自材质。 |
| 外框 | <code>x=1..14, y=1..14</code> 的 1px 空心矩形 | 绘制一条薄、无填充的外边框。 |
| 中央能量窗 | <code>x=3..12, y=3..12</code> 的实心 10×10 方块 | 中心必须是色彩 / 纹理填充面，而非第二条 outline。 |
| 导入 | 单 Sprite、中心 pivot、<code>spritePixelsToUnits: 16</code>、point filter、透明 alpha | 单位逻辑格与 16px 容器对齐；无需九宫格拉伸。 |

导入参数的一手来源：本地 <code>...\Templates_Runtime\Gate\Spr_Gate_001.png.meta:35-57</code>；官方：[Spr_Gate_001.png.meta:35-57](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/Spr_Gate_001.png.meta#L35-L57)。

## 三、Portal Material 与 Shader Graph

### 1. 两种材质的实际差异

两个 material 都绑定相同的 <code>Shader_Portal</code>、相同的 <code>_MainTex</code>（<code>Img_Common_WhiteRect.png</code>，本地像素审计为 1×1 纯白）和相同的 <code>_Mask</code>（<code>Spr_Gate_001.png</code>）。速度、扭曲强度、Voronoi 密度、亮度指数完全相同；只有 <code>_Color</code> 的 HDR RGB 数值不同。

| 属性 | Orange | Blue | 视觉作用（由 graph 连线确认） |
| --- | ---: | ---: | --- |
| <code>_Speed</code> | 0.5 | 0.5 | 时间驱动的 Twirl offset。 |
| <code>_Strength</code> | 8 | 8 | Twirl 强度。 |
| <code>_Denstity</code>（源码拼写） | 2 | 2 | Voronoi <code>Cells</code> 输入。 |
| <code>_Brightness</code> | 2 | 2 | Voronoi Cells 的 Power 指数。 |
| <code>_Color</code> | <code>(144.98065, 41.22311, 0, 0)</code> | <code>(29.475334, 89.63017, 109.62756, 0)</code> | 最终图形相乘的 HDR tint；前者趋红橙，后者趋青蓝。 |

- 本地：<code>D:\UnityProjects\Oshi\Assets\Resources_Runtime\Material\Mat_Portal_Orange.mat:16-69</code>、<code>...\Mat_Portal_Blue.mat:16-69</code>
- 官方：[Orange material](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Mat_Portal_Orange.mat#L16-L69)、[Blue material](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Mat_Portal_Blue.mat#L16-L69)。

### 2. Shader 的可验证数据流

<code>Shader_Portal.shadergraph</code> 是 URP Unlit target；它的 fragment context 只有 BaseColor 和 Alpha，没有独立 Emission block。target 序列化为 <code>m_SurfaceType: 1</code>、<code>m_AlphaClip: false</code>，并将最终乘积同时接入 BaseColor 与 Alpha。

- Target：本地 <code>D:\UnityProjects\Oshi\Assets\Resources_Runtime\Material\Shader_Portal.shadergraph:1402-1421</code>。
- Fragment 输出与边：本地 <code>...Shader_Portal.shadergraph:105-388</code>。
- 官方：[Shader_Portal.shadergraph](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L105-L388)。

从 Graph 的节点和连线可还原为下列结构（这是结构化描述，不声称浏览器会得到 Unity 的逐像素结果）：

~~~text
Time × _Speed ──→ Twirl(UV0, center=(0.5,0.5), strength=_Strength)
                       ↓
                 Voronoi(cells=_Denstity)
                       ↓
                   Power(exponent=_Brightness)

Sample(_MainTex, UV0) × Sample(_Mask, UV0) × 上述细胞场 × _Color
                       └──────────────→ BaseColor 与 Alpha
~~~

各属性的图内定义可直接核验：

- <code>_Mask</code>：本地 <code>:930-958</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L930-L958)。
- <code>_Color</code>：本地 <code>:1083-1111</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L1083-L1111)。
- <code>_MainTex</code>：本地 <code>:1559-1587</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L1559-L1587)。
- <code>_Strength</code>：本地 <code>:1819-1845</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L1819-L1845)。
- <code>_Speed</code>：本地 <code>:2389-2415</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L2389-L2415)。
- <code>_Brightness</code>：本地 <code>:2473-2499</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L2473-L2499)。
- <code>_Denstity</code>：本地 <code>:2848-2878</code>；[官方](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph#L2848-L2878)。

因此应把 Gate 视觉描述为“**被外框 + 中央实心 mask 裁剪的、缓慢旋动的细胞噪声能量**”，而不是纯色空框、图片贴图滚动或发光箭头。检索整个运行时 C# 树未发现 <code>_Speed</code> / <code>_Strength</code> / <code>_Brightness</code> / <code>_Denstity</code> 的运行时写入，动画依据就是 graph 的 Time node。

项目确有全局 Bloom（threshold 1、intensity 0.3、高质量过滤），且 Portal material 的 RGB 值远高于 1；这支持“可能有柔光”的判断，但没有 Gate 实机帧可校准具体 CSS shadow。

- 本地：<code>D:\UnityProjects\Oshi\Assets\URPSetting\Global Volume Profile.asset:83-106</code>
- 官方：[Global Volume Profile.asset:83-106](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/URPSetting/Global%20Volume%20Profile.asset#L83-L106)。

## 四、可复刻为 Web / CSS / SVG 的分层合同

| 层 | 应复刻的元素 | 不应臆造的元素 |
| --- | --- | --- |
| Geometry / mask | 16-unit viewBox；外框 <code>(1,1)-(14,14)</code>、约 1/16 宽 stroke；中央实心 rect <code>(3,3)-(12,12)</code>。 | 第二条空心内框、方向箭头、门把手、整格实色底板。 |
| Energy fill | 将同一 mask 用作 SVG <code>&lt;mask&gt;</code> / CSS mask；内部使用低频“细胞 / Voronoi”明暗斑块，并让它围绕中心缓慢扭动或旋转。 | 全屏雨、粒子喷射、独立视频或随玩法状态跳动的材质参数。 |
| Variant tint | 用一套共享组件；Orange 取红橙倾向，Blue 取青蓝倾向。CSS 应把 HDR 数值经过人工色调映射后再定色，不把原始浮点 RGB 当 CSS RGB。 | 把 Orange / Blue 做成不同 icon 或不同门洞结构。 |
| Glow | 只对 mask 可见部分施加克制的 <code>drop-shadow</code> / SVG glow，作为全局 Bloom 的近似；在 <code>prefers-reduced-motion</code> 下冻结能量纹理。 | 大面积霓虹、模糊到遮盖外框，或断言与 Unity 后期像素完全一致。 |
| Stacking | Gate 位于 Spike 之上、Role 与 Wall 之下；多 cell Gate 时每个 shape cell 复用同一 glyph。 | 让 Gate 覆盖角色、墙或 VFX。 |

推荐的最小 SVG 分层是：<code>gate-root → outer-stroke + core-rect（共同作为 mask）→ masked energy field → optional subtle glow</code>。这样既保留了原图的“外框 + 实心 portal core”，也把 Shader Graph 的 Twirl / Voronoi 语义放在可维护的浏览器实现中。

## 五、截图 / 场景证据的实际结果

当前官方固定版本中：

- <code>Assets/Resources_Sample</code> 只有一张完整游戏帧 <code>cover.jpg</code>（1828×1250）；可见的是 First Puzzle 的角色、Block、Goal、Wall 与雨，不含 Gate。
- 当前 <code>docs/cover.png</code>（1280×640）也是 README 展示封面，嵌入同一类 First Puzzle 画面，同样不含 Gate。
- Modifier 的 <code>GateEditorEntity.OnDrawGizmos</code> 仅把 <code>gateTM.mesh.texture</code> 画为编辑器 Gizmo；它不使用 <code>meshMaterial</code>，不能作为 Portal Shader 最终效果的证明。

因此，仓库的一手证据足以重建 Gate 的**结构、层级、纹理 mask、程序化动画与色相关系**，但不足以声称获得了原版 Gate 的一张完整运行时截帧。Web 版应把 glow、浏览器色调映射和动画幅度标记为“受源码约束的近似”。

- 样例帧：[Assets/Resources_Sample/cover.jpg](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Sample/cover.jpg)
- README 封面：[docs/cover.png](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/docs/cover.png)
- 编辑器 Gizmo：本地 <code>D:\UnityProjects\Oshi\Assets\Scripts_Modifier\GateEditorEntity.cs:28-51</code>；官方：[GateEditorEntity.cs:28-51](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Modifier/GateEditorEntity.cs#L28-L51)。

## 一手来源索引

- [固定官方提交](https://github.com/onovich/Oshi/commit/4afe6809aaef0894b5f27b543dff84b437bebb45)
- [Gate TM 模型](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Infra_Templates/Model/GateTM.cs)
- [Gate 运行时 cell 生成与绑定](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameGateDomain.cs)
- [Orange Gate 模板](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/SO_Gate_Orange_001.asset)
- [Blue Gate 模板](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/SO_Gate_Blue_002.asset)
- [Gate Sprite / mask](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/Spr_Gate_001.png)
- [Orange Portal material](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Mat_Portal_Orange.mat)
- [Blue Portal material](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Mat_Portal_Blue.mat)
- [Portal Shader Graph](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)
