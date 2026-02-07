---
name: springboot-security
description: Spring Boot 服务中关于身份认证/授权（authn/authz）、校验、CSRF、密钥管理、响应头、限流及依赖安全的 Spring Security 最佳实践。
---

# Spring Boot 安全审查

在添加认证、处理输入、创建端点或处理密钥时使用。

## 身份认证（Authentication）

- 优先使用无状态 JWT 或带有撤回列表（Revocation List）的不透明令牌（Opaque Tokens）
- 为会话（Session）使用 `httpOnly`、`Secure`、`SameSite=Strict` 的 Cookie
- 使用 `OncePerRequestFilter` 或资源服务器验证令牌

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain chain) throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      Authentication auth = jwtService.authenticate(token);
      SecurityContextHolder.getContext().setAuthentication(auth);
    }
    chain.doFilter(request, response);
  }
}
```

## 授权（Authorization）

- 启用方法级安全：`@EnableMethodSecurity`
- 使用 `@PreAuthorize("hasRole('ADMIN')")` 或 `@PreAuthorize("@authz.canEdit(#id)")`
- 默认拒绝（Deny by default）；仅暴露必要的权限范围（Scopes）

## 输入校验（Input Validation）

- 在控制器（Controller）上配合使用 Bean Validation 与 `@Valid`
- 在 DTO 上应用约束：`@NotBlank`、`@Email`、`@Size` 以及自定义校验器
- 在渲染之前，通过白名单对任何 HTML 进行净化（Sanitize）

## 防止 SQL 注入

- 使用 Spring Data 存储库（Repositories）或参数化查询
- 对于原生查询，使用 `:param` 绑定；严禁拼接字符串

## CSRF 防护

- 对于基于浏览器会话的应用，保持启用 CSRF；在表单/请求头中包含令牌
- 对于使用 Bearer 令牌的纯 API，禁用 CSRF 并依赖无状态认证

```java
http
  .csrf(csrf -> csrf.disable())
  .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```

## 密钥管理（Secrets Management）

- 源代码中不保留密钥；从环境变量或 Vault 加载
- 确保 `application.yml` 中没有凭据；使用占位符
- 定期轮换令牌和数据库凭据

## 安全响应头（Security Headers）

```java
http
  .headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
      .policyDirectives("default-src 'self'"))
    .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)
    .xssProtection(Customizer.withDefaults())
    .referrerPolicy(rp -> rp.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFER_ER)));
```

## 限流（Rate Limiting）

- 在高开销端点上应用 Bucket4j 或网关级限流
- 对突发流量进行日志记录并告警；返回 429 状态码及重试提示

## 依赖安全（Dependency Security）

- 在 CI 中运行 OWASP Dependency Check / Snyk
- 保持 Spring Boot 和 Spring Security 处于受支持的版本
- 发现已知 CVE 时构建失败

## 日志与个人敏感信息（PII）

- 严禁在日志中记录密钥、令牌、密码或完整的银行卡号（PAN）数据
- 脱敏敏感字段；使用结构化 JSON 日志记录

## 文件上传

- 校验大小、内容类型（Content Type）和扩展名
- 存储在 Web 根目录之外；必要时进行扫描

## 发布前自检清单

- [ ] 身份认证令牌已正确验证并配置过期时间
- [ ] 每个敏感路径都有授权保护
- [ ] 所有输入均已校验并净化
- [ ] 没有字符串拼接的 SQL
- [ ] CSRF 配置符合应用类型
- [ ] 密钥已外部化；未提交任何密钥
- [ ] 安全响应头已配置
- [ ] API 已配置限流
- [ ] 依赖已扫描且为最新
- [ ] 日志中不包含敏感数据

**记住**：默认拒绝、校验输入、最小权限原则，以及配置优先的安全性。
