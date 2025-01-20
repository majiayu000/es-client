import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/common';

// 懒加载组件
const ClusterOverview = React.lazy(() => import('../components/features/ClusterOverview'));
const IndexList = React.lazy(() => import('../components/features/IndexList'));
const ShardList = React.lazy(() => import('../components/features/ShardList'));
const Search = React.lazy(() => 
  import('../features/search/components/Search').then(module => {
    if (!module.default) {
      throw new Error('Search component must have a default export');
    }
    return module;
  })
);
const Snapshots = React.lazy(() => import('../components/features/Snapshots'));

// 包装路由组件，添加错误边界和加载状态
const withErrorBoundary = (Component: React.ComponentType<any>) => (props: { connectionId: string }) => (
  <ErrorBoundary>
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">Loading...</div>}>
      <Component {...props} />
    </Suspense>
  </ErrorBoundary>
);

interface AppRoutesProps {
  connectionId: string;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ connectionId }) => {
  return (
    <Routes>
      <Route
        path="/"
        element={withErrorBoundary(ClusterOverview)({ connectionId })}
      />
      <Route
        path="/indices"
        element={withErrorBoundary(IndexList)({ connectionId })}
      />
      <Route
        path="/shards"
        element={withErrorBoundary(ShardList)({ connectionId })}
      />
      <Route
        path="/search"
        element={withErrorBoundary(Search)({ connectionId })}
      />
      <Route
        path="/snapshots"
        element={withErrorBoundary(Snapshots)({ connectionId })}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}; 