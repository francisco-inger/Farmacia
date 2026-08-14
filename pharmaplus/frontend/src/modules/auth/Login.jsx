import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Pill, Lock, UserPlus, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.success) {
        // Redirigir según el rol normalizado
        const role = (res.user?.role || '').toLowerCase().trim();
        if (role === 'cajero') {
          navigate('/pos', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(res?.message || 'Credenciales inválidas');
      }
    } catch (err) {
      setError(err?.message || 'Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans antialiased select-none">
      
      {/* ─── COLUMNA IZQUIERDA: FORMULARIO LOGIN (40% - 45% del ancho) ─── */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-white z-10 overflow-y-auto">
        
        {/* Header / Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#12876f] to-[#16a085] flex items-center justify-center text-white shadow-md shadow-[#16a085]/20 border border-[#16a085]/30">
            <Pill size={22} className="rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xl font-black tracking-tight text-slate-800">PHARMA<span className="text-[#16a085]">PLUS</span></span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#e8f6f3] text-[#12876f] border border-[#16a085]/20">ERP</span>
            </div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
              Sistema de Gestión Farmacéutica
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="my-auto py-6 max-w-md w-full mx-auto">
          
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sistema de Gestión Farmacéutica
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1.5 flex items-center gap-1.5">
              Panel de Control y POS — <span className="text-[#16a085] font-semibold">Acceso Seguro</span>
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Usuario / Correo */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                Usuario / Correo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pharmaplus.do"
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16a085]/20 focus:border-[#16a085] hover:bg-slate-100/60"
              />
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                  Contraseña
                </label>
                <a href="#" className="text-xs font-semibold text-[#16a085] hover:text-[#12876f] transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16a085]/20 focus:border-[#16a085] hover:bg-slate-100/60 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Botón Iniciar Sesión Primario */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#16a085] hover:bg-[#12876f] active:scale-[0.99] shadow-lg shadow-[#16a085]/25 hover:shadow-xl hover:shadow-[#16a085]/35 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} className="text-white/90" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Accesos rápidos de demostración */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-xs font-semibold text-slate-400 mb-3">
              ¿Acceso rápido de prueba?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@pharmaplus.do', 'admin123')}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-[#e8f6f3]/50 hover:border-[#16a085]/40 text-slate-700 hover:text-[#12876f] text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShieldCheck size={14} className="text-[#16a085]" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('cajero@pharmaplus.do', 'cajero123')}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-[#e8f6f3]/50 hover:border-[#16a085]/40 text-slate-700 hover:text-[#12876f] text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus size={14} className="text-[#16a085]" />
                <span>Cajero POS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 text-center lg:text-left">
          <p className="text-[11px] font-medium text-slate-400">
            Sistema de Gestión Farmacéutica v2.4 • Sesión segura con JWT & SQLite
          </p>
        </div>

      </div>

      {/* ─── COLUMNA DERECHA: BANNER CORPORATIVO ELEGANTE (55% - 60% del ancho) ─── */}
      <div className="hidden lg:flex flex-1 relative bg-slate-900 overflow-hidden">
        
        {/* Imagen de fondo con filtro profesional */}
        <img
          src="/login-hero.jpg"
          alt="PharmaPlus Corporate Boardroom"
          className="absolute inset-0 w-full h-full object-cover object-center transform scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Gradiente multicapa de elegancia corporativa con tintes esmeralda/teal */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/50 to-slate-950/30 backdrop-brightness-[0.88]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12876f]/20 via-transparent to-slate-950/60" />

        {/* Badge Flotante Superior */}
        <div className="absolute top-8 right-8 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Red Farmacéutica Nacional Online</span>
          </div>
        </div>

        {/* Contenido Informativo Inferior */}
        <div className="relative mt-auto p-12 xl:p-16 z-10 max-w-2xl text-white">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#16a085]/30 backdrop-blur-md border border-[#16a085]/40 text-[#5eead4] text-xs font-semibold mb-4">
            <Sparkles size={14} />
            <span>Gestión Clínica & Financiera de Alto Nivel</span>
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-snug drop-shadow-md">
            Sistema de Gestión y Control Farmacéutico.
          </h2>

          <p className="text-slate-200/90 text-sm xl:text-base font-normal mt-3 leading-relaxed drop-shadow">
            Diseñado con visión, elegancia y precisión para una administración inteligente del inventario, ventas POS, ARS y facturación en tiempo real.
          </p>

          {/* Micro stats / Features Pills */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/15">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#5eead4] shrink-0" />
              <span>Facturación NCF DGII</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#5eead4] shrink-0" />
              <span>Validación ARS Directa</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <CheckCircle2 size={16} className="text-[#5eead4] shrink-0" />
              <span>Control de Lotes & Caducidad</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
