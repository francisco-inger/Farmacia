import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  Home, ShoppingCart, Package, Pill, Users, FileText, Activity,
  ShoppingBag, Truck, Receipt, UserCog, DollarSign, UsersRound,
  ShieldAlert, BarChart3, Settings, LogOut, BotMessageSquare, Bell, Network,
  ChevronDown, ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Guarda qué grupos de subItems están expandidos (por path del item padre)
  const [expandedItems, setExpandedItems] = useState({});

  const toggleExpand = (path, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedItems(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuGroups = [
    {
      title: "MÓDULOS",
      items: [
        { path: '/dashboard',    icon: Home,           label: 'Dashboard',              roles: ['admin'] },
        { path: '/pos',          icon: ShoppingCart,   label: 'Sistema POS',            roles: ['admin', 'cajero'] },
        { path: '/cajas',        icon: DollarSign,     label: 'Cajas y Cierres',        roles: ['admin', 'cajero'] },
        { path: '/inventario',   icon: Package,        label: 'Inventario',             roles: ['admin'] },
        { path: '/productos',    icon: Pill,           label: 'Productos',              roles: ['admin'] },
        { path: '/clientes',     icon: Users,          label: 'Clientes',               roles: ['admin'] },
        { path: '/servicios',    icon: Activity,       label: 'Gestión de Servicios',   roles: ['admin'] },
        { path: '/compras',      icon: ShoppingBag,    label: 'Compras',                roles: ['admin'] },
        { path: '/proveedores',  icon: Truck,          label: 'Proveedores',            roles: ['admin'] },
      ]
    },
    {
      title: "FACTURACIÓN",
      items: [
        { path: '/facturacion',  icon: Receipt,        label: 'DGI / FISCAL',           roles: ['admin'], badge: 'DGII',
          subItems: [
            { label: 'Configuración Fiscal',        path: '/facturacion?tab=configuracion' },
            { label: 'NCF / Secuencias',            path: '/facturacion?tab=secuencias' },
            { label: 'Facturación Electrónica',     path: '/facturacion?tab=ecf' },
            { label: 'Comprobantes',                path: '/facturacion?tab=comprobantes' },
            { label: 'Envíos a DGII',               path: '/facturacion?tab=envios' },
            { label: 'Respuestas DGII',             path: '/facturacion?tab=respuestas' },
            { label: 'Reportes Fiscales',           path: '/facturacion?tab=reportes' },
            { label: 'Formatos DGII (606/607/608)', path: '/facturacion?tab=formatos' },
            { label: 'Auditoría Fiscal',            path: '/facturacion?tab=auditoria' }
          ]
        },
      ]
    },
    {
      title: "SISTEMA",
      items: [
        { path: '/rrhh',         icon: UserCog,          label: 'Gestión RR. HH.',        roles: ['admin'] },
        { path: '/integraciones',icon: Network,          label: 'Integraciones Externas', roles: ['admin'], badge: 'API' },
        { path: '/ia',           icon: BotMessageSquare, label: 'Asistente IA',           roles: ['admin'], badge: 'IA' },
        { path: '/reportes',     icon: BarChart3,        label: 'Reportes',               roles: ['admin'] },
        { path: '/usuarios',     icon: UsersRound,       label: 'Usuarios y Roles',       roles: ['admin'] },
        { path: '/auditoria',    icon: ShieldAlert,      label: 'Auditoría',              roles: ['admin'] },
        { path: '/configuracion',icon: Settings,         label: 'Configuración',          roles: ['admin'] },
      ]
    }
  ];

  return (
    <div className={`h-screen flex flex-col bg-surface border-r border-border overflow-hidden shrink-0 transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* Logo Area */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100 bg-white overflow-hidden">
        <div className="flex items-center gap-3 w-full">
          <div className="w-9 h-9 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Pill size={20} className="rotate-45" />
          </div>
          {isOpen && (
            <div className="whitespace-nowrap overflow-hidden transition-all duration-300">
              <div className="flex items-center gap-1 leading-none">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">PHARMA<span className="text-[#2563eb]">.ERP</span></span>
              </div>
              <p className="text-[10px] font-semibold text-slate-400 leading-tight mt-0.5 tracking-wider uppercase">
                Enterprise Suite 2026
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-3 custom-scrollbar space-y-1">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-3">
            {isOpen && (
              <h3 className="text-[10px] font-extrabold text-slate-400 mb-1.5 px-3 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <ul className="flex flex-col gap-1">
              {group.items.filter(item => item.roles.includes(user?.role)).map((item, i) => {
                const isCurrentPath = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                const isExpanded = expandedItems[item.path] === true;
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <li key={i}>
                    {/* Main menu item */}
                    <div className="flex items-center gap-1">
                      <NavLink
                        to={item.path}
                        end={!hasSubItems}
                        className={({ isActive }) =>
                          `flex-1 flex items-center ${isOpen ? 'justify-between px-3.5' : 'justify-center px-0'} py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                            isActive
                              ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/25'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                        }
                        title={!isOpen ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} className="shrink-0" />
                          {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
                        </div>
                        {isOpen && hasSubItems && (
                          <span onClick={(e) => toggleExpand(item.path, e)} className="p-0.5">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} className="opacity-60" />}
                          </span>
                        )}
                        {isOpen && item.badge && !hasSubItems && (
                          <span className="bg-blue-50 text-[#2563eb] text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase border border-blue-200/60 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </div>

                    {/* Sub-items */}
                    {isOpen && hasSubItems && isExpanded && (
                      <ul className="mt-1 ml-4 border-l-2 border-slate-200 space-y-0.5 pl-3 py-1 overflow-hidden">
                        {item.subItems.map((sub, sIdx) => (
                          <li key={sIdx}>
                            <NavLink
                              to={sub.path}
                              className={({ isActive }) =>
                                `block text-[11px] py-1.5 px-2 rounded-lg font-medium transition-colors ${
                                  isActive
                                    ? 'bg-blue-50 text-[#2563eb] font-bold'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`
                              }
                            >
                              {sub.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Plan Widget */}
      {isOpen && (
        <div className="p-3 mx-3 mb-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
              👑 Plan Empresarial
            </span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#2563eb]/10 text-[#2563eb]">
              Avanzado
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium mb-1">
            <span>Uso del sistema</span>
            <span className="font-bold text-slate-700">68%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#2563eb] rounded-full w-[68%]" />
          </div>
        </div>
      )}

      {/* User Area Bottom */}
      <div className={`p-3.5 border-t border-slate-100 bg-white ${!isOpen && 'flex flex-col items-center gap-2'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {isOpen && (
              <div className="overflow-hidden whitespace-nowrap">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.name || 'Admin General'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-medium">{user?.role || 'Administrador'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`flex items-center justify-center gap-2 w-full py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ${!isOpen && 'px-0'}`}
        >
          <LogOut size={16} className="shrink-0" />
          {isOpen && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
