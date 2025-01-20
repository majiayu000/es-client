import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store';
import {
  LoadingButton,
  LogViewer,
  ErrorMessage,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Separator
} from '@/components/ui';

// 从环境变量获取默认连接地址，如果没有则使用 localhost:9200
const DEFAULT_ES_HOST = import.meta.env.VITE_DEFAULT_ES_HOST || 'http://localhost:9200';
// 判断是否是开发环境
const isDev = import.meta.env.DEV;

interface ConnectionFormProps {
  onConnected: (connectionId: string) => void;
  onCancel?: () => void;
}

function ConnectionForm({ onConnected, onCancel }: ConnectionFormProps) {
  const [name, setName] = useState('开发环境');
  const [hosts, setHosts] = useState(DEFAULT_ES_HOST);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [timeout, setTimeout] = useState('60');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const addConnection = useAppStore((state) => state.addConnection);

  useEffect(() => {
    // 组件加载时聚焦到名称输入框
    nameInputRef.current?.focus();

    // 添加 ESC 键监听
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('请输入连接名称');
      return false;
    }
    if (!hosts.trim()) {
      setError('请输入 Elasticsearch 地址');
      return false;
    }
    try {
      // 验证每个主机地址是否是有效的 URL
      hosts.split(',').forEach(host => {
        const url = new URL(host.trim());
        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('不支持的协议，请使用 http 或 https');
        }
      });
    } catch (err) {
      setError('请输入有效的 Elasticsearch 地址，例如：http://localhost:9200');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogs([]); // 清除之前的日志
    setError(null); // 清除之前的错误

    if (!validateForm()) {
      return;
    }

    const connectionId = uuidv4();
    setLoading(true);
    addLog('正在测试连接...');
    addLog(`连接 ID: ${connectionId}`);
    addLog(`连接地址: ${hosts}`);
    if (username) addLog(`用户名: ${username}`);

    try {
      // 准备配置
      const config = {
        hosts: hosts.split(',').map(h => h.trim()),
        username: username || undefined,
        password: password || undefined,
        timeout: parseInt(timeout, 10)
      };
      
      const connectionInfo = {
        id: connectionId,
        name,
        hosts: config.hosts,
        is_active: true
      };

      addLog(`连接配置: ${JSON.stringify(config, (key, value) => key === 'password' ? '******' : value, 2)}`);
      
      // 建立连接
      addLog('正在建立连接...');
      const connected = await invoke<boolean>('connect_elasticsearch', {
        config,
        connectionInfo
      });

      if (!connected) {
        throw new Error('连接失败');
      }

      addLog('连接成功');

      // 添加连接到 store
      addConnection(connectionInfo);
      addLog('连接已保存到 store');
      
      // 保存连接信息到数据库
      addLog('正在保存连接信息...');
      await invoke('save_connection_info', {
        connectionInfo,
        config
      });
      addLog('连接信息已保存');
      
      onConnected(connectionId);
      addLog('触发 onConnected 回调');
    } catch (err) {
      console.error('连接失败:', err);
      let errorMessage = err instanceof Error ? err.message : String(err);
      if (typeof err === 'object' && err !== null) {
        const tauriError = err as { message?: string, ConnectionError?: string };
        if (tauriError.ConnectionError) {
          errorMessage = `连接错误: ${tauriError.ConnectionError}`;
        }
      }
      setError(errorMessage);
      addLog(`连接失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>添加连接</CardTitle>
            <CardDescription>
              添加一个新的 Elasticsearch 连接。如果使用 HTTP 认证，请提供用户名和密码。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">连接名称</Label>
                  <Input
                    ref={nameInputRef}
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：开发环境"
                  />
                </div>

                <div>
                  <Label htmlFor="hosts">Elasticsearch 地址</Label>
                  <Input
                    id="hosts"
                    type="text"
                    value={hosts}
                    onChange={(e) => setHosts(e.target.value)}
                    placeholder="例如：http://localhost:9200"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    可以输入多个地址，用逗号分隔
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="username">用户名（可选）</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="elastic"
                  />
                </div>

                <div>
                  <Label htmlFor="password">密码（可选）</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">超时时间（秒）</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={timeout}
                    onChange={(e) => setTimeout(e.target.value)}
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              {error && (
                <ErrorMessage
                  title="连接错误"
                  message={error}
                  onRetry={() => setError(null)}
                />
              )}

              {logs.length > 0 && (
                <LogViewer logs={logs} maxHeight="200px" />
              )}

              <div className="flex justify-end space-x-4">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    取消
                  </button>
                )}
                <LoadingButton
                  type="submit"
                  loading={loading}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  测试并保存
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ConnectionForm; 