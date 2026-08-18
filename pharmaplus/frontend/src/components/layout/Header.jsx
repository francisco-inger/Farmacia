import React, { useContext, useState, useEffect } from 'react';
import { Menu, Search, Mic, Bell, Maximize, ChevronDown, BotMessageSquare, LogOut, Settings, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import NotificationModal from '../ui/NotificationModal';
import BarcodeScannerModal from '../BarcodeScannerModal';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchTerm.trim()) {
        navigate(`/productos?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const handleHeaderScan = (scannedCode) => {
    if (scannedCode) {
      navigate(`/productos?search=${encodeURIComponent(scannedCode)}`);
    }
  };

  return (
    <>
      <div className="h-16 bg-white border-b border-slate-100/90 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shadow-2xs">
        
        {/* Left side: Toggle button + Search input */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Alternar barra lateral"
            className="p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-emerald-50 hover:text-[#16a085] hover:border-emerald-200 text-slate-600 transition-all active:scale-95 shadow-2xs shrink-0 cursor-pointer"
          >
            <Menu size={18} />
          </button>

          <div className="relative flex items-center flex-1">
            <Search size={15} className="text-slate-400 absolute left-3.5" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Buscar en pharmaplus.erp..." 
              className="w-full bg-slate-100/70 hover:bg-slate-100 focus:bg-white border border-slate-200/60 rounded-xl py-2 pl-9 pr-14 text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16a085]/20 focus:border-[#16a085] transition-all"
            />
            <div className="absolute right-3 flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">⌘K</span>
            </div>
          </div>
        </div>

        {/* Right side: Escanear, Notification, Help, Settings, User pill */}
        <div className="flex items-center gap-3.5">
          
          {/* Escanear button */}
          <button 
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>📷</span>
            <span>Escanear</span>
          </button>

          {/* Notifications Button */}
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

          {/* Help button */}
          <button 
            onClick={() => navigate('/ia')}
            className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl font-extrabold text-sm transition-colors"
            title="Ayuda / Soporte"
          >
            ?
          </button>

          {/* Settings button */}
          <button 
            onClick={() => navigate('/configuracion')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            title="Configuración"
          >
            <Settings size={18} />
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200/80 hover:bg-slate-50/80 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#12876f] to-[#16a085] flex items-center justify-center text-white font-black text-xs shadow-2xs">
                AD
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-black text-slate-800 leading-tight">Admin General</p>
                <p className="text-[10px] text-slate-400 font-medium leading-none">admin@pharmaplus.do</p>
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
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@pharmaplus.do'}</p>
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

      {/* Global Camera Scanner Modal */}
      <BarcodeScannerModal 
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleHeaderScan}
        title="Escáner Global de Productos"
      />
    </>
  );
};

export default Header;
