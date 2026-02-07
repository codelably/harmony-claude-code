# 项目示例 CLAUDE.md

这是一个项目级 CLAUDE.md 文件的示例。请将其放置在项目根目录下。

## 项目概览

[简要描述您的项目 - 功能、技术栈]

## 核心规则

### 1. 代码组织

- 倾向于使用多个小文件，而非少数大文件
- 高内聚，低耦合
- 通常为 200-400 行，单文件最大不超过 800 行
- 按功能/领域（Feature/Domain）组织，而非按类型组织

### 2. 核心技术栈约束
- 开发平台：HarmonyOS（ArkTS/TypeScript），优先使用官方最新稳定版API
- 状态管理：强制使用 V2 版本（@ObservedV2 / AppStorageV2 / PersistenceV2），禁用所有 V1 版本 API
- 架构模式：严格遵循 MVVM 多模块架构，View 层仅负责渲染，所有业务逻辑必须封装在 ViewModel 中
- 组件优先级：模块内复用组件 → core/ui 跨模块通用组件 → IBest-UI-V2 组件库（禁止重复开发已有组件）

### 3. 代码风格

- 代码、注释或文档中不得使用表情符号（Emoji）
- 始终坚持不可变性（Immutability） - 严禁直接修改对象或数组
- 使用 try/catch 进行妥善的错误处理
- 字符串默认双引号，语句末尾必须加分号；禁用 var，优先 const，其次 let
- 禁用 any 类型，所有方法、参数、返回值必须编写完整类型注解；接口/类型需显式声明
- 变量/函数：camelCase（小驼峰），如 getUserInfo、goodsList
- 类/接口：PascalCase（大驼峰），如 UserViewModel、IGoodsModel
- 常量：UPPER_SNAKE_CASE（大写蛇形），如 MAX_PAGE_SIZE、COLOR_PRIMARY
- 注释规范：
  - 文件头部必须包含 @file（文件功能） + @author（开发者）
  - 所有方法必须编写 JSDoc 注释，包含 @param、@returns，复杂方法补充 @example
  - 注释语言以中文为主，技术关键字/API 保留英文

### 4. 布局与交互约束

- 容器组件：优先使用 core/designsystem 封装的 RowBase/ColumnBase/RowCenter/ColumnCenter 等组件
- 均分布局：强制使用 layoutWeight (1) 实现，禁用 SpaceAround/SpaceBetween 避免布局适配问题
- 页面适配：使用百分比 / 布局权重 / 系统自适应单位，禁止硬编码固定宽高（图标等固定尺寸元素除外）
- 状态响应：VM 与 View 之间的状态同步，必须使用 @ObservedV2/@ObjectLinkV2 实现，禁止手动刷新 UI

### 5. 工程命令与问题处理

### 5.1 问题处理原则
- 技术选型：优先参考鸿蒙官方最新文档 → 项目已实现的同类代码 → IBest-UI-V2 官方示例
- 组件库用法：IBest-UI-V2 地址：[https://github.com/ibestservices/ibest-ui-v2](https://github.com/ibestservices/ibest-ui-v2)
  有组件问题就联网搜索对应文档。文档地址：[https://ibestui.ibestservices.com](https://ibestui.ibestservices.com/components/button/)
- IBest-UI-V2 官方示例代码: `context/IBest-UI/` 有组件问题就来这里查看官方示例代码。
- 不确定场景：先核对项目现有代码风格 → 查阅相关规范文档 → 反馈确认，禁止凭经验臆造实现方式

### 5.2 编码命令
```bash
# 构建HAP包（全局hvigor环境）
hvigorw assembleHap -p product=default
```
- 每次编码完成后，执行命令进行构建。

### 6. 测试

- 测试驱动开发（TDD）：先写测试
- 为工具函数编写单元测试
- 为 API 编写集成测试

### 7. 安全

- 严禁硬编码秘钥（Secrets）
- 敏感数据使用环境变量
- 验证所有用户输入
- 仅使用参数化查询（Parameterized queries）
- 启用跨站请求伪造（CSRF）防护

## 文件结构

```
src/
|-- entry/            # 应用入口，初始化框架
|-- core/             # 框架核心层
|-- shared/           # 共享契约层
|-- packages/         # 业务功能包层
```

## 可用命令

- `/tdd` - 测试驱动开发（TDD）工作流
- `/plan` - 创建实现方案
- `/code-review` - 代码质量评审
- `/build-fix` - 修复构建错误

## Git 工作流

- 约定式提交（Conventional commits）：`feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- 严禁直接提交到 main 分支
- 合并请求（PRs）必须经过评审
- 所有测试必须通过后方可合并
