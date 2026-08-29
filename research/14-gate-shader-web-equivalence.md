# Oshi Gate / Portal Shader：Unity 14 到 Web 的版本级等价研究

> 调研日期：2026-08-30  
> 结论适用范围：Oshi 固定提交 `a41dba58d2009bcf2c30e5012cfb2f5f059b44ff`，Unity `2022.3.7f1c1`，Shader Graph / Core RP `14.0.8`，URP `14.0.9`。  
> 本文只研究视觉渲染，不改动运行时代码。

## 结论先行

1. 原版不是“让传送门图片持续自转”。动画链路是 `_Time.y × _Speed → Twirl.Offset`；Twirl 的角度场只由 `_Strength × distance(UV, Center)` 决定。也就是说，一个已扭曲的 UV 场沿 `(x,y)` 对角线持续平移，再去采样 Voronoi。把 `_Speed=.5` 解释成角速度或设置 `2π/.5=12.566s` 的 CSS 旋转周期，都是错误映射。[Oshi Shader Graph](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)，[Unity 14 Twirl 源码](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/UV/TwirlNode.cs#L31-L35)
2. 原图 `m_HashType: 0` 是 Deterministic Voronoi，使用 Tchou uint hash。Oshi 所锁定的 SG/Core 14.0.8 必须用 `uint / 0xffffffff`；新版 Unity 的 `(uint >> 8) / 0x00ffffff` 会生成另一幅图案，不能混用。[Oshi packages lock](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Packages/packages-lock.json)，[SG 14.0.8 Voronoi](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/Procedural/Noise/VoronoiNode.cs#L37-L46)，[Core 14.0.8 Hashes](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.render-pipelines.core/ShaderLibrary/Hashes.hlsl#L59-L76)
3. `_Color` 是 HDR Color property。项目使用 Gamma 色彩空间时，SG 14 会先执行 `LinearToSRGB(_Color)`；所以不能把材质 YAML 中的 HDR 向量直接当作 Web shader 的最终乘色值。[Oshi ProjectSettings](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/ProjectSettings/ProjectSettings.asset)，[SG 14 PropertyNode](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/Input/PropertyNode.cs#L172-L190)，[Unity Color 公式](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.render-pipelines.core/ShaderLibrary/Color.hlsl#L115-L142)
4. 原图把同一个 Vector4 结果同时连接到 Base Color 与标量 Alpha。SG 14 的 Vector4→Vector1 适配取 `.x`，不是 `.a`；这解释了材质 `_Color.a=0` 但对象仍可见。[Oshi Shader Graph](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)，[SG 14 类型适配](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Generation/Processors/GenerationUtils.cs#L739-L779)
5. `Spr_Gate_001.png` 的 alpha 确实画出了“外框 + 实心核心”，但原图 Sample Texture 使用的是 RGBA 输出，而最终 Alpha 取红通道；该 PNG 的所有 RGB texel 都是白色。因此，**不能把这张 PNG 的 alpha 轮廓直接当作 Shader Graph 已消费的裁切 mask**。Web 若按其 alpha 裁切，是一种看起来合理但不等价于当前图连接的修正。[Oshi mask](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Gate/Spr_Gate_001.png)，[mask importer](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Gate/Spr_Gate_001.png.meta)，[SG Sample Texture slot 定义](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/Input/Texture/SampleTexture2DNode.cs#L19-L23)
6. 像素级核心图案应使用 WebGL2。纯 CSS/SVG 无法表达带 uint hash 的逐像素 3×3 Worley 搜索；Canvas2D 只能用 CPU 离屏纹理近似性能。Bloom 必须保留 HDR 到后处理阶段，不能先 `clamp` 再加 `drop-shadow`。

## 1. 版本与资产链

### 1.1 固定版本

- Oshi 基线：[`a41dba58d2009bcf2c30e5012cfb2f5f059b44ff`](https://github.com/onovich/Oshi/tree/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff)。
- Editor：`2022.3.7f1c1`，见 [`ProjectSettings/ProjectVersion.txt`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/ProjectSettings/ProjectVersion.txt)。
- Oshi 的 lockfile 中 URP 为 `14.0.9`，但其依赖的 Shader Graph 与 Core RP 为 `14.0.8`，见 [`Packages/packages-lock.json`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Packages/packages-lock.json)。
- 本文采用的 SG/Core 14.0.8 官方源提交为 [`a4de9fee...`](https://github.com/Unity-Technologies/Graphics/tree/a4de9feeef1216f9007bef690a5d72fca55dc49a)；其 [`com.unity.shadergraph/package.json`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/package.json) 声明 `14.0.8`。
- Bloom 采用 URP 14.0.9 官方源提交 [`3d08aae6...`](https://github.com/Unity-Technologies/Graphics/tree/3d08aae65d6f0d39aac8f1cd2d8221c263da30c0)；其 [`com.unity.render-pipelines.universal/package.json`](https://github.com/Unity-Technologies/Graphics/blob/3d08aae65d6f0d39aac8f1cd2d8221c263da30c0/Packages/com.unity.render-pipelines.universal/package.json) 声明 `14.0.9`。

这一区分很重要：不能仅凭“项目用了 URP 14.0.9”就把当前 Unity 分支中的 Shader Graph hash 实现抄进 Web。

### 1.2 Gate 到材质、纹理

- Orange Gate SO 指向 Orange material，Blue Gate SO 指向 Blue material；两者的 sprite 都是 `Spr_Gate_001.png`：[`SO_Gate_Orange_001.asset`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Gate/SO_Gate_Orange_001.asset)，[`SO_Gate_Blue_002.asset`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Gate/SO_Gate_Blue_002.asset)。
- 两个材质都使用 [`Shader_Portal.shadergraph`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)。
- `_MainTex` 指向 [`Img_Common_WhiteRect.png`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Common/Img_Common_WhiteRect.png)，它是 `1×1` 不透明白图。
- `_Mask` 指向 [`Spr_Gate_001.png`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Gate/Spr_Gate_001.png)，它是 `16×16` RGBA 图。
- 两张纹理均为 Point filter、Clamp、无 mipmap；见 [`Spr_Gate_001.png.meta`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Templates_Runtime/Gate/Spr_Gate_001.png.meta) 与 [`Img_Common_WhiteRect.png.meta`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Common/Img_Common_WhiteRect.png.meta)。Web 使用平滑 SVG mask 或双线性缩放会改变边界语法。

### 1.3 运行时材质参数，而非 Graph 默认值

| 参数 | Graph blackboard 默认 | Orange / Blue material 实值 | Web 含义 |
|---|---:|---:|---|
| `_Speed` | 0.2 | **0.5** | UV 每轴每秒偏移 0.5 |
| `_Strength` | 10 | **8** | Twirl 空间角系数，单位 rad/UV-radius |
| `_Denstity` | 3 | **2** | Voronoi 每 UV 单位的 lattice 密度；拼写就是 `Denstity` |
| `_Brightness` | 2 | **2** | `pow(nearestDistance, 2)` |
| Voronoi `AngleOffset` | 节点常量 2 | **2** | hash 后 sin/cos 相位系数 |

材质来源：[`Mat_Portal_Orange.mat`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Mat_Portal_Orange.mat)，[`Mat_Portal_Blue.mat`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Mat_Portal_Blue.mat)。只抄 Graph 面板默认值会得到明显不同的速度、扭曲与细胞尺度。

材质序列化 HDR 色：

| 变体 | YAML `_Color`（HDR linear） | Gamma 项目经 Unity `LinearToSRGB` 后 |
|---|---|---|
| Orange | `(144.98065, 41.22311, 0, 0)` | `(8.3357023, 4.9135284, 0, 0)` |
| Blue | `(29.475334, 89.63017, 109.62756, 0)` | `(4.2654296, 6.8121266, 7.4132530, 0)` |

Oshi `m_ActiveColorSpace: 0`；Unity 2022.3 的 `ColorSpace.Gamma = 0`，见 [`ProjectSettings.asset`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/ProjectSettings/ProjectSettings.asset) 与 [UnityCsReference 2022.3 `ColorSpace`](https://github.com/Unity-Technologies/UnityCsReference/blob/a322ce5f78a82cf7ea211857a45338136ed7a22f/Runtime/Export/Graphics/GraphicsEnums.cs#L372-L378)。

## 2. 原 Shader Graph 的精确计算

令屏幕上一个片元对应 Unity UV `u=(ux,uy)`，时间为秒 `t=_Time.y`。材质实参为：

```text
speed = 0.5
strength = 8
density = 2
brightness = 2
angleOffset = 2
center = (0.5, 0.5)
```

### 2.1 Time 与 Twirl

Unity Time Node 的 `Time` 输出对应 `_Time.y`；Unity 将 `_Time` 定义为 `(t/20,t,2t,3t)`，`t` 为自关卡加载起的秒数。[Time Node 14 文档](https://docs.unity3d.com/Packages/com.unity.shadergraph@14.0/manual/Time-Node.html)，[Unity 内建 shader 变量](https://docs.unity3d.com/2023.2/Documentation/Manual/SL-UnityShaderVariables.html)。

原图把标量 `t×speed` 接入 Vector2 Offset。SG 14 的 Vector1→Vector2 类型适配为 `.xx`，见 [`GenerationUtils.cs`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Generation/Processors/GenerationUtils.cs#L765-L779)。因此：

```text
p = t * 0.5
d = u - (0.5, 0.5)
a = 8 * length(d)
twirled = (
  cos(a)*d.x - sin(a)*d.y + 0.5 + p,
  sin(a)*d.x + cos(a)*d.y + 0.5 + p
)
```

公式与 Unity 14 生成代码逐项一致，见 [`TwirlNode.cs`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/UV/TwirlNode.cs#L31-L35) 和 [Twirl Node 14 文档](https://docs.unity3d.com/Packages/com.unity.shadergraph@14.0/manual/Twirl-Node.html)。

参数的可观察含义：

- 中边 `r=.5` 处的静态扭角为 `4 rad ≈ 229.18°`；角落 `r=sqrt(.5)` 处为 `5.65685 rad ≈ 324.11°`。
- 时间只让 `twirled` 每轴以 `0.5 UV/s` 平移；乘 `density=2` 后，Voronoi lattice 每轴以 `1 cell/s` 平移。
- 它没有有限的 `2π` 动画周期。即使两秒后每轴跨过 1 UV，进入的 lattice hash 已改变，所以也不是两秒循环。

### 2.2 Deterministic Voronoi

Oshi 图中 `m_HashType:0`；SG 14 枚举顺序是 `Deterministic=0, LegacySine=1`，并且 Deterministic 绑定 `Hash_Tchou_2_2_`。[Oshi graph](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph)，[VoronoiNode.cs](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/Procedural/Noise/VoronoiNode.cs#L37-L46)。

精确算法：

```text
g = floor(twirled * density)
f = frac(twirled * density)
best = 8

for y in -1..1:
  for x in -1..1:
    lattice = (x,y)
    h = Hash_Tchou_2_2(lattice + g)
    point = (sin(h.y*angleOffset), cos(h.x*angleOffset))*.5 + .5
    d = distance(lattice + point, f)
    best = min(best, d)

n = best             // 接的是 Voronoi.Out，不是 Cells
energy = pow(n, 2)
```

循环、随机向量与最近点比较见 [`VoronoiNode.cs#L91-L127`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/Procedural/Noise/VoronoiNode.cs#L91-L127)；Power 是 `pow(A,B)`，见 [Power Node 14 文档](https://docs.unity3d.com/Packages/com.unity.shadergraph@14.0/manual/Power-Node.html)。Unity 手册页面展示的 sine hash 只是另一种/旧式实现，不能替代此固定版本源码。

14.0.8 的 Tchou hash：

```glsl
uvec2 hashTchou2To2(uvec2 v) {
  v.y ^= 1103515245u;
  v.x += v.y;
  v.x *= v.y;
  v.x ^= v.x >> 5u;
  v.x *= 0x27d4eb2du;
  v.y ^= v.x << 3u;
  return v;
}

vec2 normalizedHash = vec2(hashTchou2To2(lattice))
                    * (1.0 / 4294967295.0);
```

官方依据是 [`Hashes.hlsl#L59-L76`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.render-pipelines.core/ShaderLibrary/Hashes.hlsl#L59-L76)。WebGL2 的 `uint` 溢出语义与 HLSL 相符。Canvas/JS 必须用 `Math.imul` 与 `>>>0`，不能用普通 `number * number` 代替 32 位乘法：

```js
function hashTchou2To2(ix, iy) {
  let x = ix >>> 0;
  let y = iy >>> 0;
  y = (y ^ 1103515245) >>> 0;
  x = (x + y) >>> 0;
  x = Math.imul(x, y) >>> 0;
  x = (x ^ (x >>> 5)) >>> 0;
  x = Math.imul(x, 0x27d4eb2d) >>> 0;
  y = (y ^ ((x << 3) >>> 0)) >>> 0;
  return [x / 4294967295, y / 4294967295];
}
```

图的默认精度最终解析为 Single；WebGL 应使用 `highp float` 和 `highp int/uint`，而不是 `mediump`。[SG 14 Precision](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Enumerations/Precision.cs)，[GraphData fallback](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Graphs/GraphData.cs#L320-L331)。不同 GPU 的 `sin/cos` 仍可能产生末位差异，所以视觉测试应用容差而非逐 bit 相等。

### 2.3 颜色、纹理与 Alpha

在 Gamma 项目中先变换材质 HDR 色：

```text
LinearToSRGB(c) =
  12.92*c                              if c <= 0.0031308
  1.055*pow(max(c,0), 1/2.4) - 0.055   otherwise
```

Unity 的 `real4` 重载只变换 RGB，保留 A，见 [`Color.hlsl#L115-L142`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.render-pipelines.core/ShaderLibrary/Color.hlsl#L115-L142)。令该结果为 `C`，两次未扭曲的 UV0 纹理采样为 `Tmain` 与 `Tmask`，则原图最终乘积是：

```text
F = C * Tmain * Tmask * energy
BaseColor = F.xyz
Alpha = F.x
```

`Alpha=F.x` 来自 SG 14 Vector4→Vector1 的 `.x` 适配，[GenerationUtils.cs#L765-L770](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Generation/Processors/GenerationUtils.cs#L765-L770)。Graph target 是 Universal Unlit、Transparent、Alpha blend、无 Alpha Clip；见 [`Shader_Portal.shadergraph`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Material/Shader_Portal.shadergraph) 与 [URP 14 Alpha blend render state](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.render-pipelines.universal/Editor/ShaderGraph/Targets/UniversalTarget.cs#L1313-L1317)。

#### Mask 的反直觉事实

本地逐 texel 审计 `Spr_Gate_001.png` 得到：RGB 全部为白；alpha 只有 0/255，152 个不透明 texel、104 个透明 texel。alpha 图案为：

```text
................
.##############.
.#............#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#.##########.#.
.#............#.
.##############.
................
```

然而，原图连接 Sample Texture 的 slot 0（RGBA），不是 slot 7（A）；SG 14 的 slot 编号见 [`SampleTexture2DNode.cs#L19-L23`](https://github.com/Unity-Technologies/Graphics/blob/a4de9feeef1216f9007bef690a5d72fca55dc49a/Packages/com.unity.shadergraph/Editor/Data/Nodes/Input/Texture/SampleTexture2DNode.cs#L19-L23)。由于 BaseColor 只看 RGB、Alpha 又取最终红通道，这张 PNG 的 alpha 在该 Graph 路径中未参与输出。必须用 Unity 运行时 golden frame 判断是否还有 SpriteRenderer/几何层面的额外裁切；在证据出现前，不应宣称“shader 用该 alpha mask 裁切”。

## 3. Web 坐标与时间等价

### 3.1 时间

Web 使用一个全局、单调的相对时钟：

```js
const epochMs = performance.now();
const tSeconds = (frameNowMs - epochMs) / 1000;
```

把同一个 `tSeconds` uniform 传给所有门，保证蓝/橙门同相位。不要用 `Date.now()` 的巨大 epoch 数，也不要对时间做 `2π` 取模；确定性 lattice 并不周期重复。浏览器从后台恢复时用当前相对时间直接采样，避免逐帧累加造成漂移。

### 3.2 UV 的 y 方向不是“一律翻转”

- WebGL 全屏 quad 若把底边 NDC `y=-1` 配 `uv.y=0`、顶边配 `uv.y=1`（例如 `uv=position*.5+.5`），视觉方向已经与 Unity UV0 一致，**不要再翻 y**。
- Canvas2D/CPU 若按 DOM 像素行从顶部 `y=0` 往下遍历，则用 `uv=((x+.5)/W, 1-(y+.5)/H)`。
- WebGL 上传真实 mask 纹理时，应通过顶点 UV 或 `UNPACK_FLIP_Y_WEBGL` 二选一统一约定，不能两边都翻。

mask 本身上下对称，不能拿它判断 y 是否正确；应使用固定时间的非对称 Voronoi golden frame。

## 4. HDR、Bloom 与 Web LDR 边界

Oshi 的 URP asset 支持 HDR；MainEntry camera 开启 post-processing 和 HDR。证据：[`New Universal Render Pipeline Asset.asset`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/URPSetting/New%20Universal%20Render%20Pipeline%20Asset.asset)，[`MainEntry.unity`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/Resources_Runtime/Scene/MainEntry.unity)。

[`Global Volume Profile.asset`](https://github.com/onovich/Oshi/blob/a41dba58d2009bcf2c30e5012cfb2f5f059b44ff/Assets/URPSetting/Global%20Volume%20Profile.asset) 的有效 Bloom 覆盖为：

| 参数 | 有效值 | 依据 |
|---|---:|---|
| threshold | 1 | profile override；URP 内部 `GammaToLinearSpace(1)=1` |
| intensity | 0.3 | profile override |
| highQualityFiltering | true | profile override |
| scatter | 默认 0.7 | profile 的序列化 1 未 override；URP 默认 0.7 |
| 内部 scatter | `lerp(.05,.95,.7)=.68` | URP SetupBloom |
| clamp | 默认 65472 | 未 override |
| downscale | Half | 未 override |
| maxIterations | 6 | 未 override |
| dirt | none / 0 | 未 override |

URP 14.0.9 默认值与换算见 [`Bloom.cs`](https://github.com/Unity-Technologies/Graphics/blob/3d08aae65d6f0d39aac8f1cd2d8221c263da30c0/Packages/com.unity.render-pipelines.universal/Runtime/Overrides/Bloom.cs#L33-L92) 和 [`PostProcessPass.cs#L1089-L1166`](https://github.com/Unity-Technologies/Graphics/blob/3d08aae65d6f0d39aac8f1cd2d8221c263da30c0/Packages/com.unity.render-pipelines.universal/Runtime/Passes/PostProcessPass.cs#L1089-L1166)。HQ 预滤波、soft-knee threshold、down/up sample 的精确核见 [`Bloom.shader`](https://github.com/Unity-Technologies/Graphics/blob/3d08aae65d6f0d39aac8f1cd2d8221c263da30c0/Packages/com.unity.render-pipelines.universal/Shaders/PostProcessing/Bloom.shader#L53-L167)。

该 Volume **没有 Tonemapping component**。Gamma 项目的 URP UberPost 会先把 scene color 转到 linear、解码并加入 Bloom，最后转回 sRGB；见 [`UberPost.shader#L170-L256`](https://github.com/Unity-Technologies/Graphics/blob/3d08aae65d6f0d39aac8f1cd2d8221c263da30c0/Packages/com.unity.render-pipelines.universal/Shaders/PostProcessing/UberPost.shader#L170-L256)。

因此最可信的 Web 路径是：

```text
原 shader HDR 输出
  → 浮点 scene FBO / 正确透明合成
  → URP 14 等价 Bloom 多尺度 pass
  → Gamma 项目对应的 Uber 合成
  → 最终写入 SDR canvas 时才限制到显示范围
```

不能直接照抄/替代的做法：

- 在主 fragment shader 里先 `clamp(hdrColor,0,1)`：会在 Bloom 看到 HDR 之前丢失亮度层级。
- 把 HDR 向量塞进 CSS `rgb()`：所有大于 1 的分量立刻饱和。
- 用 Reinhard/ACES：原 Volume 没有 Tonemapping，这是另一个视觉设计。
- 用一层 CSS `drop-shadow`：URP 是分辨率相关的多级预滤波、下采样、上采样与 soft-knee 阈值，不是单半径阴影。

即使核心 shader 完全等价，Bloom 的像素级结果仍取决于 viewport 分辨率、门在整幅 scene 中的尺寸以及周围亮度；孤立 DOM icon 无法脱离整幅 scene 获得严格相同的 halo。应将“核心 field 等价”和“后处理近似”分别验收。

## 5. 技术方案选择

| 方案 | 核心 Twirl + deterministic Voronoi | mask point 语义 | HDR/Bloom | 结论 |
|---|---|---|---|---|
| CSS gradients / transform | 不可精确；没有 uint hash 与 3×3 nearest search | 可近似 | 只能伪造 | 仅概念稿 |
| SVG filter / pattern | 不可精确复现 Tchou/Worley | 可表达轮廓，但易平滑 | 只能伪造 | 不选作高仿 runtime |
| Canvas2D CPU | 可按 JS 公式复现，但成本随像素/门数增长 | 可 point sample | 需额外离屏 pass | 低分辨率 fallback |
| WebGL2 | 可直接移植 uint/float 核心 | 可整数采样或解析式 | 可用 float FBO 多 pass | **推荐** |

WebGL1 缺少可靠的 uint/位运算路径；若必须支持它，预先在 CPU 生成所需 lattice hash 表，比换成 sine hash 更可信。

## 6. TDD 与视觉验收指标

### 6.1 纯函数 golden values

以下数值使用固定的 14.0.8 `uint/0xffffffff` hash、`angleOffset=2`、`density=2`、`speed=.5`、`strength=8`、`brightness=2` 计算。UV 按 Unity 约定给出；比较 `energy=n²`，建议 CPU 容差 `1e-10`，CPU 对 WebGL highp 容差 `5e-5`。

| UV | t(s) | twirled UV | Voronoi n | energy n² |
|---|---:|---|---:|---:|
| `(0.5,0.5)` | 0 | `(0.5,0.5)` | 0.3294609548 | 0.1085445207 |
| `(0.5,0.5)` | 0.25 | `(0.625,0.625)` | 0.6393322593 | 0.4087457378 |
| `(0.5,0.5)` | 1 | `(1,1)` | 0.2136926457 | 0.0456645468 |
| `(0.25,0.25)` | 0 | `(0.8148587176,0.6608228464)` | 0.5742103840 | 0.3297175651 |
| `(0.75,0.5)` | 0 | `(0.3959632909,0.7273243567)` | 0.5662620768 | 0.3206527396 |

最低限度单测：

1. `t=2s` 时 Offset 必须严格为 `(1,1)`，而不是旋转角 `1 rad`。
2. `strength=0` 时得到未扭曲、仍按对角线漂移的 Voronoi。
3. `speed=0` 时不同时间采样完全相同。
4. `brightness=1/2` 时输出分别为 `n` 与 `n²`。
5. 固定 lattice 输入验证 Tchou 使用 32 位 wrap 与 `/0xffffffff`；专门加一个会区分 24-bit 新版 hash 的 regression case。
6. HDR Color 在 Gamma 项目先过 Unity `LinearToSRGB`；验证上表转换值。
7. 同一最终 Vector4 接标量 Alpha 时取 red `.x`，不是 `.a`。

### 6.2 结构与运动指标

1. 蓝/橙门在同一时刻的 scalar field 应逐像素相同，仅颜色不同；必须共享时钟。
2. 从 `t=0` 到 `t=.25`，内部 field 有非零帧差；不能是完全静态。
3. `t→t+1` 时，Twirl 的静态空间扭曲形状不变，而采样 lattice 每轴推进 1 cell；不应出现整个门框刚体旋转。
4. 用非对称 golden frame 检查 UV 方向；不要用上下对称的 gate PNG 判断。
5. 纹理边界若被采用，point sampling 下应只有 0/1 alpha，不得出现由双线性插值产生的半透明一圈。
6. HDR 主 pass 的离屏读回应保留 `>1` 的 RGB；Bloom 之前不存在 SDR clamp。
7. “mask alpha 是否应裁切”必须以 Unity 固定版本实际运行截图/RenderDoc frame 为裁决依据；资产 alpha 图案本身不是 Graph 消费证据。

### 6.3 建议的截图差分层级

- 层 A：只比较 scalar field 灰度图，关闭颜色、透明与 Bloom；这是算法等价的硬门槛。
- 层 B：比较 Gamma/HDR 乘色与 Alpha blend，关闭 Bloom。
- 层 C：打开 Bloom，在固定 viewport、固定门像素尺寸下比较；用 SSIM/平均绝对误差并另测 halo 半径。
- 层 D：整幅场景比较，才纳入 Vignette 等全局后处理。

这样能避免用 Bloom 的柔光掩盖 hash、UV 或时间映射错误。

## 7. 尚不能仅凭源码宣称的部分

- 不同图形 API/GPU 的 `sin/cos` 末位可能不同；不能承诺跨设备 bit-exact。
- `Spr_Gate_001.png` 的 alpha 外形存在，但 Graph 未消费其 A；是否有 SpriteRenderer 或导入后几何造成额外裁切，需要原 Unity 运行帧验证。
- Bloom 是全屏、分辨率相关后处理；没有固定 Unity golden frame时，只能声明参数/算法等价，不能声明最终 halo 已像素级一致。
- Web canvas 最终色彩管理依浏览器与显示器而异；应在指定浏览器、DPR、canvas 色彩空间与截图管线下建立 golden。

## 8. 可执行的实现契约

若目标是“基于原版源码的高仿”而不是“像传送门的装饰”，实现应同时满足：

1. WebGL2，`highp`，Tchou hash 精确为 14.0.8 `/0xffffffff`。
2. `performance` 相对秒数 × `.5` 写入 Twirl Offset `.xx`；没有 CSS rotate、没有人为周期。
3. Twirl→Deterministic Voronoi.Out→`pow(n,2)` 的顺序不变。
4. 材质 HDR raw color 在 Gamma 项目先执行 Unity `LinearToSRGB`。
5. 明确复刻原 Graph 的 `Alpha=final.red`；如果产品选择修复 mask alpha，应作为有测试、有注释的“有意偏离原版”，不要伪称源码等价。
6. HDR 值保留到 Bloom 之后；核心 field、颜色/Alpha、Bloom 分层测试。
7. 以 Unity 固定版本录制的 `t=0/.25/1/2s` golden frames 完成最后视觉校准。
