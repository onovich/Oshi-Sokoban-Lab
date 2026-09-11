# 已验收建模参考

## 角色三视图

最终采用 [turnaround-v4.png](turnaround-v4.png)。主 agent 独立验收主体轮廓、头部量级、正侧背分件、后跟与骶骨/髋附件通过。

采用用途：正侧背轮廓、胸肩与骨盆分件、后膝/跟腱和脚跟外观。原始图的“7.5头身”文字与可见头盔比例不完全一致，优先参考可见轮廓，不把该文字当作精确测量。v4腿间纸背景有浅色色差，但不在角色主体内，不用于模型材质采样。

提示词：turnaround-v4-prompt.txt。历史版本和详细退回原因见 REVIEW.md。当前模型对照图为 model-v3-front.png、model-v3-side.png、model-v3-back.png；差距见 MODEL-GAPS.md。v5/v6改变背板轮廓，不采用。

## 关节运动稿

采用 [joints-v5.png](joints-v5.png)。通过肩/肘/膝配对、肢体数量、运动方向、足向、膝护片归属及外形一致性检查。

用途：运动方向与分件归属的美术参考；装甲间隙和连杆行程需在 Blender 中实测。提示词：joints-v5-prompt.txt。v1～v4 已退回，不能作为正式运动结构依据。

两张均由 subagent 使用内置 image_gen 生成，主 agent 验收，全部版本与提示词在本目录保留。本轮完成补充原画验收，尚未将新稿应用到 Demo 模型。
