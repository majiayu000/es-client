# ElasticEye

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)
[![简体中文](https://img.shields.io/badge/语言-简体中文-blue.svg)](README.zh-CN.md)

ElasticEye is a modern Elasticsearch management tool that provides an intuitive user interface for managing and monitoring Elasticsearch clusters.

## ✨ Features

- 🚀 **Multi-Cluster Management**
  - Manage multiple Elasticsearch clusters
  - Real-time health monitoring
  - Cluster overview and statistics

- 📊 **Index Management**
  - Create and configure indices
  - Manage index settings and mappings
  - Index templates and lifecycle policies

- 🔍 **Advanced Search**
  - Intuitive query builder
  - JSON query mode for complex searches
  - Results visualization and export

- 💎 **Shard Management**
  - Shard allocation visualization
  - Migration monitoring
  - Node load balancing

- ⌨️ **Developer Experience**
  - Keyboard shortcuts
  - Dark/Light theme
  - Cross-platform desktop app

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16
- pnpm >= 8
- Rust (for desktop app)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd elastic-eye

# Install dependencies
pnpm install

# Start development server
cargo tauri dev
```

For detailed installation instructions, including troubleshooting and system-specific setup, see our [Getting Started Guide](docs/en/getting-started.md).

## 📚 Documentation

- [Getting Started](docs/en/getting-started.md)
- [User Guide](docs/en/user-guide.md)
- [API Reference](docs/en/api-reference.md)
- [Contributing Guide](docs/en/contributing.md)

## 🔧 Tech Stack

- **Frontend**: React + TypeScript
- **UI Framework**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Desktop App**: Tauri (Rust)
- **Build Tool**: Vite

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/en/contributing.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Support

- Report bugs by creating [Issues](issues)
- Join our [Discord Community](discord)
- Follow us on [Twitter](twitter)
