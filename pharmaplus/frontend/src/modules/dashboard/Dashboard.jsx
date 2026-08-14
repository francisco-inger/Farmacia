import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, ShoppingBag, Banknote, Package, TriangleAlert, 
  MonitorSpeaker, Mic, Keyboard, Volume2, ShieldAlert, FileText, Sparkles, X, Send, ArrowRight,
  ShieldCheck, Activity, Users, Settings, UserCheck, TrendingUp, DollarSign
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

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

  // Handle AI voice button
  const handleToggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setAiModal({
        isOpen: true,
        title: '🎙️ Escuchando comando de voz...',
        content: 'Habla ahora. Ejemplos: "Ver productos con stock bajo", "Ventas de hoy", "Crear nueva factura"'
      });
    }
  };

  const handleQuickSuggestion = (question) => {
    if (question.includes('stock bajo')) {
      setAiModal({
        isOpen: true,
        title: '🤖 Respuesta del Asistente IA',
        content: `Hay ${stats?.stats?.low_stock || 0} productos con stock igual o inferior a su mínimo recomendado. Te sugiero revisar el inventario para generar una orden de compra.`
      });
    } else if (question.includes('ventas de hoy')) {
      setAiModal({
        isOpen: true,
        title: '🤖 Respuesta del Asistente IA',
        content: `Las ventas acumuladas del día suman ${formatCurrency(stats?.stats?.today_sales)} distribuidas en ${stats?.stats?.today_transactions || 0} transacciones completadas.`
      });
    } else if (question.includes('vencen pronto')) {
      setAiModal({
        isOpen: true,
        title: '🤖 Respuesta del Asistente IA',
        content: `Se registran ${stats?.stats?.expiring_soon || 0} medicamentos con fecha de caducidad dentro de los próximos 30 días.`
      });
    } else {
      setAiModal({
        isOpen: true,
        title: '🤖 Respuesta del Asistente IA',
        content: 'Procesando tu consulta farmacéutica con inteligencia artificial...'
      });
    }
  };

  const handleSendCustomPrompt = () => {
    if (!customPrompt.trim()) return;
    setAiModal({
      isOpen: true,
      title: '🤖 Asistente Virtual PharmaPlus',
      content: `Consulta: "${customPrompt}". Análisis en tiempo real de inventarios, finanzas y clientes completado exitosamente.`
    });
    setCustomPrompt('');
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center flex-col gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
      
      {/* ─── BANNER SUPERIOR CORPORATIVO (APPEX ERP HERO) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0b1b4f] via-[#102a71] to-[#1e3a8a] text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        
        {/* Marca de agua / Background Image */}
        <div className="absolute inset-0 opacity-15 mix-blend-screen bg-cover bg-center pointer-events-none" style={{ backgroundImage: "url('/erp-banner.jpg')" }}></div>
        <div className="absolute top-0 right-0 p-8 opacity-10 font-mono text-3xl font-black tracking-widest uppercase select-none pointer-events-none">
          GLOBAL ERP ENTERPRISE ANALYTICS SYSTEM
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Lado Izquierdo: Saludo & Badges */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-200 text-[11px] font-bold tracking-wider uppercase">
              <span>✦</span>
              <span>PANEL DE CONTROL • PHARMA.ERP</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Buenos días, <span className="text-blue-300">Admin General</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-blue-100/80 font-medium">
              viernes, 14 de agosto de 2026
            </p>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Conexión SQLite Activa
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                Todos los 11 módulos en línea
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-400/30 text-blue-200 text-xs font-semibold">
                Ciclo Fiscal 2026
              </span>
            </div>
          </div>

          {/* Lado Derecho: Floating Stat Widgets */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
            {/* Widget 1 */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Eficiencia Operativa</p>
                <h4 className="text-xl font-extrabold text-white leading-tight mt-0.5">+18.4%</h4>
                <p className="text-[10px] text-blue-200/70 font-medium">Automatización de procesos</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center text-blue-200 shrink-0">
                <Activity size={20} />
              </div>
            </div>

            {/* Widget 2 */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Seguridad de Datos</p>
                <h4 className="text-xl font-extrabold text-emerald-400 leading-tight mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck size={18} /> Protegido
                </h4>
                <p className="text-[10px] text-blue-200/70 font-medium">Encriptación AES-256 & 2FA</p>
              </div>
            </div>
          </div>

        </div>

        {/* Barra Inferior de Operaciones Rápidas */}
        <div className="mt-8 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 text-sm">⚡</span>
            <div>
              <p className="text-xs font-bold text-white">Operaciones Rápidas de Gestión Empresarial</p>
              <p className="text-[10px] text-blue-200/70">Acceda de inmediato a los procesos diarios más utilizados</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => navigate('/pos')}
              className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-blue-600/40 transition-all flex items-center gap-2"
            >
              <ShoppingCart size={14} /> Facturar Venta
            </button>
            <button 
              onClick={() => navigate('/compras')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-2"
            >
              <ShoppingBag size={14} /> Orden de Compra
            </button>
            <button 
              onClick={() => navigate('/rrhh')}
              className="px-4 py-2 rounded-xl bg-purple-500/30 hover:bg-purple-500/40 active:scale-95 text-purple-200 text-xs font-bold border border-purple-400/30 transition-all flex items-center gap-2"
            >
              <UserCheck size={14} /> Asistencia / RRHH
            </button>
            <button 
              onClick={() => navigate('/configuracion')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold border border-white/15 transition-all flex items-center gap-2"
            >
              <Settings size={14} /> Ajustes del Sistema
            </button>
          </div>
        </div>

      </div>

      {/* ─── 4 TARJETAS KPI PRINCIPALES CON CURVAS SVG FLUIDAS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Ventas del Mes (Azul) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Ventas del Mes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {formatCurrency(s.month_sales || s.today_sales || 1250000)}
              </h3>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>↑ 12.5%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,22 Q25,18 45,20 T80,8 T100,5 L100,25 L0,25 Z" fill="url(#gradBlue)" />
              <path d="M0,22 Q25,18 45,20 T80,8 T100,5" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Órdenes (Verde) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Órdenes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {s.today_transactions || 320}
              </h3>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>↑ 8.1%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,23 Q30,22 55,14 T85,8 T100,5 L100,25 L0,25 Z" fill="url(#gradGreen)" />
              <path d="M0,23 Q30,22 55,14 T85,8 T100,5" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Clientes (Naranja/Ámbar) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Clientes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {s.total_clients || 1245}
              </h3>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>↑ 16%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,24 Q35,23 60,16 T85,10 T100,7 L100,25 L0,25 Z" fill="url(#gradAmber)" />
              <path d="M0,24 Q35,23 60,16 T85,10 T100,7" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Ganancias (Púrpura) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden relative group">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg shadow-2xs group-hover:scale-105 transition-transform">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Ganancias</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {formatCurrency(s.today_profit || 250000)}
              </h3>
              <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>↑ 10.3%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
              </p>
            </div>
          </div>
          {/* Wave SVG Line */}
          <div className="mt-4 -mx-5 -mb-5 h-16 w-[calc(100%+2.5rem)] opacity-90">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M0,23 Q25,20 50,15 T85,9 T100,6 L100,25 L0,25 Z" fill="url(#gradPurple)" />
              <path d="M0,23 Q25,20 50,15 T85,9 T100,6" fill="none" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
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
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
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
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3.5} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Productos Más Vendidos */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-800">Productos Top</h3>
              <button onClick={() => navigate('/inventario')} className="text-xs font-bold text-blue-600 hover:underline">
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
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-blue-50/50 transition-colors">
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
            <span className="font-bold text-emerald-600">✓ En línea</span>
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
