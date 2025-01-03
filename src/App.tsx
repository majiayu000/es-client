import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ClusterOverview } from './components/ClusterOverview';
import { IndexList } from './components/IndexList';
import { ShardList } from './components/ShardList';
import { Search } from './components/Search';

function App() {
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    if (!activeConnectionId) {
      return null;
    }

    switch (activeTab) {
      case 'home':
        return <ClusterOverview connectionId={activeConnectionId} />;
      case 'indices':
        return <IndexList connectionId={activeConnectionId} />;
      case 'shards':
        return <ShardList connectionId={activeConnectionId} />;
      case 'search':
        return <Search connectionId={activeConnectionId} />;
      case 'snapshots':
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">快照管理</h2>
            <p className="text-gray-500">快照管理功能开发中...</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout
      activeConnectionId={activeConnectionId}
      onConnectionChange={setActiveConnectionId}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </Layout>
  );
}

export default App; 