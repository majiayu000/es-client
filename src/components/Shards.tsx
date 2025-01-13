import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ShardsProps {
  connectionId: string;
}

interface ShardInfo {
  index: string;
  shard: number;
  prirep: string;
  state: string;
  docs: number;
  store: string;
  ip: string;
  node: string;
}

export function Shards({ connectionId }: ShardsProps) {
  const [shards, setShards] = useState<ShardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShards, setSelectedShards] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadShards();
  }, [connectionId]);

  const loadShards = async () => {
    try {
      setLoading(true);
      setError(null);
      const shardList = await invoke<ShardInfo[]>('list_shards', { connectionId });
      setShards(shardList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredShards = shards.filter(shard => 
    shard.index.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shard.node.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleShardSelection = (shardKey: string) => {
    setSelectedShards(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(shardKey)) {
        newSelection.delete(shardKey);
      } else {
        newSelection.add(shardKey);
      }
      return newSelection;
    });
  };

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'started':
        return 'bg-green-100 text-green-800';
      case 'relocating':
        return 'bg-yellow-100 text-yellow-800';
      case 'unassigned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* 页面标题和操作栏 */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">分片管理</h2>
              <p className="mt-1 text-sm text-gray-500">
                管理和监控您的 Elasticsearch 分片
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadShards}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ring-1 ring-gray-200 hover:ring-indigo-500 transition-all duration-200"
              >
                刷新
              </button>
              {selectedShards.size > 0 && (
                <button
                  onClick={() => {
                    // TODO: 实现批量操作
                    console.log('Selected shards:', Array.from(selectedShards));
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-200"
                >
                  操作选中 ({selectedShards.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索索引或节点..."
                className="w-full pl-4 pr-10 py-2 text-sm border-0 bg-white text-gray-900 rounded-lg ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="px-6 py-4 bg-red-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">加载失败</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分片列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedShards.size === shards.length}
                    onChange={() => {
                      if (selectedShards.size === shards.length) {
                        setSelectedShards(new Set());
                      } else {
                        setSelectedShards(new Set(shards.map(s => `${s.index}-${s.shard}-${s.prirep}`)));
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  索引
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分片
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文档数
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  存储大小
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  节点
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShards.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                    没有找到匹配的分片
                  </td>
                </tr>
              ) : (
                filteredShards.map((shard) => {
                  const shardKey = `${shard.index}-${shard.shard}-${shard.prirep}`;
                  return (
                    <tr 
                      key={shardKey}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedShards.has(shardKey)}
                          onChange={() => toggleShardSelection(shardKey)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(shard.state)}`}>
                          {shard.state}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{shard.index}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shard.shard}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shard.prirep === 'p' ? '主分片' : '副本分片'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shard.docs.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shard.store}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shard.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shard.node}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 