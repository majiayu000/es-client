import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '../store';
import { LoadingButton } from './ui/loading-button';
import { LogViewer } from './ui/log-viewer';
import { ErrorMessage } from './ui/error-message';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Separator } from './ui/separator';

// 从环境变量获取默认连接地址，如果没有则使用 localhost:9200
const DEFAULT_ES_HOST = import.meta.env.VITE_DEFAULT_ES_HOST || 'http://localhost:9200';
// 判断是否是开发环境
const isDev = import.meta.env.DEV;

interface ConnectionFormProps {
  onConnected: (connectionId: string) => void;
  onCancel?: () => void;
}

export function ConnectionForm({ onConnected, onCancel }: ConnectionFormProps) {
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

  // 添加 ESC 键关闭功能
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  // 自动聚焦到名称输入框
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <Card className="w-full max-w-lg bg-white shadow-lg" onClick={e => e.stopPropagation()}>
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-semibold">添加连接</CardTitle>
          <CardDescription>
            连接到 Elasticsearch 集群。所有信息都将安全地存储在本地。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  连接名称 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="开发环境"
                  className="focus:ring-2 focus:ring-offset-0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hosts" className="text-sm font-medium">
                  主机地址 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hosts"
                  value={hosts}
                  onChange={(e) => setHosts(e.target.value)}
                  placeholder={isDev ? DEFAULT_ES_HOST : 'http://localhost:9200'}
                  className="focus:ring-2 focus:ring-offset-0"
                  required
                  pattern="https?://.*"
                  title="请输入有效的 URL 地址，以 http:// 或 https:// 开头"
                />
                <p className="text-sm text-muted-foreground">
                  输入 Elasticsearch 集群的地址，例如: http://localhost:9200
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">认证信息（可选）</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">用户名</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="elastic"
                    className="focus:ring-2 focus:ring-offset-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-2 focus:ring-offset-0"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">高级设置</h3>
              <div className="space-y-2">
                <Label htmlFor="timeout" className="text-sm font-medium">超时时间（秒）</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
                  min={1}
                  max={300}
                  className="w-32 focus:ring-2 focus:ring-offset-0"
                />
                <p className="text-sm text-muted-foreground">
                  设置连接超时时间，默认为 60 秒
                </p>
              </div>
            </div>

            <ErrorMessage error={error} className="mt-6" />
            <LogViewer logs={logs} title="连接日志" className="mt-6" />

            <div className="flex justify-end space-x-3 pt-6">
              <LoadingButton
                variant="outline"
                onClick={onCancel}
                type="button"
                className="min-w-[80px]"
              >
                取消
              </LoadingButton>
              <LoadingButton
                type="submit"
                loading={loading}
                className="min-w-[80px]"
              >
                连接
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 