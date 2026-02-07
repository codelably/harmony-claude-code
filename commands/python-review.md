---
description: 针对 PEP 8 标准、类型提示、安全性及 Pythonic 惯用写法的 Python 代码全面审查。调用 python-reviewer 智能体（Agent）。
---

# Python 代码审查 (Python Code Review)

此命令调用 **python-reviewer** 智能体（Agent），进行全面的 Python 专项代码审查。

## 此命令的作用

1. **识别 Python 变更**：通过 `git diff` 查找修改过的 `.py` 文件
2. **运行静态分析**：执行 `ruff`、`mypy`、`pylint`、`black --check`
3. **安全扫描**：检查 SQL 注入、命令注入、不安全的反序列化
4. **类型安全审查**：分析类型提示（Type Hints）和 mypy 错误
5. **Pythonic 代码检查**：验证代码是否符合 PEP 8 和 Python 最佳实践
6. **生成报告**：按严重程度（Severity）对问题进行分类

## 适用场景

在以下情况下使用 `/python-review`：
- 编写或修改 Python 代码后
- 提交 Python 变更前
- 审查包含 Python 代码的拉取请求（Pull Requests）
- 接入新的 Python 代码库时
- 学习 Pythonic 模式和惯用法时

## 审查类别

### 严重 (CRITICAL) (必须修复)
- SQL/命令注入漏洞
- 不安全的 eval/exec 使用
- Pickle 不安全的反序列化
- 硬编码凭据
- YAML 不安全的加载 (unsafe load)
- 隐藏错误的裸 except 子句

### 高 (HIGH) (应该修复)
- 公共函数缺失类型提示
- 可变默认参数 (Mutable default arguments)
- 静默吞掉异常
- 未对资源使用上下文管理器 (Context Managers)
- 使用 C 风格循环而非推导式 (Comprehensions)
- 使用 type() 而非 isinstance()
- 无锁状态下的竞态条件

### 中 (MEDIUM) (建议考虑)
- 违反 PEP 8 格式规范
- 公共函数缺失文档字符串 (Docstrings)
- 使用 print 语句而非日志 (Logging)
- 低效的字符串操作
- 无命名常量的魔术数字 (Magic numbers)
- 未使用 f-strings 进行格式化
- 不必要的列表创建

## 运行的自动化检查

```bash
# 类型检查
mypy .

# 代码检查与格式化
ruff check .
black --check .
isort --check-only .

# 安全扫描
bandit -r .

# 依赖审计
pip-audit
safety check

# 测试
pytest --cov=app --cov-report=term-missing
```

## 示例用法

```text
User: /python-review

Agent:
# Python 代码审查报告

## 已审查文件
- app/routes/user.py (已修改)
- app/services/auth.py (已修改)

## 静态分析结果
✓ ruff: 无问题
✓ mypy: 无错误
⚠️ black: 2 个文件需要重新格式化
✓ bandit: 无安全问题

## 发现的问题

[CRITICAL] SQL 注入漏洞
文件: app/routes/user.py:42
问题: 用户输入直接插入到 SQL 查询中
```python
query = f"SELECT * FROM users WHERE id = {user_id}"  # 不良做法
```
修复: 使用参数化查询
```python
query = "SELECT * FROM users WHERE id = %s"  # 推荐做法
cursor.execute(query, (user_id,))
```

[HIGH] 可变默认参数
文件: app/services/auth.py:18
问题: 可变默认参数会导致状态共享
```python
def process_items(items=[]):  # 不良做法
    items.append("new")
    return items
```
修复: 使用 None 作为默认值
```python
def process_items(items=None):  # 推荐做法
    if items is None:
        items = []
    items.append("new")
    return items
```

[MEDIUM] 缺失类型提示
文件: app/services/auth.py:25
问题: 公共函数没有类型注解
```python
def get_user(user_id):  # 不良做法
    return db.find(user_id)
```
修复: 添加类型提示
```python
def get_user(user_id: str) -> Optional[User]:  # 推荐做法
    return db.find(user_id)
```

[MEDIUM] 未使用上下文管理器
文件: app/routes/user.py:55
问题: 异常发生时文件未关闭
```python
f = open("config.json")  # 不良做法
data = f.read()
f.close()
```
修复: 使用上下文管理器
```python
with open("config.json") as f:  # 推荐做法
    data = f.read()
```

## 摘要
- 严重 (CRITICAL): 1
- 高 (HIGH): 1
- 中 (MEDIUM): 2

建议: ❌ 在修复严重问题前阻止合并

## 需要格式化
运行: `black app/routes/user.py app/services/auth.py`
```

## 批准标准

| 状态 | 条件 |
|--------|-----------|
| ✅ 批准 (Approve) | 无“严重”或“高”级别问题 |
| ⚠️ 警告 (Warning) | 仅存在“中”级别问题（谨慎合并） |
| ❌ 阻止 (Block) | 发现“严重”或“高”级别问题 |

## 与其他命令的集成

- 先使用 `/python-test` 确保测试通过
- 使用 `/code-review` 处理非 Python 专项的关注点
- 在提交（commit）前使用 `/python-review`
- 如果静态分析工具报错，使用 `/build-fix`

## 框架专项审查

### Django 项目
审查者会检查：
- N+1 查询问题（使用 `select_related` 和 `prefetch_related`）
- 模型变更缺失迁移文件
- 在 ORM 可用的情况下使用原生 SQL
- 多步操作缺失 `transaction.atomic()`

### FastAPI 项目
审查者会检查：
- CORS 配置错误
- 用于请求校验的 Pydantic 模型
- 响应模型的正确性
- 恰当的 async/await 使用
- 依赖注入模式

### Flask 项目
审查者会检查：
- 上下文管理（应用上下文、请求上下文）
- 恰当的错误处理
- 蓝图 (Blueprint) 组织结构
- 配置管理

## 相关

- 智能体 (Agent): `agents/python-reviewer.md`
- 技能 (Skills): `skills/python-patterns/`, `skills/python-testing/`

## 常见修复方案

### 添加类型提示
```python
# 修复前
def calculate(x, y):
    return x + y

# 修复后
from typing import Union

def calculate(x: Union[int, float], y: Union[int, float]) -> Union[int, float]:
    return x + y
```

### 使用上下文管理器
```python
# 修复前
f = open("file.txt")
data = f.read()
f.close()

# 修复后
with open("file.txt") as f:
    data = f.read()
```

### 使用列表推导式
```python
# 修复前
result = []
for item in items:
    if item.active:
        result.append(item.name)

# 修复后
result = [item.name for item in items if item.active]
```

### 修复可变默认参数
```python
# 修复前
def append(value, items=[]):
    items.append(value)
    return items

# 修复后
def append(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items
```

### 使用 f-strings (Python 3.6+)
```python
# 修复前
name = "Alice"
greeting = "Hello, " + name + "!"
greeting2 = "Hello, {}".format(name)

# 修复后
greeting = f"Hello, {name}!"
```

### 修复循环中的字符串拼接
```python
# 修复前
result = ""
for item in items:
    result += str(item)

# 修复后
result = "".join(str(item) for item in items)
```

## Python 版本兼容性

审查者会提示代码何时使用了较新 Python 版本的特性：

| 特性 | 最低 Python 版本 |
|---------|----------------|
| 类型提示 (Type hints) | 3.5+ |
| f-strings | 3.6+ |
| 海象运算符 (Walrus operator `:=`) | 3.8+ |
| 仅限位置参数 (Position-only parameters) | 3.8+ |
| 匹配语句 (Match statements) | 3.10+ |
| 类型联合 (Type unions &#96;x &#124; None&#96;) | 3.10+ |

请确保项目的 `pyproject.toml` 或 `setup.py` 指定了正确的最低 Python 版本。
