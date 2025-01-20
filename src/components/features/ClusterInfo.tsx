import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ClusterInfoProps {
  connectionId: string;
}

interface ClusterHealth {
  cluster_name: string;
  status: string;
  number_of_nodes: number;
  number_of_data_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  delayed_unassigned_shards: number;
  number_of_pending_tasks: number;
  number_of_in_flight_fetch: number;
  task_max_waiting_in_queue_millis: number;
  active_shards_percent_as_number: number;
}

interface ClusterStats {
  timestamp: number;
  cluster_name: string;
  status: string;
  indices: {
    count: number;
    shards: {
      total: number;
      primaries: number;
      replication: number;
      index: {
        shards: {
          min: number;
          max: number;
          avg: number;
        };
        primaries: {
          min: number;
          max: number;
          avg: number;
        };
        replication: {
          min: number;
          max: number;
          avg: number;
        };
      };
    };
    docs: {
      count: number;
      deleted: number;
    };
    store: {
      size_in_bytes: number;
      total_data_set_size_in_bytes: number;
    };
    fielddata: {
      memory_size_in_bytes: number;
      evictions: number;
    };
    query_cache: {
      memory_size_in_bytes: number;
      total_count: number;
      hit_count: number;
      miss_count: number;
      cache_size: number;
      total_evictions: number;
    };
  };
  nodes: {
    count: {
      total: number;
      data: number;
      coordinating_only: number;
      master: number;
      ingest: number;
    };
    versions: string[];
    os: {
      available_processors: number;
      allocated_processors: number;
      names: Array<{ name: string; count: number }>;
      mem: {
        total_in_bytes: number;
        free_in_bytes: number;
        used_in_bytes: number;
        free_percent: number;
        used_percent: number;
      };
    };
    process: {
      cpu: {
        percent: number;
      };
      open_file_descriptors: {
        min: number;
        max: number;
        avg: number;
      };
    };
    jvm: {
      max_uptime_in_millis: number;
      versions: Array<{
        version: string;
        vm_name: string;
        vm_version: string;
        vm_vendor: string;
        count: number;
      }>;
      mem: {
        heap_used_in_bytes: number;
        heap_max_in_bytes: number;
      };
      threads: number;
    };
    fs: {
      total_in_bytes: number;
      free_in_bytes: number;
      available_in_bytes: number;
    };
  };
}

export function ClusterInfo({ connectionId }: ClusterInfoProps) {
  const [health, setHealth] = useState<ClusterHealth | null>(null);
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [healthData, statsData] = await Promise.all([
          invoke<ClusterHealth>('get_cluster_health', { connectionId }),
          invoke<ClusterStats>('get_cluster_stats', { connectionId }),
        ]);

        setHealth(healthData);
        setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // 每10秒刷新一次

    return () => clearInterval(interval);
  }, [connectionId]);

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatUptime = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天 ${hours % 24}小时`;
    }
    if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    }
    if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  };

  if (loading && !health && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">错误</h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 集群健康状态 */}
      {health && (
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">集群健康状态</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">集群名称</dt>
              <dd className="mt-1 text-sm text-gray-900">{health.cluster_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">状态</dt>
              <dd className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  health.status === 'green' ? 'bg-green-100 text-green-800' :
                  health.status === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {health.status.toUpperCase()}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">节点数</dt>
              <dd className="mt-1 text-sm text-gray-900">{health.number_of_nodes} (数据节点: {health.number_of_data_nodes})</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">分片状态</dt>
              <dd className="mt-1 text-sm text-gray-900">
                活跃: {health.active_shards} (主分片: {health.active_primary_shards})<br />
                迁移中: {health.relocating_shards}<br />
                初始化中: {health.initializing_shards}<br />
                未分配: {health.unassigned_shards}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">任务状态</dt>
              <dd className="mt-1 text-sm text-gray-900">
                待处理任务: {health.number_of_pending_tasks}<br />
                飞行获取: {health.number_of_in_flight_fetch}
              </dd>
            </div>
          </div>
        </div>
      )}

      {/* 集群统计信息 */}
      {stats && (
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">集群统计信息</h2>
          
          {/* 索引统计 */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">索引统计</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">索引数量</dt>
                <dd className="mt-1 text-sm text-gray-900">{stats.indices.count}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">文档数量</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  总数: {stats.indices.docs.count.toLocaleString()}<br />
                  已删除: {stats.indices.docs.deleted.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">存储大小</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatBytes(stats.indices.store.size_in_bytes)}</dd>
              </div>
            </div>
          </div>

          {/* 节点统计 */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">节点统计</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">节点版本</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {stats.nodes.versions.join(', ')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">节点角色分布</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  总数: {stats.nodes.count.total}<br />
                  数据节点: {stats.nodes.count.data}<br />
                  协调节点: {stats.nodes.count.coordinating_only}<br />
                  主节点: {stats.nodes.count.master}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">JVM 内存</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  已用: {formatBytes(stats.nodes.jvm.mem.heap_used_in_bytes)}<br />
                  最大: {formatBytes(stats.nodes.jvm.mem.heap_max_in_bytes)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">操作系统</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  处理器: {stats.nodes.os.available_processors}<br />
                  内存使用: {stats.nodes.os.mem.used_percent.toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">文件系统</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  总空间: {formatBytes(stats.nodes.fs.total_in_bytes)}<br />
                  可用空间: {formatBytes(stats.nodes.fs.available_in_bytes)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">JVM 运行时间</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatUptime(stats.nodes.jvm.max_uptime_in_millis)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClusterInfo; 