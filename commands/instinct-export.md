---
name: instinct-export
description: 导出直觉（Instincts）以便与团队成员或其他项目共享
command: /instinct-export
---

# 直觉导出（Instinct Export）命令

将直觉（Instincts）导出为可共享的格式。非常适用于：
- 与团队成员共享
- 迁移到新机器
- 为项目规范（Conventions）贡献内容

## 用法

```
/instinct-export                           # 导出所有个人直觉
/instinct-export --domain testing          # 仅导出测试相关的直觉
/instinct-export --min-confidence 0.7      # 仅导出高置信度的直觉
/instinct-export --output team-instincts.yaml
```

## 执行流程

1. 从 `~/.claude/homunculus/instincts/personal/` 读取直觉
2. 根据标志位（Flags）进行过滤
3. 脱敏处理（剥离敏感信息）：
   - 移除会话 ID（Session IDs）
   - 移除文件路径（仅保留模式匹配符 Pattern）
   - 移除早于“上周”的时间戳
4. 生成导出文件

## 输出格式

创建一个 YAML 文件：

```yaml
# Instincts Export
# Generated: 2025-01-22
# Source: personal
# Count: 12 instincts

version: "2.0"
exported_by: "continuous-learning-v2"
export_date: "2025-01-22T10:30:00Z"

instincts:
  - id: prefer-functional-style
    trigger: "when writing new functions"
    action: "Use functional patterns over classes"
    confidence: 0.8
    domain: code-style
    observations: 8

  - id: test-first-workflow
    trigger: "when adding new functionality"
    action: "Write test first, then implementation"
    confidence: 0.9
    domain: testing
    observations: 12

  - id: grep-before-edit
    trigger: "when modifying code"
    action: "Search with Grep, confirm with Read, then Edit"
    confidence: 0.7
    domain: workflow
    observations: 6
```

## 隐私考量

导出内容包括：
- ✅ 触发模式（Trigger patterns）
- ✅ 动作（Actions）
- ✅ 置信度分数（Confidence scores）
- ✅ 域（Domains）
- ✅ 观察次数（Observation counts）

导出内容 **不包括**：
- ❌ 实际代码片段
- ❌ 文件路径
- ❌ 会话转录文本
- ❌ 个人身份标识符

## 标志位（Flags）

- `--domain <name>`: 仅导出指定的域（Domain）
- `--min-confidence <n>`: 最低置信度阈值（默认值：0.3）
- `--output <file>`: 输出文件路径（默认值：instincts-export-YYYYMMDD.yaml）
- `--format <yaml|json|md>`: 输出格式（默认值：yaml）
- `--include-evidence`: 包含证据文本（默认值：排除）
