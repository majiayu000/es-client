import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ConnectionInfo {
  id: string;
  name: string;
  hosts: string[];
  is_active: boolean;
}

interface ConnectionListProps {
  onConnectionSelect: (connectionId: string) => void;
  onAddNew: () => void;
}

export function ConnectionList({ onConnectionSelect, onAddNew }: ConnectionListProps) {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<ConnectionInfo[]>('list_connections');
      setConnections(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await invoke('disconnect_elasticsearch', { connectionId });
      await loadConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        加载连接列表...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        加载失败: {error}
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      <div className="p-4">
        <button
          onClick={onAddNew}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          添加新连接
        </button>
      </div>
      {connections.length === 0 ? (
        <div className="p-4 text-center text-gray-600">
          暂无连接，请添加新连接
        </div>
      ) : (
        connections.map((connection) => (
          <div key={connection.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{connection.name}</h3>
                <p className="text-sm text-gray-500">{connection.hosts.join(', ')}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onConnectionSelect(connection.id)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {connection.is_active ? '切换' : '连接'}
                </button>
                {connection.is_active && (
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    断开
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 