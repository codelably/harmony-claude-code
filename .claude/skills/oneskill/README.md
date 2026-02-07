<div align="center">

# OneSkill 元管理器（Meta-Manager）

**AI 智能体技能（Agent Skills）的通用桥梁。**  
从 OpenSkills 注册表中发现、安装并映射功能到您的环境。

[![](https://img.shields.io/npm/v/oneskill?color=brightgreen)](https://www.npmjs.com/package/oneskill)
[![](https://img.shields.io/npm/l/oneskill)](LICENSE)

[**🇺🇸 English**](README.md) | [**🇨🇳 中文指南**](README_CN.md)

</div>

---

## ⚡️ 什么是 OneSkill？

**OneSkill** 是一款专为 AI 智能体（Agent）（以及人类）设计的元工具，用于轻松扩展其功能。它是 [OpenSkills](https://github.com/Starttoaster/openskills) 生态系统的搜索引擎和工作流管理器（Workflow Manager）。

虽然 `openskills` 处理文件的原始安装，但 **OneSkill** 提供：
1.  **智能搜索（Intelligent Search）**：使用自然语言或关键词找到适合该任务的工具。
2.  **工作流指南（Workflow Guidance）**：为智能体（Agent）安全获取新技能提供标准化流程。
3.  **环境映射（Environment Mapping）**：至关重要的一点是，它弥合了 `openskills`（标准结构）与 **Gemini CLI**（自定义结构）等使用者之间的鸿沟。

## 🚀 快速开始

您无需永久安装。只需使用 `npx` 运行即可。

```bash
# 搜索技能（例如，用于浏览网页）
npx oneskill search "puppeteer browser"

# 搜索按流行度排序的数据库工具
npx oneskill search "database" --sort stars
```

## 🛠 工作流

为您的智能体（Agent）添加新功能的标准生命周期：

1.  **搜索（Search）**：查找技能。
    ```bash
    npx oneskill search "github integration"
    ```
2.  **安装（Install）**：使用标准的 `openskills` 安装程序。
    ```bash
    npx openskills install anthropics/skills
    ```
3.  **映射（Map）（对 Gemini 至关重要）**：如果您正在使用 **Gemini CLI**，则必须将安装的技能映射到您的配置中。
    ```bash
    # 将安装的技能映射到 Gemini 的配置
    npx oneskill map --target gemini
    ```

## 📖 命令参考

### `search`
在全局注册表中搜索技能。
```bash
npx oneskill search <query> [options]

# 选项：
#   --category <name>   按类别过滤
#   --sort <field>      按 'stars'、'created' 或 'updated' 排序
#   --limit <number>    限制结果数量（默认值：10）
```

### `map`
为特定的智能体（Agent）环境生成配置。
```bash
npx oneskill map --target <env>

# 目标：
#   gemini    生成/更新 Gemini CLI 配置
```

### `list`
列出本地映射的技能（`openskills list` 的封装）。
```bash
npx oneskill list
```

---

<div align="center">
  <sub>由 OneSkill 社区用 ❤️ 构建</sub>
</div>
