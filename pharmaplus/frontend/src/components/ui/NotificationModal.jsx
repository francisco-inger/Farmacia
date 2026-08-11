import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, Trash2, X, AlertTriangle, ShieldAlert, Package, 
  ShoppingBag, Info, ExternalLink, CheckCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationModal = ({ isOpen, onClose, onCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'high'
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notificaciones');
      const items = res.data || res;
      if (Array.isArray(items)) {
        setNotifications(items);
      } else if (items.data && Array.isArray(items.data)) {
        setNotifications(items.data);
      }
      if (onCountChange && (res.unread_count !== undefined || items.unread_count !== undefined)) {
        onCountChange(res.unread_count ?? items.unread_count);
      }
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/notificaciones/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      if (onCountChange) {
        setNotifications(current => {
          const unread = current.filter(n => !n.is_read).length;
          onCountChange(unread);
          return current;
        });
      }
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notificaciones/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      if (onCountChange) onCountChange(0);
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/notificaciones/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error eliminando notificación:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id, { stopPropagation: () => {} });
    }
    onClose();
    if (notification.module === 'inventario') navigate('/inventario');
    else if (notification.module === 'compras') navigate('/compras');
    else if (notification.module === 'pos') navigate('/pos');
    else if (notification.module === 'cajas') navigate('/cajas');
    else if (notification.module === 'recetas') navigate('/recetas');
    else navigate('/dashboard');
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'high') return n.priority === 'HIGH' || n.priority === 'CRITICAL';
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-danger text-white">CRÍTICO</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-warning text-white">ALTA</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-info text-white">MEDIA</span>;
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-muted/20 text-muted">NORMAL</span>;
    }
  };

  const getModuleIcon = (module, type) => {
    if (type === 'out_of_stock' || type === 'stock_low') {
      return <div className="w-9 h-9 rounded-full bg-danger-light text-danger flex items-center justify-center shrink-0"><AlertTriangle size={18} /></div>;
    }
    if (module === 'compras') {
      return <div className="w-9 h-9 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0"><ShoppingBag size={18} /></div>;
    }
    if (module === 'inventario') {
      return <div className="w-9 h-9 rounded-full bg-warning-light text-warning flex items-center justify-center shrink-0"><Package size={18} /></div>;
    }
    return <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0"><Info size={18} /></div>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 md:p-6 bg-black/30 backdrop-blur-xs animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden mt-12 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-light text-primary">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-bold text-main text-base leading-tight">Centro de Notificaciones</h3>
              <p className="text-xs text-muted">Alertas en tiempo real del sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-main hover:bg-background rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar & Quick Actions */}
        <div className="px-4 py-2 bg-background/60 border-b border-border flex items-center justify-between text-xs">
          <div className="flex gap-1">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'text-muted hover:bg-surface'}`}
            >
              Todas ({notifications.length})
            </button>
            <button 
              onClick={() => setFilter('unread')} 
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filter === 'unread' ? 'bg-primary text-white' : 'text-muted hover:bg-surface'}`}
            >
              Sin leer ({notifications.filter(n => !n.is_read).length})
            </button>
            <button 
              onClick={() => setFilter('high')} 
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${filter === 'high' ? 'bg-primary text-white' : 'text-muted hover:bg-surface'}`}
            >
              Urgentes
            </button>
          </div>
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
            title="Marcar todas como leídas"
          >
            <CheckCheck size={14} /> Leídas
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
          {loading ? (
            <div className="py-8 text-center text-muted text-sm">Cargando notificaciones...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted">
                <Check size={24} />
              </div>
              <p className="text-sm font-semibold text-main">¡Todo al día!</p>
              <p className="text-xs text-muted">No tienes notificaciones pendientes en esta sección.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div 
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 relative group ${
                  n.is_read 
                  ? 'bg-surface border-border/60 opacity-80 hover:opacity-100 hover:border-border' 
                  : 'bg-primary-light/20 border-primary/30 shadow-xs hover:shadow-sm'
                }`}
              >
                {!n.is_read && (
                  <span className="w-2 h-2 rounded-full bg-primary absolute top-3 right-3"></span>
                )}
                {getModuleIcon(n.module, n.type)}
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-bold text-main leading-tight">{n.title}</h4>
                    {getPriorityBadge(n.priority)}
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-2">{n.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted">
                    <span>{new Date(n.created_at || Date.now()).toLocaleDateString('es-DO', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-semibold text-primary group-hover:underline flex items-center gap-1">
                      Ir al módulo <ExternalLink size={10} />
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                  {!n.is_read && (
                    <button 
                      onClick={(e) => handleMarkAsRead(n.id, e)} 
                      className="p-1 text-muted hover:text-success hover:bg-success-light rounded transition-colors"
                      title="Marcar como leída"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleDelete(n.id, e)} 
                    className="p-1 text-muted hover:text-danger hover:bg-danger-light rounded transition-colors"
                    title="Eliminar notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-background/50 text-center">
          <p className="text-[11px] text-muted">PharmaPlus • Sistema Inteligente de Farmacia</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
