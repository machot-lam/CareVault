import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      isPermissionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error.message || 'An unexpected application error occurred.';
    let isPermissionError = false;
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed && parsed.error) {
        message = `${parsed.error}${parsed.path ? ` (${parsed.operationType} on ${parsed.path})` : ''}`;
        isPermissionError = parsed.error.toLowerCase().includes('permission');
      }
    } catch {
      isPermissionError = message.toLowerCase().includes('permission');
    }
    return {
      hasError: true,
      errorMessage: message,
      isPermissionError,
    };
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '', isPermissionError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-700 mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h1 className="text-lg font-semibold text-slate-900">
                {this.state.isPermissionError ? 'Clinical Access Restricted' : 'Application Error'}
              </h1>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {this.state.isPermissionError
                ? 'CareVault could not complete a protected database operation. Please verify that your clinician session is active and email-verified.'
                : 'CareVault encountered an unexpected runtime problem while rendering clinical data.'}
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 font-mono text-xs text-slate-700 break-words">
              {this.state.errorMessage}
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              Reload CareVault
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
