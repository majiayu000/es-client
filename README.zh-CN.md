# ElasticEye

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-blue.svg)](README.zh-CN.md)

ElasticEye 是一个现代化的 Elasticsearch 管理工具，提供直观的用户界面来管理和监控 Elasticsearch 集群。

## ✨ 功能特点

- 🚀 **多集群管理**
  - 管理多个 Elasticsearch 集群
  - 实时健康状态监控
  - 集群概览和统计信息

- 📊 **索引管理**
  - 创建和配置索引
  - 管理索引设置和映射
  - 索引模板和生命周期策略

- 🔍 **高级搜索**
  - 直观的查询构建器
  - 支持复杂 JSON 查询模式
  - 结果可视化和导出

- 💎 **分片管理**
  - 分片分配可视化
  - 迁移监控
  - 节点负载均衡

- ⌨️ **开发者体验**
  - 键盘快捷键
  - 深色/浅色主题
  - 跨平台桌面应用

## 🚀 快速开始

### 前提条件

- Node.js >= 16
- pnpm >= 8
- Rust（用于桌面应用）

### 安装

```bash
# 克隆仓库
git clone [repository-url]
cd elastic-eye

# 安装依赖
pnpm install

# 启动开发服务器
cargo tauri dev
```

详细的安装说明，包括故障排除和系统特定设置，请查看我们的[入门指南](docs/zh-CN/getting-started.md)。

## 📚 文档

- [入门指南](docs/zh-CN/getting-started.md)
- [用户指南](docs/zh-CN/user-guide.md)
- [API 参考](docs/zh-CN/api-reference.md)
- [贡献指南](docs/zh-CN/contributing.md)

## 🔧 技术栈

- **前端框架**: React + TypeScript
- **UI 框架**: Tailwind CSS + Radix UI
- **状态管理**: Zustand
- **桌面应用**: Tauri (Rust)
- **构建工具**: Vite

## 🤝 贡献

我们欢迎各种形式的贡献！详情请查看[贡献指南](docs/zh-CN/contributing.md)。

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🌟 支持

- 通过创建 [Issues](issues) 报告问题
- 加入我们的 [Discord 社区](discord)
- 在 [Twitter](twitter) 上关注我们 