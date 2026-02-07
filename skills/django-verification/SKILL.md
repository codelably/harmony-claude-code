---
name: django-verification
description: Django 项目的验证循环（Verification loop）：包含数据库迁移、代码检查、带覆盖率的测试、安全扫描，以及在发布或 PR 前的部署就绪检查。
---

# Django 验证循环（Verification Loop）

在提交 PR 之前、重大变更之后以及预部署（Pre-deploy）之前运行，以确保 Django 应用程序的质量和安全性。

## 阶段 1：环境检查 (Phase 1: Environment Check)

```bash
# 验证 Python 版本
python --version  # 应符合项目要求

# 检查虚拟环境
which python
pip list --outdated

# 验证环境变量
python -c "import os; import environ; print('DJANGO_SECRET_KEY set' if os.environ.get('DJANGO_SECRET_KEY') else 'MISSING: DJANGO_SECRET_KEY')"
```

如果环境配置错误，请停止并修复。

## 阶段 2：代码质量与格式化 (Phase 2: Code Quality & Formatting)

```bash
# 类型检查
mypy . --config-file pyproject.toml

# 使用 ruff 进行 Lint 检查
ruff check . --fix

# 使用 black 进行格式化
black . --check
black .  # 自动修复

# 导入语句排序
isort . --check-only
isort .  # 自动修复

# Django 特有的检查
python manage.py check --deploy
```

常见问题：
- 公共函数缺失类型提示（Type hints）
- 违反 PEP 8 格式规范
- 未排序的导入语句
- 生产环境配置中遗留了调试设置

## 阶段 3：数据库迁移 (Phase 3: Migrations)

```bash
# 检查是否存在未应用的迁移
python manage.py showmigrations

# 创建缺失的迁移
python manage.py makemigrations --check

# 模拟迁移应用（Dry-run）
python manage.py migrate --plan

# 应用迁移（测试环境）
python manage.py migrate

# 检查迁移冲突
python manage.py makemigrations --merge  # 仅在存在冲突时运行
```

报告内容：
- 待处理迁移的数量
- 任何迁移冲突
- 存在模型变更但未生成迁移

## 阶段 4：测试与覆盖率 (Phase 4: Tests + Coverage)

```bash
# 使用 pytest 运行所有测试
pytest --cov=apps --cov-report=html --cov-report=term-missing --reuse-db

# 运行特定应用的测试
pytest apps/users/tests/

# 使用标记运行
pytest -m "not slow"  # 跳过慢速测试
pytest -m integration  # 仅运行集成测试

# 覆盖率报告
open htmlcov/index.html
```

报告内容：
- 测试统计：X 通过，Y 失败，Z 跳过
- 总体覆盖率：XX%
- 各应用的覆盖率明细

覆盖率目标：

| 组件 | 目标 |
|-----------|--------|
| 模型 (Models) | 90%+ |
| 序列化器 (Serializers) | 85%+ |
| 视图 (Views) | 80%+ |
| 服务 (Services) | 90%+ |
| 总体 | 80%+ |

## 阶段 5：安全扫描 (Phase 5: Security Scan)

```bash
# 依赖项漏洞扫描
pip-audit
safety check --full-report

# Django 安全检查
python manage.py check --deploy

# Bandit 安全 Linter
bandit -r . -f json -o bandit-report.json

# 密钥扫描（如果安装了 gitleaks）
gitleaks detect --source . --verbose

# 环境变量检查
python -c "from django.core.exceptions import ImproperlyConfigured; from django.conf import settings; settings.DEBUG"
```

报告内容：
- 发现的有漏洞的依赖项
- 安全配置问题
- 检测到的硬编码密钥
- DEBUG 模式状态（在生产环境中应为 False）

## 阶段 6：Django 管理命令 (Phase 6: Django Management Commands)

```bash
# 检查模型问题
python manage.py check

# 收集静态文件
python manage.py collectstatic --noinput --clear

# 创建超级用户（如果测试需要）
echo "from apps.users.models import User; User.objects.create_superuser('admin@example.com', 'admin')" | python manage.py shell

# 数据库完整性检查
python manage.py check --database default

# 缓存验证（如果使用 Redis）
python -c "from django.core.cache import cache; cache.set('test', 'value', 10); print(cache.get('test'))"
```

## 阶段 7：性能检查 (Phase 7: Performance Checks)

```bash
# Django Debug Toolbar 输出（检查 N+1 查询）
# 在 DEBUG=True 的开发模式下运行并访问页面
# 在 SQL 面板中查找重复查询

# 查询计数分析
django-admin debugsqlshell  # 如果安装了 django-debug-sqlshell

# 检查缺失的索引
python manage.py shell << EOF
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("SELECT table_name, index_name FROM information_schema.statistics WHERE table_schema = 'public'")
    print(cursor.fetchall())
EOF
```

报告内容：
- 每个页面的查询数量（典型页面应 < 50）
- 缺失的数据库索引
- 检测到的重复查询

## 阶段 8：静态资源 (Phase 8: Static Assets)

```bash
# 检查 npm 依赖项（如果使用 npm）
npm audit
npm audit fix

# 构建静态文件（如果使用 webpack/vite）
npm run build

# 验证静态文件
ls -la staticfiles/
python manage.py findstatic css/style.css
```

## 阶段 9：配置审查 (Phase 9: Configuration Review)

```python
# 在 Python shell 中运行以验证设置
python manage.py shell << EOF
from django.conf import settings
import os

# 关键检查项
checks = {
    'DEBUG is False': not settings.DEBUG,
    'SECRET_KEY set': bool(settings.SECRET_KEY and len(settings.SECRET_KEY) > 30),
    'ALLOWED_HOSTS set': len(settings.ALLOWED_HOSTS) > 0,
    'HTTPS enabled': getattr(settings, 'SECURE_SSL_REDIRECT', False),
    'HSTS enabled': getattr(settings, 'SECURE_HSTS_SECONDS', 0) > 0,
    'Database configured': settings.DATABASES['default']['ENGINE'] != 'django.db.backends.sqlite3',
}

for check, result in checks.items():
    status = '✓' if result else '✗'
    print(f"{status} {check}")
EOF
```

## 阶段 10：日志配置 (Phase 10: Logging Configuration)

```bash
# 测试日志输出
python manage.py shell << EOF
import logging
logger = logging.getLogger('django')
logger.warning('Test warning message')
logger.error('Test error message')
EOF

# 检查日志文件（如果已配置）
tail -f /var/log/django/django.log
```

## 阶段 11：API 文档 (Phase 11: API Documentation)

```bash
# 生成 Schema
python manage.py generateschema --format openapi-json > schema.json

# 验证 Schema
# 检查 schema.json 是否为有效的 JSON
python -c "import json; json.load(open('schema.json'))"

# 访问 Swagger UI（如果使用 drf-yasg）
# 在浏览器中访问 http://localhost:8000/swagger/
```

## 阶段 12：差异审查 (Phase 12: Diff Review)

```bash
# 显示 diff 统计信息
git diff --stat

# 显示实际变更
git diff

# 显示已变更的文件
git diff --name-only

# 检查常见问题
git diff | grep -i "todo\|fixme\|hack\|xxx"
git diff | grep "print("  # 调试语句
git diff | grep "DEBUG = True"  # 调试模式
git diff | grep "import pdb"  # 调试器
```

检查清单：
- 无调试语句（print, pdb, breakpoint()）
- 关键代码中无 TODO/FIXME 注释
- 无硬编码的密钥或凭据
- 模型变更已包含数据库迁移
- 配置变更已记录文档
- 外部调用已包含错误处理
- 视需要包含事务管理（Transaction management）

## 输出模板 (Output Template)

```
DJANGO 验证报告
==========================

阶段 1：环境检查 (Phase 1: Environment Check)
  ✓ Python 3.11.5
  ✓ 虚拟环境已激活
  ✓ 所有环境变量已设置

阶段 2：代码质量 (Phase 2: Code Quality)
  ✓ mypy: 无类型错误
  ✗ ruff: 发现 3 个问题（已自动修复）
  ✓ black: 无格式化问题
  ✓ isort: 导入语句已排序
  ✓ manage.py check: 无问题

阶段 3：数据库迁移 (Phase 3: Migrations)
  ✓ 无未应用的迁移
  ✓ 无迁移冲突
  ✓ 所有模型均有迁移

阶段 4：测试与覆盖率 (Phase 4: Tests + Coverage)
  测试：247 通过，0 失败，5 跳过
  覆盖率：
    总体：87%
    users: 92%
    products: 89%
    orders: 85%
    payments: 91%

阶段 5：安全扫描 (Phase 5: Security Scan)
  ✗ pip-audit: 发现 2 个漏洞（需要修复）
  ✓ safety check: 无问题
  ✓ bandit: 无安全问题
  ✓ 未检测到密钥
  ✓ DEBUG = False

阶段 6：Django 命令 (Phase 6: Django Commands)
  ✓ collectstatic 已完成
  ✓ 数据库完整性正常
  ✓ 缓存后端可连接

阶段 7：性能 (Phase 7: Performance)
  ✓ 未检测到 N+1 查询
  ✓ 数据库索引已配置
  ✓ 查询计数在可接受范围内

阶段 8：静态资源 (Phase 8: Static Assets)
  ✓ npm audit: 无漏洞
  ✓ 资源构建成功
  ✓ 静态文件已收集

阶段 9：配置审查 (Phase 9: Configuration)
  ✓ DEBUG = False
  ✓ SECRET_KEY 已配置
  ✓ ALLOWED_HOSTS 已设置
  ✓ HTTPS 已启用
  ✓ HSTS 已启用
  ✓ 数据库已配置

阶段 10：日志 (Phase 10: Logging)
  ✓ 日志已配置
  ✓ 日志文件可写

阶段 11：API 文档 (Phase 11: API Documentation)
  ✓ Schema 已生成
  ✓ Swagger UI 可访问

阶段 12：差异审查 (Phase 12: Diff Review)
  文件变更：12
  +450, -120 行
  ✓ 无调试语句
  ✓ 无硬编码密钥
  ✓ 已包含迁移

建议：⚠️ 在部署前修复 pip-audit 漏洞

后续步骤：
1. 更新有漏洞的依赖项
2. 重新运行安全扫描
3. 部署到预发布环境进行最终测试
```

## 预部署检查清单 (Pre-Deployment Checklist)

- [ ] 所有测试均通过
- [ ] 覆盖率 ≥ 80%
- [ ] 无安全漏洞
- [ ] 无未应用的迁移
- [ ] 生产环境设置中 DEBUG = False
- [ ] SECRET_KEY 已正确配置
- [ ] ALLOWED_HOSTS 已正确设置
- [ ] 数据库备份已启用
- [ ] 静态文件已收集并提供服务
- [ ] 日志已配置并正常工作
- [ ] 错误监控（Sentry 等）已配置
- [ ] CDN 已配置（如适用）
- [ ] Redis/缓存后端已配置
- [ ] Celery worker 正在运行（如适用）
- [ ] HTTPS/SSL 已配置
- [ ] 环境变量已记录文档

## 持续集成 (Continuous Integration)

### GitHub Actions 示例

```yaml
# .github/workflows/django-verification.yml
name: Django Verification

on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Cache pip
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install ruff black mypy pytest pytest-django pytest-cov bandit safety pip-audit

      - name: Code quality checks
        run: |
          ruff check .
          black . --check
          isort . --check-only
          mypy .

      - name: Security scan
        run: |
          bandit -r . -f json -o bandit-report.json
          safety check --full-report
          pip-audit

      - name: Run tests
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
          DJANGO_SECRET_KEY: test-secret-key
        run: |
          pytest --cov=apps --cov-report=xml --cov-report=term-missing

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 快速参考 (Quick Reference)

| 检查项 | 命令 |
|-------|---------|
| 环境 (Environment) | `python --version` |
| 类型检查 (Type checking) | `mypy .` |
| 代码检查 (Linting) | `ruff check .` |
| 格式化 (Formatting) | `black . --check` |
| 数据库迁移 (Migrations) | `python manage.py makemigrations --check` |
| 测试 (Tests) | `pytest --cov=apps` |
| 安全 (Security) | `pip-audit && bandit -r .` |
| Django 检查 (Django check) | `python manage.py check --deploy` |
| 收集静态资源 (Collectstatic) | `python manage.py collectstatic --noinput` |
| 差异统计 (Diff stats) | `git diff --stat` |

记住：自动化验证可以捕捉常见问题，但不能取代手动代码审查和在预发布环境（Staging environment）中的测试。
