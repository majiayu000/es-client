import React, { useState } from 'react';
import { ConnectionList } from './ConnectionList';
import { ConnectionForm } from './ConnectionForm';

interface LayoutProps {
  children: React.ReactNode;
  activeConnectionId: string | null;
  onConnectionChange: (connectionId: string | null) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ 
  children, 
  activeConnectionId, 
  onConnectionChange,
  activeTab,
  onTabChange 
}: LayoutProps) {
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showConnectionList, setShowConnectionList] = useState(false);

  const handleConnectionSelect = (connectionId: string) => {
    onConnectionChange(connectionId);
    setShowConnectionList(false);
  };

  const tabs = [
    { id: 'home', name: '首页' },
    { id: 'shards', name: '分片' },
    { id: 'indices', name: '索引' },
    { id: 'search', name: '搜索' },
    { id: 'snapshots', name: '快照' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowConnectionList(!showConnectionList)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {activeConnectionId ? '已连接' : '选择连接'}
                  </button>
                  {showConnectionList && (
                    <div className="origin-top-left absolute left-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <ConnectionList
                          onConnectionSelect={handleConnectionSelect}
                          onAddNew={() => {
                            setShowConnectionModal(true);
                            setShowConnectionList(false);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {activeConnectionId && (
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* 如果没有活动连接且不在连接列表/表单中，显示欢迎页面 */}
        {!activeConnectionId && !showConnectionList && !showConnectionModal ? (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              欢迎使用 Elasticsearch 管理工具
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              请点击左上角的"选择连接"按钮来开始使用
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">索引管理</h2>
                <p className="text-gray-600">查看和管理您的 Elasticsearch 索引</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">集群监控</h2>
                <p className="text-gray-600">监控集群状态和性能指标</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">数据查询</h2>
                <p className="text-gray-600">执行搜索和查询操作</p>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* 连接表单模态框 */}
      {showConnectionModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <ConnectionForm
                  onConnected={() => {
                    setShowConnectionModal(false);
                    setShowConnectionList(true);
                  }}
                  onCancel={() => setShowConnectionModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 