import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icons } from './Icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 font-sans">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              We're sorry, but an unexpected error occurred.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-100 dark:bg-slate-900 p-4 rounded-lg mb-6 overflow-auto max-h-48 border border-slate-200 dark:border-slate-700">
                <p className="font-mono text-xs text-red-600 dark:text-red-400 break-words font-bold mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                   <pre className="font-mono text-[10px] text-slate-500 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                   </pre>
                )}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
