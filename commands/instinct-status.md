---
name: instinct-status
description: 显示所有已学习的本能及其置信度
command: true
---

# 本能状态查询命令（Instinct Status Command）

显示所有已学习的本能（Instincts）及其置信度分数，并按领域（Domain）进行分组。

## 实现方式

使用插件根路径运行本能 CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status
```

如果未设置 `CLAUDE_PLUGIN_ROOT`（手动安装），请使用：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

## 用法

```
/instinct-status
/instinct-status --domain code-style
/instinct-status --low-confidence
```

## 执行逻辑

1. 从 `~/.claude/homunculus/instincts/personal/` 读取所有个人本能文件。
2. 从 `~/.claude/homunculus/instincts/inherited/` 读取继承的本能。
3. 按领域分组显示，并附带置信度进度条。

## 输出格式

```
📊 本能状态 (Instinct Status)
==================

## 代码风格 (Code Style) (4 条本能)

### prefer-functional-style
触发器 (Trigger)：编写新函数时
动作 (Action)：优先使用函数式模式而非类
置信度 (Confidence)：████████░░ 80%
来源 (Source)：会话观察 (session-observation) | 最近更新：2025-01-22

### use-path-aliases
触发器 (Trigger)：导入模块时
动作 (Action)：使用 @/ 路径别名而非相对导入
置信度 (Confidence)：██████░░░░ 60%
来源 (Source)：仓库分析 (repo-analysis) (github.com/acme/webapp)

## 测试 (Testing) (2 条本能)

### test-first-workflow
触发器 (Trigger)：添加新功能时
动作 (Action)：先写测试，再写实现
置信度 (Confidence)：█████████░ 90%
来源 (Source)：会话观察 (session-observation)

## 工作流 (Workflow) (3 条本能)

### grep-before-edit
触发器 (Trigger)：修改代码时
动作 (Action)：先用 Grep 搜索，再用 Read 确认，最后 Edit 编辑
置信度 (Confidence)：███████░░░ 70%
来源 (Source)：会话观察 (session-observation)

---
总计：9 条本能 (4 条个人, 5 条继承)
观察器 (Observer)：运行中 (最近分析：5 分钟前)
```

## 参数 (Flags)

- `--domain <name>`: 按领域筛选（如 code-style, testing, git 等）
- `--low-confidence`: 仅显示置信度 < 0.5 的本能
- `--high-confidence`: 仅显示置信度 >= 0.7 的本能
- `--source <type>`: 按来源筛选（session-observation, repo-analysis, inherited）
- `--json`: 以 JSON 格式输出，便于程序化调用
