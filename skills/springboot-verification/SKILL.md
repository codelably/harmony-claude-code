---
name: springboot-verification
description: Spring Boot 项目的验证循环（Verification loop）：包含构建、静态分析、带覆盖率的测试、安全扫描，以及在发布或 PR 前的差异评审（diff review）。
---

# Spring Boot 验证循环（Verification Loop）

在提交 PR 前、发生重大变更后以及预部署阶段运行此流程。

## 阶段 1：构建（Build）

```bash
mvn -T 4 clean verify -DskipTests
# 或者
./gradlew clean assemble -x test
```

如果构建失败，请停止并修复。

## 阶段 2：静态分析（Static Analysis）

Maven（常用插件）：
```bash
mvn -T 4 spotbugs:check pmd:check checkstyle:check
```

Gradle（如果已配置）：
```bash
./gradlew checkstyleMain pmdMain spotbugsMain
```

## 阶段 3：测试 + 覆盖率（Tests + Coverage）

```bash
mvn -T 4 test
mvn jacoco:report   # 验证 80% 以上的覆盖率
# 或者
./gradlew test jacocoTestReport
```

报告指标：
- 测试总数、通过/失败数量
- 覆盖率 %（行/分支）

## 阶段 4：安全扫描（Security Scan）

```bash
# 依赖项 CVE 漏洞扫描
mvn org.owasp:dependency-check-maven:check
# 或者
./gradlew dependencyCheckAnalyze

# 密钥（Secrets）扫描 (git)
git secrets --scan  # 如果已配置
```

## 阶段 5：代码规范/格式化（Lint/Format，可选阈值）

```bash
mvn spotless:apply   # 如果使用了 Spotless 插件
./gradlew spotlessApply
```

## 阶段 6：差异评审（Diff Review）

```bash
git diff --stat
git diff
```

自查清单（Checklist）：
- 未残留调试日志（如 `System.out`，或缺少防护检查的 `log.debug`）
- 错误信息和 HTTP 状态码具有明确语义
- 在必要处已包含事务（Transactions）和校验（Validation）
- 配置变更已记录在文档中

## 输出模版（Output Template）

```
验证报告 (VERIFICATION REPORT)
===================
构建 (Build):        [通过/失败]
静态分析 (Static):   [通过/失败] (spotbugs/pmd/checkstyle)
测试 (Tests):        [通过/失败] (通过 X/Y，覆盖率 Z%)
安全 (Security):     [通过/失败] (CVE 发现数量: N)
差异 (Diff):         [X 个文件已变更]

结论 (Overall):      [就绪 / 未就绪]

待修复问题:
1. ...
2. ...
```

## 持续模式（Continuous Mode）

- 在发生显著变更时，或在长会话中每 30–60 分钟重新运行各阶段。
- 保持短反馈循环：运行 `mvn -T 4 test` + spotbugs 以获得快速反馈。

**记住**：快速反馈优于后期惊讶。保持严格的准入门槛——在生产系统中，将警告（Warnings）视为缺陷（Defects）。
