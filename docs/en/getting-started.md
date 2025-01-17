# Getting Started

This guide will help you set up ElasticEye and start using its features.

## Installation

### Prerequisites

Before installing ElasticEye, ensure you have the following installed:

1. **Node.js >= 16**
   ```bash
   # Check Node.js version
   node --version
   
   # Install Node.js via nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 16
   nvm use 16
   ```

2. **pnpm >= 8**
   ```bash
   # Install pnpm
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   # Or using npm
   npm install -g pnpm
   
   # Verify installation
   pnpm --version
   ```

3. **Rust and Cargo**
   ```bash
   # Install Rust and Cargo
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   
   # Verify installation
   rustc --version
   cargo --version
   ```

4. **Tauri Prerequisites**
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
   - **Windows**: Install Visual Studio C++ Build Tools

### Installation Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd elastic-eye
```

2. Install dependencies:
```bash
# Install project dependencies
pnpm install
```

3. Start the development server:
```bash
# Start the development server with hot reload
cargo tauri dev
```

### Troubleshooting

If you encounter any issues during installation:

1. **Rust/Cargo Issues**
   ```bash
   # Update Rust
   rustup update
   
   # Check Rust installation
   rustup check
   ```

2. **Node.js/pnpm Issues**
   ```bash
   # Clear pnpm cache
   pnpm store prune
   
   # Reinstall dependencies
   rm -rf node_modules
   pnpm install
   ```

3. **Build Issues**
   - Ensure all system dependencies are installed
   - Check your system meets the minimum requirements
   - Try cleaning the build cache:
     ```bash
     cargo clean
     pnpm clean
     ```

## Basic Usage

### Connecting to Elasticsearch

1. Click the "Add Connection" button
2. Enter your Elasticsearch cluster details:
   - Connection Name
   - Host URL
   - Port
   - Authentication details (if required)
3. Click "Test Connection" to verify
4. Save the connection

### Managing Indices

1. Select a connection from the sidebar
2. Navigate to the "Indices" tab
3. View index list and details
4. Perform operations:
   - Create new index
   - Modify settings
   - Delete index
   - Manage templates

### Searching Data

1. Select an index
2. Go to the "Search" tab
3. Enter your query:
   - Use Query Builder for basic searches
   - Switch to JSON mode for advanced queries
4. View and export results

## Building for Production

### Web Version
```bash
pnpm build
```

### Desktop Application
```bash
cargo tauri build
```

## Next Steps

- Read the [Features Guide](./features.md) for detailed feature information
- Check the [Configuration Guide](./configuration.md) for advanced settings
- Visit the [API Reference](./api-reference.md) for programmatic usage 