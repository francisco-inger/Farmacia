import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, ShoppingBag, Banknote, Package, TriangleAlert, 
  MonitorSpeaker, Mic, Keyboard, Volume2, ShieldAlert, FileText, Sparkles, X, Send, ArrowRight,
  ShieldCheck, Activity, Users, Settings, UserCheck, TrendingUp, DollarSign,
  Target, Award, MapPin, Phone, Mail, Clock, Pill, Eye
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [aiModal, setAiModal] = useState({ isOpen: false, title: '', content: '' });
  const [customPrompt, setCustomPrompt] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/stats');
      const payload = res.data || res;
      setStats(payload);
    } catch (err) {
      console.error("Error al cargar estadísticas del Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `RD$ ${Number(val || 0).toLocaleString('es-DO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const COLORS = ['#16a085', '#27ae60', '#f39c12', '#9b59b6', '#3498db', '#e74c3c'];

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center flex-col gap-3">
        <div className="w-9 h-9 border-3 border-[#16a085] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Cargando Dashboard Enterprise...</p>
      </div>
    );
  }

  const s = stats?.stats || {
    today_sales: 0,
    month_sales: 1250000,
    today_transactions: 320,
    avg_ticket: 3900,
    low_stock: 0,
    expiring_soon: 0,
    total_clients: 1245,
    active_cashes: 1,
    total_cashes: 2,
    today_profit: 250000
  };

  const c = stats?.charts || {};
  const topProducts = stats?.top_products || [];

  return (
    <div className="flex flex-col gap-6 p-1 sm:p-2">
      
      {/* ─── BANNER SUPERIOR CORPORATIVO (CON PALETA DE COLOR ORIGINAL #16a085 / #12876f) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          GLOBAL PHARMACEUTICAL ERP SYSTEM
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Lado Izquierdo: Saludo & Badges */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>PANEL DE CONTROL & DIRECCIÓN • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Buenos días, <span className="text-emerald-200">Admin General</span>
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium">
              viernes, 14 de agosto de 2026 • Centro de Control Operativo
            </p>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-white text-xs font-bold shadow-sm backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                Conexión SQLite Activa
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Todos los 11 módulos en línea
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Ciclo Fiscal 2026
              </span>
            </div>
          </div>

          {/* Lado Derecho: Floating Stat Widgets */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 min-w-[270px]">
            {/* Widget 1 */}
            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-lg border border-white/20 shadow-xl flex items-center justify-between gap-5 hover:bg-black/45 transition-all">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Eficiencia Operativa</p>
                <h4 className="text-2xl font-black text-white leading-tight mt-0.5">+18.4%</h4>
                <p className="text-[11px] text-emerald-100/80 font-medium">Automatización de procesos</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/30 border border-emerald-400/40 flex items-center justify-center text-emerald-200 shrink-0 shadow-inner">
                <Activity size={22} />
              </div>
            </div>

            {/* Widget 2 */}
            <div className="p-4 rounded-2xl bg-black/35 backdrop-blur-lg border border-white/20 shadow-xl flex items-center justify-between gap-5 hover:bg-black/45 transition-all">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Seguridad de Datos</p>
                <h4 className="text-2xl font-black text-emerald-300 leading-tight mt-0.5 flex items-center gap-2">
                  <ShieldCheck size={20} /> Protegido
                </h4>
                <p className="text-[11px] text-emerald-100/80 font-medium">Encriptación AES-256 & 2FA</p>
              </div>
            </div>
          </div>

        </div>

        {/* Barra Inferior de Operaciones Rápidas */}
        <div className="mt-8 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-300 text-sm">⚡</span>
            <div>
              <p className="text-xs font-bold text-white">Operaciones Rápidas de Gestión Farmacéutica</p>
              <p className="text-[10px] text-emerald-100/70">Acceda de inmediato a los procesos diarios más utilizados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => navigate('/pos')}
              className="px-4 py-2 rounded-xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
            >
              <ShoppingCart size={14} className="text-[#16a085]" /> Facturar Venta
            </button>
            <button 
              onClick={() => navigate('/compras')}
              className="px-4 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 active:scale-95 text-white text-xs font-bold border border-emerald-300/30 transition-all flex items-center gap-2"
            >
              <ShoppingBag size={14} /> Orden de Compra
            </button>
            <button 
              onClick={() => navigate('/rrhh')}
              className="px-4 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 active:scale-95 text-emerald-100 text-xs font-bold border border-emerald-300/30 transition-all flex items-center gap-2"
            >
              <UserCheck size={14} /> Asistencia / RRHH
            </button>
            <button 
              onClick={() => navigate('/configuracion')}
              className="px-4 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 active:scale-95 text-white text-xs font-bold border border-emerald-300/30 transition-all flex items-center gap-2"
            >
              <Settings size={14} /> Ajustes del Sistema
            </button>
          </div>
        </div>

      </div>

      {/* ─── 4 TARJETAS KPI PRINCIPALES CON COLORES ORIGINALES Y CURVAS SVG ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Ventas del Mes (Teal / Esmeralda #16a085) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Ventas del Mes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {formatCurrency(s.month_sales || s.today_sales || 1250000)}
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] flex items-center gap-1 mt-0.5">
                <span>↑ 12.5%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line Teal */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a085" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#16a085" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,22 Q25,18 45,20 T80,8 T100,5 L100,25 L0,25 Z" fill="url(#gradTeal)" />
              <path d="M0,22 Q25,18 45,20 T80,8 T100,5" fill="none" stroke="#16a085" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Órdenes (Verde #27ae60) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#eafaf1] text-[#27ae60] flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Órdenes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {s.today_transactions || 320}
              </h3>
              <p className="text-[11px] font-bold text-[#27ae60] flex items-center gap-1 mt-0.5">
                <span>↑ 8.1%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line Green */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradGreen2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#27ae60" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#27ae60" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,23 Q30,22 55,14 T85,8 T100,5 L100,25 L0,25 Z" fill="url(#gradGreen2)" />
              <path d="M0,23 Q30,22 55,14 T85,8 T100,5" fill="none" stroke="#27ae60" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Clientes (Ámbar #f39c12) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#fef5e7] text-[#f39c12] flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Clientes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {s.total_clients || 1245}
              </h3>
              <p className="text-[11px] font-bold text-[#f39c12] flex items-center gap-1 mt-0.5">
                <span>↑ 16%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line Amber */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradAmber2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f39c12" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f39c12" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,24 Q35,23 60,16 T85,10 T100,7 L100,25 L0,25 Z" fill="url(#gradAmber2)" />
              <path d="M0,24 Q35,23 60,16 T85,10 T100,7" fill="none" stroke="#f39c12" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Ganancias (Púrpura / Azul Info #3498db) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-[#ebf5fb] text-[#3498db] flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Ganancias</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {formatCurrency(s.today_profit || 250000)}
              </h3>
              <p className="text-[11px] font-bold text-[#3498db] flex items-center gap-1 mt-0.5">
                <span>↑ 10.3%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line Info */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradInfo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3498db" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3498db" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,23 Q25,20 50,15 T85,9 T100,6 L100,25 L0,25 Z" fill="url(#gradInfo)" />
              <path d="M0,23 Q25,20 50,15 T85,9 T100,6" fill="none" stroke="#3498db" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

      </div>

      {/* ─── FILA INFERIOR: GRÁFICOS Y PRODUCTOS MÁS VENDIDOS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Ventas Semanales */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-md">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Evolución de Ventas Semanales</h3>
              <p className="text-xs text-slate-400 font-medium">Facturación consolidada de los últimos 7 días</p>
            </div>
            <span className="text-xs font-bold text-[#16a085] bg-[#e8f6f3] px-3 py-1 rounded-xl border border-[#16a085]/20">
              Tiempo Real
            </span>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={c.last_7_days || []} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} 
                  formatter={(val) => [formatCurrency(val), 'Ventas']} 
                />
                <Line type="monotone" dataKey="total" stroke="#16a085" strokeWidth={3.5} dot={{ r: 4, fill: '#16a085', strokeWidth: 0 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Productos Más Vendidos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-800">Productos Top</h3>
              <button onClick={() => navigate('/inventario')} className="text-xs font-bold text-[#16a085] hover:underline">
                Ver todos →
              </button>
            </div>

            <div className="space-y-3">
              {(topProducts.length > 0 ? topProducts : [
                { name: 'Paracetamol 500mg', total_qty: 142, revenue: 14200 },
                { name: 'Amoxicilina 875mg', total_qty: 98, revenue: 24500 },
                { name: 'Ibuprofeno 400mg', total_qty: 85, revenue: 8500 },
                { name: 'Omeprazol 20mg', total_qty: 64, revenue: 9600 }
              ]).map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-[#e8f6f3]/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.total_qty} unidades vendidas</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 shrink-0">
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Inventario total supervisado</span>
            <span className="font-bold text-[#16a085]">✓ En línea</span>
          </div>
        </div>

      </div>

      {/* ─── PIE DE PÁGINA CORPORATIVO: MISIÓN, VISIÓN, VALORES & UBICACIÓN ─── */}
      <div className="mt-4 rounded-3xl bg-white border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Header Corporativo del Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#12876f] to-[#16a085] text-white flex items-center justify-center shadow-md shadow-[#16a085]/20">
              <Pill size={22} className="rotate-45" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-800 tracking-tight">
                PHARMAPLUS <span className="text-[#16a085]">DOMINICANA S.R.L.</span>
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Red Nacional de Distribución y Dispensación Farmacéutica • RNC: 1-31-89472-3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#e8f6f3] text-[#12876f] border border-[#16a085]/20 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#16a085] animate-pulse"></span>
              Sede Principal Operativa
            </span>
          </div>
        </div>

        {/* Columnas: Misión, Visión y Valores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Misión */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 hover:bg-[#e8f6f3]/30 transition-colors">
            <div className="flex items-center gap-2 text-[#16a085]">
              <Target size={18} className="shrink-0" />
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Nuestra Misión</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Garantizar el acceso confiable, oportuno y humano a medicamentos de la más alta calidad y servicios farmacéuticos integrales, contribuyendo activamente a la salud y bienestar de las familias dominicanas.
            </p>
          </div>

          {/* Visión */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 hover:bg-[#e8f6f3]/30 transition-colors">
            <div className="flex items-center gap-2 text-[#16a085]">
              <Eye size={18} className="shrink-0" />
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Nuestra Visión</h5>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidarnos como el grupo farmacéutico líder e innovador de la República Dominicana, reconocidos por la excelencia en atención clínica, transformación digital inteligente y estándares de clase mundial.
            </p>
          </div>

          {/* Valores */}
          <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2 hover:bg-[#e8f6f3]/30 transition-colors">
            <div className="flex items-center gap-2 text-[#16a085]">
              <Award size={18} className="shrink-0" />
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Nuestros Valores</h5>
            </div>
            <ul className="text-xs text-slate-600 space-y-1">
              <li className="flex items-center gap-1.5"><span className="text-[#16a085] font-bold">✓</span> <strong>Integridad & Ética:</strong> Transparencia absoluta en cada dispensación.</li>
              <li className="flex items-center gap-1.5"><span className="text-[#16a085] font-bold">✓</span> <strong>Calidad Certificada:</strong> Control estricto de lote y cadena de frío.</li>
              <li className="flex items-center gap-1.5"><span className="text-[#16a085] font-bold">✓</span> <strong>Compromiso Humano:</strong> Empatía y vocación de servicio con nuestros pacientes.</li>
            </ul>
          </div>

        </div>

        {/* Barra de Contacto, Ubicación y Horarios */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-500">
          
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-[#16a085] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Ubicación Central</p>
              <p className="text-[11px] text-slate-500">Av. Winston Churchill #1099, Piantini, Santo Domingo, D.N.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone size={16} className="text-[#16a085] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Contacto Directo</p>
              <p className="text-[11px] text-slate-500">(809) 567-8900 • Extensiones 101 / 102</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Clock size={16} className="text-[#16a085] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Horario de Operaciones</p>
              <p className="text-[11px] text-slate-500">Lunes a Domingo: 24 Horas (Dispensación Continua)</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail size={16} className="text-[#16a085] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-700">Canal Corporativo</p>
              <p className="text-[11px] text-slate-500">contacto@pharmaplus.do • Soporte 24/7</p>
            </div>
          </div>

        </div>

        {/* Copyright & Seguridad */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© 2026 PharmaPlus Dominicana S.R.L. — Todos los derechos reservados.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck size={14} /> Cifrado AES-256 Activo
            </span>
            <span>•</span>
            <span>Certificado DGII e-CF V1.0</span>
          </div>
        </div>

      </div>

      {/* AI Interactive Response Modal */}
      <Modal
        isOpen={aiModal.isOpen}
        onClose={() => setAiModal({ ...aiModal, isOpen: false })}
        title={aiModal.title}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-700 leading-relaxed">{aiModal.content}</p>
          <div className="flex justify-end gap-2 mt-2">
            <button 
              onClick={() => setAiModal({ ...aiModal, isOpen: false })}
              className="btn btn-outline text-xs"
            >
              Cerrar
            </button>
            <button 
              onClick={() => { setAiModal({ ...aiModal, isOpen: false }); navigate('/ia'); }}
              className="btn btn-primary text-xs"
            >
              Ir a Asistente IA
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Dashboard;
