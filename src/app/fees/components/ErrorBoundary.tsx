// @ts-nocheck
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  theme?: 'dark' | 'light';
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // In production, you could send this to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      const isDark = this.props.theme === 'dark';

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className={`max-w-md w-full rounded-xl border p-6 text-center ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className={`text-xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Something went wrong
            </h2>
            
            <p className={`mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={`mb-6 text-left`}>
                <summary className={`cursor-pointer mb-2 text-sm font-medium ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  Error Details
                </summary>
                <div className={`mt-2 p-3 rounded text-xs overflow-auto max-h-40 ${
                  isDark ? 'bg-gray-900 text-red-400' : 'bg-gray-100 text-red-600'
                }`}>
                  <div className="font-mono">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className={`flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors`}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  theme?: 'dark' | 'light',
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary theme={theme} fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
