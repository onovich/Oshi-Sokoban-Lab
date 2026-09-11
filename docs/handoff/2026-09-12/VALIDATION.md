# 提交前验证 · 2026-09-12

- 全局 Git Validate 包装器按更新后的项目配置执行完成，退出码 0。
- 正式游戏 Vitest：73 个文件，554 项测试全部通过。
- TypeScript typecheck 与正式 Vite build 通过。
- 两个独立 3D 实验 Node 测试：13 项全部通过。
- wasteland-3d 与 faceted-salvage 独立生产构建通过。
- 108 项实验资产/源文件 SHA256 检查通过；Blade 原始来源清单16项 SHA256检查通过。
- 本次调整的 Python 文件语法检查、交接指南相对链接和 git diff --check 通过。

首轮统一验证发现 Vitest 误收集使用 node:test 的独立实验（主游戏554项已通过，但两个实验套件发现失败）。已在 vite.config.ts 保留默认排除项并排除 experiments/**；项目 Git 验证配置显式追加两套 Node 测试和两个实验构建。随后统一验证全部通过。

保留限制：3D 构建有超过500kB包体提示；本轮未重跑 Blender/Unity 导入或重新执行浏览器视觉验收，已有报告是前任务证据。浏览器连接失败，未备份当前 localStorage。详情见交接指南。

本轮提交复用上述已经完成的验证结果，不重复运行同一套测试；提交前仅追加本验证说明。资产、代码和测试配置自验证完成后未改动。
