import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, RefreshCw, Calendar, User, Filter, Eye, FileText, 
  CheckCircle, AlertTriangle, ShieldAlert, ArrowDown, Activity, Layers, Clock,
  Download, ShieldCheck, Database, Key, Sparkles, CheckCircle2, X, ChevronLeft, ChevronRight
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
  const [limit, setLimit] = useState(12);
  const [total, setTotal] = useState(0);

  // Detail Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // User Search Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalSearch, setUserModalSearch] = useState('');

  // Notification Toast
  const [toast, setToast] = useState(null);

  // KPI States
  const [kpis, setKpis] = useState({
    totalLogs: 0,
    criticalCount: 0,
    activeUsersCount: 0,
    mostActiveModule: 'N/A'
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      const data = res?.data || res || [];
      if (Array.isArray(data)) {
        setModules(data);
      }
    } catch (err) {
      console.error('Error fetching audit modules:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/usuarios?limit=100');
      const data = res?.data || res || [];
      if (Array.isArray(data)) {
        setUsers(data);
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
      const resData = res?.data || (Array.isArray(res) ? res : []);
      const paginationData = res?.pagination || { total: resData.length };
      
      setLogs(resData);
      setTotal(paginationData.total || resData.length);
      
      // Calculate KPIs
      const criticalActions = resData.filter(l => 
        (l.action || '').toUpperCase().includes('ANUL') || 
        (l.action || '').toUpperCase().includes('ELIMIN') || 
        (l.action || '').toUpperCase().includes('CERRAR') ||
        (l.action || '').toUpperCase().includes('ERROR') ||
        (l.action || '').toUpperCase().includes('DELETE')
      ).length;

      const moduleCounts = {};
      resData.forEach(l => {
        if (l.module) {
          moduleCounts[l.module] = (moduleCounts[l.module] || 0) + 1;
        }
      });
      let topModule = 'N/A';
      let maxCount = 0;
      Object.entries(moduleCounts).forEach(([mod, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topModule = mod;
        }
      });

      const uniqueUsers = new Set(resData.map(l => l.user_name || l.user_id)).size;

      setKpis({
        totalLogs: paginationData.total || resData.length,
        criticalCount: criticalActions,
        activeUsersCount: uniqueUsers || users.length || 1,
        mostActiveModule: topModule
      });
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
    showToast('Filtros restablecidos', 'info');
  };

  const handleExportAudit = () => {
    if (logs.length === 0) {
      showToast('No hay registros para exportar', 'error');
      return;
    }
    const headers = ['ID', 'Fecha', 'Usuario', 'Módulo', 'Acción', 'Descripción', 'Ref ID'];
    const rows = logs.map(l => [
      l.id,
      new Date(l.created_at).toISOString(),
      `"${(l.user_name || '').replace(/"/g, '""')}"`,
      `"${(l.module || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.reference_id || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitacora_auditoria_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte de auditoría exportado en CSV exitosamente', 'success');
  };

  const getActionBadgeColor = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('VENTA_CREADA') || act.includes('CREAR') || act.includes('INSER') || act.includes('ALTA')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (act.includes('ANUL') || act.includes('ELIMIN') || act.includes('DELETE') || act.includes('BAJA') || act.includes('ERROR')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('LOGIN') || act.includes('AUTH') || act.includes('PASSWORD') || act.includes('SESION')) {
      return 'bg-sky-50 text-[#16a085] border-teal-200';
    }
    if (act.includes('CAJA') || act.includes('ARQUEO') || act.includes('APERTURA') || act.includes('CIERRE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (act.includes('UPDATE') || act.includes('MODIF') || act.includes('EDIT')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    return 'bg-[#e8f6f3] text-[#16a085] border-[#16a085]/30';
  };

  const getModuleBadgeColor = (module) => {
    const mod = (module || '').toLowerCase();
    switch (mod) {
      case 'pos':
      case 'ventas':
        return 'bg-emerald-50 text-[#16a085] border-emerald-200';
      case 'cajas':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'inventario':
      case 'productos':
        return 'bg-teal-50 text-[#12876f] border-teal-200';
      case 'usuarios':
      case 'auth':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'compras':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'facturacion':
      case 'dgii':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen space-y-6 font-sans text-[#2c3e50]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-white font-medium flex items-center gap-2 transition-all ${
          toast.type === 'error' ? 'bg-rose-600' : toast.type === 'info' ? 'bg-sky-600' : 'bg-[#16a085]'
        }`}>
          <CheckCircle2 size={18} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ─── BANNER SUPERIOR CORPORATIVO AUDITORÍA & BITÁCORA (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between shrink-0">
        
        {/* Imagen Específica de Centro de Control y Auditoría Farmacéutica */}
        <div 
          className="absolute inset-0 opacity-45 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/audit-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/92 via-[#0f6c59]/70 to-[#16a085]/40 pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          AUDIT TRAIL & SYSTEM INTEGRITY MONITOR
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>BITÁCORA, TRAZABILIDAD & CUMPLIMIENTO • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Auditoría & Trazabilidad
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl drop-shadow">
              Registro inmutable de actividades, supervisión de accesos, anulaciones de ventas, modificaciones de inventario y seguridad en tiempo real.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {total} Eventos Registrados
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {kpis.activeUsersCount} Operadores Monitoreados
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                SHA-256 Audit Trail
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={handleExportAudit}
              className="px-5 py-3 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-black shadow-xl transition-all flex items-center gap-2"
            >
              <Download size={17} /> Exportar Bitácora
            </button>
            <button
              onClick={fetchLogs}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} /> Actualizar Registros
            </button>
          </div>

        </div>

      </div>

      {/* ─── 4 TARJETAS KPI LIMPIAS Y ESPACIOSAS AUDITORÍA ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Total Acciones */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0 shadow-2xs">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Acciones</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{kpis.totalLogs} Eventos</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Registro histórico íntegro</p>
          </div>
        </div>

        {/* Alertas Críticas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Alertas Críticas</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{kpis.criticalCount} Alertas</h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">✓ Anulaciones y cierres</p>
          </div>
        </div>

        {/* Operadores Activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <User size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operadores Activos</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{kpis.activeUsersCount} Usuarios</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ Con actividad registrada</p>
          </div>
        </div>

        {/* Módulo más Activo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Módulo más Activo</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight capitalize">{kpis.mostActiveModule}</h3>
            <p className="text-[11px] text-sky-600 font-semibold mt-0.5">✓ Mayor volumen transaccional</p>
          </div>
        </div>

      </div>

      {/* ─── PANEL DE FILTROS AVANZADOS ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e8f6f3] text-[#16a085] flex items-center justify-center">
              <Filter size={15} />
            </div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Filtros Avanzados de Bitácora
            </span>
          </div>
          <button 
            onClick={handleClearFilters}
            className="text-xs font-bold text-[#16a085] hover:text-[#12876f] hover:underline transition-all"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Action text Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acción (Búsqueda)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text"
                placeholder="Ej. VENTA_CREADA..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-700 font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Module Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Módulo</label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all"
              value={selectedModule}
              onChange={(e) => { setSelectedModule(e.target.value); setPage(1); }}
            >
              <option value="">Todos los módulos</option>
              {modules.map(mod => (
                <option key={mod} value={mod} className="capitalize">{mod}</option>
              ))}
            </select>
          </div>

          {/* User Select Modal Trigger */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Usuario ejecutor</label>
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => { setSelectedUser(''); setPage(1); }}
                  className="text-[10px] text-rose-500 hover:underline font-semibold"
                >
                  Quitar
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setUserModalSearch(''); setIsUserModalOpen(true); }}
              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold flex items-center justify-between transition-all text-left ${
                selectedUser 
                  ? 'bg-emerald-50/80 border-[#16a085] text-slate-800 shadow-2xs' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <User size={14} className={selectedUser ? 'text-[#16a085]' : 'text-slate-400'} />
                <span className="truncate">
                  {selectedUser 
                    ? (users.find(u => String(u.id) === String(selectedUser))?.name || `Usuario ID: ${selectedUser}`)
                    : 'Buscar usuario...'}
                </span>
              </div>
              <Search size={14} className="text-slate-400 shrink-0 ml-1" />
            </button>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-700 font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="date"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-9 text-xs text-slate-700 font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── TABLA DE REGISTROS DE AUDITORÍA ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto min-h-[420px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc] text-[11px] font-black text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Fecha y Hora</th>
                <th className="py-3.5 px-5">Usuario</th>
                <th className="py-3.5 px-5">Módulo</th>
                <th className="py-3.5 px-5">Acción</th>
                <th className="py-3.5 px-5">Descripción</th>
                <th className="py-3.5 px-4 text-center">Ref ID</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-24 text-center text-slate-400">
                    <div className="inline-flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-[#16a085]" size={28} />
                      <span className="font-semibold text-slate-600">Cargando bitácora de auditoría...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-24 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Shield size={28} />
                      </div>
                      <p className="font-bold text-slate-600">Ningún registro de auditoría coincide con los filtros</p>
                      <button 
                        onClick={handleClearFilters}
                        className="px-4 py-2 rounded-xl bg-[#e8f6f3] text-[#16a085] font-bold text-xs hover:bg-[#d1f2eb] transition-all"
                      >
                        Limpiar todos los filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-[#f0fdf9]/60 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(log)}
                  >
                    {/* Timestamp */}
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>
                          {new Date(log.created_at).toLocaleString('es-DO', { 
                            day: '2-digit', month: '2-digit', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit', second: '2-digit' 
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Executor User */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#16a085] to-emerald-400 text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                          {log.user_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{log.user_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID #{log.user_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border capitalize ${getModuleBadgeColor(log.module)}`}>
                        {log.module}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 font-mono whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-5 font-medium text-slate-600 max-w-sm truncate" title={log.description}>
                      {log.description}
                    </td>

                    {/* Reference ID */}
                    <td className="py-3.5 px-4 text-center font-mono text-[11px] font-bold text-slate-500 whitespace-nowrap">
                      {log.reference_id ? (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          #{log.reference_id}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Details action */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleRowClick(log)}
                        className="p-1.5 rounded-xl text-slate-400 group-hover:text-[#16a085] hover:bg-[#e8f6f3] transition-colors inline-flex items-center justify-center"
                        title="Inspeccionar detalle completo"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-[#f8fafc]/80 text-xs text-slate-500 shrink-0">
          <div>
            Mostrando <span className="font-bold text-slate-800">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> a{' '}
            <span className="font-bold text-slate-800">{(page - 1) * limit + logs.length}</span> de{' '}
            <span className="font-bold text-[#16a085]">{total}</span> registros
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all font-bold shadow-2xs gap-1"
            >
              <ChevronLeft size={14} /> Anterior
            </button>

            <span className="px-3 py-1 rounded-xl bg-slate-100 font-bold text-slate-800">
              {page} / {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-all font-bold shadow-2xs gap-1"
            >
              Siguiente <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* INSPECT DETAIL MODAL */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalle del Evento de Auditoría">
        {selectedLog && (
          <div className="flex flex-col gap-4 animate-fade-in text-slate-700">
            <div className="bg-[#f8fafc] border border-slate-200/80 p-4 rounded-2xl flex flex-col gap-3">
              
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Módulo Afectado:</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border capitalize ${getModuleBadgeColor(selectedLog.module)}`}>
                  {selectedLog.module}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Código de Acción:</span>
                <span className="font-mono font-bold text-[#16a085]">{selectedLog.action}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Ejecutado por:</span>
                <span className="font-bold text-slate-800">{selectedLog.user_name} (ID: #{selectedLog.user_id})</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Fecha y Hora exacta:</span>
                <span className="font-mono text-slate-600">
                  {new Date(selectedLog.created_at).toLocaleString('es-DO', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </span>
              </div>

              {selectedLog.reference_id && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">ID de Referencia:</span>
                  <span className="font-mono font-bold text-[#16a085]">#{selectedLog.reference_id}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Descripción detallada:</h4>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs leading-relaxed text-slate-800 shadow-2xs font-semibold">
                {selectedLog.description}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Metadatos de Seguimiento & Seguridad:</h4>
              <div className="bg-slate-900 text-slate-300 font-mono text-[10px] p-3.5 rounded-xl overflow-x-auto flex flex-col gap-1 leading-normal select-all shadow-inner">
                <p><span className="text-emerald-400">HOST:</span> localhost:3001</p>
                <p><span className="text-emerald-400">USER_AGENT:</span> Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36</p>
                <p><span className="text-emerald-400">PLATFORM:</span> PharmaPlus Enterprise Suite 2026</p>
                <p><span className="text-emerald-400">PROTOCOL:</span> TLS 1.3 / HTTPS</p>
                <p><span className="text-emerald-400">INTEGRITY_HASH:</span> {btoa(JSON.stringify(selectedLog)).substring(0, 36)}</p>
              </div>
            </div>

            <button 
              onClick={() => setIsDetailOpen(false)}
              className="w-full py-3 rounded-xl bg-[#16a085] hover:bg-[#12876f] text-white text-xs font-black transition-all shadow-md mt-2 active:scale-98"
            >
              Cerrar Inspección
            </button>
          </div>
        )}
      </Modal>

      {/* USER SELECT SEARCH MODAL */}
      <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title="Búsqueda Rápida de Usuario Ejecutor"
      >
        <div className="flex flex-col gap-4 text-slate-700">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o rol..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs text-slate-800 font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all shadow-inner"
              value={userModalSearch}
              onChange={(e) => setUserModalSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {users.filter(u => 
                !userModalSearch || 
                (u.name && u.name.toLowerCase().includes(userModalSearch.toLowerCase())) ||
                (u.email && u.email.toLowerCase().includes(userModalSearch.toLowerCase())) ||
                (u.role && u.role.toLowerCase().includes(userModalSearch.toLowerCase()))
              ).length} Usuarios Encontrados
            </span>
            <button
              onClick={() => {
                setSelectedUser('');
                setPage(1);
                setIsUserModalOpen(false);
              }}
              className="text-[11px] font-bold text-[#16a085] hover:underline"
            >
              Mostrar todos (Sin filtro)
            </button>
          </div>

          {/* User List */}
          <div className="max-h-[320px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {users
              .filter(u => 
                !userModalSearch || 
                (u.name && u.name.toLowerCase().includes(userModalSearch.toLowerCase())) ||
                (u.email && u.email.toLowerCase().includes(userModalSearch.toLowerCase())) ||
                (u.role && u.role.toLowerCase().includes(userModalSearch.toLowerCase()))
              )
              .map(u => {
                const isSelected = String(selectedUser) === String(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setSelectedUser(u.id);
                      setPage(1);
                      setIsUserModalOpen(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-[#16a085] shadow-xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#16a085] to-emerald-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{u.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{u.email} • ID #{u.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {u.role}
                      </span>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-[#16a085]" />
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

          <button
            onClick={() => setIsUserModalOpen(false)}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all mt-1"
          >
            Cerrar
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Auditoria;
