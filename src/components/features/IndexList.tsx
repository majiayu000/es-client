import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';

interface IndexListProps {
  connectionId: string;
}

interface IndexInfo {
  name: string;
  docs_count: number;
  size_in_bytes: number;
  status: string;
  health: string;
  uuid: string;
  creation_date: string;
}

interface IndexDetails {
  name: string;
  health: string;
  status: string;
  uuid: string;
  primary_shards: number;
  replica_shards: number;
  docs_count: number;
  docs_deleted: number;
  size_in_bytes: number;
  creation_date: number;
  settings: Record<string, any>;
  mappings: Record<string, any>;
}

interface Column {
  key: string;
  title: string;
  defaultVisible: boolean;
}

function IndexList({ connectionId }: IndexListProps) {
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    'checkbox', 'health', 'name', 'docs_count', 'size_in_bytes', 'creation_date', 'uuid', 'actions'
  ]));
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedIndexDetails, setSelectedIndexDetails] = useState<IndexDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigate = useNavigate();

  const columns: Column[] = [
    { key: 'checkbox', title: '', defaultVisible: true },
    { key: 'health', title: '状态', defaultVisible: true },
    { key: 'name', title: '索引名称', defaultVisible: true },
    { key: 'docs_count', title: '文档数', defaultVisible: true },
    { key: 'size_in_bytes', title: '大小', defaultVisible: true },
    { key: 'creation_date', title: '创建时间', defaultVisible: true },
    { key: 'uuid', title: 'UUID', defaultVisible: true },
    { key: 'actions', title: '操作', defaultVisible: true },
  ];

  useEffect(() => {
    loadIndices();
  }, [connectionId]);

  const loadIndices = async () => {
    try {
      setLoading(true);
      setError(null);
      const indexList = await invoke<IndexInfo[]>('list_indices', { connectionId });
      setIndices(indexList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredIndices = indices.filter(index => 
    index.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (timestamp: string | number) => {
    return new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp).toLocaleString();
  };

  const getHealthColor = (health: string) => {
    switch (health.toLowerCase()) {
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

  const handleShowDetails = async (indexName: string) => {
    try {
      setLoadingDetails(true);
      const details = await invoke<IndexDetails>('get_index_details', {
        connectionId,
        indexName,
      });
      setSelectedIndexDetails(details);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Failed to fetch index details:', err);
      // 显示错误提示
      setError(err instanceof Error ? err.message : '获取索引详情失败');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex-1 max-w-lg">
              <label htmlFor="search" className="sr-only">搜索索引</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="搜索索引..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadIndices}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                刷新
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center border-b border-gray-200 pb-4">
            <span className="text-sm font-medium text-gray-700">显示列：</span>
            {columns.map((column) => (
              <label key={column.key} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={visibleColumns.has(column.key)}
                  onChange={(e) => {
                    const newVisibleColumns = new Set(visibleColumns);
                    if (e.target.checked) {
                      newVisibleColumns.add(column.key);
                    } else {
                      newVisibleColumns.delete(column.key);
                    }
                    setVisibleColumns(newVisibleColumns);
                  }}
                  disabled={column.key === 'name'}
                />
                <span className="ml-2 text-sm text-gray-600">{column.title}</span>
              </label>
            ))}
          </div>

          {error && (
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
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    visibleColumns.has(column.key) && (
                      <th
                        key={column.key}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.key === 'checkbox' ? (
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectedIndices.size === filteredIndices.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIndices(new Set(filteredIndices.map(i => i.name)));
                              } else {
                                setSelectedIndices(new Set());
                              }
                            }}
                          />
                        ) : (
                          column.title
                        )}
                      </th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    </td>
                  </tr>
                ) : filteredIndices.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
                      没有找到索引
                    </td>
                  </tr>
                ) : (
                  filteredIndices.map((index) => (
                    <tr key={index.name} className="hover:bg-gray-50">
                      {visibleColumns.has('checkbox') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            checked={selectedIndices.has(index.name)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedIndices);
                              if (e.target.checked) {
                                newSelected.add(index.name);
                              } else {
                                newSelected.delete(index.name);
                              }
                              setSelectedIndices(newSelected);
                            }}
                          />
                        </td>
                      )}
                      {visibleColumns.has('health') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(index.health)}`}>
                            {index.health}
                          </span>
                        </td>
                      )}
                      {visibleColumns.has('name') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index.name}
                        </td>
                      )}
                      {visibleColumns.has('docs_count') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index.docs_count.toLocaleString()}
                        </td>
                      )}
                      {visibleColumns.has('size_in_bytes') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatSize(index.size_in_bytes)}
                        </td>
                      )}
                      {visibleColumns.has('creation_date') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(index.creation_date)}
                        </td>
                      )}
                      {visibleColumns.has('uuid') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {index.uuid}
                        </td>
                      )}
                      {visibleColumns.has('actions') && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => handleShowDetails(index.name)}
                          >
                            详情
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Modal */}
      {showDetailsModal && selectedIndexDetails && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDetailsModal(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">索引详情</h3>
                  <p className="mt-1 text-sm text-gray-500">{selectedIndexDetails.name}</p>
                </div>
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowDetailsModal(false)}
                >
                  <span className="sr-only">关闭</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">健康状态</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(selectedIndexDetails.health)}`}>
                        {selectedIndexDetails.health}
                      </span>
                    </dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">状态</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedIndexDetails.status}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">主分片数</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedIndexDetails.primary_shards}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">副本分片数</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedIndexDetails.replica_shards}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">文档数</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedIndexDetails.docs_count.toLocaleString()}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">已删除文档数</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedIndexDetails.docs_deleted.toLocaleString()}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">大小</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatSize(selectedIndexDetails.size_in_bytes)}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">创建时间</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(selectedIndexDetails.creation_date)}</dd>
                  </div>
                  <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                    <dt className="text-sm font-medium text-gray-500">UUID</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{selectedIndexDetails.uuid}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IndexList;