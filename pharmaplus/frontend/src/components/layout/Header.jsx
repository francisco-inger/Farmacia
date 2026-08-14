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
      <div className="h-16 bg-white border-b border-slate-100/90 flex items-center justify-between px-6 sticky top-0 z-20 shadow-2xs">
        
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

        {/* Right side: Escanear button, notifications badge, help, settings, user pill */}
        <div className="flex items-center gap-3.5">
          
          {/* Escanear button */}
          <button 
            onClick={() => navigate('/pos')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
          >
            <span>📷</span>
            <span>Escanear</span>
          </button>

          {/* Notifications Button with Red Badge 2 */}
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-colors"
            title="Notificaciones"
          >
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center rounded-full border-2 border-white shadow-2xs">
              2
            </span>
          </button>

          {/* Help Question Mark */}
          <button 
            onClick={() => navigate('/ia')}
            className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl font-extrabold text-sm transition-colors"
            title="Ayuda / Soporte"
          >
            ?
          </button>

          {/* Settings Icon */}
          <button 
            onClick={() => navigate('/configuracion')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            title="Configuración"
          >
            <Settings size={18} />
          </button>

          {/* User Profile Pill matching screenshot: Circle AD | Admin General admin@appes.com */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200/80 hover:bg-slate-50/80 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-black text-xs shadow-2xs">
                AD
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-black text-slate-800 leading-tight">Admin General</p>
                <p className="text-[10px] text-slate-400 font-medium leading-none">admin@appes.com</p>
              </div>
              <ChevronDown size={13} className="text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.name || 'Admin General'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@appes.com'}</p>
                </div>
                
                <button 
                  onClick={() => navigate('/configuracion')}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <Settings size={14} className="text-slate-400" /> Configuración
                </button>
                <button 
                  onClick={() => navigate('/usuarios')}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <User size={14} className="text-slate-400" /> Mi Perfil
                </button>

                <div className="border-t border-slate-100 my-1"></div>
                <button 
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors"
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
