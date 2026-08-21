import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PharmaPlus ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-4 text-3xl font-bold border border-rose-500/30">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold mb-2">Se produjo un error en la aplicación</h1>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            Ocurrió un problema inesperado al cargar este módulo o componente.
          </p>
          <div className="bg-slate-800/80 p-4 rounded-xl text-left font-mono text-xs text-rose-300 max-w-lg w-full overflow-auto mb-6 border border-slate-700">
            {this.state.error?.toString()}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              Reiniciar Sesión
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
