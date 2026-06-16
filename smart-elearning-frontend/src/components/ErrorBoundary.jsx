import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{color:'red', padding:'20px', backgroundColor: '#1e1e1e', height: '100vh', width: '100vw', zIndex: 9999, position: 'fixed', top: 0, left: 0}}>
          <h1>Something went wrong.</h1>
          <pre style={{whiteSpace: 'pre-wrap'}}>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
