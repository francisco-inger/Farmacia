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
      <div className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
        
        {/* Left side: Menu toggle & Page Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="text-muted hover:text-main p-1.5 rounded-lg hover:bg-background transition-colors"
            title="Contraer/Expandir menú"
          >
            <Menu size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-main leading-tight">{title}</h2>
            <p className="text-xs text-muted leading-tight">{subtitle}</p>
          </div>
        </div>

        {/* Middle: Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Buscar productos, clientes, recetas, servicios..." 
              className="w-full bg-background border border-border rounded-full py-2 pl-4 pr-12 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <div className="absolute right-3 flex items-center gap-2 text-muted">
              <button onClick={handleSearch} className="hover:text-primary transition-colors" title="Buscar">
                <Search size={16} />
              </button>
              <button 
                onClick={() => navigate('/ia?query=' + encodeURIComponent('Escanear producto'))} 
                className="hover:text-primary transition-colors" 
                title="Búsqueda por voz"
              >
                <Mic size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Actions & User */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Button */}
          <button 
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-muted hover:text-main hover:bg-background rounded-full transition-colors"
            title="Centro de Notificaciones"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-surface shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* AI Quick Button */}
          <button 
            onClick={() => navigate('/ia')}
            className="p-2 text-primary hover:bg-primary-light rounded-full transition-colors relative"
            title="Asistente IA"
          >
            <BotMessageSquare size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full"></span>
          </button>

          {/* Fullscreen */}
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-muted hover:text-main hover:bg-background rounded-full transition-colors hidden sm:block"
            title="Pantalla Completa"
          >
            <Maximize size={18} />
          </button>

          <div className="w-px h-6 bg-border mx-1"></div>

          {/* User Profile Menu */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 hover:bg-background p-1.5 rounded-lg transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-main leading-none">{user?.name || 'Admin Farmacia'}</p>
                <p className="text-[10px] text-muted leading-none mt-1 capitalize">{user?.role || 'Administrador'}</p>
              </div>
              <ChevronDown size={14} className="text-muted ml-1" />
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
