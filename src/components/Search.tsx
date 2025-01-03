import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface SearchProps {
  connectionId: string;
}

interface SearchResult {
  _index: string;
  _id: string;
  _score: number;
  _source: Record<string, any>;
}

interface SearchResponse {
  took: number;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number;
    hits: SearchResult[];
  };
}

interface IndexInfo {
  name: string;
  docs_count: number;
  size_in_bytes: number;
}

interface Column {
  key: string;
  title: string;
  defaultVisible: boolean;
  render?: (value: any) => React.ReactNode;
}

export function Search({ connectionId }: SearchProps) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState('');
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchStats, setSearchStats] = useState<{
    total: number;
    took: number;
  } | null>(null);
  const [selectedRow, setSelectedRow] = useState<SearchResult | null>(null);
  const [showRowDetail, setShowRowDetail] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(['_id']));

  const MAX_CELL_HEIGHT = 100; // 最大单元格高度（像素）

  useEffect(() => {
    loadIndices();
  }, [connectionId]);

  useEffect(() => {
    if (index) {
      handleSearch();
    }
  }, [index]);

  // 当有新的搜索结果时，自动选择所有列
  useEffect(() => {
    if (results.length > 0) {
      const allColumns = new Set(['_id', ...Object.keys(results[0]._source)]);
      setVisibleColumns(allColumns);
    }
  }, [results]);

  const loadIndices = async () => {
    try {
      const indexList = await invoke<IndexInfo[]>('list_indices', { connectionId });
      setIndices(indexList);
      if (indexList.length > 0 && !index) {
        setIndex(indexList[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSearch = async () => {
    if (!index.trim()) {
      setError('请选择要搜索的索引');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let searchQuery = query.trim();
      if (!searchQuery) {
        searchQuery = JSON.stringify({
          query: {
            match_all: {}
          }
        });
      }
      
      const response = await invoke<SearchResponse>('search', {
        connectionId,
        index: index.trim(),
        query: searchQuery
      });

      setResults(response.hits.hits);
      setSearchStats({
        total: response.hits.total.value,
        took: response.took
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
      setSearchStats(null);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  // 自动生成表格列
  const columns = useMemo(() => {
    const baseColumns: Column[] = [
      {
        key: '_id',
        title: 'ID',
        defaultVisible: true,
        render: (value) => (
          <span className="font-medium text-gray-900">{value}</span>
        ),
      },
    ];

    if (results.length === 0) return baseColumns;

    // 从第一个文档中获取所有字段
    const sourceFields = Object.keys(results[0]._source);
    const sourceColumns: Column[] = sourceFields.map(field => ({
      key: field,
      title: field,
      defaultVisible: true,
      render: (value) => {
        if (value === null) return <span className="text-gray-400">null</span>;
        if (typeof value === 'object') {
          return (
            <div 
              className="text-xs text-gray-600 overflow-hidden"
              style={{ maxHeight: `${MAX_CELL_HEIGHT}px` }}
            >
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(value, null, 2)}
              </pre>
              {JSON.stringify(value).length > 100 && (
                <div className="text-xs text-gray-400 mt-1">
                  点击行查看完整内容...
                </div>
              )}
            </div>
          );
        }
        const strValue = String(value);
        return (
          <div 
            className="text-gray-900 overflow-hidden"
            style={{ maxHeight: `${MAX_CELL_HEIGHT}px` }}
          >
            {strValue}
            {strValue.length > 100 && (
              <div className="text-xs text-gray-400 mt-1">
                点击行查看完整内容...
              </div>
            )}
          </div>
        );
      },
    }));

    return [...baseColumns, ...sourceColumns];
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="index" className="block text-sm font-medium text-gray-700">
              索引名称
            </label>
            <div className="mt-1">
              <select
                id="index"
                value={index}
                onChange={(e) => setIndex(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">选择索引</option>
                {indices.map((idx) => (
                  <option key={idx.name} value={idx.name}>
                    {idx.name} ({idx.docs_count.toLocaleString()} 文档, {(idx.size_in_bytes / 1024 / 1024).toFixed(2)} MB)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700">
              搜索条件（可选）
            </label>
            <div className="mt-1">
              <textarea
                id="query"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder='输入搜索条件，例如: {"query":{"match":{"field":"value"}}}，留空则搜索全部文档'
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              请输入符合 Elasticsearch Query DSL 的 JSON 格式查询条件，留空则搜索全部文档
            </p>
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
                  <h3 className="text-sm font-medium text-red-800">搜索错误</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
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
                  搜索中...
                </>
              ) : (
                '搜索'
              )}
            </button>
          </div>
        </div>
      </div>

      {searchStats && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              搜索结果
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              找到 {searchStats.total} 条结果，耗时 {searchStats.took}ms
            </p>
          </div>

          {results.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="flex flex-wrap gap-4 items-center pb-4">
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
                      disabled={column.key === '_id'} // ID 列始终显示
                    />
                    <span className="ml-2 text-sm text-gray-600">{column.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200">
            {results.length > 0 ? (
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
                            {column.title}
                          </th>
                        )
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr 
                        key={result._id}
                        onClick={() => {
                          setSelectedRow(result);
                          setShowRowDetail(true);
                        }}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        {columns.map((column) => (
                          visibleColumns.has(column.key) && (
                            <td key={`${result._id}-${column.key}`} className="px-6 py-4 whitespace-normal text-sm">
                              {column.render
                                ? column.render(column.key === '_id'
                                    ? result[column.key as keyof SearchResult]
                                    : result._source[column.key])
                                : formatValue(column.key === '_id'
                                    ? result[column.key as keyof SearchResult]
                                    : result._source[column.key])}
                            </td>
                          )
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                未找到匹配的结果
              </div>
            )}
          </div>
        </div>
      )}

      {/* 行详情弹窗 */}
      {showRowDetail && selectedRow && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    文档详情
                  </h3>
                  <div className="mt-4 text-left">
                    <div className="mb-4">
                      <span className="font-medium">ID: </span>
                      <span>{selectedRow._id}</span>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[60vh] text-sm">
                      {JSON.stringify(selectedRow._source, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                  onClick={() => {
                    setShowRowDetail(false);
                    setSelectedRow(null);
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 