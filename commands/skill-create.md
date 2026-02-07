---
name: skill-create
description: 分析本地 Git 历史以提取编码模式并生成 SKILL.md 文件。Skill Creator GitHub App 的本地版本。
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /skill-create - 本地技能生成（Local Skill Generation）

分析你仓库的 Git 历史记录以提取编码模式，并生成 SKILL.md 文件，以便让 Claude 学习你团队的工程实践。

## 用法（Usage）

```bash
/skill-create                    # 分析当前仓库
/skill-create --commits 100      # 分析最近 100 条提交
/skill-create --output ./skills  # 指定自定义输出目录
/skill-create --instincts        # 同时为 continuous-learning-v2 生成直觉（instincts）
```

## 功能说明（What It Does）

1. **解析 Git 历史** - 分析提交（commits）、文件变更和模式。
2. **检测模式** - 识别循环出现的工作流（Workflow）和约定。
3. **生成 SKILL.md** - 创建有效的 Claude Code 技能（Skill）文件。
4. **可选生成直觉（Instincts）** - 用于 continuous-learning-v2 系统。

## 分析步骤（Analysis Steps）

### 第 1 步：收集 Git 数据

```bash
# 获取带有文件变更的近期提交
git log --oneline -n ${COMMITS:-200} --name-only --pretty=format:"%H|%s|%ad" --date=short

# 获取按文件统计的提交频率
git log --oneline -n 200 --name-only | grep -v "^$" | grep -v "^[a-f0-9]" | sort | uniq -c | sort -rn | head -20

# 获取提交信息模式
git log --oneline -n 200 | cut -d' ' -f2- | head -50
```

### 第 2 步：检测模式

寻找以下模式类型：

| 模式 (Pattern) | 检测方法 (Detection Method) |
|---------|-----------------|
| **提交规范 (Commit conventions)** | 对提交信息使用正则匹配 (feat:, fix:, chore:) |
| **文件关联变更 (File co-changes)** | 总是同时发生变化的文件 |
| **工作流序列 (Workflow sequences)** | 重复出现的文件变更模式 |
| **架构 (Architecture)** | 文件夹结构和命名规范 |
| **测试模式 (Testing patterns)** | 测试文件位置、命名、覆盖率 |

### 第 3 步：生成 SKILL.md

输出格式：

```markdown
---
name: {repo-name}-patterns
description: Coding patterns extracted from {repo-name}
version: 1.0.0
source: local-git-analysis
analyzed_commits: {count}
---

# {Repo Name} 模式

## 提交规范
{检测到的提交信息模式}

## 代码架构
{检测到的文件夹结构和组织方式}

## 工作流
{检测到的重复文件变更模式}

## 测试模式
{检测到的测试约定}
```

### 第 4 步：生成直觉 (如果使用了 --instincts)

用于 continuous-learning-v2 集成：

```yaml
---
id: {repo}-commit-convention
trigger: "when writing a commit message"
confidence: 0.8
domain: git
source: local-repo-analysis
---

# 使用约定式提交 (Conventional Commits)

## 操作 (Action)
在提交信息前添加前缀：feat:, fix:, chore:, docs:, test:, refactor:

## 证据 (Evidence)
- 已分析 {n} 条提交
- {percentage}% 遵循约定式提交格式
```

## 输出示例

在 TypeScript 项目上运行 `/skill-create` 可能会产生：

```markdown
---
name: my-app-patterns
description: Coding patterns from my-app repository
version: 1.0.0
source: local-git-analysis
analyzed_commits: 150
---

# My App 模式

## 提交规范 (Commit Conventions)

该项目使用 **约定式提交 (conventional commits)**：
- `feat:` - 新功能
- `fix:` - 错误修复
- `chore:` - 维护任务
- `docs:` - 文档更新

## 代码架构 (Code Architecture)

```
src/
├── components/     # React 组件 (PascalCase.tsx)
├── hooks/          # 自定义 Hooks (use*.ts)
├── utils/          # 工具函数
├── types/          # TypeScript 类型定义
└── services/       # API 和外部服务
```

## 工作流 (Workflows)

### 添加新组件
1. 创建 `src/components/ComponentName.tsx`
2. 在 `src/components/__tests__/ComponentName.test.tsx` 中添加测试
3. 从 `src/components/index.ts` 导出

### 数据库迁移
1. 修改 `src/db/schema.ts`
2. 运行 `pnpm db:generate`
3. 运行 `pnpm db:migrate`

## 测试模式 (Testing patterns)

- 测试文件：`__tests__/` 目录或 `.test.ts` 后缀
- 覆盖率目标：80%+
- 框架：Vitest
```

## GitHub App 集成

对于高级功能（1万+ 提交、团队共享、自动 PR），请使用 [Skill Creator GitHub App](https://github.com/apps/skill-creator)：

- 安装：[github.com/apps/skill-creator](https://github.com/apps/skill-creator)
- 在任何 Issue 上评论 `/skill-creator analyze`
- 接收包含生成的技能的 PR

## 相关命令

- `/instinct-import` - 导入生成的直觉
- `/instinct-status` - 查看已学习的直觉
- `/evolve` - 将直觉聚类为技能/智能体

---

*属于 [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) 的一部分*
