import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SearchResult, SearchResponse, IndexInfo, SearchCondition, SavedSearch, FieldMetadata, Column, ColumnState } from '../types';
import { commonFieldMetadata } from '../constants';
import { buildQuery } from '../utils';

export function useSearch(connectionId: string) {
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

  // 加载索引列表
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

  // 加载字段信息
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
        
        // 设置默认可见列
        const defaultVisibleColumns = new Set(['_id']);
        fields.slice(0, 5).forEach(field => defaultVisibleColumns.add(field.name));
        setVisibleColumns(defaultVisibleColumns);
        
        // 设置默认列顺序
        setColumnOrder(['_id', ...fields.map(f => f.name)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // 执行搜索
  const handleSearch = async () => {
    if (!index.trim()) {
      setError('请选择要搜索的索引');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchQuery = buildQuery(searchConditions, availableFields);
      
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

  // 加载保存的搜索条件
  const loadSavedSearches = () => {
    const saved = localStorage.getItem(`saved_searches_${connectionId}`);
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };

  // 保存搜索条件
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

  // 应用保存的搜索条件
  const applySavedSearch = (savedSearch: SavedSearch) => {
    setSearchConditions(savedSearch.conditions);
    handleSearch();
  };

  // 删除连接
  const deleteConnection = async (connectionName: string) => {
    try {
      await invoke('delete_connection', { connectionId: connectionName });
      // 刷新连接列表
      loadIndices();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // 初始化加载
  useEffect(() => {
    loadIndices();
    loadSavedSearches();
  }, [connectionId]);

  // 当索引改变时重置状态并执行搜索
  useEffect(() => {
    if (index) {
      resetSearchState();
      loadFields();
      handleSearch();
    }
  }, [index]);

  // 当索引列表或搜索词变化时，更新过滤后的索引列表
  useEffect(() => {
    const filtered = indices.filter(idx =>
      idx.name.toLowerCase().includes(indexSearchTerm.toLowerCase())
    );
    setFilteredIndices(filtered);
  }, [indices, indexSearchTerm]);

  // 当有新的搜索结果时，自动选择所有列
  useEffect(() => {
    if (results.length > 0) {
      const allColumns = new Set(['_id', ...Object.keys(results[0]._source)]);
      setVisibleColumns(allColumns);
    }
  }, [results]);

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

  return {
    // 状态
    index,
    indices,
    filteredIndices,
    indexSearchTerm,
    results,
    loading,
    error,
    searchStats,
    selectedRow,
    showRowDetail,
    visibleColumns,
    searchConditions,
    availableFields,
    savedSearches,
    showSaveSearchDialog,
    newSearchName,
    selectedGroup,
    columnOrder,
    isColumnOrderInitialized,
    draggedColumn,
    columnStates,
    resizingColumn,
    startResizeX,
    startResizeWidth,
    sortConfig,
    selectedRows,
    expandedRows,
    hoveredRow,
    fieldGroups,
    tableRef,

    // 方法
    setIndex,
    setIndexSearchTerm,
    setSelectedRow,
    setShowRowDetail,
    setVisibleColumns,
    setSearchConditions,
    setShowSaveSearchDialog,
    setNewSearchName,
    setSelectedGroup,
    setColumnOrder,
    setDraggedColumn,
    setColumnStates,
    setResizingColumn,
    setStartResizeX,
    setStartResizeWidth,
    setSortConfig,
    setSelectedRows,
    setExpandedRows,
    setHoveredRow,
    resetSearchState,
    loadIndices,
    loadFields,
    handleSearch,
    saveSearch,
    applySavedSearch,
    deleteConnection,
    handleTableScroll
  };
} 