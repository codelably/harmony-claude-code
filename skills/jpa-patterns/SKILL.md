---
name: jpa-patterns
description: Spring Boot 中用于实体设计、关联关系、查询优化、事务、审计、索引、分页和连接池的 JPA/Hibernate 模式。
---

# JPA/Hibernate 模式

用于 Spring Boot 中的数据建模、存储层（Repositories）开发和性能调优。

## 实体设计（Entity Design）

```java
@Entity
@Table(name = "markets", indexes = {
  @Index(name = "idx_markets_slug", columnList = "slug", unique = true)
})
@EntityListeners(AuditingEntityListener.class)
public class MarketEntity {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, unique = true, length = 120)
  private String slug;

  @Enumerated(EnumType.STRING)
  private MarketStatus status = MarketStatus.ACTIVE;

  @CreatedDate private Instant createdAt;
  @LastModifiedDate private Instant updatedAt;
}
```

启用审计（Auditing）：
```java
@Configuration
@EnableJpaAuditing
class JpaConfig {}
```

## 关联关系与 N+1 问题预防

```java
@OneToMany(mappedBy = "market", cascade = CascadeType.ALL, orphanRemoval = true)
private List<PositionEntity> positions = new ArrayList<>();
```

- 默认使用懒加载（Lazy loading）；必要时在查询中使用 `JOIN FETCH`
- 避免在集合上使用立即加载（`EAGER`）；对于读取路径，优先使用 DTO 投影（Projections）

```java
@Query("select m from MarketEntity m left join fetch m.positions where m.id = :id")
Optional<MarketEntity> findWithPositions(@Param("id") Long id);
```

## 存储层模式（Repository Patterns）

```java
public interface MarketRepository extends JpaRepository<MarketEntity, Long> {
  Optional<MarketEntity> findBySlug(String slug);

  @Query("select m from MarketEntity m where m.status = :status")
  Page<MarketEntity> findByStatus(@Param("status") MarketStatus status, Pageable pageable);
}
```

- 使用投影（Projections）进行轻量级查询：
```java
public interface MarketSummary {
  Long getId();
  String getName();
  MarketStatus getStatus();
}
Page<MarketSummary> findAllBy(Pageable pageable);
```

## 事务（Transactions）

- 使用 `@Transactional` 注解 Service 方法
- 在读取路径上使用 `@Transactional(readOnly = true)` 进行优化
- 谨慎选择传播行为（Propagation）；避免长事务

```java
@Transactional
public Market updateStatus(Long id, MarketStatus status) {
  MarketEntity entity = repo.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Market"));
  entity.setStatus(status);
  return Market.from(entity);
}
```

## 分页（Pagination）

```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
Page<MarketEntity> markets = repo.findByStatus(MarketStatus.ACTIVE, page);
```

对于游标式分页（Cursor-like pagination），请在 JPQL 中包含 `id > :lastId` 并配合排序。

## 索引与性能

- 为常用过滤器（`status`、`slug`、外键）添加索引（Indexing）
- 使用匹配查询模式的复合索引（Composite indexes，如 `status, created_at`）
- 避免使用 `select *`；仅投影所需的列
- 使用 `saveAll` 并配置 `hibernate.jdbc.batch_size` 进行批量写入

## 连接池（Connection Pooling - HikariCP）

推荐属性：
```
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.validation-timeout=5000
```

对于 PostgreSQL 的 LOB 处理，请添加：
```
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true
```

## 缓存（Caching）

- 一级缓存（1st-level cache）是基于 EntityManager 的；避免跨事务保留实体
- 对于读多写少的实体，谨慎考虑二级缓存（2nd-level cache）；验证逐出策略（Eviction strategy）

## 数据迁移（Migrations）

- 使用 Flyway 或 Liquibase；在生产环境中绝不要依赖 Hibernate 的自动 DDL
- 保持迁移是幂等（Idempotent）且具有增量性的；避免在没有计划的情况下删除列

## 测试数据访问

- 优先使用 `@DataJpaTest` 配合 Testcontainers 来模拟生产环境
- 使用日志断言 SQL 效率：设置 `logging.level.org.hibernate.SQL=DEBUG` 以及 `logging.level.org.hibernate.orm.jdbc.bind=TRACE` 以查看参数值

**记住**：保持实体精简、查询意图明确且事务简短。通过抓取策略（Fetch strategies）和投影（Projections）来防止 N+1 问题，并针对读/写路径建立索引。
