import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layouts';
import { ErrorBoundary } from './components/common';
import { AppRoutes } from './routes';
import Home from './pages/Home';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/*" element={
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

              return <AppRoutes connectionId={activeConnectionId} />;
            }}
          </Layout>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App; 