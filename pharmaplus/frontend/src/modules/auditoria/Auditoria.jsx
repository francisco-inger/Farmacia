import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, RefreshCw, Calendar, User, Filter, Eye, FileText, 
  CheckCircle, AlertTriangle, ShieldAlert, ArrowDown, Activity, Layers, Clock
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';

const Auditoria = () => {
  const [logs, setLogs] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // KPI States
  const [kpis, setKpis] = useState({
    totalLogs: 0,
    criticalCount: 0,
    activeUsersCount: 0,
    mostActiveModule: 'N/A'
  });

  useEffect(() => {
    fetchModules();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedModule, selectedUser, dateFrom, dateTo, page, searchTerm]);

  const fetchModules = async () => {
    try {
      const res = await api.get('/audit/modules');
      if (res.success && res.data) {
        setModules(res.data);
      }
    } catch (err) {
      console.error('Error fetching audit modules:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users?limit=100');
      // res is { success: true, data: [...] }
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = `/audit?page=${page}&limit=${limit}`;
      if (selectedModule) query += `&module=${selectedModule}`;
      if (selectedUser) query += `&user_id=${selectedUser}`;
      if (searchTerm) query += `&action=${encodeURIComponent(searchTerm)}`;
      if (dateFrom) query += `&date_from=${dateFrom}`;
      if (dateTo) query += `&date_to=${dateTo}`;

      const res = await api.get(query);
      if (res.success && res.data) {
        setLogs(res.data);
        setTotal(res.pagination?.total || res.data.length);
        
        // Calculate KPIs locally based on fetched or general data
        const criticalActions = res.data.filter(l => 
          l.action.includes('ANULADA') || 
          l.action.includes('ELIMINAR') || 
          l.action.includes('CERRAR') ||
          l.action.includes('ERROR')
        ).length;

        // Group by module to find the most active module
        const moduleCounts = {};
        res.data.forEach(l => {
          moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1;
        });
        let topModule = 'N/A';
        let maxCount = 0;
        Object.entries(moduleCounts).forEach(([mod, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topModule = mod;
          }
        });

        // Unique users in logs
        const uniqueUsers = new Set(res.data.map(l => l.user_name)).size;

        setKpis({
          totalLogs: res.pagination?.total || res.data.length,
          criticalCount: criticalActions,
          activeUsersCount: uniqueUsers || users.length,
          mostActiveModule: topModule
        });
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleClearFilters = () => {
    setSelectedModule('');
    setSelectedUser('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const getActionBadgeColor = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('VENTA_CREADA') || act.includes('CREAR') || act.includes('INSER')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('ANUL') || act.includes('ELIMIN') || act.includes('DELETE') || act.includes('BAJA')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('PASSWORD')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('CAJA') || act.includes('ARQUEO')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getModuleBadgeColor = (module) => {
    const mod = (module || '').toLowerCase();
    switch (mod) {
      case 'pos':
      case 'ventas':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cajas':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'inventario':
      case 'productos':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'usuarios':
      case 'auth':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pr-1">
      
      {/* Header Banner */}
      <div className="bg-[#2c3e50] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Auditoría y Bitácora del Sistema</h2>
            <p className="text-xs text-slate-300 font-semibold mt-0.5 uppercase tracking-wider">Control y monitoreo de acciones de usuarios</p>
          </div>
        </div>
        
        <div className="shrink-0 h-16 md:h-20 flex items-center justify-center z-10">
          <ShieldAlert className="h-16 w-16 text-white/10 absolute -right-3 -bottom-3 rotate-12" />
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total logs card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Acciones</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">{kpis.totalLogs}</p>
            <p className="text-[10px] font-medium text-slate-400">Eventos registrados</p>
          </div>
        </div>

        {/* Critical Alerts count card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Alertas Críticas</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">{kpis.criticalCount}</p>
            <p className="text-[10px] font-medium text-rose-600">Anulaciones y cierres</p>
          </div>
        </div>

        {/* Distinct active users count card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <User size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Usuarios Activos</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">{kpis.activeUsersCount}</p>
            <p className="text-[10px] font-medium text-emerald-600">Operando en el sistema</p>
          </div>
        </div>

        {/* Most active module card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Módulo más Activo</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight capitalize">{kpis.mostActiveModule}</p>
            <p className="text-[10px] font-medium text-amber-600">Mayor volumen de logs</p>
          </div>
        </div>

      </div>

      {/* Advanced Filters Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Filter size={14} /> Filtros de Auditoría
          </span>
          <button 
            onClick={handleClearFilters}
            className="text-[10px] font-bold text-primary hover:underline"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Action text Search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500">Acción (Filtro Texto)</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Ej. VENTA_CREADA..."
                className="input text-xs py-1.5 pl-8"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Module Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500">Módulo</label>
            <select
              className="input text-xs py-1.5"
              value={selectedModule}
              onChange={(e) => { setSelectedModule(e.target.value); setPage(1); }}
            >
              <option value="">Todos los módulos</option>
              {modules.map(mod => (
                <option key={mod} value={mod} className="capitalize">{mod}</option>
              ))}
            </select>
          </div>

          {/* User Select */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500">Usuario ejecutor</label>
            <select
              className="input text-xs py-1.5"
              value={selectedUser}
              onChange={(e) => { setSelectedUser(e.target.value); setPage(1); }}
            >
              <option value="">Todos los usuarios</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date"
                className="input text-xs py-1.5 pl-8"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="date"
                className="input text-xs py-1.5 pl-8"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bitacora Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Acción</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-3 text-center">Ref ID</th>
                <th className="py-3 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="animate-spin text-primary" size={20} />
                      <span>Cargando bitácora de auditoría...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield size={32} className="opacity-35 text-slate-400" />
                      <p className="font-bold text-slate-500">Ningún registro de auditoría coincide con los filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(log)}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {new Date(log.created_at).toLocaleString('es-DO', { 
                        day: '2-digit', month: '2-digit', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit', second: '2-digit' 
                      })}
                    </td>

                    {/* Executor User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center border">
                          {log.user_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{log.user_name}</p>
                          <p className="text-[9px] text-slate-400 font-mono">ID: {log.user_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${getModuleBadgeColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 font-medium text-slate-600 truncate max-w-xs" title={log.description}>
                      {log.description}
                    </td>

                    {/* Reference ID */}
                    <td className="py-3 px-3 text-center font-mono text-[10px] font-semibold text-slate-500">
                      {log.reference_id || '-'}
                    </td>

                    {/* Details action */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleRowClick(log)}
                        className="p-1 rounded-md text-slate-400 hover:text-primary hover:bg-primary-light transition-colors"
                        title="Inspeccionar detalle completo"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500 shrink-0">
          <div>
            Mostrando <span className="font-semibold text-slate-700">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> a{' '}
            <span className="font-semibold text-slate-700">{(page - 1) * limit + logs.length}</span> de{' '}
            <span className="font-semibold text-slate-700">{total}</span> registros
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all font-bold"
            >
              Anterior
            </button>

            <span className="font-bold text-slate-700">Pág. {page} de {totalPages}</span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all font-bold"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* INSPECT DETAIL MODAL */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle del Evento de Auditoría">
        {selectedLog && (
          <div className="flex flex-col gap-4 animate-fade-in text-slate-700">
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col gap-2.5">
              
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Módulo Afectado:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border capitalize ${getModuleBadgeColor(selectedLog.module)}`}>
                  {selectedLog.module}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Código de Acción:</span>
                <span className="font-mono font-bold text-slate-800">{selectedLog.action}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Ejecutado por:</span>
                <span className="font-bold text-slate-800">{selectedLog.user_name} (ID: {selectedLog.user_id})</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500">Fecha y Hora exacta:</span>
                <span className="font-mono text-slate-600">
                  {new Date(selectedLog.created_at).toLocaleString('es-DO', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </span>
              </div>

              {selectedLog.reference_id && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">ID de Referencia:</span>
                  <span className="font-mono font-bold text-primary">#{selectedLog.reference_id}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <h4 className="text-xs font-bold text-slate-600">Descripción detallada:</h4>
              <div className="bg-white border rounded-lg p-3 text-xs leading-relaxed text-slate-700 shadow-2xs font-semibold">
                {selectedLog.description}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <h4 className="text-xs font-bold text-slate-600">Metadatos de Seguimiento (Auditoría):</h4>
              <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-3 rounded-lg overflow-x-auto flex flex-col gap-1 leading-normal select-all">
                <p><span className="text-emerald-400">HOST:</span> localhost:3001</p>
                <p><span className="text-emerald-400">USER_AGENT:</span> Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36</p>
                <p><span className="text-emerald-400">PLATFORM:</span> Windows 11 Desktop Client</p>
                <p><span className="text-emerald-400">IP:</span> 127.0.0.1</p>
                <p><span className="text-emerald-400">INTEGRITY_HASH:</span> {btoa(JSON.stringify(selectedLog)).substring(0, 32)}</p>
              </div>
            </div>

            <button 
              onClick={() => setIsDetailOpen(false)}
              className="btn btn-primary w-full py-2.5 text-xs font-bold mt-2"
            >
              Cerrar Inspección
            </button>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Auditoria;
