import React from 'react';
import { Link } from 'react-router-dom';
import { LoadingButton } from '@/components/ui';
import { BoltIcon, ChartBarIcon, CogIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          Elastic Eye
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-gray-300">
          快速、直观、强大的 Elasticsearch 管理工具
        </p>
        <Link to="/dashboard">
          <LoadingButton 
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg"
          >
            开始使用 →
          </LoadingButton>
        </Link>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
            <div className="h-12 w-12 bg-indigo-600 rounded-lg p-2 mb-4">
              <BoltIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">高性能</h3>
            <p className="text-gray-400">
              使用 Rust 构建的后端确保了极致的性能和可靠性，让您的操作快速响应。
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
            <div className="h-12 w-12 bg-purple-600 rounded-lg p-2 mb-4">
              <ChartBarIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">可视化</h3>
            <p className="text-gray-400">
              直观的界面设计，让您轻松监控和管理 Elasticsearch 集群的各项指标。
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
            <div className="h-12 w-12 bg-pink-600 rounded-lg p-2 mb-4">
              <CogIcon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-4">可定制</h3>
            <p className="text-gray-400">
              灵活的配置选项，满足不同场景下的需求，支持多集群管理。
            </p>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6">快速开始</h2>
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 mb-2">1. 添加连接</p>
              <code className="text-sm text-pink-400">
                输入 Elasticsearch 地址，例如：http://localhost:9200
              </code>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 mb-2">2. 验证连接</p>
              <code className="text-sm text-pink-400">
                点击测试连接，确保可以正常访问
              </code>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 mb-2">3. 开始使用</p>
              <code className="text-sm text-pink-400">
                连接成功后，即可开始管理您的 Elasticsearch 集群
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-400">
        <p>使用 Rust + React + Tauri 构建</p>
      </footer>
    </div>
  );
} 