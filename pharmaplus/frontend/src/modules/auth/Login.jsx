import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Pill, Activity } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || 'Error de autenticación');
      }
    } catch (err) {
      setError(err.message || 'Error de red al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e8f6f3 100%)' }}>
      <div className="flex flex-col justify-center items-center w-full max-w-md mx-auto p-6 animate-fade-in">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center justify-center bg-primary text-white w-16 h-16 rounded-xl shadow-lg mb-2">
            <Pill size={32} />
          </div>
          <h1 className="text-3xl font-bold text-main flex items-center gap-2">
            PharmaPlus <Activity size={24} className="text-primary" />
          </h1>
          <p className="text-muted text-center">Sistema Integral de Gestión para Farmacias</p>
        </div>

        {/* Login Card */}
        <div className="card w-full shadow-lg">
          <h2 className="text-xl font-semibold mb-6 text-center text-main">Iniciar Sesión</h2>
          
          {error && (
            <div className="bg-danger-light text-danger p-3 rounded-md mb-4 text-sm border border-danger/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-main">Correo Electrónico</label>
              <input 
                type="email" 
                className="input"
                placeholder="admin@pharmaplus.do"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="flex flex-col gap-1 mb-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-main">Contraseña</label>
                <a href="#" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <input 
                type="password" 
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-2.5 text-base shadow-md hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Ingresar al sistema'}
            </button>
          </form>

          <div className="mt-8 pt-4 border-t border-border">
            <p className="text-xs text-muted text-center mb-2">Cuentas de demostración:</p>
            <div className="flex justify-between gap-2 text-xs">
              <button onClick={() => { setEmail('admin@pharmaplus.do'); setPassword('admin123'); }} className="btn-outline flex-1 py-1 rounded">Admin</button>
              <button onClick={() => { setEmail('cajero@pharmaplus.do'); setPassword('cajero123'); }} className="btn-outline flex-1 py-1 rounded">Cajero</button>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-xs text-muted">
          &copy; {new Date().getFullYear()} PharmaPlus. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Login;
