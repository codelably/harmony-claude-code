---
name: springboot-patterns
description: Spring Boot 架构模式、REST API 设计、分层服务、数据访问、缓存、异步处理和日志记录。适用于 Java Spring Boot 后端开发工作。
---

# Spring Boot 开发模式 (Spring Boot Development Patterns)

适用于可扩展、生产级服务的 Spring Boot 架构与 API 模式。

## REST API 结构

```java
@RestController
@RequestMapping("/api/markets")
@Validated
class MarketController {
  private final MarketService marketService;

  MarketController(MarketService marketService) {
    this.marketService = marketService;
  }

  @GetMapping
  ResponseEntity<Page<MarketResponse>> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Page<Market> markets = marketService.list(PageRequest.of(page, size));
    return ResponseEntity.ok(markets.map(MarketResponse::from));
  }

  @PostMapping
  ResponseEntity<MarketResponse> create(@Valid @RequestBody CreateMarketRequest request) {
    Market market = marketService.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(MarketResponse.from(market));
  }
}
```

## 仓储模式 (Repository Pattern - Spring Data JPA)

```java
public interface MarketRepository extends JpaRepository<MarketEntity, Long> {
  @Query("select m from MarketEntity m where m.status = :status order by m.volume desc")
  List<MarketEntity> findActive(@Param("status") MarketStatus status, Pageable pageable);
}
```

## 带事务的服务层 (Service Layer with Transactions)

```java
@Service
public class MarketService {
  private final MarketRepository repo;

  public MarketService(MarketRepository repo) {
    this.repo = repo;
  }

  @Transactional
  public Market create(CreateMarketRequest request) {
    MarketEntity entity = MarketEntity.from(request);
    MarketEntity saved = repo.save(entity);
    return Market.from(saved);
  }
}
```

## DTO 与校验 (DTOs and Validation)

```java
public record CreateMarketRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 2000) String description,
    @NotNull @FutureOrPresent Instant endDate,
    @NotEmpty List<@NotBlank String> categories) {}

public record MarketResponse(Long id, String name, MarketStatus status) {
  static MarketResponse from(Market market) {
    return new MarketResponse(market.id(), market.name(), market.status());
  }
}
```

## 异常处理 (Exception Handling)

```java
@ControllerAdvice
class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> e.getField() + ": " + e.getDefaultMessage())
        .collect(Collectors.joining(", "));
    return ResponseEntity.badRequest().body(ApiError.validation(message));
  }

  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiError> handleAccessDenied() {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of("Forbidden"));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> handleGeneric(Exception ex) {
    // 记录带有堆栈跟踪的非预期错误
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiError.of("Internal server error"));
  }
}
```

## 缓存 (Caching)

需要在配置类上添加 `@EnableCaching`。

```java
@Service
public class MarketCacheService {
  private final MarketRepository repo;

  public MarketCacheService(MarketRepository repo) {
    this.repo = repo;
  }

  @Cacheable(value = "market", key = "#id")
  public Market getById(Long id) {
    return repo.findById(id)
        .map(Market::from)
        .orElseThrow(() -> new EntityNotFoundException("Market not found"));
  }

  @CacheEvict(value = "market", key = "#id")
  public void evict(Long id) {}
}
```

## 异步处理 (Async Processing)

需要在配置类上添加 `@EnableAsync`。

```java
@Service
public class NotificationService {
  @Async
  public CompletableFuture<Void> sendAsync(Notification notification) {
    // 发送 邮件/短信
    return CompletableFuture.completedFuture(null);
  }
}
```

## 日志记录 (Logging - SLF4J)

```java
@Service
public class ReportService {
  private static final Logger log = LoggerFactory.getLogger(ReportService.class);

  public Report generate(Long marketId) {
    log.info("generate_report marketId={}", marketId);
    try {
      // 业务逻辑
    } catch (Exception ex) {
      log.error("generate_report_failed marketId={}", marketId, ex);
      throw ex;
    }
    return new Report();
  }
}
```

## 中间件 / 过滤器 (Middleware / Filters)

```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    long start = System.currentTimeMillis();
    try {
      filterChain.doFilter(request, response);
    } finally {
      long duration = System.currentTimeMillis() - start;
      log.info("req method={} uri={} status={} durationMs={}",
          request.getMethod(), request.getRequestURI(), response.getStatus(), duration);
    }
  }
}
```

## 分页与排序 (Pagination and Sorting)

```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
Page<Market> results = marketService.list(page);
```

## 容错性外部调用 (Error-Resilient External Calls)

```java
public <T> T withRetry(Supplier<T> supplier, int maxRetries) {
  int attempts = 0;
  while (true) {
    try {
      return supplier.get();
    } catch (Exception ex) {
      attempts++;
      if (attempts >= maxRetries) {
        throw ex;
      }
      try {
        Thread.sleep((long) Math.pow(2, attempts) * 100L);
      } catch (InterruptedException ie) {
        Thread.currentThread().interrupt();
        throw ex;
      }
    }
  }
}
```

## 限流 (Filter + Bucket4j)

**安全注意事项**：`X-Forwarded-For` 请求头默认是不可信的，因为客户端可以伪造它。
仅在以下情况下使用转发请求头：
1. 你的应用位于受信任的反向代理（nginx、AWS ALB 等）之后
2. 你已将 `ForwardedHeaderFilter` 注册为 Bean
3. 你在 application 属性中配置了 `server.forward-headers-strategy=NATIVE` 或 `FRAMEWORK`
4. 你的代理配置为覆盖（而非追加）`X-Forwarded-For` 请求头

当 `ForwardedHeaderFilter` 配置正确时，`request.getRemoteAddr()` 将自动从转发头中返回正确的客户端 IP。如果没有此配置，请直接使用 `request.getRemoteAddr()`——它返回直接连接的 IP，这是唯一可信的值。

```java
@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  /*
   * 安全提示：此过滤器使用 request.getRemoteAddr() 来识别用于限流的客户端。
   *
   * 如果你的应用位于反向代理（nginx、AWS ALB 等）之后，你必须配置 Spring 
   * 正确处理转发头，以便准确检测客户端 IP：
   *
   * 1. 在 application.properties/yaml 中设置 server.forward-headers-strategy=NATIVE 
   *    (适用于云平台) 或 FRAMEWORK
   * 2. 如果使用 FRAMEWORK 策略，请注册 ForwardedHeaderFilter：
   *
   *    @Bean
   *    ForwardedHeaderFilter forwardedHeaderFilter() {
   *        return new ForwardedHeaderFilter();
   *    }
   *
   * 3. 确保你的代理覆盖（而不是追加）X-Forwarded-For 请求头以防止伪造
   * 4. 为你的容器配置 server.tomcat.remoteip.trusted-proxies 或等效配置
   *
   * 如果没有这些配置，request.getRemoteAddr() 将返回代理服务器的 IP，而非客户端 IP。
   * 不要直接读取 X-Forwarded-For —— 在没有受信任代理处理的情况下，它是极易伪造的。
   */
  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
    // 使用 getRemoteAddr()，它在配置了 ForwardedHeaderFilter 时返回正确的客户端 IP，
    // 否则返回直接连接的 IP。在没有正确代理配置的情况下，切勿直接信任 X-Forwarded-For 头。
    String clientIp = request.getRemoteAddr();

    Bucket bucket = buckets.computeIfAbsent(clientIp,
        k -> Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
            .build());

    if (bucket.tryConsume(1)) {
      filterChain.doFilter(request, response);
    } else {
      response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
    }
  }
}
```

## 后台任务 (Background Jobs)

使用 Spring 的 `@Scheduled` 或集成队列（如 Kafka、SQS、RabbitMQ）。保持处理程序具有幂等性和可观测性。

## 可观测性 (Observability)

- 通过 Logback encoder 实现结构化日志（JSON）
- 指标（Metrics）：Micrometer + Prometheus/OTel
- 链路追踪（Tracing）：使用 OpenTelemetry 或 Brave 后端的 Micrometer Tracing

## 生产环境默认实践 (Production Defaults)

- 优先使用构造函数注入，避免字段注入
- 为 RFC 7807 错误启用 `spring.mvc.problemdetails.enabled=true` (Spring Boot 3+)
- 根据工作负载配置 HikariCP 连接池大小并设置超时
- 为查询使用 `@Transactional(readOnly = true)`
- 通过 `@NonNull` 和 `Optional` 在适当时强制执行空安全（null-safety）

**切记**：保持控制器（Controller）薄、服务（Service）专注、仓储（Repository）简单，并集中处理错误。针对可维护性和可测试性进行优化。
