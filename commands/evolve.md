---
name: evolve
description: 将相关的直觉（Instincts）聚类为技能（Skills）、命令（Commands）或智能体（Agents）
command: true
---

# Evolve 命令

## 实现 (Implementation)

使用插件根路径运行直觉（Instinct）命令行界面（CLI）：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

或者如果未设置 `CLAUDE_PLUGIN_ROOT`（手动安装）：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

分析直觉（Instincts）并将相关的直觉聚类为更高级的结构：
- **命令（Commands）**：当直觉描述用户调用的操作时
- **技能（Skills）**：当直觉描述自动触发的行为时
- **智能体（Agents）**：当直觉描述复杂的、多步骤的流程时

## 用法 (Usage)

```
/evolve                    # 分析所有直觉并建议演进方案
/evolve --domain testing   # 仅演进测试领域（testing domain）中的直觉
/evolve --dry-run          # 显示将要创建的内容而不实际创建
/evolve --threshold 5      # 要求至少有 5 个以上的相关直觉才进行聚类
```

## 演进规则 (Evolution Rules)

### → 命令 (Command)（用户调用）
当直觉描述用户会明确请求的操作时：
- 多个关于“当用户要求...”的直觉
- 带有“当创建新的 X 时”等触发器的直觉
- 遵循可重复序列的直觉

示例：
- `new-table-step1`: "when adding a database table, create migration"
- `new-table-step2`: "when adding a database table, update schema"
- `new-table-step3`: "when adding a database table, regenerate types"

→ 创建：`/new-table` 命令

### → 技能 (Skill)（自动触发）
当直觉描述应该自动发生的行为时：
- 模式匹配触发器
- 错误处理响应
- 代码风格强制执行

示例：
- `prefer-functional`: "when writing functions, prefer functional style"
- `use-immutable`: "when modifying state, use immutable patterns"
- `avoid-classes`: "when designing modules, avoid class-based design"

→ 创建：`functional-patterns` 技能（Skill）

### → 智能体 (Agent)（需要深度/隔离）
当直觉描述复杂的、多步骤的流程，且受益于隔离环境时：
- 调试工作流（Workflow）
- 重构序列
- 研究任务

示例：
- `debug-step1`: "when debugging, first check logs"
- `debug-step2`: "when debugging, isolate the failing component"
- `debug-step3`: "when debugging, create minimal reproduction"
- `debug-step4`: "when debugging, verify fix with test"

→ 创建：`debugger` 智能体（Agent）

## 操作步骤 (What to Do)

1. 从 `~/.claude/homunculus/instincts/` 读取所有直觉（Instincts）
2. 按以下维度对直觉进行分组：
   - 领域（Domain）相似性
   - 触发模式重合度
   - 操作序列关联性
3. 对于每个包含 3 个及以上相关直觉的聚类：
   - 确定演进类型（命令/技能/智能体）
   - 生成相应的文件
   - 保存至 `~/.claude/homunculus/evolved/{commands,skills,agents}/`
4. 将演进后的结构链接回原始直觉

## 输出格式 (Output Format)

```
🧬 演进分析 (Evolve Analysis)
==================

发现 3 个已准备好演进的聚类：

## 聚类 1：数据库迁移工作流 (Database Migration Workflow)
直觉 (Instincts): new-table-migration, update-schema, regenerate-types
类型: 命令 (Command)
置信度: 85% (基于 12 次观察)

将创建: /new-table 命令
文件:
  - ~/.claude/homunculus/evolved/commands/new-table.md

## 聚类 2：函数式代码风格 (Functional Code Style)
直觉 (Instincts): prefer-functional, use-immutable, avoid-classes, pure-functions
类型: 技能 (Skill)
置信度: 78% (基于 8 次观察)

将创建: functional-patterns 技能 (Skill)
文件:
  - ~/.claude/homunculus/evolved/skills/functional-patterns.md

## 聚类 3：调试流程 (Debugging Process)
直觉 (Instincts): debug-check-logs, debug-isolate, debug-reproduce, debug-verify
类型: 智能体 (Agent)
置信度: 72% (基于 6 次观察)

将创建: debugger 智能体 (Agent)
文件:
  - ~/.claude/homunculus/evolved/agents/debugger.md

---
运行 `/evolve --execute` 来创建这些文件。
```

## 参数标志 (Flags)

- `--execute`: 实际创建演进后的结构（默认为预览）
- `--dry-run`: 预览而不创建
- `--domain <name>`: 仅演进指定领域（Domain）中的直觉
- `--threshold <n>`: 形成聚类所需的最小直觉数量（默认值：3）
- `--type <command|skill|agent>`: 仅创建指定类型

## 生成的文件格式 (Generated File Format)

### 命令 (Command)
```markdown
---
name: new-table
description: Create a new database table with migration, schema update, and type generation
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# New Table 命令

[基于聚类直觉生成的正文内容]

## 步骤
1. ...
2. ...
```

### 技能 (Skill)
```markdown
---
name: functional-patterns
description: Enforce functional programming patterns
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Functional Patterns 技能 (Skill)

[基于聚类直觉生成的正文内容]
```

### 智能体 (Agent)
```markdown
---
name: debugger
description: Systematic debugging agent
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Debugger 智能体 (Agent)

[基于聚类直觉生成的正文内容]
```
