import React, { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

/** Top-level error boundary (M6) — a crash shows a recover screen instead of a blank task pane */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Absentbox crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif', textAlign: 'center', gap: 12 }}>
          <img src="/logo.jpeg" alt="Absentbox" style={{ width: 120, borderRadius: 12 }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Something went wrong</h1>
          <p style={{ fontSize: 12, color: '#64748b', maxWidth: 320 }}>{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
            style={{ marginTop: 8, padding: '10px 24px', background: '#D4654A', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Reload Absentbox
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
