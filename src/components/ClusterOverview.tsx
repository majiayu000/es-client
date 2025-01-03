import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ClusterInfo {
  name: string;
  status: string;
  number_of_nodes: number;
  active_primary_shards: number;
  active_shards: number;
  relocating_shards: number;
  initializing_shards: number;
  unassigned_shards: number;
  version: string;
  nodes: Array<{
    name: string;
    version: string;
    roles: string[];
    os: string;
    jvm: string;
  }>;
}

interface ClusterOverviewProps {
  connectionId?: string;
}

export function ClusterOverview({ connectionId }: ClusterOverviewProps) {
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connectionId) {
      fetchClusterInfo();
    }
  }, [connectionId]);

  const fetchClusterInfo = async () => {
    if (!connectionId) return;

    try {
      setLoading(true);
      setError(null);
      const info = await invoke<ClusterInfo>('get_cluster_info', { connectionId });
      setClusterInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!connectionId) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">获取集群信息失败</h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchClusterInfo}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!clusterInfo) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          暂无集群信息
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          集群概览
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {clusterInfo.name} - 版本 {clusterInfo.version}
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">状态</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(clusterInfo.status)}`}>
                {clusterInfo.status}
              </span>
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">节点数</dt>
            <dd className="mt-1 text-sm text-gray-900">{clusterInfo.number_of_nodes}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">分片状态</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <span className="block text-2xl font-semibold text-indigo-600">{clusterInfo.active_shards}</span>
                  <span className="block text-sm text-gray-500">活动分片</span>
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-green-600">{clusterInfo.active_primary_shards}</span>
                  <span className="block text-sm text-gray-500">主分片</span>
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-yellow-600">{clusterInfo.relocating_shards}</span>
                  <span className="block text-sm text-gray-500">迁移中</span>
                </div>
                <div>
                  <span className="block text-2xl font-semibold text-red-600">{clusterInfo.unassigned_shards}</span>
                  <span className="block text-sm text-gray-500">未分配</span>
                </div>
              </div>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">节点列表</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clusterInfo.nodes.map((node, index) => (
                  <div key={index} className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400">
                    <div className="space-y-2">
                      <div className="truncate">
                        <span className="font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        版本: {node.version}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        角色: {node.roles.join(', ')}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        操作系统: {node.os}
                      </div>
                      <div className="truncate text-sm text-gray-500">
                        JVM: {node.jvm}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
} 