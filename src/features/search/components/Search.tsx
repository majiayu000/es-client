import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchProps, SearchResult, SearchResponse, IndexInfo, Column, ColumnState, FieldMetadata, SearchCondition, SavedSearch } from '../types';
import { MAX_CELL_HEIGHT, commonFieldMetadata } from '../constants';
import {  buildQuery, getOperatorOptions } from '../utils';

const Search: React.FC<SearchProps> = ({ connectionId }) => {
  const [index, setIndex] = useState('');
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [filteredIndices, setFilteredIndices] = useState<IndexInfo[]>([]);
  const [indexSearchTerm, setIndexSearchTerm] = useState('');
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
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([
    { field: '', operator: '=', value: '' }
  ]);
  const [availableFields, setAvailableFields] = useState<FieldMetadata[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const [newSearchName, setNewSearchName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isColumnOrderInitialized, setIsColumnOrderInitialized] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [columnStates, setColumnStates] = useState<Record<string, ColumnState>>({});
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startResizeX, setStartResizeX] = useState(0);
  const [startResizeWidth, setStartResizeWidth] = useState(0);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // 字段分组
  const fieldGroups = useMemo(() => {
    const groups = new Set<string>();
              availableFields.forEach(field => {
      if (field.group) {
        groups.add(field.group);
      }
    });
    return ['all', ...Array.from(groups)];
  }, [availableFields]);

  // 清空搜索相关状态的函数
  const resetSearchState = useCallback(() => {
    setResults([]);
    setSearchStats(null);
    setSelectedRow(null);
    setShowRowDetail(false);
    setVisibleColumns(new Set(['_id']));
    setSearchConditions([{ field: '', operator: '=', value: '' }]);
    setAvailableFields([]);
    setColumnOrder([]);
    setColumnStates({});
  }, []);

  // 当索引改变时重置状态并执行搜索
  useEffect(() => {
    if (index) {
      // 重置搜索状态
      setResults([]);
      setSearchStats(null);
      setSelectedRow(null);
      setShowRowDetail(false);
      setVisibleColumns(new Set(['_id']));
      setSearchConditions([{ field: '', operator: '=', value: '' }]);
      setAvailableFields([]);
      setColumnOrder([]);
      setColumnStates({});

      // 加载新索引的字段并执行搜索
      const loadIndexAndSearch = async () => {
        try {
          // 先加载字段信息
          await loadFields();
          
          // 然后执行搜索
          setLoading(true);
          setError(null);
          
          const response = await invoke<SearchResponse>('search', {
            connectionId,
            index: index.trim(),
            query: JSON.stringify({
              query: { match_all: {} }
            })
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

      loadIndexAndSearch();
    }
  }, [index, connectionId]);

  useEffect(() => {
    loadIndices();
    loadSavedSearches();
  }, [connectionId]);

  const loadSavedSearches = () => {
    // 这里可以从本地存储或后端加载保存的搜索条件
    const saved = localStorage.getItem(`saved_searches_${connectionId}`);
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };

  const saveSearch = () => {
    if (!newSearchName.trim()) {
      setError('请输入搜索名称');
      return;
    }

    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: newSearchName.trim(),
      conditions: searchConditions,
    };

    const updatedSearches = [...savedSearches, newSavedSearch];
    setSavedSearches(updatedSearches);
    localStorage.setItem(`saved_searches_${connectionId}`, JSON.stringify(updatedSearches));
    setShowSaveSearchDialog(false);
    setNewSearchName('');
  };

  const applySavedSearch = (savedSearch: SavedSearch) => {
    setSearchConditions(savedSearch.conditions);
    handleSearch();
  };

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

  const loadFields = async () => {
    if (!index) return;
    
    try {
      const response = await invoke<SearchResponse>('search', {
        connectionId,
        index: index.trim(),
        query: JSON.stringify({
          query: { match_all: {} },
          size: 1
        })
      });

      if (response.hits.hits.length > 0) {
        const documentFields = Object.keys(response.hits.hits[0]._source);
        const fields: FieldMetadata[] = documentFields.map(field => {
          const commonField = commonFieldMetadata.find(f => f.name === field);
          if (commonField) {
            return commonField;
          }

          // 推测字段类型
          const value = response.hits.hits[0]._source[field];
          let type: FieldMetadata['type'] = 'text';
          if (typeof value === 'number') {
            type = 'number';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
            type = 'date';
          }

          return {
            name: field,
            displayName: field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            type,
            group: '其他'
          };
        });

        setAvailableFields(fields);
        
        // 设置默认可见列，不包含 _id
        const defaultVisibleColumns = new Set<string>();
        fields.slice(0, 5).forEach(field => defaultVisibleColumns.add(field.name));
        setVisibleColumns(defaultVisibleColumns);
        
        // 设置默认列顺序，_id 仍然在列表中但默认不显示
        setColumnOrder(['_id', ...fields.map(f => f.name)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const renderFieldInput = (condition: SearchCondition, index: number) => {
    const field = availableFields.find(f => f.name === condition.field);
    if (!field) {
      return (
        <input
          type="text"
          value={condition.value}
          onChange={(e) => updateSearchCondition(index, 'value', e.target.value)}
          className="block w-1/3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
          placeholder="输入搜索值"
        />
      );
    }

    switch (field.type) {
      case 'date':
        return (
          <input
            type="datetime-local"
            value={condition.value}
            onChange={(e) => updateSearchCondition(index, 'value', e.target.value)}
            className="block w-1/3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={condition.value}
            onChange={(e) => updateSearchCondition(index, 'value', e.target.value)}
            className="block w-1/3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
          />
        );
      case 'boolean':
        return (
          <select
            value={condition.value}
            onChange={(e) => updateSearchCondition(index, 'value', e.target.value)}
            className="block w-1/3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
          >
            <option value="">请选择</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={condition.value}
            onChange={(e) => updateSearchCondition(index, 'value', e.target.value)}
            className="block w-1/3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
            placeholder="输入搜索值"
          />
        );
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
      
      console.log('开始搜索:', {
        index,
        searchConditions,
        availableFields
      });
      
      const searchQuery = buildQuery(searchConditions, availableFields);
      console.log('构建的查询:', searchQuery);
      
      const response = await invoke<SearchResponse>('search', {
        connectionId,
        index: index.trim(),
        query: searchQuery
      });
      console.log('搜索结果:', response);

      setResults(response.hits.hits);
      setSearchStats({
        total: response.hits.total.value,
        took: response.took
      });
    } catch (err) {
      console.error('搜索错误:', err);
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
      setSearchStats(null);
    } finally {
      setLoading(false);
    }
  };

  const addSearchCondition = () => {
    setSearchConditions([...searchConditions, { field: '', operator: '=', value: '' }]);
  };

  const removeSearchCondition = (index: number) => {
    setSearchConditions(searchConditions.filter((_, i) => i !== index));
  };

  const updateSearchCondition = (index: number, field: keyof SearchCondition, value: string) => {
    console.log('更新搜索条件:', { index, field, value, before: searchConditions[index] });
    const newConditions = [...searchConditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    console.log('更新后的条件:', newConditions[index]);
    setSearchConditions(newConditions);
  };

  // 当有新的搜索结果时，更新可用列但保持当前显示状态
  useEffect(() => {
    if (results.length > 0) {
      const availableColumns = new Set<string>([...Object.keys(results[0]._source)]);
      // 保持当前显示的列，但移除不再可用的列
      setVisibleColumns(prev => {
        const newVisibleColumns = new Set(prev);
        for (const col of newVisibleColumns) {
          if (!availableColumns.has(col)) {
            newVisibleColumns.delete(col);
          }
        }
        return newVisibleColumns;
      });
    }
  }, [results]);

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

  // 初始化列顺序
  useEffect(() => {
    if (results.length > 0 && columnOrder.length === 0) {
      const initialOrder = ['_id', ...Object.keys(results[0]._source)];
      console.log('初始化列顺序:', initialOrder);
      setColumnOrder(initialOrder);
      setIsColumnOrderInitialized(true);
    }
  }, [results, columnOrder.length]);

  // 监听列顺序变化
  useEffect(() => {
    console.log('列顺序已更新:', columnOrder);
  }, [columnOrder]);

  // 修改表格头部渲染
  const renderTableHeader = useCallback(() => {
    console.log('renderTableHeader 被调用, columnOrder:', columnOrder);
    return (
      <thead className="bg-gray-50 dark:bg-gray-800">
        <tr>
          {columnOrder.filter(key => visibleColumns.has(key)).map(key => {
            const column = columns.find(col => col.key === key);
            const isDragging = draggedColumn === key;
            const isOver = dragOverKey === key;
            
      
            
            return (
              <th
                key={key}
                data-column-key={key}
                draggable={true}
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(e, key);
                }}
                onDragEnd={(e) => {
                  e.stopPropagation();
                  handleDragEnd(e);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedColumn && draggedColumn !== key) {
                    setDragOverKey(key);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedColumn && draggedColumn !== key) {
                    e.dataTransfer.dropEffect = 'move';
                    setDragOverKey(key);
                  }
                }}
                onDragLeave={(e) => {
                  e.stopPropagation();
                  if (dragOverKey === key) {
                    setDragOverKey(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDrop(e, key);
                }}
                style={{
                  cursor: 'move',
                  opacity: isDragging ? 0.5 : 1,
                  backgroundColor: isOver ? 'rgba(99, 102, 241, 0.1)' : undefined,
                  transition: 'all 0.2s',
                  position: 'relative',
                  zIndex: isOver ? 1 : 'auto'
                }}
                className={`
                  px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 
                  uppercase tracking-wider select-none
                  ${isOver ? 'border-2 border-indigo-500 border-dashed' : ''}
                `}
              >
                <div className="flex items-center space-x-1 pointer-events-none">
                  <span>{column?.title || key}</span>
                  <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                  </svg>
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  }, [columnOrder, columns, draggedColumn, dragOverKey, visibleColumns]);

  // 渲染表格内容
  const renderTableBody = () => (
    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
      {results.map((doc) => (
        <tr 
          key={doc._id} 
          className="hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => {
            setSelectedRow(doc);
            setShowRowDetail(true);
          }}
        >
          {columnOrder.filter(key => visibleColumns.has(key)).map(key => {
            const value = key === '_id' ? doc._id : doc._source[key];
            const column = columns.find(col => col.key === key);
            return (
              <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                {column?.render ? column.render(value) : value}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );

  // 初始化列状态
  useEffect(() => {
    if (results.length > 0) {
      const initialStates: Record<string, ColumnState> = {};
      ['_id', ...Object.keys(results[0]._source)].forEach(key => {
        initialStates[key] = {
          width: 200, // 默认宽度
          fixed: null
        };
      });
      setColumnStates(initialStates);
    }
  }, [results]);

  // 处理列宽调整
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setStartResizeX(e.clientX);
    setStartResizeWidth(columnStates[columnKey]?.width || 200);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!resizingColumn) return;

    const diff = e.clientX - startResizeX;
    const newWidth = Math.max(100, startResizeWidth + diff); // 最小宽度 100px

    setColumnStates(prev => ({
      ...prev,
      [resizingColumn]: {
        ...prev[resizingColumn],
        width: newWidth
      }
    }));
  };

  const handleResizeEnd = () => {
    setResizingColumn(null);
  };

  useEffect(() => {
    if (resizingColumn) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn, startResizeX, startResizeWidth]);

  // 处理列固定
  const toggleColumnFixed = (columnKey: string, position: 'left' | 'right' | null) => {
    setColumnStates(prev => ({
      ...prev,
      [columnKey]: {
        ...prev[columnKey],
        fixed: position
      }
    }));
  };

  // 处理排序
  const handleSort = (columnKey: string) => {
    setSortConfig(current => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        }
        return null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  // 排序结果
  const sortedResults = useMemo(() => {
    if (!sortConfig) return results;

    return [...results].sort((a, b) => {
      const aValue = sortConfig.key === '_id' 
        ? a[sortConfig.key] 
        : a._source[sortConfig.key];
      const bValue = sortConfig.key === '_id'
        ? b[sortConfig.key]
        : b._source[sortConfig.key];

      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [results, sortConfig]);

  // 渲染列头部菜单
  const renderColumnMenu = (columnKey: string) => (
    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
      <div className="py-1" role="menu">
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => toggleColumnFixed(columnKey, 'left')}
        >
          固定在左侧
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => toggleColumnFixed(columnKey, 'right')}
        >
          固定在右侧
        </button>
        <button
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          onClick={() => toggleColumnFixed(columnKey, null)}
        >
          取消固定
        </button>
      </div>
    </div>
  );

  // 处理行选择
  const toggleRowSelection = (e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    e.stopPropagation(); // 防止触发行点击事件
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(rowId)) {
        newSelection.delete(rowId);
      } else {
        newSelection.add(rowId);
      }
      return newSelection;
    });
  };

  // 处理全选
  const toggleSelectAll = () => {
    if (selectedRows.size === sortedResults.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedResults.map(r => r._id)));
    }
  };

  // 处理行展开/收起
  const toggleRowExpansion = (e: React.MouseEvent, rowId: string) => {
    e.stopPropagation(); // 防止触发行点击事件
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(rowId)) {
        newExpanded.delete(rowId);
      } else {
        newExpanded.add(rowId);
      }
      return newExpanded;
    });
  };

  // 优化表格滚动性能
  const handleTableScroll = useCallback(() => {
    if (!tableRef.current) return;
    const { scrollLeft } = tableRef.current;
    const headers = tableRef.current.querySelectorAll('th[data-fixed]');
    const cells = tableRef.current.querySelectorAll('td[data-fixed]');
    
    headers.forEach((header: Element) => {
      const fixed = header.getAttribute('data-fixed');
      if (fixed === 'left') {
        (header as HTMLElement).style.transform = `translateX(${scrollLeft}px)`;
      }
    });
    
    cells.forEach((cell: Element) => {
      const fixed = cell.getAttribute('data-fixed');
      if (fixed === 'left') {
        (cell as HTMLElement).style.transform = `translateX(${scrollLeft}px)`;
      }
    });
  }, []);

  useEffect(() => {
    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener('scroll', handleTableScroll);
      return () => tableElement.removeEventListener('scroll', handleTableScroll);
    }
  }, [handleTableScroll]);

  // 当索引列表或搜索词变化时，更新过滤后的索引列表
  useEffect(() => {
    const filtered = indices.filter(idx =>
      idx.name.toLowerCase().includes(indexSearchTerm.toLowerCase())
    );
    setFilteredIndices(filtered);
  }, [indices, indexSearchTerm]);

  const deleteConnection = async (connectionName: string) => {
    try {
      await invoke('delete_connection', { connectionId: connectionName });
      // 刷新连接列表
      loadIndices();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // 处理列拖放
  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    console.log('=== handleDrop 开始 ===');
    console.log('处理拖放事件');
    const draggedKey = draggedColumn;
    console.log('拖放操作:', { draggedKey, targetKey });
    console.log('dataTransfer.dropEffect:', e.dataTransfer.dropEffect);
    
    if (!draggedKey || !targetKey || draggedKey === targetKey) {
      console.log('无效的拖放操作，原因:', !draggedKey ? 'draggedKey为空' : !targetKey ? 'targetKey为空' : '拖放到相同位置');
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedKey);
    const targetIndex = newOrder.indexOf(targetKey);

    console.log('拖放前状态:', {
      currentOrder: newOrder,
      draggedIndex,
      targetIndex
    });

    if (draggedIndex === -1 || targetIndex === -1) {
      console.log('找不到列索引，draggedIndex:', draggedIndex, 'targetIndex:', targetIndex);
      return;
    }

    // 移除拖动的列并在目标位置插入
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedKey);

    console.log('拖放后新顺序:', newOrder);
    
    // 强制更新状态
    setColumnOrder([...newOrder]);
    
    // 清除拖动状态
    requestAnimationFrame(() => {
      setDragOverKey(null);
      setDraggedColumn(null);
    });
    
    console.log('=== handleDrop 结束 ===');
  };

  // 处理列拖动开始
  const handleDragStart = (e: React.DragEvent, columnKey: string) => {
    console.log('=== handleDragStart 开始 ===');
    console.log('开始拖动列:', columnKey);
    console.log('当前列顺序:', columnOrder);
    console.log('设置拖动数据:', columnKey);
    console.log('dataTransfer.effectAllowed 之前:', e.dataTransfer.effectAllowed);
    e.dataTransfer.setData('text/plain', columnKey);
    e.dataTransfer.effectAllowed = 'move';
    console.log('dataTransfer.effectAllowed 之后:', e.dataTransfer.effectAllowed);
    setDraggedColumn(columnKey);
    console.log('=== handleDragStart 结束 ===');
  };

  // 处理列拖动结束
  const handleDragEnd = (e: React.DragEvent) => {
    console.log('=== handleDragEnd 开始 ===');
    console.log('结束拖动列:', draggedColumn);
    console.log('最终列顺序:', columnOrder);
    console.log('dragOverKey:', dragOverKey);
    
    // 使用 requestAnimationFrame 确保状态更新的顺序
    requestAnimationFrame(() => {
      setDraggedColumn(null);
      setDragOverKey(null);
    });
    
    console.log('=== handleDragEnd 结束 ===');
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 搜索区域 */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="space-y-6">
                {/* 索引选择器 */}
                <div>
                  <label htmlFor="index" className="block text-sm font-semibold text-gray-900 mb-2">
                    索引名称
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-full flex justify-between items-center pl-4 pr-3 py-2.5 text-base border-0 bg-gray-50 text-gray-900 rounded-lg ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:bg-gray-100"
                      >
                        <span className="truncate">
                          {index ? `${index} (${indices.find(i => i.name === index)?.docs_count.toLocaleString() || 0} 文档)` : '选择索引'}
                        </span>
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto shadow-lg border border-gray-200 rounded-lg"
                      align="start"
                      onCloseAutoFocus={(e) => e.preventDefault()}
                      style={{ backgroundColor: 'white' }}
                    >
                      <div className="p-2 sticky top-0 bg-white z-10 border-b border-gray-100">
                        <input
                          type="text"
                          placeholder="搜索索引..."
            value={indexSearchTerm}
                          onChange={(e) => setIndexSearchTerm(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 text-sm border-0 bg-gray-50 text-gray-900 rounded-lg ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        />
                      </div>
                      <div className="py-1">
                        {filteredIndices.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            未找到匹配的索引
                          </div>
                        ) : (
                          filteredIndices.map((idx) => (
                            <DropdownMenuItem
                              key={idx.name}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                              onSelect={() => {
                                setIndex(idx.name);
                                setIndexSearchTerm('');
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{idx.name}</span>
                                <span className="text-xs text-gray-500">
                                  {idx.docs_count.toLocaleString()} 文档, {(idx.size_in_bytes / 1024 / 1024).toFixed(2)} MB
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConnection(idx.name);
                                }}
                                className="ml-2 p-1 hover:bg-red-50 rounded-lg group"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 group-hover:text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </DropdownMenuItem>
                          ))
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* 已保存的搜索 */}
                {savedSearches.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      已保存的搜索
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {savedSearches.map(saved => (
                        <button
                          key={saved.id}
                          onClick={() => applySavedSearch(saved)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ring-1 ring-gray-200 hover:ring-indigo-500 transition-all duration-200"
                        >
                          {saved.name}
                        </button>
                      ))}
        </div>
                  </div>
                )}

                {/* 搜索条件 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-base font-semibold text-gray-900">
                        搜索条件
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="pl-3 pr-10 py-2 text-sm border-0 bg-gray-50 text-gray-700 rounded-lg ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:bg-gray-100 flex items-center justify-between min-w-[120px]">
                            <span>{selectedGroup === 'all' ? '所有字段' : selectedGroup}</span>
                            <svg className="h-5 w-5 text-gray-400 ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-white shadow-lg border border-gray-200 rounded-lg">
                          {fieldGroups.map(group => (
                            <DropdownMenuItem
                              key={group}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                              onSelect={() => setSelectedGroup(group)}
                            >
                              {group === 'all' ? '所有字段' : group}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        type="button"
            onClick={() => setShowSaveSearchDialog(true)}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ring-1 ring-gray-200 hover:ring-indigo-500 transition-all duration-200"
          >
            保存搜索
                      </button>
                      <button
                        type="button"
                        onClick={addSearchCondition}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-200"
                      >
                        添加条件
                      </button>
                    </div>
      </div>

                  {/* 列选择器 */}
                  <div className="flex flex-wrap gap-4 items-center p-4 bg-gray-50 rounded-lg">
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
                        />
                        <span className="ml-2 text-sm text-gray-600">{column.title}</span>
                      </label>
                    ))}
                  </div>

                  {/* 搜索条件表单 */}
                  <div className="space-y-3">
                    {searchConditions.map((condition, index) => (
                      <div 
                        key={index} 
                        className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl ring-1 ring-gray-200 hover:ring-indigo-500 transition-all duration-200"
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-1/3 pl-4 pr-10 py-2 text-sm border-0 bg-white text-gray-900 rounded-lg ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:bg-gray-100 flex items-center justify-between">
                              <span className="truncate">
                                {condition.field ? (availableFields.find(f => f.name === condition.field)?.displayName || condition.field) : '选择字段'}
                              </span>
                              <svg className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] shadow-lg border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto" style={{ backgroundColor: 'white' }}>
                            <div className="py-1">
                              {availableFields
                                .filter(field => selectedGroup === 'all' || field.group === selectedGroup)
                                .map(field => (
                                  <DropdownMenuItem
                                    key={field.name}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                                    onSelect={() => updateSearchCondition(index, 'field', field.name)}
                                  >
                                    {field.displayName || field.name}
                                  </DropdownMenuItem>
                                ))}
        </div>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-32 pl-4 pr-10 py-2 text-sm border-0 bg-white text-gray-900 rounded-lg ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:bg-gray-100 flex items-center justify-between">
                              <span className="truncate">
                                {getOperatorOptions(availableFields.find(f => f.name === condition.field)?.type || 'text')
                                  .find(op => op.value === condition.operator)?.label || '选择操作符'}
                              </span>
                              <svg className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] shadow-lg border border-gray-200 rounded-lg" style={{ backgroundColor: 'white' }}>
                            {getOperatorOptions(availableFields.find(f => f.name === condition.field)?.type || 'text')
                              .map(op => (
                                <DropdownMenuItem
                                  key={op.value}
                                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                                  onSelect={() => updateSearchCondition(index, 'operator', op.value)}
                                >
                                  {op.label}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {renderFieldInput(condition, index)}

                        {searchConditions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSearchCondition(index)}
                            className="flex items-center px-3 py-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 ring-1 ring-gray-200 hover:ring-red-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="ml-1">删除</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
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

                {/* 搜索按钮 */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className={`px-6 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm transition-all duration-200 ${
                      loading
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        搜索中...
                      </div>
                    ) : (
                      '搜索'
                    )}
                  </button>
                </div>
              </div>
        </div>
      </div>

          {/* 搜索结果 */}
          {searchStats && (
            <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      搜索结果
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      找到 {searchStats.total} 条结果，耗时 {searchStats.took}ms
                    </p>
                  </div>
                  {selectedRows.size > 0 && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          // TODO: 实现导出选中行
                          console.log('导出选中行:', Array.from(selectedRows));
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all duration-200"
                      >
                        导出选中 ({selectedRows.size})
                      </button>
                      <button
                        onClick={() => {
                          // TODO: 实现删除选中行
                          console.log('删除选中行:', Array.from(selectedRows));
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all duration-200"
                      >
                        删除选中
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {results.length > 0 ? (
                <div ref={tableRef} className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    {renderTableHeader()}
                    {renderTableBody()}
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="mt-4 text-sm text-gray-500">
                    未找到匹配的结果
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 文档详情弹窗 */}
          {showRowDetail && selectedRow && (
            <div 
              className="fixed z-50 inset-0 overflow-y-auto backdrop-blur-sm"
              aria-labelledby="modal-title" 
              role="dialog" 
              aria-modal="true"
              onClick={() => {
          setShowRowDetail(false);
          setSelectedRow(null);
        }}
            >
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500/75 transition-opacity" aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div 
                  className="relative inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-all duration-200"
                      onClick={() => {
                        setShowRowDetail(false);
                        setSelectedRow(null);
                      }}
                    >
                      <span className="sr-only">关闭</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                        文档详情
                      </h3>
                      <div className="mt-6 text-left">
                        <div className="mb-4">
                          <span className="font-medium text-gray-700">ID: </span>
                          <span className="font-mono text-gray-900">{selectedRow._id}</span>
                        </div>
                        <pre className="bg-gray-50 p-6 rounded-xl overflow-auto max-h-[60vh] text-sm font-mono text-gray-900 whitespace-pre-wrap">
            {JSON.stringify(selectedRow._source, null, 2)}
          </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;