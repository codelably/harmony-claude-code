<div align="center">

# OneSkill 元管理器 (Meta-Manager)

**AI 智能体 (Agent) 技能的通用桥梁**  
帮助你发现、安装并将 OpenSkills 注册表中的能力映射到你的运行环境。

[![](https://img.shields.io/npm/v/oneskill?color=brightgreen)](https://www.npmjs.com/package/oneskill)
[![](https://img.shields.io/npm/l/oneskill)](LICENSE)

[**🇺🇸 English**](README.md) | [**🇨🇳 中文指南**](README_CN.md)

</div>

---

## ⚡️ 什么是 OneSkill？

**OneSkill** 是一个为 AI 智能体 (Agent) 设计的通用技能管理工具。它作为 [OpenSkills](https://github.com/Starttoaster/openskills) 生态系统的搜索引擎和工作流管理器 (Workflow Manager)，帮助你发现、安装并将能力映射到你的运行环境中。

虽然 `openskills` 负责文件的下载安装，但 **OneSkill** 提供了：
1.  **智能搜索**: 支持通过自然语言或关键词搜索注册表中的技能 (Skill)。
2.  **工作流引导**: 为智能体 (Agent) 提供了一套标准的扩展能力流程（搜索 -> 确认 -> 安装）。
3.  **环境映射 (Mapping)**: 解决了安装路径与运行环境不一致的问题。特别是对于 **Gemini CLI** 用户，OneSkill 能自动将下载的技能 (Skill) 映射到 Gemini 的配置文件中。

## 🚀 快速开始

无需全局安装，直接使用 `npx` 运行即可：

```bash
# 搜索技能 (例如：想要网页浏览能力)
npx oneskill search "puppeteer browser"

# 搜索数据库相关技能，并按星级排序
npx oneskill search "database" --sort stars
```

## 🛠 使用流程

为你的智能体 (Agent) 添加新能力的推荐步骤：

1.  **搜索 (Search)**: 查找你需要的技能 (Skill)。
    ```bash
    npx oneskill search "github integration"
    ```

2.  **安装 (Install)**: 使用 `openskills` 标准命令进行下载。
    ```bash
    npx openskills install anthropics/skills
    ```

3.  **映射 (Map)**: **(Gemini 用户必读)**
    `openskills` 默认将文件下载到通用目录，Gemini CLI 无法直接读取。必须执行映射 (Mapping) 命令：
    ```bash
    # 自动识别已安装的技能 (Skill) 并配置到 Gemini
    npx oneskill map --target gemini
    ```
    *如果你的技能 (Skill) 是全局安装的 (加了 --global)，这里也需要加 --global。*

## 📖 命令参考

### `search` (搜索)
在全局注册表中搜索技能 (Skill)。
```bash
npx oneskill search <查询词> [选项]

# 选项:
#   --category <name>   按分类筛选
#   --sort <field>      排序方式: 'stars' (星级), 'created' (创建时间), 'updated' (更新时间)
#   --limit <number>    限制返回数量 (默认: 10)
```

### `map` (映射)
为特定环境生成配置。
```bash
npx oneskill map --target <环境>

# 支持的目标:
#   gemini    更新 Gemini CLI 的配置与路径映射
```

### `list` (列表)
查看本地已安装的技能 (Skill)。
```bash
npx oneskill list
```

---

<div align="center">
  <sub>Built with ❤️ by the OneSkill Community</sub>
</div>
