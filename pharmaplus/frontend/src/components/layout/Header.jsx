import React, { useContext, useState, useEffect } from 'react';
import { Menu, Search, Mic, Bell, Maximize, ChevronDown, BotMessageSquare, LogOut, Settings, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import NotificationModal from '../ui/NotificationModal';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setSearchTerm('Paracetamol 500mg');
        setIsListening(false);
      }, 1500);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setSearchTerm(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Micrófono:', err);
      setIsListening(false);
    }
  };

  useEffect(() => {
    // Initial fetch of unread count
    api.get('/notificaciones')
      .then(res => {
        const count = res.unread_count ?? (res.data && res.data.unread_count) ?? 3;
        setUnreadCount(count);
      })
      .catch(() => {});
  }, []);

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1] || 'dashboard';
    const titles = {
      'dashboard': { title: 'Dashboard', subtitle: 'Resumen general de la farmacia' },
      'pos': { title: 'Sistema POS', subtitle: 'Punto de venta y facturación' },
      'inventario': { title: 'Inventario', subtitle: 'Control de existencias y movimientos' },
      'productos': { title: 'Productos', subtitle: 'Catálogo de medicamentos y artículos' },
      'clientes': { title: 'Clientes', subtitle: 'Directorio y perfil de pacientes' },
      'recetas': { title: 'Recetas Médicas', subtitle: 'Registro y dispensación' },
      'servicios': { title: 'Servicios', subtitle: 'Toma de presión, inyecciones, etc.' },
      'compras': { title: 'Compras', subtitle: 'Órdenes a proveedores' },
      'proveedores': { title: 'Proveedores', subtitle: 'Directorio de laboratorios y distribuidores' },
      'facturacion': { title: 'Facturación DGII', subtitle: 'Gestión de comprobantes fiscales (NCF)' },
      'rrhh': { title: 'Recursos Humanos', subtitle: 'Personal y asistencia' },
      'ia': { title: 'Asistente IA', subtitle: 'Inteligencia Artificial PharmaPlus' },
      'reportes': { title: 'Reportes', subtitle: 'Estadísticas e inteligencia de negocios' },
      'cajas': { title: 'Cajas y Cierres', subtitle: 'Control de efectivo por turno' },
      'usuarios': { title: 'Usuarios y Roles', subtitle: 'Accesos al sistema' },
      'auditoria': { title: 'Auditoría', subtitle: 'Registro de actividades' },
      'configuracion': { title: 'Configuración', subtitle: 'Parámetros generales del sistema' }
    };
    return titles[path] || { title: 'PharmaPlus', subtitle: 'Sistema de Gestión' };
  };

  const { title, subtitle } = getPageTitle();

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        navigate(`/productos?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-slate-100/90 flex items-center justify-between px-6 sticky top-0 z-20">
        
        {/* Left side: Search input with shortcut icon (Just like image) */}
        <div className="flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Buscar en appes.erp..." 
              className="w-full bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200/60 rounded-xl py-2 pl-9 pr-14 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">⌘K</span>
            </div>
          </div>
        </div>

        {/* Right side: Actions & User pill */}
        <div className="flex items-center gap-3">
          
          {/* Escanear Button */}
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 transition-all shadow-2xs"
          >
            <span className="text-sm">📷</span>
            <span>Escanear</span>
          </button>

          {/* Notifications Button with count */}
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            title="Centro de Notificaciones"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Ayuda / Pregunta */}
          <button
            onClick={() => navigate('/ia')}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-sm transition-colors"
            title="Centro de Ayuda / IA"
          >
            ?
          </button>

          {/* System Settings Shortcut */}
          <button
            onClick={() => navigate('/configuracion')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            title="Ajustes y Parámetros"
          >
            <Settings size={18} />
          </button>

          {/* User Dropdown Header Profile (Exact like screenshot) */}
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                AD
              </div>
              <div className="hidden md:block text-left pr-1">
                <p className="text-xs font-bold text-slate-800 leading-tight">Admin General</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">admin@appes.com</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-xl border border-border py-1 z-30 animate-fade-in"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-bold text-main">{user?.name}</p>
                  <p className="text-[10px] text-muted truncate">{user?.email}</p>
                </div>
                {/* Opciones solo para Admin */}
                {user?.role !== 'cajero' && (
                  <>
                    <button 
                      onClick={() => navigate('/configuracion')}
                      className="w-full px-4 py-2 text-xs text-main hover:bg-background flex items-center gap-2 transition-colors"
                    >
                      <Settings size={14} /> Configuración
                    </button>
                    <button 
                      onClick={() => navigate('/usuarios')}
                      className="w-full px-4 py-2 text-xs text-main hover:bg-background flex items-center gap-2 transition-colors"
                    >
                      <User size={14} /> Mi Cuenta
                    </button>
                  </>
                )}
                <div className="border-t border-border my-1"></div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full px-4 py-2 text-xs text-danger hover:bg-danger-light flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)}
        onCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
};

export default Header;
