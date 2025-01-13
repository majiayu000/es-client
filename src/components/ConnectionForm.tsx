import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '../store';

interface ConnectionFormProps {
  onConnected: (connectionId: string) => void;
  onCancel?: () => void;
}

export function ConnectionForm({ onConnected, onCancel }: ConnectionFormProps) {
  const [name, setName] = useState('开发环境');
  const [hosts, setHosts] = useState('http://172.31.0.7:19200');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [timeout, setTimeout] = useState('60');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addConnection = useAppStore((state) => state.addConnection);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([]); // Clear previous logs
    
    // Validate inputs
    if (!name.trim()) {
      setError('请输入连接名称');
      return;
    }

    if (!hosts.trim()) {
      setError('请输入 Elasticsearch 主机地址');
      return;
    }

    try {
      new URL(hosts);
    } catch {
      setError('请输入有效的 URL 地址，例如: http://localhost:9200');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const connectionId = uuidv4();
      const config = {
        hosts: [hosts.trim()],
        username: username.trim() || undefined,
        password: password.trim() || undefined,
        timeout_secs: parseInt(timeout, 10),
      };
      
      addLog(`开始连接到 ${hosts}`);
      addLog(`连接配置: ${JSON.stringify({ ...config, password: config.password ? '******' : undefined }, null, 2)}`);
      addLog(`连接ID: ${connectionId}`);

      const result = await invoke('connect_elasticsearch', {
        config,
        connectionInfo: {
          id: connectionId,
          name: name.trim(),
          hosts: [hosts.trim()],
          is_active: true,
        }
      });
      
      addLog(`连接结果: ${JSON.stringify(result)}`);
      addLog('连接成功');

      // 添加到全局状态
      addConnection({
        id: connectionId,
        name: name.trim(),
        hosts: [hosts.trim()],
        is_active: true,
      });

      onConnected(connectionId);
    } catch (err) {
      let errorMessage = '未知错误';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage = JSON.stringify(err);
      } else {
        errorMessage = String(err);
      }
      addLog(`连接失败: ${errorMessage}`);
      if (err instanceof Error && err.stack) {
        addLog(`错误堆栈: ${err.stack}`);
      }
      setError(`连接失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">添加连接</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                连接名称
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="开发环境"
              />
            </div>

            <div>
              <label htmlFor="hosts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                主机地址
              </label>
              <input
                type="text"
                id="hosts"
                value={hosts}
                onChange={(e) => setHosts(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="http://localhost:9200"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                用户名（可选）
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                placeholder="elastic"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密码（可选）
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="timeout" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                超时时间（秒）
              </label>
              <input
                type="number"
                id="timeout"
                value={timeout}
                onChange={(e) => setTimeout(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                min="1"
                max="300"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-md p-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">连接日志</div>
                <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? '连接中...' : '连接'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 