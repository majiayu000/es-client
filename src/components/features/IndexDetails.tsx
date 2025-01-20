import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useParams, useNavigate } from 'react-router-dom';

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

interface IndexDetailsProps {
  connectionId: string;
}

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

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
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

export function IndexDetails({ connectionId }: IndexDetailsProps) {
  const { indexName } = useParams();
  const navigate = useNavigate();
  const decodedIndexName = indexName ? decodeURIComponent(indexName) : '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<IndexDetails | null>(null);

  useEffect(() => {
    const fetchIndexDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await invoke<IndexDetails>('get_index_details', {
          connectionId,
          indexName: decodedIndexName,
        });
        setDetails(response);
      } catch (err) {
        console.error('Failed to fetch index details:', err);
        if (err instanceof Error && err.message.includes('index_not_found')) {
          navigate('/indices');
          return;
        }
        setError(err instanceof Error ? err.message : '获取索引详情失败');
      } finally {
        setLoading(false);
      }
    };

    if (decodedIndexName) {
      fetchIndexDetails();
    }
  }, [connectionId, decodedIndexName, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="text-gray-600">未找到索引信息</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">索引详情</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{details.name}</p>
          </div>
          <button
            onClick={() => navigate('/indices')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            返回列表
          </button>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">健康状态</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getHealthColor(details.health)}`}>
                  {details.health}
                </span>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">状态</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{details.status}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">UUID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{details.uuid}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">主分片数</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{details.primary_shards}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">副本分片数</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{details.replica_shards}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">文档数</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{details.docs_count.toLocaleString()}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">已删除文档数</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{details.docs_deleted.toLocaleString()}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">大小</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatSize(details.size_in_bytes)}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">创建时间</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(details.creation_date)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default IndexDetails; 