---
name: oneskill
description: 发现技能 (Skill)，迭代查询，并在任何环境中自动安装技能。
---

# OneSkill 元管理器 (Meta-Manager)

使用此技能来发现新功能、优化搜索查询，并使用 OpenSkills 简化技能设置。这为扩展环境功能提供了一种统一的方式。

## 何时使用

- 当用户要求的某些功能你目前不具备时。
- 当任务复杂、属于特定领域，或在尝试 2 次后仍被反复阻断时。
- 当可能存在更好的技能（Skill）时（例如：网页浏览、GitHub 集成、数据库管理、云基础设施）。

## 工作流 (Workflow)

1. 搜索注册表：
   - 运行：`npx oneskill search "<query>" [options]`
   - 支持的选项：`--category`、`--limit`、`--offset`、`--sort`。
   - 示例：
     - `npx oneskill search "browser" --sort stars`
     - `npx oneskill search "" --category database --limit 5`
2. 分析结果：
   - 确定最佳匹配项，或优化查询并再次搜索。
3. 与用户确认：
   - 说明该技能的功能及其来源。
4. 在获得明确批准后进行安装（使用 openskills）：
   - 运行：`npx openskills install <slug-or-repo>`
   - 示例：`npx openskills install anthropics/skills`
5. 处理特定环境的设置：
   - **Gemini CLI 用户：** `openskills` 不会自动配置 Gemini。安装后你**必须**运行映射命令：
     - `npx oneskill map --target gemini`（如果是全局安装，请添加 `--global`）
6. 应用新技能以完成原始请求。

## OpenSkills 基础

- `npx openskills install <source> [options]`  # 从 GitHub、本地路径或私有仓库安装
- `npx openskills sync [-y] [-o <path>]`       # 更新 AGENTS.md (或自定义输出)
- `npx openskills list`                        # 显示已安装的技能
- `npx openskills read <name>`                 # 加载技能（供智能体 (Agent) 使用）
- `npx openskills update [name...]`            # 更新已安装的技能（默认：全部）
- `npx openskills manage`                      # 移除技能（交互式）
- `npx openskills remove <name>`               # 移除特定技能

示例：
- `npx openskills install anthropics/skills`
- `npx openskills sync`

默认设置：安装在项目本地（`./.claude/skills`，或者带 `--universal` 参数安装在 `./.agent/skills`）。使用 `--global` 安装在 `~/.claude/skills`。

## 安全提示 (Safety Reminders)

- 未经用户明确确认，请勿安装。
- 除非用户同意覆盖现有目标，否则避免使用 `--force-map`。
- 使用 openskills 进行安装/更新；OneSkill 仅为 Gemini 提供搜索和映射。
- 对于 Gemini，请在安装后运行 `npx oneskill map --target gemini`。
- 默认安装/映射是项目本地的，与 openskills 相同；全局安装请使用 `--global`。
- 安装 OneSkill 本身时，建议使用 `--global`，以便在跨项目时可用。
