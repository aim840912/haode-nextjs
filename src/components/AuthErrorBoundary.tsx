'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import Link from 'next/link';

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary 捕獲錯誤:', error as Error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // 在開發環境下記錄詳細錯誤信息
    if (process.env.NODE_ENV === 'development') {
      console.error('驗證錯誤詳情:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 自定義錯誤 UI，如果有提供 fallback 則使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-900 tracking-tight mb-6">
                豪德茶業
              </div>
              <div className="text-sm text-amber-700/70 font-medium tracking-wider mb-8">
                HAUDE TEA
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg 
                      className="h-6 w-6 text-red-600" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" 
                      />
                    </svg>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    登入系統暫時無法使用
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-6">
                    我們遇到了一些技術問題，請稍後再試或聯繫客服協助。
                  </p>

                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                      <h4 className="text-xs font-medium text-red-800 mb-2">開發模式 - 錯誤詳情:</h4>
                      <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                        {this.state.error.message}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      onClick={this.handleRetry}
                      className="w-full bg-amber-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
                    >
                      重新嘗試
                    </button>
                    
                    <Link 
                      href="/"
                      className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-center"
                    >
                      返回首頁
                    </Link>
                  </div>
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

export default AuthErrorBoundary;