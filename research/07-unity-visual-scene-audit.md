# Oshi Unity 最终画面审计：从真实帧反推 Web 视觉合同

调研日期：2026-08-28  
核验版本：Oshi `4afe6809aaef0894b5f27b543dff84b437bebb45`  
审计范围：真实截图、Unity Scene / Prefab、材质、Shader、VFX、相机与运行时图层；不讨论 VN 叙事。

## 结论先行

之前只根据 16×16 图标模板来重绘，导致 Web 版看起来像“深色网格 + 一套通用 SVG 图标”，而不是 Oshi。仓库内其实有一张**真实的游戏画面**：[`Assets/Resources_Sample/cover.jpg`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Sample/cover.jpg)。它应当成为视觉复刻的第一基准。

原作的视觉语法是：**全屏近黑舞台 + 透明棋盘空间 + 细白地图边框 + 连通的白色墙线 + 极简纯色几何 + 受状态驱动的 Bloom + 全屏雨层**。它不是“每格都有底色、每种机制都有一个说明性图标”的系统。

因此，下一轮 Web 版应当优先做如下纠偏：

1. 移除普通格子的显式网格、填色和卡片感；逻辑格仍存在，但默认不可见。
2. 角色是**无内部符号的亮黄方块**，Block 是纯白方块；不要额外添加朝向箭头、立体面或 emoji 式语义。
3. Wall / Terrain Wall 必须按相邻格合并为连续的白色轮廓，而不是每格一个独立“墙图标”。
4. Rain 是覆盖整个舞台的天气状态，不能只把棋盘或单元格染蓝。
5. Portal 应保持“双矩形门框 + 动态纹理/扰动”的抽象形态；不要塞入方向箭头。
6. 讲解面板可以作为学习版附加层存在，但不能取代游戏画面本身的主视觉。

## 证据等级与边界

| 等级 | 证据 | 能可靠说明什么 | 不能说明什么 |
| --- | --- | --- | --- |
| A | [`Assets/Resources_Sample/cover.jpg`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Sample/cover.jpg)，1828×1250 | 实际帧的构图、深色舞台、无格线棋盘、雨滴、白/黄 Bloom、边框、低对比 HUD。 | Gate、Spike 等未出现在这张帧中的最终动态外观。 |
| A | [`docs/cover.png`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/docs/cover.png) | 官方 README 的同一套白墙、白 Block、黄角色、深色背景语言。 | 这是宣传排版，不是完整 HUD 帧。 |
| A | [`MainEntry.unity`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Scene/MainEntry.unity)、[`Global Volume Profile`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/URPSetting/Global%20Volume%20Profile.asset) | 相机、HDR、Bloom、Vignette 是运行时配置，而非宣传图的后期猜测。 | 不等于某个截图时的逐像素调色结果。 |
| A | 运行时 Prefab / 模板 / Shader / VFX 源码 | 每种对象实际引用的 Sprite、材质、绘制层和动画参数。 | Unity Shader Graph 在浏览器中的像素级输出。 |

仓库中未发现第二张完整游戏截图、公开视频或可直接比对的发行版。因此 Gate 的噪声纹理、死亡 VFX 与相机运动只能以源码参数为依据，Web 实现须称为“受源码约束的近似”，而不能宣称像素级还原。

## 真实游戏画面读取

`Resources_Sample/cover.jpg` 是最有价值的证据。可观察到：

- 画面是一个 16:9 倾向的全屏深灰 / 近黑场景，四角明显压暗；棋盘不是嵌在浅色文档卡里。
- 棋盘内部没有行列网格，也没有“每个地块一个填色方块”。只用一条细白外框定义地图边界。
- 墙由相连的白色细线构成轮廓；内部仍是暗色，因此玩家读取的是**墙体拓扑**而不是一排独立小图标。
- Goal 是四角留缺口的白色方框。完成时的白 Block 有明显的柔和白晕；角色是明黄实心方块，也有黄晕。
- 雨是稀疏、很长的灰白斜线，覆盖棋盘外的大背景和棋盘区域；右下角 HUD 同样被压低对比度，而不是另起一套“蓝色格子皮肤”。
- 标题使用低饱和无衬线大写字与下划线，按键提示也极克制。这与网页当前偏编辑杂志感的高对比大标题并不相同。

这解释了为什么“换几套图标库”不会提升还原度：原作的辨识度来自空间与材质层级，而不是线性图标的语义密度。

## Unity 场景与后期：可直接复用的参数

### 相机、背景与后期

[`MainEntry.unity`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Scene/MainEntry.unity) 配置了正交主相机（`orthographic: 1`、`orthographic size: 11.25`、位置 `z: -10`），并开启 `HDR` 与 `m_RenderPostProcessing: 1`。初始清屏色是约 `#323232`。

[`Global Volume Profile`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/URPSetting/Global%20Volume%20Profile.asset) 还给出：

| 后期 | 原始参数 | Web 对应 |
| --- | --- | --- |
| Bloom | `threshold: 1`、`intensity: 0.3`、高质量过滤开启 | 用少量 `drop-shadow` / `box-shadow` 只强化角色、Goal、完成 Block、Spike；不能给每个 UI 元素都加光。 |
| Vignette | 黑色，`intensity: 0.31`，`smoothness: 1` | 舞台最外层使用径向渐变压暗边缘。 |
| Film Grain | 已关闭 | 不要擅自叠重颗粒，截图的质感主要来自暗场、压缩与 Vignette。 |

### 天气不等于“变更格子色”

[`SO_GameConfig.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/GameConfig/SO_GameConfig.asset) 和 [`GameWeatherDomain.cs`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameWeatherDomain.cs) 说明：

- Normal camera color：`#333333`；
- Rain camera color：`#00B0FF`；
- Rain 对全局色彩过滤使用 `#8C8C8C`；
- 进入雨天会播放 [`VFX_Rain.prefab`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/VFX/VFX_Rain.prefab)，并直接改变**相机背景**。

这与真实截图的暗色雨天存在表面差异（截图没有呈现纯青背景），因此 Web 不应机械填充 `#00B0FF`。可靠的还原方式是：维持棋盘地形和实体的形状/颜色不变，把雨实现为舞台级的蓝灰环境渐变加前景斜线；是否强调青色背景应在视觉回归截图中再调整。

Rain Prefab 的粒子参数可作动画密度上限参考：生命周期 5 秒、速度 25、尺寸 0.05、发射率 20、宽度约 30、`LengthScale: 2`，并被置于 `VFX` 层。浏览器版本应使用稀疏的 CSS/SVG 雨线和 `prefers-reduced-motion` 回退，不必模拟上千 Unity 粒子。

## 棋盘不是格子：地图边框与墙体拓扑

### 外边框

[`Entity_Map.prefab`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Entities/Entity_Map.prefab) 的 `mesh` 使用 `Spr_MapBorder_001.png`。该 Sprite 是 16×16、仅一像素宽的白色空心矩形；[`MapEntity.Mesh_SetSize`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Map/MapEntity.cs) 将它拉伸至 `mapSize + 8/32`，再向左下偏移半个地图尺寸。

Web 合同：以整张地图的 `::before` 绘制一条 1–2px 的浅灰白描边；不要用每格 border 拼成“表格”。

### 墙体

[`SO_Terrain_Wall_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Terrain/SO_Terrain_Wall_001.asset) 接到 Rule Tile；其 40 张 `Spr_Terrain_001_*` 根据相邻地形自动选择外沿。普通 [`SO_Wall_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Wall/SO_Wall_001.asset) 同样是白线轮廓（`lineWidth: 0.125`），并放在更高绘制层。

Web 合同：保留逻辑上“一格墙”的数据模型，但渲染时从四邻接计算上、右、下、左四条边；仅绘制暴露在空气一侧的边。连续相邻的墙会成为一个连通的白色轮廓，正是截图中大型墙体的来源。

## 当前源码实际引用的对象外观

下面的表优先列出**当前 ScriptableObject 真正引用的资源**，避免被同目录但未被模板使用的旧 Sprite 误导。

| 对象 / 状态 | 当前源码的直接依据 | 应呈现的 Web 形式 |
| --- | --- | --- |
| 角色 | [`SO_Role_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Role/SO_Role_001.asset) 引用 1×1 `#FCFF00` Sprite 与 `Mat_Bloom_Yellow`；名称也是 `Cube`。 | 无箭头、无面部、无立体面的亮黄正方形，带柔黄外晕。 |
| 普通 Block | [`SO_Block_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Block/SO_Block_001.asset) 是白色 1×1 Sprite；[`GameBlockDomain`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameBlockDomain.cs) 仅在完整落入 Goal / Terrain Goal 后改为 Bloom 材质。 | 正常是纯白方块；完成时才加白色 glow。不要永远发光。 |
| Fake Block | 同一模板的 `fakeColor` 为约 `#6C6C6C`，不走 Bloom。 | 低亮灰方块即可；不要附加“叉号”这种源代码中不存在的解释符。 |
| 普通 Goal / Terrain Goal | [`SO_Goal_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Goal/SO_Goal_001.asset) 和 [`Tile_Terrain_Goal_003.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Terrain/Tile_Terrain_Goal_003.asset) 都引用 `Spr_Goal_001.png`。 | 四角留缺口的白色目标框；这是地形/物件层属性，不用填充整格背景。 |
| 可推 Goal | [`SO_Goal_CanPush_100.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Goal/SO_Goal_CanPush_100.asset) 引用黄色的 `Spr_Goal_100.png` 与黄 Bloom。 | 黄色四角目标框；不要绘制四向箭头。 |
| Spike | [`SO_Spike_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Spike/SO_Spike_001.asset) 实际引用的是 128×128 的 `Spr_Spike_004.png`，搭配 `Mat_Bloom_Red`。 | 近似 12 角的红色爆裂星，带短红晕；不是红色 X，也不是警告三角。 |
| Portal / Gate | [`SO_Gate_Blue_002.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/SO_Gate_Blue_002.asset) / [`SO_Gate_Orange_001.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/Gate/SO_Gate_Orange_001.asset) 都用双矩形 `Spr_Gate_001.png`，材质为 Portal shader。 | 双层矩形框中显现蓝/橙动态能量；不要加出口方向箭头。 |
| 编号 | `Number Block` 的字色为黑，`Number Goal` 是白色 Bloom；标准 Block 模板也允许橙色编号。 | 数字是对象上的文字层，而非另一个地块颜色。用小号无衬线文本，按实体层叠放。 |

### 两处需要更正的旧推断

1. `Goal/Spr_Goal_002.png` 的确是斜线纹矩形，但在该版本的 Template / Terrain / Prefab 引用图中没有找到其 GUID `5eeb65e88a8ff4a68ac13a2b3f570ea3`。当前普通 Goal 与 Terrain Goal 实际都使用四角框 `Spr_Goal_001.png`。因此不能把斜线格当成当前原作的 Terrain Goal 主视觉。
2. `Spike/Spr_Spike_001.png` 是红色 X，但当前 `SO_Spike_001/002` 实际引用 GUID `1f83bcec…` 的 `Spr_Spike_004.png`，即红色锯齿爆裂星。Web 版本应以“实际引用”优先。

这两项更正覆盖 [`06-unity-glyph-source-audit.md`](06-unity-glyph-source-audit.md) 中相应的视觉结论。

## 层级合同

[`TagManager.asset`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/ProjectSettings/TagManager.asset) 声明的实际排序为：

```text
Back Ground → Terrain → Goal → Block → Spike → Gate → Role → Wall → VFX → UI
```

这是用两套视觉语法而不互相打架的关键：

- 地图边框和墙是空间/拓扑语法；
- Goal、Block、Role、Spike、Gate 是对象语法；
- Bloom、Portal 扰动、雨是状态/环境语法；
- 编号与按键说明是文字语法。

Web renderer 应显式建这几个层，而不是用一个 Cell 里同时塞底色、图标、徽标、纹理和雨效。这样雨天才可与 Gate、Goal、数字兼容。

## Portal 的可信 Web 近似

[`Shader_Portal.shadergraph`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph) 可见 `Voronoi`、`Twirl`、`Cosine Time`、`Sine Time`、`Speed`、`Strength`、`Brightness`、`Denstity` 节点；[`Mat_Portal_Blue.mat`](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Mat_Portal_Blue.mat) 的主要值为 `Speed: 0.5`、`Strength: 8`、`Brightness: 2`、`Denstity: 2`（橙色材质同构）。

不建议在 Web 里假装完整重写该 Shader Graph。可信且可维护的近似是：

- 用 SVG/CSS 复刻双矩形 mask；
- 内部使用两层低频、缓慢反向移动的 radial / conic gradient；
- 使用蓝 / 橙高亮与小范围发光；
- 在 `prefers-reduced-motion` 下冻结纹理；
- 绝不把动态扰动替换成与机制无关的“传送门箭头”。

## 建议的 Web 实施顺序

1. **先重做舞台而不是单个 icon**：全屏暗色容器、Vignette、响应式棋盘、低对比 HUD；常规学习信息移至可折叠侧栏/抽屉。
2. **重做 Board 的拓扑渲染**：隐藏空格子；单独画 map border；由墙邻接生成连续轮廓。
3. **按当前引用资源重做 glyph**：无箭头黄 Cube、白 Block、四角 Goal、黄四角可推 Goal、红爆裂 Spike、双框 Portal。
4. **做状态材质层**：完成 Block 白 glow、角色黄 glow、Spike 红 glow、Gate 动态能量、全视口 Rain。
5. **做视觉回归**：至少固定 16:9、较窄桌面、雨天、Gate/Spike/编号共存四种状态截图，与 `Resources_Sample/cover.jpg` 的空间、对比和层级对照，而不是只检查 DOM 是否有 SVG。

## 一手来源索引

- [官方 Oshi 仓库（固定审计提交）](https://github.com/onovich/Oshi/tree/4afe6809aaef0894b5f27b543dff84b437bebb45)
- [真实游戏帧：Resources_Sample/cover.jpg](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Sample/cover.jpg)
- [README 宣传封面：docs/cover.png](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/docs/cover.png)
- [主场景](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Scene/MainEntry.unity) 与 [全局后期](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/URPSetting/Global%20Volume%20Profile.asset)
- [地图实体与尺寸算法](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Entities_Game/Map/MapEntity.cs)
- [天气域逻辑](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Scripts_Runtime/Business_Game/Domains/GameWeatherDomain.cs) 与 [游戏配置](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Templates_Runtime/GameConfig/SO_GameConfig.asset)
- [雨 VFX](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/VFX/VFX_Rain.prefab) 与 [Portal Shader Graph](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)
- [渲染排序层](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/ProjectSettings/TagManager.asset)
- [项目许可证（MIT）](https://github.com/onovich/Oshi/blob/4afe6809aaef0894b5f27b543dff84b437bebb45/LICENSE)
