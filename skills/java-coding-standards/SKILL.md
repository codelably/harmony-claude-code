---
name: java-coding-standards
description: Spring Boot 服务的 Java 编码规范：命名、不可变性（Immutability）、Optional 使用、流（Streams）、异常处理、泛型（Generics）和项目布局。
---

# Java 编码规范

适用于 Spring Boot 服务中易读、可维护的 Java (17+) 代码规范。

## 核心原则

- 清晰胜过奇巧
- 默认不可变（Immutable）；尽量减少共享的可变状态
- 快速失败并抛出有意义的异常
- 保持一致的命名和包结构

## 命名

```java
// ✅ 类（Classes）/ 记录（Records）：大驼峰式（PascalCase）
public class MarketService {}
public record Money(BigDecimal amount, Currency currency) {}

// ✅ 方法/字段：小驼峰式（camelCase）
private final MarketRepository marketRepository;
public Market findBySlug(String slug) {}

// ✅ 常量：大写下划线命名式（UPPER_SNAKE_CASE）
private static final int MAX_PAGE_SIZE = 100;
```

## 不可变性（Immutability）

```java
// ✅ 优先使用记录（Records）和 final 字段
public record MarketDto(Long id, String name, MarketStatus status) {}

public class Market {
  private final Long id;
  private final String name;
  // 仅提供 getter，不提供 setter
}
```

## Optional 使用

```java
// ✅ find* 方法返回 Optional
Optional<Market> market = marketRepository.findBySlug(slug);

// ✅ 使用 map/flatMap 而不是 get()
return market
    .map(MarketResponse::from)
    .orElseThrow(() -> new EntityNotFoundException("Market not found"));
```

## 流（Streams）最佳实践

```java
// ✅ 使用流进行转换，保持流水线简短
List<String> names = markets.stream()
    .map(Market::name)
    .filter(Objects::nonNull)
    .toList();

// ❌ 避免复杂的嵌套流；为了清晰起见，优先使用循环
```

## 异常处理

- 领域错误使用非受检异常（Unchecked Exceptions）；为技术异常包装上下文信息
- 创建领域特定的异常（例如 `MarketNotFoundException`）
- 避免宽泛的 `catch (Exception ex)`，除非是进行集中式重抛（Rethrow）或日志记录

```java
throw new MarketNotFoundException(slug);
```

## 泛型与类型安全

- 避免原始类型（Raw Types）；声明泛型参数
- 可复用工具类优先使用有界泛型（Bounded Generics）

```java
public <T extends Identifiable> Map<Long, T> indexById(Collection<T> items) { ... }
```

## 项目结构 (Maven/Gradle)

```
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  util/
src/main/resources/
  application.yml
src/test/java/... (结构与 main 保持镜像)
```

## 格式与风格

- 一致地使用 2 或 4 个空格（遵循项目标准）
- 每个文件仅包含一个公共顶层类型
- 保持方法简短且聚焦；提取辅助方法（Helper methods）
- 成员排序：常量、字段、构造函数、公共方法、受保护方法、私有方法

## 需避免的代码坏味道（Code Smells）

- 长参数列表 → 使用 DTO/构建器（Builders）
- 深层嵌套 → 尽早返回（Early returns）
- 魔法数字 → 具名常量
- 静态可变状态 → 优先使用依赖注入（Dependency Injection）
- 静默的 catch 块 → 记录日志并处理或重抛

## 日志记录

```java
private static final Logger log = LoggerFactory.getLogger(MarketService.class);
log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);
```

## 空值处理（Null Handling）

- 仅在不可避免时接受 `@Nullable`；否则使用 `@NonNull`
- 在输入上使用 Bean 校验（`@NotNull`, `@NotBlank`）

## 测试预期

- 使用 JUnit 5 + AssertJ 进行流式断言（Fluent Assertions）
- 使用 Mockito 进行模拟（Mocking）；尽可能避免部分模拟（Partial Mocks）
- 倾向于确定性测试；不要包含隐藏的 sleep 操作

**记住**：保持代码的意图清晰、类型安全且具有可观测性。除非证明有必要，否则应优先考虑可维护性而非微优化。
