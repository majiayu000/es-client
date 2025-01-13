import React from 'react';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { errorService } from '../services/error';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentStack = errorInfo.componentStack || '';
    errorService.reportError(error, componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 max-w-2xl w-full">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  发生错误
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p className="whitespace-pre-wrap font-mono text-xs">
                    {this.state.error?.message || '未知错误'}
                  </p>
                  {this.state.error?.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">查看详细信息</summary>
                      <pre className="mt-2 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="mt-4 space-x-3">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:text-red-100 dark:bg-red-800 dark:hover:bg-red-700"
                  >
                    刷新页面
                  </button>
                  <button
                    type="button"
                    onClick={this.handleReset}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    重试
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 