import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      hasError: true
    });

    // Try to recover from error after a delay
    setTimeout(() => {
      // Auto-recover if it's a transient error
      if (this.state.hasError && !this.state.error?.message?.includes('Cannot read')) {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }
    }, 5000);
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null, hasError: false });
    // Force navigation to home to reset app state
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Something went wrong</h2>
            <p className="text-neutral-700 mb-4">
              An unexpected error occurred. The page will try to recover automatically, or you can refresh.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="bg-gray-50 p-4 rounded-lg mb-4 max-h-96 overflow-auto">
                <summary className="text-neutral-900 font-semibold cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-red-600 text-xs mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      <br />
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="bg-blue-950 text-white py-2 px-6 rounded-lg hover:bg-blue-900 transition"
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;