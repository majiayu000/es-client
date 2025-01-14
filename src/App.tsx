import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ClusterOverview } from './components/ClusterOverview';
import { IndexList } from './components/IndexList';
import { ShardList } from './components/ShardList';
import { Search } from './features/search/components/Search';
import { Snapshots } from './components/Snapshots';
import { ErrorBoundary } from './components/ErrorBoundary';

// 包装路由组件，添加错误边界
const withErrorBoundary = (Component: React.ComponentType<any>) => (props: any) => (
  <ErrorBoundary>
    <Component {...props} />
  </ErrorBoundary>
);

function App() {
  return (
    <ErrorBoundary>
      <Layout>
        {({ activeConnectionId }) => {
          if (!activeConnectionId) {
            return (
              <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">未连接到 Elasticsearch</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">请先选择或添加一个连接</p>
                </div>
              </div>
            );
          }

          return (
            <Routes>
              <Route
                path="/"
                element={withErrorBoundary(ClusterOverview)({ connectionId: activeConnectionId })}
              />
              <Route
                path="/indices"
                element={withErrorBoundary(IndexList)({ connectionId: activeConnectionId })}
              />
              <Route
                path="/shards"
                element={withErrorBoundary(ShardList)({ connectionId: activeConnectionId })}
              />
              <Route
                path="/search"
                element={withErrorBoundary(Search)({ connectionId: activeConnectionId })}
              />
              <Route
                path="/snapshots"
                element={withErrorBoundary(Snapshots)({ connectionId: activeConnectionId })}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          );
        }}
      </Layout>
    </ErrorBoundary>
  );
}

export default App; 