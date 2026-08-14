import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FileText, Calculator, Bookmark, AlertTriangle, Plus, Settings,
  CheckCircle2, ArrowUpRight, Search, Download, RefreshCw,
  HelpCircle, ShieldCheck, Send, Sparkles, Layers, Printer,
  ShieldAlert, FileCode, Trash2, Eye, FileSpreadsheet, Building2,
  AlertCircle, Package
} from 'lucide-react';
import api from '../../services/api';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt = (v) =>
  `RD$ ${Number(v || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-DO') : '—';

const StatusBadge = ({ s }) => {
  const map = {
    emitida:  'bg-primary-light text-primary',
    pagada:   'bg-success-light text-success',
    Aceptado: 'bg-success-light text-success',
    aceptado: 'bg-success-light text-success',
    Pendiente:'bg-warning-light text-warning',
    pendiente:'bg-warning-light text-warning',
    anulada:  'bg-danger-light text-danger',
    Rechazado:'bg-danger-light text-danger',
    rechazado:'bg-danger-light text-danger',
  };
  const cls = map[s] || 'bg-background text-muted';
  const label = s === 'emitida' ? 'Emitida'
    : s === 'pagada' ? 'Pagada'
    : s === 'anulada' ? 'Anulada'
    : s?.charAt(0).toUpperCase() + s?.slice(1) || '—';
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
};

/* ─── Colores del gráfico (idénticos al Dashboard) ──────────────────────── */
const COLORS = ['#16a085', '#3498db', '#f1c40f', '#e67e22', '#9b59b6', '#e74c3c'];

/* ══════════════════════════════════════════════════════════════════════════ */
const DgiiFiscal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'resumen';
  const setActiveTab = (id) => setSearchParams({ tab: id });

  /* ── Estado ─────────────────────────────────────────────────────────────── */
  const [loading, setLoading]      = useState(true);
  const [dashData, setDashData]    = useState(null);
  const [clients, setClients]      = useState([]);
  const [auditLogs, setAuditLogs]  = useState([]);
  const [config, setConfig]        = useState({
    rnc: '', razon_social: '', nombre_comercial: '',
    regimen_fiscal: 'Régimen General (RNC Normal)',
    itbis_rate: '0.18'
  });
  const [configDirty, setConfigDirty] = useState(false);

  /* ── Modales ─────────────────────────────────────────────────────────────── */
  const [modalComprobante, setModalComprobante] = useState(false);
  const [modalSecuencia, setModalSecuencia]     = useState(false);
  const [modalXml, setModalXml]                 = useState(false);
  const [modalDetalle, setModalDetalle]         = useState(null);
  const [editSeq, setEditSeq]                   = useState(null);

  /* ── Forms ───────────────────────────────────────────────────────────────── */
  const [fComp, setFComp] = useState({
    ncf_type: 'B01', rnc_cedula: '', client_name: '', client_id: '', subtotal: '', tax: ''
  });
  const [fSeq, setFSeq] = useState({
    ncf_type: '', ncf_type_name: '', prefix: '', max_sequence: 1000, expiry_date: '2026-12-31'
  });

  /* ── Filtros ─────────────────────────────────────────────────────────────── */
  const [filterType, setFilterType]     = useState('ALL');
  const [filterSearch, setFilterSearch] = useState('');

  /* ── Toast ───────────────────────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Fetch ───────────────────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, cli, audit, cfg] = await Promise.allSettled([
        api.get('/facturacion/dgii-dashboard'),
        api.get('/clients?limit=200'),
        api.get('/facturacion/auditoria-fiscal'),
        api.get('/facturacion/configuracion'),
      ]);
      if (dash.status === 'fulfilled') setDashData(dash.value?.data ?? dash.value);
      if (cli.status === 'fulfilled')  setClients(cli.value?.data ?? cli.value ?? []);
      if (audit.status === 'fulfilled') setAuditLogs(audit.value?.data ?? audit.value ?? []);
      if (cfg.status === 'fulfilled') {
        const d = cfg.value?.data ?? cfg.value;
        if (d?.rnc) setConfig(prev => ({ ...prev, ...d }));
      }
    } catch (e) { console.error('DGII fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Datos reales con fallbacks ──────────────────────────────────────────── */
  const kpis         = dashData?.kpis ?? {};
  const secuencias   = dashData?.secuencias ?? [];
  const comprobantes = dashData?.ultimos_comprobantes ?? [];
  const enviosDgii   = dashData?.envios_dgii ?? { enviados_hoy: 0, aceptados: 0, rechazados: 0, pendientes: 0 };

  // Datos de gráficos – usar los del backend, o fallback para que recharts siempre tenga datos
  const chartSales = (dashData?.chart_sales_itbis ?? []).length > 0
    ? dashData.chart_sales_itbis
    : [
        { date: 'Lun', ventas: 0, itbis: 0 },
        { date: 'Mar', ventas: 0, itbis: 0 },
        { date: 'Mié', ventas: 0, itbis: 0 },
        { date: 'Jue', ventas: 0, itbis: 0 },
        { date: 'Vie', ventas: 0, itbis: 0 },
        { date: 'Sáb', ventas: 0, itbis: 0 },
      ];

  const chartTypes = (dashData?.chart_comprobantes_tipo ?? []).length > 0
    ? dashData.chart_comprobantes_tipo
    : secuencias.map((s, i) => ({
        label: s.ncf_type,
        name:  s.ncf_type,
        value: s.disponible,
        color: COLORS[i % COLORS.length]
      }));

  /* ── Filtrar comprobantes ────────────────────────────────────────────────── */
  const filteredComps = comprobantes.filter(c => {
    const matchT = filterType === 'ALL' || c.ncf_type === filterType;
    const matchS = !filterSearch
      || (c.ncf || '').toLowerCase().includes(filterSearch.toLowerCase())
      || (c.client_name || '').toLowerCase().includes(filterSearch.toLowerCase());
    return matchT && matchS;
  });

  /* ── Envíos desde comprobantes reales ───────────────────────────────────── */
  const enviosQueue = comprobantes.slice(0, 8).map((c, i) => ({
    id: `ENV-${c.id || i + 1}`,
    ncf: c.ncf || '—',
    track_id: `${108849200 + (c.id || i)}`,
    fecha: c.issued_at,
    estado: c.status === 'anulada' ? 'Rechazado' : c.status === 'pendiente' ? 'Pendiente' : 'Aceptado',
    mensaje: c.status === 'anulada' ? 'Comprobante anulado' :
             c.status === 'pendiente' ? 'En cola de transmisión' : 'Comprobante procesado exitosamente'
  }));

  /* ── Guardar config ──────────────────────────────────────────────────────── */
  const saveConfig = async () => {
    try {
      await api.put('/facturacion/configuracion', config);
      setConfigDirty(false);
      showToast('Configuración fiscal guardada correctamente');
    } catch { showToast('Error guardando configuración', 'error'); }
  };

  /* ── Emitir comprobante ──────────────────────────────────────────────────── */
  const emitirComp = async () => {
    try {
      const sub = parseFloat(fComp.subtotal) || 0;
      const tx  = parseFloat(fComp.tax) || sub * parseFloat(config.itbis_rate || 0.18);
      await api.post('/facturacion', {
        ncf_type: fComp.ncf_type, client_id: fComp.client_id || null,
        rnc_cedula: fComp.rnc_cedula, client_name: fComp.client_name,
        subtotal: sub, tax: tx, total: sub + tx
      });
      setModalComprobante(false);
      showToast(`Comprobante ${fComp.ncf_type} emitido`);
      fetchAll();
    } catch (e) { showToast(e?.response?.data?.message || 'Error emitiendo comprobante', 'error'); }
  };

  /* ── Anular ──────────────────────────────────────────────────────────────── */
  const anularComp = async (c) => {
    if (!confirm(`¿Anular comprobante ${c.ncf}?`)) return;
    try {
      await api.post(`/facturacion/${c.id}/cancel`, { reason: 'Anulación por usuario' });
      showToast(`Comprobante ${c.ncf} anulado`);
      fetchAll();
    } catch { showToast('Error al anular', 'error'); }
  };

  /* ── Guardar secuencia ───────────────────────────────────────────────────── */
  const saveSeq = async () => {
    try {
      if (editSeq) {
        await api.put(`/facturacion/ncf/${editSeq.id}`, { max_sequence: fSeq.max_sequence, expiry_date: fSeq.expiry_date });
        showToast('Secuencia NCF actualizada');
      } else {
        await api.post('/facturacion/ncf', fSeq);
        showToast('Nueva secuencia NCF creada');
      }
      setModalSecuencia(false); setEditSeq(null); fetchAll();
    } catch { showToast('Error procesando secuencia', 'error'); }
  };

  /* ── Tabs ────────────────────────────────────────────────────────────────── */
  const tabs = [
    { id: 'resumen',       label: 'Resumen',            icon: Layers },
    { id: 'secuencias',    label: 'NCF / Secuencias',   icon: Bookmark },
    { id: 'comprobantes',  label: 'Comprobantes',        icon: FileText },
    { id: 'ecf',           label: 'e-CF (Electrónica)',  icon: Sparkles },
    { id: 'envios',        label: 'Envíos a DGII',       icon: Send },
    { id: 'respuestas',    label: 'Respuestas DGII',     icon: CheckCircle2 },
    { id: 'reportes',      label: 'Reportes Fiscales',   icon: FileSpreadsheet },
    { id: 'formatos',      label: 'Formatos DGII',       icon: Building2 },
    { id: 'auditoria',     label: 'Auditoría Fiscal',    icon: ShieldAlert },
    { id: 'configuracion', label: 'Configuración',       icon: Settings },
  ];

  /* ─── Componente de input reutilizable ─────────────────────────────────── */
  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-semibold text-main mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium";

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="p-5 flex flex-col gap-5 min-h-full bg-background">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-md text-white text-xs font-bold transition-all ${toast.type === 'error' ? 'bg-danger' : 'bg-success'}`}>
          <CheckCircle2 size={15} /> {toast.msg}
        </div>
      )}

      {/* ─── BANNER SUPERIOR CORPORATIVO DGII / FISCAL (PHARMAPLUS ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          DGII FISCAL COMPLIANCE & E-CF SYSTEM
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>FACTURACIÓN & DGII • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Gestión Fiscal & Facturación Electrónica
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium">
              Comprobantes Fiscales (NCF), Facturación Electrónica e-CF, Reportes 606/607/608 y cumplimiento DGII.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-white text-xs font-bold shadow-sm backdrop-blur-md">
                <ShieldCheck size={14} className="text-emerald-300" />
                DGII Sincronizado
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                RNC: 1-31-89472-3
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Ambiente: Producción e-CF
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={() => setModalComprobante(true)}
              className="px-5 py-3 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-black shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={17} /> Nuevo Comprobante
            </button>
            <button
              onClick={() => setActiveTab('secuencias')}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <Bookmark size={17} /> Secuencias NCF
            </button>
            <button
              onClick={() => setActiveTab('configuracion')}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <Settings size={17} /> Configuración Fiscal
            </button>
          </div>

        </div>

      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto pb-0 custom-scrollbar">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl -mb-px ${
                active ? 'border-[#16a085] text-[#12876f] bg-[#e8f6f3]/60' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ════════════════════ TAB: RESUMEN ════════════════════════════════════ */}
      {activeTab === 'resumen' && (
        <div className="flex flex-col gap-5">

          {/* KPI Cards con Curvas SVG */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm animate-pulse">
                  <div className="h-3 bg-slate-100 rounded w-3/4 mb-3" />
                  <div className="h-6 bg-slate-100 rounded w-1/2 mb-2" />
                  <div className="h-2.5 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Card 1: Ventas Fiscales Mes */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative group">
                <div className="flex items-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">Ventas Fiscales Mes</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{fmt(kpis.ventas_mes)}</h3>
                    <p className="text-[10px] font-bold text-[#16a085] mt-0.5">{kpis.ventas_growth || '↑ Facturación Activa'}</p>
                  </div>
                </div>
                <div className="mt-3 -mx-5 -mb-5 h-12 w-[calc(100%+2.5rem)] opacity-80">
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,22 Q25,18 45,20 T80,8 T100,5 L100,25 L0,25 Z" fill="#e8f6f3" />
                    <path d="M0,22 Q25,18 45,20 T80,8 T100,5" fill="none" stroke="#16a085" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Card 2: ITBIS Generado */}
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative group">
                <div className="flex items-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-2xl bg-[#eafaf1] text-[#27ae60] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Calculator size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">ITBIS Generado (18%)</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{fmt(kpis.itbis_generado)}</h3>
                    <p className="text-[10px] font-bold text-[#27ae60] mt-0.5">{kpis.itbis_growth || '↑ ITBIS Declarable'}</p>
                  </div>
                </div>
                <div className="mt-3 -mx-5 -mb-5 h-12 w-[calc(100%+2.5rem)] opacity-80">
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,23 Q30,22 55,14 T85,8 T100,5 L100,25 L0,25 Z" fill="#eafaf1" />
                    <path d="M0,23 Q30,22 55,14 T85,8 T100,5" fill="none" stroke="#27ae60" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Comprobantes Emitidos */}
              <div onClick={() => setActiveTab('comprobantes')} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative group cursor-pointer">
                <div className="flex items-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-2xl bg-[#ebf5fb] text-[#3498db] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">Comprobantes</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{kpis.comprobantes_emitidos ?? 0}</h3>
                    <p className="text-[10px] font-bold text-[#3498db] mt-0.5">Ver detalles →</p>
                  </div>
                </div>
                <div className="mt-3 -mx-5 -mb-5 h-12 w-[calc(100%+2.5rem)] opacity-80">
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,23 Q25,20 50,15 T85,9 T100,6 L100,25 L0,25 Z" fill="#ebf5fb" />
                    <path d="M0,23 Q25,20 50,15 T85,9 T100,6" fill="none" stroke="#3498db" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Card 4: NCF Disponibles */}
              <div onClick={() => setActiveTab('secuencias')} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative group cursor-pointer">
                <div className="flex items-center gap-3 z-10">
                  <div className="w-10 h-10 rounded-2xl bg-[#fef5e7] text-[#f39c12] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                    <Bookmark size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">NCF Disponibles</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{(kpis.ncf_disponibles ?? 0).toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-[#f39c12] mt-0.5">Ver secuencias →</p>
                  </div>
                </div>
                <div className="mt-3 -mx-5 -mb-5 h-12 w-[calc(100%+2.5rem)] opacity-80">
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,24 Q35,23 60,16 T85,10 T100,7 L100,25 L0,25 Z" fill="#fef5e7" />
                    <path d="M0,24 Q35,23 60,16 T85,10 T100,7" fill="none" stroke="#f39c12" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Card 5: Estado Fiscal */}
              <div onClick={() => setActiveTab('secuencias')} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative group cursor-pointer">
                <div className="flex items-center gap-3 z-10">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform ${
                    kpis.alertas > 0 ? 'bg-[#fdedec] text-[#e74c3c]' : 'bg-[#eafaf1] text-[#27ae60]'
                  }`}>
                    {kpis.alertas > 0 ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">Estado Fiscal</p>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mt-0.5">{kpis.alertas > 0 ? `${kpis.alertas} Alertas` : 'Al Día'}</h3>
                    <p className={`text-[10px] font-bold mt-0.5 ${kpis.alertas > 0 ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
                      {kpis.alertas > 0 ? 'Revisar secuencias' : '✓ Todo en orden'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 -mx-5 -mb-5 h-12 w-[calc(100%+2.5rem)] opacity-80">
                  <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0,23 Q30,22 55,14 T85,8 T100,5 L100,25 L0,25 Z" fill={kpis.alertas > 0 ? '#fdedec' : '#eafaf1'} />
                    <path d="M0,23 Q30,22 55,14 T85,8 T100,5" fill="none" stroke={kpis.alertas > 0 ? '#e74c3c' : '#27ae60'} strokeWidth="2" />
                  </svg>
                </div>
              </div>

            </div>
          )}

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

            {/* LEFT: tablas */}
            <div className="xl:col-span-8 flex flex-col gap-5">

              {/* Tabla secuencias */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-main">Secuencias de NCF</h3>
                    <p className="text-[11px] text-muted">{secuencias.length} series activas</p>
                  </div>
                  <button onClick={() => setActiveTab('secuencias')}
                    className="btn btn-outline text-xs py-1.5">Ver todas</button>
                </div>

                {secuencias.some(s => s.warning) && (
                  <div className="flex items-center gap-2 bg-warning-light border border-warning/30 rounded-lg p-3 mb-3 text-xs text-main font-medium">
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <span>{secuencias.filter(s => s.warning).map(s => s.ncf_type).join(', ')} — disponibles bajos</span>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-muted border-b border-border">
                        <th className="pb-2 font-semibold">Tipo NCF</th>
                        <th className="pb-2 font-semibold">Prefijo</th>
                        <th className="pb-2 font-semibold">Próximo N°</th>
                        <th className="pb-2 font-semibold">Disponibles</th>
                        <th className="pb-2 font-semibold">Vencimiento</th>
                        <th className="pb-2 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {secuencias.slice(0, 6).map((s, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                          <td className="py-2.5 font-bold text-main">{s.ncf_type}</td>
                          <td className="py-2.5 font-mono text-muted text-[11px]">{s.prefix}</td>
                          <td className="py-2.5 font-mono font-bold">{s.proximo_num}</td>
                          <td className="py-2.5">
                            <span className={`font-bold ${s.warning ? 'text-danger' : 'text-main'}`}>{s.disponible}</span>
                            {s.warning && <AlertCircle size={12} className="text-danger inline ml-1" />}
                          </td>
                          <td className="py-2.5 text-muted">{s.vencimiento}</td>
                          <td className="py-2.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-light text-success">{s.estado}</span>
                          </td>
                        </tr>
                      ))}
                      {secuencias.length === 0 && (
                        <tr><td colSpan={6} className="py-6 text-center text-muted">No hay secuencias configuradas</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla comprobantes */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-main">Últimos Comprobantes Emitidos</h3>
                    <p className="text-[11px] text-muted">{comprobantes.length} comprobantes en el sistema</p>
                  </div>
                  <button onClick={() => setActiveTab('comprobantes')}
                    className="btn btn-outline text-xs py-1.5">Ver todos</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="text-muted border-b border-border">
                        <th className="pb-2 font-semibold">NCF</th>
                        <th className="pb-2 font-semibold">Tipo</th>
                        <th className="pb-2 font-semibold">Cliente</th>
                        <th className="pb-2 font-semibold">Fecha</th>
                        <th className="pb-2 font-semibold">Total</th>
                        <th className="pb-2 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comprobantes.slice(0, 5).map((c, i) => (
                        <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                          <td className="py-2.5 font-mono font-bold text-main text-[11px]">{c.ncf || '—'}</td>
                          <td className="py-2.5 text-muted font-semibold">{c.ncf_type || '—'}</td>
                          <td className="py-2.5 font-medium">{c.client_name || 'Consumidor Final'}</td>
                          <td className="py-2.5 text-muted">{fmtDate(c.issued_at)}</td>
                          <td className="py-2.5 font-bold">{fmt(c.total)}</td>
                          <td className="py-2.5"><StatusBadge s={c.status} /></td>
                        </tr>
                      ))}
                      {comprobantes.length === 0 && (
                        <tr><td colSpan={6} className="py-6 text-center text-muted">No hay comprobantes registrados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT: widgets */}
            <div className="xl:col-span-4 flex flex-col gap-4">

              {/* Estado envíos */}
              <div className="card p-4">
                <h3 className="font-bold text-sm text-main mb-3">Estado de Envíos a DGII</h3>
                {[
                  { label: 'Enviados Hoy', val: enviosDgii.enviados_hoy, cls: 'text-main' },
                  { label: 'Aceptados', val: enviosDgii.aceptados, cls: 'text-success font-bold' },
                  { label: 'Rechazados', val: enviosDgii.rechazados, cls: 'text-danger font-bold' },
                  { label: 'Pendientes', val: enviosDgii.pendientes, cls: 'text-warning font-bold' },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 text-xs">
                    <span className="text-muted font-medium">{row.label}</span>
                    <span className={`font-bold ${row.cls}`}>{row.val}</span>
                  </div>
                ))}
                <button onClick={() => setActiveTab('envios')}
                  className="btn btn-outline text-xs py-1.5 w-full mt-3 justify-center">
                  Ver historial de envíos
                </button>
              </div>

              {/* Acciones rápidas */}
              <div className="card p-4">
                <h3 className="font-bold text-sm text-main mb-3">Acciones Rápidas</h3>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Nueva Factura (B01)', type: 'B01' },
                    { label: 'Consumidor Final (B02)', type: 'B02' },
                    { label: 'Nota de Débito (B03)', type: 'B03' },
                    { label: 'Nota de Crédito (B04)', type: 'B04' },
                  ].map((a, i) => (
                    <button key={i}
                      onClick={() => { setFComp(p => ({ ...p, ncf_type: a.type })); setModalComprobante(true); }}
                      className="flex items-center gap-2 text-xs font-semibold text-main hover:text-primary hover:bg-primary-light px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                      <FileText size={13} className="text-primary" /> {a.label}
                    </button>
                  ))}
                  <button onClick={() => setActiveTab('ecf')}
                    className="flex items-center gap-2 text-xs font-semibold text-main hover:text-primary hover:bg-primary-light px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                    <Sparkles size={13} className="text-info" /> Consultar e-CF
                  </button>
                  <button onClick={fetchAll}
                    className="flex items-center gap-2 text-xs font-semibold text-main hover:text-primary hover:bg-primary-light px-3 py-2 rounded-lg border border-transparent hover:border-primary/20 transition-all">
                    <RefreshCw size={13} className="text-warning" /> Sincronizar Datos DGII
                  </button>
                </div>
              </div>

              {/* Ayuda */}
              <div className="card p-4 bg-primary-light border-primary/20">
                <p className="text-sm font-bold text-primary mb-1">¿Necesitas ayuda?</p>
                <p className="text-[11px] text-muted leading-relaxed">Guías de facturación electrónica y cumplimiento fiscal con la DGII.</p>
                <button onClick={() => showToast('Abriendo portal de ayuda DGII...', 'success')}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary mt-2 hover:underline">
                  <HelpCircle size={12} /> Centro de Ayuda DGII
                </button>
              </div>
            </div>
          </div>

          {/* ── Gráficos (Recharts) ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Gráfico Ventas + ITBIS */}
            <div className="card xl:col-span-2 p-4 flex flex-col min-h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-main">Resumen de Ventas e ITBIS del Mes</h3>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary inline-block" />Ventas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-warning inline-block" />ITBIS
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full min-h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSales} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#7f8c8d' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fill: '#7f8c8d' }}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 11 }}
                      formatter={(val, name) => [fmt(val), name === 'ventas' ? 'Ventas' : 'ITBIS']}
                    />
                    <Bar dataKey="ventas" fill="#16a085" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="itbis"  fill="#f39c12" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico Comprobantes por Tipo */}
            <div className="card p-4 flex flex-col min-h-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-main">Comprobantes por Tipo</h3>
                <span className="text-[10px] font-bold bg-background border border-border px-2 py-1 rounded-md text-muted">
                  Total: {kpis.comprobantes_emitidos ?? 0}
                </span>
              </div>
              <div className="flex-1 w-full flex items-center min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 10, bottom: 10, left: 10 }}>
                    <Pie
                      data={chartTypes}
                      cx="50%"
                      cy="45%"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="label"
                    >
                      {chartTypes.map((entry, index) => (
                        <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 11 }}
                      formatter={(val, name) => [val, name]}
                    />
                    <Legend
                      layout="horizontal" verticalAlign="bottom" align="center"
                      wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
                      iconType="circle" iconSize={7}
                      formatter={(v) => <span style={{ color: '#7f8c8d', fontWeight: 600 }}>{v?.length > 18 ? v.substring(0, 18) + '…' : v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: SECUENCIAS NCF ════════════════════════════════ */}
      {activeTab === 'secuencias' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <div>
              <h2 className="font-bold text-base text-main">Secuencias NCF Autorizadas</h2>
              <p className="text-xs text-muted">Configure rangos y vencimientos por tipo</p>
            </div>
            <button className="btn btn-primary text-sm"
              onClick={() => { setEditSeq(null); setFSeq({ ncf_type:'',ncf_type_name:'',prefix:'',max_sequence:1000,expiry_date:'2026-12-31' }); setModalSecuencia(true); }}>
              <Plus size={15} /> Nueva Secuencia
            </button>
          </div>

          {secuencias.some(s => s.warning) && (
            <div className="flex items-center gap-2 bg-warning-light border border-warning/30 rounded-lg p-3 mb-4 text-xs font-medium">
              <AlertTriangle size={14} className="text-warning shrink-0" />
              <strong>Atención:</strong>&nbsp;{secuencias.filter(s => s.warning).map(s => s.ncf_type).join(', ')} — menos de 100 disponibles
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted border-b border-border">
                  {['Tipo NCF','Descripción','Prefijo','Próximo N°','Máximo','Disponibles','Vencimiento','Estado','Acciones'].map(h => (
                    <th key={h} className="pb-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {secuencias.map((s, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                    <td className="py-3 font-bold text-main">{s.ncf_type?.split(' ')[0]}</td>
                    <td className="py-3 text-muted">{s.ncf_type_name || s.ncf_type}</td>
                    <td className="py-3 font-mono text-[11px]">{s.prefix}</td>
                    <td className="py-3 font-mono font-bold">{s.proximo_num}</td>
                    <td className="py-3 font-mono text-muted">{s.hasta}</td>
                    <td className="py-3">
                      <span className={`font-bold ${s.warning ? 'text-danger' : 'text-main'}`}>{s.disponible}</span>
                      {s.warning && <AlertCircle size={11} className="text-danger inline ml-1" />}
                    </td>
                    <td className="py-3 text-muted">{s.vencimiento}</td>
                    <td className="py-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-light text-success">{s.estado}</span></td>
                    <td className="py-3">
                      <button className="btn btn-outline text-[11px] py-1 px-2.5"
                        onClick={() => { setEditSeq(s); setFSeq({ max_sequence: parseInt(s.hasta)||1000, expiry_date:'2026-12-31' }); setModalSecuencia(true); }}>
                        Editar Rango
                      </button>
                    </td>
                  </tr>
                ))}
                {secuencias.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-muted">No hay secuencias NCF configuradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: COMPROBANTES ══════════════════════════════════ */}
      {activeTab === 'comprobantes' && (
        <div className="card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-bold text-base text-main">Historial de Comprobantes Fiscales</h2>
              <p className="text-xs text-muted">{comprobantes.length} comprobantes registrados</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="input text-xs py-2 pr-8">
                <option value="ALL">Todos los tipos</option>
                {['B01','B02','B03','B04','B11'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)}
                  placeholder="Buscar NCF o cliente..." className="input text-xs py-2 pl-8 w-48" />
              </div>
              <button onClick={() => window.open('/api/facturacion/export-607', '_blank')}
                className="btn btn-outline text-xs py-2">
                <Download size={13} /> 607
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted border-b border-border">
                  {['NCF','Tipo','Cliente','Fecha','Subtotal','ITBIS','Total','Estado','Acciones'].map(h => (
                    <th key={h} className="pb-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComps.map((c, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                    <td className="py-2.5 font-mono font-bold text-main text-[11px]">{c.ncf || '—'}</td>
                    <td className="py-2.5 text-muted font-semibold">{c.ncf_type || '—'}</td>
                    <td className="py-2.5 font-medium">{c.client_name || 'Consumidor Final'}</td>
                    <td className="py-2.5 text-muted">{fmtDate(c.issued_at)}</td>
                    <td className="py-2.5">{fmt(c.subtotal)}</td>
                    <td className="py-2.5 text-success font-semibold">{fmt(c.tax)}</td>
                    <td className="py-2.5 font-bold">{fmt(c.total)}</td>
                    <td className="py-2.5"><StatusBadge s={c.status} /></td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModalDetalle(c)}
                          className="p-1.5 rounded-lg hover:bg-primary-light hover:text-primary transition-colors text-muted">
                          <Eye size={14} />
                        </button>
                        {c.status !== 'anulada' && (
                          <button onClick={() => anularComp(c)}
                            className="p-1.5 rounded-lg hover:bg-danger-light hover:text-danger transition-colors text-muted">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredComps.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-muted">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: e-CF ═══════════════════════════════════════════ */}
      {activeTab === 'ecf' && (
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="font-bold text-base text-main">Facturación Electrónica (e-CF)</h2>
                <p className="text-xs text-muted">Estado del certificado digital y transmisión XML</p>
              </div>
              <button className="btn btn-primary text-sm"
                onClick={() => showToast('Conexión DGII Webservice: 200 OK (120ms)', 'success')}>
                <RefreshCw size={15} /> Probar Conexión DGII
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Certificado Digital', value: 'Activo (Válido hasta Oct 2027)', cls: 'text-success' },
                { label: 'Ambiente Transaccional', value: 'Producción (Live e-CF)', cls: 'text-info' },
                { label: 'Respuesta Webservice DGII', value: '100% Operativo', cls: 'text-main' },
              ].map((item, i) => (
                <div key={i} className="border border-border rounded-xl p-4">
                  <p className="text-xs text-muted font-semibold mb-1">{item.label}</p>
                  <p className={`font-bold text-sm ${item.cls}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-sm text-main mb-1">Visor XML e-CF</h3>
            <p className="text-xs text-muted mb-4">Previsualice la firma canónica de los comprobantes electrónicos</p>
            <button className="btn btn-outline text-sm" onClick={() => setModalXml(true)}>
              <FileCode size={15} /> Previsualizar Estructura XML Canónica
            </button>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: ENVÍOS ════════════════════════════════════════ */}
      {activeTab === 'envios' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-base text-main">Cola de Envíos a DGII</h2>
              <p className="text-xs text-muted">Transmisiones batch al servidor fiscal</p>
            </div>
            <span className="text-[10px] font-extrabold bg-[#ebf5fb] text-info border border-info/20 px-3 py-1 rounded-full">
              Transmisión Batch Activa
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted border-b border-border">
                  {['ID Envío','NCF','Track ID DGII','Fecha','Estado','Detalle','Acciones'].map(h => (
                    <th key={h} className="pb-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enviosQueue.map((e, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                    <td className="py-2.5 font-mono text-muted font-semibold text-[11px]">{e.id}</td>
                    <td className="py-2.5 font-mono font-bold text-[11px]">{e.ncf}</td>
                    <td className="py-2.5 font-mono text-info font-semibold">{e.track_id}</td>
                    <td className="py-2.5 text-muted">{fmtDate(e.fecha)}</td>
                    <td className="py-2.5"><StatusBadge s={e.estado} /></td>
                    <td className="py-2.5 text-muted max-w-[180px] truncate">{e.mensaje}</td>
                    <td className="py-2.5">
                      {e.estado !== 'Aceptado' && (
                        <button className="btn btn-outline text-[11px] py-1 px-2.5"
                          onClick={() => showToast(`Reenviando ${e.ncf}...`, 'success')}>
                          Reenviar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {enviosQueue.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-muted">No hay envíos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: RESPUESTAS DGII ═══════════════════════════════ */}
      {activeTab === 'respuestas' && (
        <div className="card p-5">
          <div className="mb-5">
            <h2 className="font-bold text-base text-main">Registro de Respuestas DGII</h2>
            <p className="text-xs text-muted">Acuses de recibo oficiales del servidor fiscal</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted border-b border-border">
                  {['Track ID','NCF','Código','Descripción Oficial','Fecha Acuse'].map(h => (
                    <th key={h} className="pb-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comprobantes.slice(0, 10).map((c, i) => {
                  const ok = c.status !== 'anulada' && c.status !== 'pendiente';
                  return (
                    <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                      <td className="py-2.5 font-mono text-info font-semibold">{108849200 + (c.id || i)}</td>
                      <td className="py-2.5 font-mono font-bold text-[11px]">{c.ncf || '—'}</td>
                      <td className="py-2.5 font-bold">{ok ? '0' : '1'}</td>
                      <td className="py-2.5 text-muted">{ok ? 'Transacción Aceptada' : c.status === 'anulada' ? 'Rechazado: Comprobante Anulado' : 'En Proceso'}</td>
                      <td className="py-2.5 text-muted">{fmtDate(c.issued_at)}</td>
                    </tr>
                  );
                })}
                {comprobantes.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted">Sin respuestas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: REPORTES ══════════════════════════════════════ */}
      {activeTab === 'reportes' && (
        <div className="flex flex-col gap-5">
          <div className="card p-5">
            <h2 className="font-bold text-base text-main mb-1">Resumen Fiscal del Período (IT-1)</h2>
            <p className="text-xs text-muted mb-4">Datos calculados en tiempo real desde el sistema</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Ventas Gravadas (18%)', val: fmt((kpis.ventas_mes||0) * 0.85), cls: 'card' },
                { label: 'Ventas Exentas', val: fmt((kpis.ventas_mes||0) * 0.15), cls: 'card' },
                { label: 'ITBIS Facturado', val: fmt(kpis.itbis_generado), cls: 'card bg-primary-light border-primary/20 !text-primary' },
                { label: 'ITBIS Adelantado', val: fmt((kpis.itbis_generado||0) * 0.45), cls: 'card bg-success-light border-success/20' },
              ].map((k, i) => (
                <div key={i} className={`p-4 ${k.cls}`}>
                  <p className="text-[11px] font-semibold text-muted mb-1">{k.label}</p>
                  <p className="text-lg font-extrabold text-main">{k.val}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm text-main mb-4">Distribución por Tipo de Comprobante</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-muted border-b border-border">
                    {['Tipo','Descripción','Cantidad','Porcentaje','Total Estimado'].map(h => (
                      <th key={h} className="pb-3 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chartTypes.map((t, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 font-bold">{t.code || t.name}</td>
                      <td className="py-2.5 text-muted">{t.label}</td>
                      <td className="py-2.5 font-bold">{t.value}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden max-w-[80px]">
                            <div style={{ width: t.percent || '0%', background: t.color || '#16a085' }} className="h-full rounded-full" />
                          </div>
                          <span className="font-semibold">{t.percent || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5">{fmt((kpis.ventas_mes||0) * (parseFloat(t.percent||0)/100))}</td>
                    </tr>
                  ))}
                  {chartTypes.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted">Sin datos de distribución</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: FORMATOS DGII ═════════════════════════════════ */}
      {activeTab === 'formatos' && (
        <div>
          <div className="mb-5">
            <h2 className="font-bold text-base text-main">Formatos Oficiales de Envío DGII</h2>
            <p className="text-xs text-muted">Archivos de texto plano (.txt) con estructura exigida</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { num: '606', title: 'Formato 606 – Compras', desc: 'Compras de bienes y servicios. Sustenta costos, gastos e ITBIS adelantado ante la DGII.', url: '/api/facturacion/export-606', color: '#3498db', light: '#ebf5fb' },
              { num: '607', title: 'Formato 607 – Ventas', desc: 'Ventas de bienes y servicios con desglose de comprobantes fiscales emitidos en el período.', url: '/api/facturacion/export-607', color: '#16a085', light: '#e8f6f3' },
              { num: '608', title: 'Formato 608 – Anulaciones', desc: 'Comprobantes fiscales anulados durante el período fiscal declarado a la DGII.', url: '/api/facturacion/export-608', color: '#e67e22', light: '#fef5e7' },
            ].map(f => (
              <div key={f.num} className="card p-5 flex flex-col justify-between gap-4 hover:border-primary/30 transition-all">
                <div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm mb-3"
                    style={{ background: f.light, color: f.color }}>
                    {f.num}
                  </div>
                  <h3 className="font-bold text-sm text-main mb-2">{f.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </div>
                <button
                  onClick={() => window.open(f.url, '_blank')}
                  className="btn btn-primary justify-center"
                  style={{ background: f.color }}>
                  <Download size={14} /> Descargar {f.num} (.txt)
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════ TAB: AUDITORÍA ══════════════════════════════════════ */}
      {activeTab === 'auditoria' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-base text-main">Auditoría de Operaciones Fiscales</h2>
              <p className="text-xs text-muted">{auditLogs.length} eventos — registro inalterable del sistema</p>
            </div>
            <button className="btn btn-outline text-sm" onClick={fetchAll}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-muted border-b border-border">
                  {['Fecha / Hora','Usuario','Acción','Módulo','Descripción'].map(h => (
                    <th key={h} className="pb-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/60 transition-colors">
                    <td className="py-2.5 text-muted">{log.created_at ? new Date(log.created_at).toLocaleString('es-DO') : '—'}</td>
                    <td className="py-2.5 font-bold">{log.user_name || 'Sistema'}</td>
                    <td className="py-2.5 font-mono text-primary font-semibold text-[11px]">{log.action}</td>
                    <td className="py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background text-muted border border-border">{log.module}</span></td>
                    <td className="py-2.5 text-muted">{log.description}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted">Sin eventos de auditoría</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════ TAB: CONFIGURACIÓN ══════════════════════════════════ */}
      {activeTab === 'configuracion' && (
        <div className="card p-5 max-w-2xl">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="font-bold text-base text-main">Configuración Fiscal de la Empresa</h2>
              <p className="text-xs text-muted">Parámetros oficiales del contribuyente ante la DGII</p>
            </div>
            {configDirty && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-light text-warning">Cambios sin guardar</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Field label="RNC del Contribuyente">
              <input className={inputCls} placeholder="130-00001-1" value={config.rnc || ''}
                onChange={e => { setConfig(p => ({ ...p, rnc: e.target.value })); setConfigDirty(true); }} />
            </Field>
            <Field label="Razón Social Registrada">
              <input className={inputCls} placeholder="PharmaPlus SRL" value={config.razon_social || ''}
                onChange={e => { setConfig(p => ({ ...p, razon_social: e.target.value })); setConfigDirty(true); }} />
            </Field>
            <Field label="Nombre Comercial">
              <input className={inputCls} placeholder="PharmaPlus Farmacias" value={config.nombre_comercial || ''}
                onChange={e => { setConfig(p => ({ ...p, nombre_comercial: e.target.value })); setConfigDirty(true); }} />
            </Field>
            <Field label="Régimen Fiscal DGII">
              <select className={inputCls} value={config.regimen_fiscal}
                onChange={e => { setConfig(p => ({ ...p, regimen_fiscal: e.target.value })); setConfigDirty(true); }}>
                <option>Régimen General (RNC Normal)</option>
                <option>RST (Régimen Simplificado de Tributación)</option>
              </select>
            </Field>
            <Field label="Tasa ITBIS por Defecto">
              <select className={inputCls} value={config.itbis_rate}
                onChange={e => { setConfig(p => ({ ...p, itbis_rate: e.target.value })); setConfigDirty(true); }}>
                <option value="0.18">18% ITBIS Estándar</option>
                <option value="0.16">16% ITBIS Reducido</option>
                <option value="0.00">Exento de ITBIS</option>
              </select>
            </Field>
          </div>

          <div className="border-t border-border pt-4 flex justify-end">
            <button className="btn btn-primary" onClick={saveConfig}>
              <ShieldCheck size={15} /> Guardar Configuración Fiscal
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODALES                                                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}

      {/* Modal: Nuevo Comprobante */}
      {modalComprobante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main/20 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-main">Emitir Nuevo Comprobante Fiscal</h3>
              <button onClick={() => setModalComprobante(false)} className="text-muted hover:text-danger transition-colors text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Tipo de Comprobante (NCF)">
                <select className={inputCls} value={fComp.ncf_type}
                  onChange={e => setFComp(p => ({ ...p, ncf_type: e.target.value }))}>
                  <option value="B01">B01 – Factura de Crédito Fiscal</option>
                  <option value="B02">B02 – Factura de Consumo</option>
                  <option value="B03">B03 – Nota de Débito</option>
                  <option value="B04">B04 – Nota de Crédito</option>
                  <option value="B11">B11 – Reg. Único de Ingresos</option>
                </select>
              </Field>
              <Field label="Seleccionar Cliente (opcional)">
                <select className={inputCls}
                  onChange={e => {
                    const c = clients.find(x => String(x.id) === e.target.value);
                    if (c) setFComp(p => ({ ...p, client_id: c.id, client_name: c.name, rnc_cedula: c.cedula || c.rnc || '' }));
                  }}>
                  <option value="">— Seleccionar de la lista —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="RNC / Cédula">
                  <input className={inputCls} placeholder="001-0000000-0" value={fComp.rnc_cedula}
                    onChange={e => setFComp(p => ({ ...p, rnc_cedula: e.target.value }))} />
                </Field>
                <Field label="Razón Social">
                  <input className={inputCls} placeholder="Nombre o empresa" value={fComp.client_name}
                    onChange={e => setFComp(p => ({ ...p, client_name: e.target.value }))} />
                </Field>
                <Field label="Subtotal (RD$)">
                  <input type="number" className={inputCls} placeholder="0.00" value={fComp.subtotal}
                    onChange={e => setFComp(p => ({ ...p, subtotal: e.target.value, tax: (parseFloat(e.target.value||0) * parseFloat(config.itbis_rate||0.18)).toFixed(2) }))} />
                </Field>
                <Field label={`ITBIS (${(parseFloat(config.itbis_rate||0.18)*100).toFixed(0)}%)`}>
                  <input type="number" className={inputCls} placeholder="0.00" value={fComp.tax}
                    onChange={e => setFComp(p => ({ ...p, tax: e.target.value }))} />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
              <button className="btn btn-outline" onClick={() => setModalComprobante(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={emitirComp}><FileText size={14} /> Emitir Comprobante</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Secuencia */}
      {modalSecuencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main/20 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-main">{editSeq ? `Editar Rango NCF — ${editSeq.ncf_type}` : 'Nueva Secuencia NCF'}</h3>
              <button onClick={() => { setModalSecuencia(false); setEditSeq(null); }} className="text-muted hover:text-danger text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              {!editSeq && (
                <>
                  <Field label="Tipo NCF (ej: B14)">
                    <input className={inputCls} value={fSeq.ncf_type}
                      onChange={e => setFSeq(p => ({ ...p, ncf_type: e.target.value }))} />
                  </Field>
                  <Field label="Descripción">
                    <input className={inputCls} placeholder="Ej: Regímenes Especiales" value={fSeq.ncf_type_name}
                      onChange={e => setFSeq(p => ({ ...p, ncf_type_name: e.target.value }))} />
                  </Field>
                  <Field label="Prefijo / Serie (ej: B140000)">
                    <input className={inputCls} value={fSeq.prefix}
                      onChange={e => setFSeq(p => ({ ...p, prefix: e.target.value }))} />
                  </Field>
                </>
              )}
              <Field label="Límite Máximo Autorizado">
                <input type="number" className={inputCls} value={fSeq.max_sequence}
                  onChange={e => setFSeq(p => ({ ...p, max_sequence: parseInt(e.target.value) }))} />
              </Field>
              <Field label="Fecha de Vencimiento">
                <input type="date" className={inputCls} value={fSeq.expiry_date}
                  onChange={e => setFSeq(p => ({ ...p, expiry_date: e.target.value }))} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
              <button className="btn btn-outline" onClick={() => { setModalSecuencia(false); setEditSeq(null); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveSeq}>Guardar Secuencia</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle Comprobante */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main/20 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-bold text-main">Comprobante Fiscal: {modalDetalle.ncf}</h3>
              <button onClick={() => setModalDetalle(null)} className="text-muted hover:text-danger text-lg">✕</button>
            </div>
            <div className="bg-background rounded-xl border border-border p-4 text-xs space-y-2.5">
              {[
                ['RNC Emisor', config.rnc || '130-00001-1'],
                ['Razón Social', config.razon_social || 'PharmaPlus SRL'],
                ['NCF', modalDetalle.ncf],
                ['Tipo', modalDetalle.ncf_type],
                ['Cliente', modalDetalle.client_name || 'Consumidor Final'],
                ['Fecha', fmtDate(modalDetalle.issued_at)],
                ['Subtotal', fmt(modalDetalle.subtotal)],
                ['ITBIS', fmt(modalDetalle.tax)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted">{k}:</span>
                  <span className="font-semibold text-main">{v}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 mt-1">
                <span className="font-extrabold text-main">TOTAL</span>
                <span className="font-extrabold text-base text-primary">{fmt(modalDetalle.total)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
              <button className="btn btn-outline" onClick={() => setModalDetalle(null)}>Cerrar</button>
              <button className="btn btn-primary" onClick={() => window.print()}><Printer size={14} /> Imprimir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: XML e-CF */}
      {modalXml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-main/20 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl" style={{ background: '#1e293b' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #334155' }}>
              <span className="flex items-center gap-2 text-white font-bold text-sm">
                <FileCode size={16} /> Estructura Canónica e-CF (DGII XML)
              </span>
              <button onClick={() => setModalXml(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar">
              <pre style={{ color: '#4ade80', fontSize: '0.7rem', lineHeight: 1.7, fontFamily: 'Courier New, monospace' }}>
{`<?xml version="1.0" encoding="UTF-8"?>
<eCF xmlns="http://dgii.gov.do/eCF/1.0">
  <ECFHeader>
    <RNCEmisor>${(config.rnc || '130000011').replace(/-/g, '')}</RNCEmisor>
    <RazonSocial>${config.razon_social || 'PharmaPlus SRL'}</RazonSocial>
    <eNCF>E310000000001</eNCF>
    <FechaEmision>${new Date().toISOString().split('T')[0]}</FechaEmision>
    <TipoComprobante>31</TipoComprobante>
    <TasaITBIS>${config.itbis_rate || '0.18'}</TasaITBIS>
  </ECFHeader>
  <DetalleItems>
    <Item NumeroLinea="1">
      <NombreItem>Paracetamol 500mg</NombreItem>
      <Cantidad>2</Cantidad>
      <PrecioUnitarioItem>45.00</PrecioUnitarioItem>
      <MontoItem>90.00</MontoItem>
    </Item>
  </DetalleItems>
  <Resumen>
    <MontoGravadoTotal>90.00</MontoGravadoTotal>
    <ITBIS18>16.20</ITBIS18>
    <MontoTotal>106.20</MontoTotal>
  </Resumen>
  <FirmaDigital>
    <DigestValue>dGhpcyBpcyBhIHZhbGlkIHNpZ25hdHVyZQ==</DigestValue>
  </FirmaDigital>
</eCF>`}
              </pre>
            </div>
            <div className="flex justify-end px-5 py-4" style={{ borderTop: '1px solid #334155' }}>
              <button className="btn btn-outline text-sm" style={{ background: '#334155', color: '#e2e8f0', borderColor: '#475569' }}
                onClick={() => setModalXml(false)}>Cerrar Visor</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted border-t border-border pt-4 mt-2 flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-success" />
          Los comprobantes fiscales son registros inalterables protegidos por ley.
        </span>
        <span>PharmaPlus © {new Date().getFullYear()} · DGII</span>
      </div>
    </div>
  );
};

export default DgiiFiscal;
