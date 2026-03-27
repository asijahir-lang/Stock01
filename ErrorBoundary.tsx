import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-sm w-full text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">দুঃখিত! একটি সমস্যা হয়েছে</h1>
            <p className="text-gray-500 text-sm">
              অ্যাপ্লিকেশনটি লোড করতে সমস্যা হচ্ছে। দয়া করে পেজটি রিফ্রেশ করুন।
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            >
              রিফ্রেশ করুন
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-[10px] overflow-auto max-h-40 text-red-500">
                {JSON.stringify(this.state.error, null, 2)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
