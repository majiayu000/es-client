# 快速开始

本指南将帮助您设置 ElasticEye 并开始使用其功能。

## 安装

### 前提条件

在安装 ElasticEye 之前，请确保已安装以下软件：

1. **Node.js >= 16**
   ```bash
   # 检查 Node.js 版本
   node --version
   
   # 通过 nvm 安装 Node.js（推荐）
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 16
   nvm use 16
   ```

2. **pnpm >= 8**
   ```bash
   # 安装 pnpm
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   # 或使用 npm 安装
   npm install -g pnpm
   
   # 验证安装
   pnpm --version
   ```

3. **Rust 和 Cargo**
   ```bash
   # 安装 Rust 和 Cargo
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # 验证安装
   rustc --version
   cargo --version
   ```

4. **Tauri 系统依赖**
   - **macOS**:
     ```bash
     xcode-select --install
     ```
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update
     sudo apt install libwebkit2gtk-4.0-dev \
         build-essential \
         curl \
         wget \
         libssl-dev \
         libgtk-3-dev \
         libayatana-appindicator3-dev \
         librsvg2-dev
     ```
   - **Windows**: 安装 Visual Studio C++ Build Tools

### 安装步骤

1. 克隆仓库：
```bash
git clone [repository-url]
cd elastic-eye
```

2. 安装依赖：
```bash
# 安装项目依赖
pnpm install
```

3. 启动开发服务器：
```bash
# 启动开发服务器（支持热重载）
cargo tauri dev
```

### 故障排除

如果在安装过程中遇到问题：

1. **Rust/Cargo 相关问题**
   ```bash
   # 更新 Rust
   rustup update
   
   # 检查 Rust 安装
   rustup check
   ```

2. **Node.js/pnpm 相关问题**
   ```bash
   # 清理 pnpm 缓存
   pnpm store prune
   
   # 重新安装依赖
   rm -rf node_modules
   pnpm install
   ```

3. **构建问题**
   - 确保所有系统依赖都已安装
   - 检查系统是否满足最低要求
   - 尝试清理构建缓存：
     ```bash
     cargo clean
     pnpm clean
     ```

## 基本使用

### 连接到 Elasticsearch

1. 点击"添加连接"按钮
2. 输入 Elasticsearch 集群详情：
   - 连接名称
   - 主机 URL
   - 端口
   - 认证信息（如需要）
3. 点击"测试连接"进行验证
4. 保存连接

### 管理索引

1. 从侧边栏选择一个连接
2. 导航到"索引"标签页
3. 查看索引列表和详情
4. 执行操作：
   - 创建新索引
   - 修改设置
   - 删除索引
   - 管理模板

### 搜索数据

1. 选择一个索引
2. 进入"搜索"标签页
3. 输入查询：
   - 使用查询构建器进行基本搜索
   - 切换到 JSON 模式进行高级查询
4. 查看和导出结果

## 生产环境构建

### Web 版本
```bash
pnpm build
```

### 桌面应用
```bash
cargo tauri build
```

## 下一步

- 阅读[功能指南](./features.md)了解详细功能信息
- 查看[配置指南](./configuration.md)了解高级设置
- 访问[API 参考](./api-reference.md)了解编程使用方法 