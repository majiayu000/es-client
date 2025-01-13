import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Pagination } from './Pagination';

interface NodesProps {
  connectionId: string;
}

interface NodeInfo {
  name: string;
  ip: string;
  nodeRole: string;
  heapPercent: number;
  ramPercent: number;
  cpu: number;
  load1m: number;
  load5m: number;
  load15m: number;
  diskUsed: string;
  diskTotal: string;
  diskPercent: number;
}

const PAGE_SIZE = 10;

export function Nodes({ connectionId }: NodesProps) {
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadNodes();
  }, [connectionId]);

  const loadNodes = async () => {
    try {
      setLoading(true);
      setError(null);
      const nodeList = await invoke<NodeInfo[]>('list_nodes', { connectionId });
      setNodes(nodeList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredNodes = nodes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.nodeRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredNodes.length / PAGE_SIZE);
  const paginatedNodes = filteredNodes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-8">
      {/* 页面标题和操作栏 */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">节点管理</h2>
              <p className="mt-1 text-sm text-gray-500">
                管理和监控您的 Elasticsearch 节点
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadNodes}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ring-1 ring-gray-200 hover:ring-indigo-500 transition-all duration-200"
              >
                刷新
              </button>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // 重置页码
                }}
                placeholder="搜索节点名称、IP或角色..."
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

        {/* 节点列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  节点名称
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP地址
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  堆内存
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  系统内存
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPU使用率
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  负载(1m/5m/15m)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  磁盘使用
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedNodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    没有找到匹配的节点
                  </td>
                </tr>
              ) : (
                paginatedNodes.map((node) => (
                  <tr 
                    key={node.name}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{node.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.nodeRole}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${getUsageColor(node.heapPercent)}`}
                            style={{ width: `${node.heapPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{node.heapPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${getUsageColor(node.ramPercent)}`}
                            style={{ width: `${node.ramPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{node.ramPercent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${getUsageColor(node.cpu)}`}
                            style={{ width: `${node.cpu}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{node.cpu}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {node.load1m.toFixed(2)} / {node.load5m.toFixed(2)} / {node.load15m.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className={`h-2.5 rounded-full ${getUsageColor(node.diskPercent)}`}
                            style={{ width: `${node.diskPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {node.diskUsed} / {node.diskTotal} ({node.diskPercent}%)
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && filteredNodes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
} 