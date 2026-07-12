import React from 'react';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0B3C5D',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '32px',
            textAlign: 'center',
            fontFamily: 'sans-serif',
            zIndex: 99999,
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>حدث خطأ غير متوقع</div>
          <div style={{ fontSize: '13px', opacity: 0.8, maxWidth: '480px', wordBreak: 'break-word' }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
            style={{
              marginTop: '12px',
              padding: '10px 24px',
              background: '#D9B310',
              color: '#0B3C5D',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
