import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Home, ShoppingCart, Package, Pill, Users, FileText, Activity,
  ShoppingBag, Truck, Receipt, UserCog, DollarSign, UsersRound,
  ShieldAlert, BarChart3, Settings, LogOut, BotMessageSquare, Bell
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user, logout, hasRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuGroups = [
    {
      title: "MÓDULOS",
      items: [
        { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'cajero'] },
        { path: '/pos', icon: ShoppingCart, label: 'Sistema POS', roles: ['admin', 'cajero'] },
        { path: '/inventario', icon: Package, label: 'Inventario', roles: ['admin', 'cajero'] },
        { path: '/productos', icon: Pill, label: 'Productos', roles: ['admin', 'cajero'] },
        { path: '/clientes', icon: Users, label: 'Clientes', roles: ['admin', 'cajero'] },
        { path: '/recetas', icon: FileText, label: 'Recetas', roles: ['admin', 'cajero'] },
        { path: '/servicios', icon: Activity, label: 'Gestión de Servicios', roles: ['admin', 'cajero'] },
        { path: '/compras', icon: ShoppingBag, label: 'Compras', roles: ['admin'] },
        { path: '/proveedores', icon: Truck, label: 'Proveedores', roles: ['admin'] },
        { path: '/facturacion', icon: Receipt, label: 'Facturación DGII', roles: ['admin'] },
        { path: '/rrhh', icon: UserCog, label: 'Gestión RR. HH.', roles: ['admin'] },
        { path: '/ia', icon: BotMessageSquare, label: 'Asistente IA', roles: ['admin', 'cajero'], badge: 'Nuevo' },
        { path: '/reportes', icon: BarChart3, label: 'Reportes', roles: ['admin'] },
        { path: '/cajas', icon: DollarSign, label: 'Cajas y Cierres', roles: ['admin', 'cajero'] },
        { path: '/usuarios', icon: UsersRound, label: 'Usuarios y Roles', roles: ['admin'] },
        { path: '/auditoria', icon: ShieldAlert, label: 'Auditoría', roles: ['admin'] },
        { path: '/configuracion', icon: Settings, label: 'Configuración', roles: ['admin'] },
      ]
    }
  ];

  return (
    <div className={`h-screen flex flex-col bg-surface border-r border-border overflow-hidden shrink-0 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-border overflow-hidden">
        <div className="flex items-center gap-2 w-full justify-center">
          <div className="bg-primary text-white p-1.5 rounded flex items-center justify-center shrink-0">
            <Pill size={20} />
          </div>
          {isOpen && (
            <div className="whitespace-nowrap overflow-hidden transition-all duration-300">
              <h1 className="font-bold text-main leading-tight text-lg">PharmaPlus</h1>
              <p className="text-[10px] text-muted leading-tight">Sistema de Gestión</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-6">
            {isOpen && <h3 className="text-[10px] font-bold text-primary mb-2 px-3 uppercase tracking-wider">{group.title}</h3>}
            <ul className="flex flex-col gap-1">
              {group.items.filter(item => item.roles.includes(user?.role)).map((item, i) => (
                <li key={i}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                        ? 'bg-primary text-white shadow-sm' 
                        : 'text-main hover:bg-background hover:text-primary'
                      }`
                    }
                    title={!isOpen ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="shrink-0" />
                      {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                    </div>
                    {isOpen && item.badge && (
                      <span className="bg-success-light text-success text-[10px] px-1.5 py-0.5 rounded font-bold border border-success/20 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* User Area Bottom */}
      <div className={`p-4 border-t border-border bg-background/50 ${!isOpen && 'flex flex-col items-center gap-2'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {isOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-sm font-bold text-main truncate">{user?.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  <span className="text-xs text-muted">En línea</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`flex items-center justify-center gap-2 w-full py-2 text-sm text-danger hover:bg-danger-light rounded-lg border border-transparent hover:border-danger/20 transition-colors ${!isOpen && 'px-0'}`}
        >
          <LogOut size={20} className="shrink-0" /> 
          {isOpen && <span>Salir</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
