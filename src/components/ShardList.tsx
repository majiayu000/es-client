import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ShardInfo {
  index: string;
  shard: number;
  prirep: string;
  state: string;
  docs?: number;
  store?: string;
  node?: string;
}

interface ShardListProps {
  connectionId: string;
}

export function ShardList({ connectionId }: ShardListProps) {
  const [shards, setShards] = useState<ShardInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchShards = async () => {
    try {
      setLoading(true);
      setError(null);
      const shardList = await invoke<ShardInfo[]>('get_shards_info', { connectionId });
      setShards(shardList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch shards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShards();
    const interval = setInterval(fetchShards, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredShards = shards.filter(shard =>
    shard.index.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shard.node?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStateColor = (state: string) => {
    switch (state.toLowerCase()) {
      case 'started': return 'bg-green-100 text-green-800';
      case 'relocating': return 'bg-yellow-100 text-yellow-800';
      case 'initializing': return 'bg-blue-100 text-blue-800';
      case 'unassigned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchShards}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">分片状态</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filteredShards.length} 个分片
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <div className="max-w-xs flex-1">
            <label htmlFor="search" className="sr-only">搜索分片</label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="text"
                name="search"
                id="search"
                className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="搜索索引或节点..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <button
            onClick={fetchShards}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            刷新
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">索引</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">分片</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">类型</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">状态</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">文档数</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">大小</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">节点</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredShards.map((shard, idx) => (
                    <tr key={`${shard.index}-${shard.shard}-${idx}`}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {shard.index}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shard.shard}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shard.prirep === 'p' ? '主分片' : '副本'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStateColor(shard.state)}`}>
                          {shard.state}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shard.docs?.toLocaleString() ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shard.store ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {shard.node ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 