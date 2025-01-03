import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';

interface ConnectionFormProps {
  onConnected: () => void;
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
      onConnected();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">连接错误</h3>
              <div className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          连接名称
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="例如：开发环境"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="hosts" className="block text-sm font-medium text-gray-700">
          Elasticsearch 主机
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="hosts"
            value={hosts}
            onChange={(e) => setHosts(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="例如：http://localhost:9200"
            required
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          输入 Elasticsearch 实例的完整 URL，例如: http://localhost:9200
        </p>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          用户名（可选）
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="elastic"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          密码（可选）
        </label>
        <div className="mt-1">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label htmlFor="timeout" className="block text-sm font-medium text-gray-700">
          连接超时（秒）
        </label>
        <div className="mt-1">
          <input
            type="number"
            id="timeout"
            value={timeout}
            onChange={(e) => setTimeout(e.target.value)}
            min="1"
            max="300"
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          设置连接超时时间，默认为 60 秒
        </p>
      </div>

      {logs.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">连接日志</label>
          <div className="mt-1 bg-gray-50 rounded-md p-4 h-48 overflow-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
              {logs.join('\n')}
            </pre>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              连接中...
            </>
          ) : (
            '连接'
          )}
        </button>
      </div>
    </form>
  );
} 