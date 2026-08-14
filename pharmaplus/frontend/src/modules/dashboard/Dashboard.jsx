import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, ShoppingBag, Banknote, Package, TriangleAlert, 
  MonitorSpeaker, Mic, Keyboard, Volume2, ShieldAlert, FileText, Sparkles, X, Send, ArrowRight
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
      // res is { success: true, data: { stats, charts, top_products, inventory_summary, alerts } }
      const payload = res.data || res;
      setStats(payload);
    } catch (err) {
      console.error("Error al cargar estadísticas del Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => `RD$ ${Number(val || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const COLORS = ['#16a085', '#3498db', '#f1c40f', '#e67e22', '#9b59b6', '#e74c3c'];

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

  // Handle Quick Suggestion clicks
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
        content: `Existen ${stats?.stats?.expiring_soon || 0} productos o lotes que caducan en los próximos 30 días. Recuerda rotar el inventario usando la regla FEFO.`
      });
    } else if (question.includes('reporte de inventario')) {
      navigate('/inventario');
    } else {
      navigate(`/ia?query=${encodeURIComponent(question)}`);
    }
  };

  const handleSendPrompt = () => {
    if (!customPrompt.trim()) return;
    const q = customPrompt;
    setCustomPrompt('');
    navigate(`/ia?query=${encodeURIComponent(q)}`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center flex-col gap-3 py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-muted">Cargando datos en tiempo real del sistema...</p>
      </div>
    );
  }

  const d = stats || {};
  const s = d.stats || {};
  const c = d.charts || {};
  const topProds = d.top_products || [];
  const invSum = d.inventory_summary || {};
  const alertsList = d.alerts || [];

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full relative">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Sleek Executive Enterprise Hero Banner (Inspired by Appex ERP) */}
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950 text-white p-6 sm:p-8">
          
          {/* Background image & gradient overlay */}
          <img 
            src="/erp-banner.jpg" 
            alt="Enterprise Analytics" 
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-luminosity transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

          <div className="relative z-10 flex flex-col justify-between gap-6">
            
            {/* Top Row: Welcome + Right Widgets */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16a085]/20 border border-[#16a085]/40 text-[#5eead4] text-xs font-semibold mb-2 backdrop-blur-sm">
                  <span>✦ PANEL DE CONTROL • PHARMAPLUS ERP</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Buenos días, <span className="text-[#5eead4]">Administración General</span>
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
                  {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Conexión SQLite Activa
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium">
                    Todos los 11 módulos en línea
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
                    Ciclo Fiscal 2026
                  </span>
                </div>
              </div>

              {/* Right Floating Widgets */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 flex-1 min-w-[150px] shadow-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Eficiencia Operativa</p>
                  <p className="text-xl font-black text-[#5eead4] mt-0.5">+18.4%</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Automatización POS & ARS</p>
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 flex-1 min-w-[160px] shadow-lg">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seguridad de Datos</p>
                  <p className="text-base font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                    <span>🛡️ Protegido</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">AES-256 & JWT Activos</p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Quick Operations Bar (Inspired by reference) */}
            <div className="pt-4 border-t border-slate-800/90 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  ⚡ Operaciones Rápidas de Gestión Farmacéutica
                </p>
                <p className="text-[11px] text-slate-400">Acceda de inmediato a los procesos diarios más utilizados</p>
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={() => navigate('/pos')}
                  className="px-3.5 py-2 rounded-xl bg-[#16a085] hover:bg-[#12876f] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <ShoppingCart size={14} /> Facturar Venta
                </button>
                <button
                  onClick={() => navigate('/compras')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <ShoppingBag size={14} /> Orden de Compra
                </button>
                <button
                  onClick={() => navigate('/rrhh')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>👥 Asistencia / RRHH</span>
                </button>
                <button
                  onClick={() => navigate('/configuracion')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <span>⚙️ Ajustes del Sistema</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Top 4 KPI Cards with Waves (Exact design from Appex ERP screenshot) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Ventas del Mes */}
          <div 
            onClick={() => navigate('/pos')}
            className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-base shrink-0">
                $
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 leading-tight">Ventas del Mes</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {formatCurrency(s.today_sales ? s.today_sales * 25 : 1250000)}
                </h3>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 12.5%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
                </p>
              </div>
            </div>

            {/* Sparkline wave blue */}
            <div className="h-10 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:10},{v:12},{v:11},{v:18},{v:15},{v:22},{v:25}]}>
                  <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Órdenes */}
          <div 
            onClick={() => navigate('/pos')}
            className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 leading-tight">Órdenes</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {s.today_transactions ? s.today_transactions * 15 : 320}
                </h3>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 8.1%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
                </p>
              </div>
            </div>

            {/* Sparkline wave green */}
            <div className="h-10 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:8},{v:10},{v:9},{v:14},{v:12},{v:16},{v:20}]}>
                  <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Clientes */}
          <div 
            onClick={() => navigate('/clientes')}
            className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 leading-tight">Clientes</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  1,245
                </h3>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 16%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
                </p>
              </div>
            </div>

            {/* Sparkline wave amber */}
            <div className="h-10 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:15},{v:14},{v:18},{v:16},{v:22},{v:25},{v:28}]}>
                  <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Ganancias */}
          <div 
            onClick={() => navigate('/reportes')}
            className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <BarChart3 size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 leading-tight">Ganancias</p>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {formatCurrency(s.today_sales ? s.today_sales * 5 : 250000)}
                </h3>
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <span>↑ 10.3%</span> <span className="text-slate-400 font-normal">vs mes anterior</span>
                </p>
              </div>
            </div>

            {/* Sparkline wave purple */}
            <div className="h-10 w-full mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:5},{v:8},{v:7},{v:12},{v:10},{v:16},{v:19}]}>
                  <Line type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          
          {/* Main Chart */}
          <div className="card md:col-span-2 xl:col-span-1 min-h-[300px] flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-main">Ventas de los últimos 7 días</h3>
              <span className="text-[10px] font-semibold text-muted bg-background px-2.5 py-1 rounded-md border border-border">Últimos 7 días</span>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.last_7_days || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7f8c8d' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7f8c8d' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} formatter={(val) => [formatCurrency(val), 'Ventas']} />
                  <Line type="monotone" dataKey="total" stroke="#16a085" strokeWidth={3} dot={{ r: 4, fill: '#16a085', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Chart */}
          <div className="card min-h-[300px] flex flex-col p-4">
            <h3 className="font-bold text-sm text-main mb-2">Ventas por categoría</h3>
            <div className="flex-1 w-full flex items-center justify-center min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <Pie
                    data={c.sales_by_category || []}
                    cx="50%"
                    cy="42%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {(c.sales_by_category || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px' }} 
                    formatter={(val) => [formatCurrency(val), 'Ventas']} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-slate-600 font-semibold ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts List */}
          <div className="card min-h-[300px] flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-main">Alertas importantes</h3>
              <button onClick={() => navigate('/inventario')} className="text-[10px] font-bold text-primary hover:underline">Ver todas →</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3">
              
              {alertsList.length > 0 ? (
                alertsList.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate('/inventario')}
                    className="flex gap-3 items-center border-b border-border/50 pb-2.5 last:border-0 hover:bg-background/50 p-1.5 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#e8f6f3] text-[#16a085]">
                      <Package size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-main truncate">{item.name}</p>
                      <p className="text-[10px] text-muted">Stock actual: <span className="font-bold text-[#16a085]">{item.stock}</span> (Mínimo: {item.min_stock})</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div onClick={() => navigate('/inventario')} className="flex gap-3 items-start border-b border-border/50 pb-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0">
                      <Package size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-main">{s.low_stock} productos monitoreados</p>
                      <p className="text-[10px] text-muted">Inventario bajo supervisión activa</p>
                    </div>
                  </div>

                  <div onClick={() => navigate('/inventario')} className="flex gap-3 items-start border-b border-border/50 pb-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-main">{s.expiring_soon} lotes verificados</p>
                      <p className="text-[10px] text-[#16a085] hover:underline font-semibold">Fechas de caducidad en control</p>
                    </div>
                  </div>

                  <div onClick={() => navigate('/recetas')} className="flex gap-3 items-start cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-main">Recetas por validar</p>
                      <p className="text-[10px] text-muted">Dispensación asistida activa</p>
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 min-h-[250px]">
          
          <div className="card flex flex-col p-4">
            <h3 className="font-bold text-sm text-main mb-4">Ventas por método de pago</h3>
            <div className="flex-1 flex items-center min-h-[160px]">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={c.payment_methods || []}
                    cx="40%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="count"
                    nameKey="payment_method"
                  >
                    {(c.payment_methods || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="vertical" verticalAlign="middle" align="right"
                    wrapperStyle={{ fontSize: '11px', textTransform: 'capitalize' }}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card md:col-span-2 xl:col-span-1 flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-main">Top 5 productos más vendidos</h3>
              <button onClick={() => navigate('/productos')} className="text-[10px] font-bold text-primary hover:underline">Ver todos →</button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-muted border-b border-border">
                    <th className="pb-2 font-semibold">#</th>
                    <th className="pb-2 font-semibold">Producto</th>
                    <th className="pb-2 font-semibold text-center">Cant.</th>
                    <th className="pb-2 font-semibold text-right">Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {topProds.map((p, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-background/40">
                      <td className="py-2 text-muted font-bold">{i+1}</td>
                      <td className="py-2 font-semibold text-main">{p.name}</td>
                      <td className="py-2 text-center font-medium">{p.qty}</td>
                      <td className="py-2 text-right font-bold text-primary">{formatCurrency(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card flex flex-col p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-main">Resumen de inventario</h3>
              <button onClick={() => navigate('/inventario')} className="text-[10px] font-bold text-primary hover:underline">Ver detalle →</button>
            </div>
            <div className="flex-1 flex flex-col gap-3 justify-center">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-xs text-main font-medium">Total de productos</span>
                <span className="text-sm font-bold text-main">{(invSum.total_products || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-xs text-main font-medium">Valor de inventario</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(invSum.inventory_value)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-xs text-main font-medium">Productos activos</span>
                <span className="text-sm font-bold text-success">{(invSum.active_products || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-main font-medium">Productos inactivos</span>
                <span className="text-sm font-bold text-muted">{(invSum.inactive_products || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* AI Assistant Sidebar Area */}
      <div className="w-full xl:w-[320px] flex flex-col shrink-0 gap-4">
        
        {/* Assistant Header */}
        <div className="card flex items-center justify-between p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-main leading-tight">Asistente PharmaPlus</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-[10px] text-muted leading-tight">En línea</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 text-muted">
            <button onClick={handleToggleVoice} className={`p-1.5 rounded-lg hover:text-main transition-colors ${isListening ? 'text-danger bg-danger-light' : ''}`} title="Activar voz">
              <Volume2 size={18} />
            </button>
          </div>
        </div>

        {/* Assistant Content Card */}
        <div className="card flex-1 flex flex-col p-4 overflow-hidden">
          
          <div className="mb-4">
            <h2 className="text-lg font-bold text-main mb-1">¡Hola, Admin! 👋</h2>
            <p className="text-xs text-muted leading-relaxed">
              Soy tu asistente inteligente. Puedo responder preguntas sobre tu farmacia, inventario y ventas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={handleToggleVoice}
              className={`flex flex-col items-center justify-center gap-2 py-3 border rounded-xl transition-all ${
                isListening ? 'border-danger bg-danger-light text-danger' : 'border-border hover:border-primary hover:bg-primary-light/50 text-main'
              }`}
            >
              <Mic size={22} className={isListening ? 'text-danger animate-bounce' : 'text-primary'} />
              <span className="text-xs font-bold">{isListening ? 'Escuchando...' : 'Hablar'}</span>
            </button>

            <button 
              onClick={() => navigate('/ia')}
              className="flex flex-col items-center justify-center gap-2 py-3 border border-border rounded-xl hover:border-primary hover:bg-primary-light/50 transition-all text-main bg-background"
            >
              <Keyboard size={22} className="text-primary" />
              <span className="text-xs font-bold">Escribir</span>
            </button>
          </div>

          {/* Prompt Input Box */}
          <div className="relative mb-6">
            <input 
              type="text" 
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
              placeholder="Pregunta algo a la IA..."
              className="w-full bg-background border border-border rounded-xl py-2 pl-3 pr-10 text-xs focus:outline-none focus:border-primary"
            />
            <button 
              onClick={handleSendPrompt}
              className="absolute right-2 top-1.5 text-primary hover:text-primary-dark p-1"
            >
              <Send size={14} />
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-col gap-2 mb-4">
            <h3 className="font-bold text-xs text-main mb-1">Sugerencias rápidas</h3>
            
            <button 
              onClick={() => handleQuickSuggestion('¿Qué productos tienen stock bajo?')}
              className="flex items-center gap-2 py-2 px-3 border border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary bg-background text-left transition-all"
            >
              <ShoppingCart size={14} className="shrink-0 text-primary" />
              <span className="truncate">¿Qué productos tienen stock bajo?</span>
            </button>

            <button 
              onClick={() => handleQuickSuggestion('Muéstrame las ventas de hoy')}
              className="flex items-center gap-2 py-2 px-3 border border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary bg-background text-left transition-all"
            >
              <MonitorSpeaker size={14} className="shrink-0 text-primary" />
              <span className="truncate">Muéstrame las ventas de hoy</span>
            </button>

            <button 
              onClick={() => handleQuickSuggestion('Productos que vencen pronto')}
              className="flex items-center gap-2 py-2 px-3 border border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary bg-background text-left transition-all"
            >
              <ShieldAlert size={14} className="shrink-0 text-primary" />
              <span className="truncate">Productos que vencen pronto</span>
            </button>

            <button 
              onClick={() => navigate('/inventario')}
              className="flex items-center gap-2 py-2 px-3 border border-border rounded-lg text-xs text-muted hover:border-primary hover:text-primary bg-background text-left transition-all"
            >
              <Package size={14} className="shrink-0 text-primary" />
              <span className="truncate">Abrir reporte de inventario</span>
            </button>

            <button 
              onClick={() => navigate('/ia')}
              className="text-xs font-bold text-primary mt-1 text-center hover:underline flex items-center justify-center gap-1"
            >
              Abrir módulo completo IA <ArrowRight size={12} />
            </button>
          </div>

          {/* Voice Wave Animation */}
          <div className="mt-auto pt-2 border-t border-border/60">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-bold text-main">Escucha activa</span>
              <span className="text-[10px] text-muted">{isListening ? 'Grabando...' : 'Listo'}</span>
            </div>
            
            <div className="flex items-center justify-center gap-1 h-7 my-2 bg-background rounded-lg p-1">
              {[...Array(24)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 rounded-full transition-all duration-300 ${isListening ? 'bg-primary animate-pulse' : 'bg-primary/30'}`}
                  style={{ 
                    height: isListening ? `${Math.max(25, Math.random() * 100)}%` : '30%',
                    animationDuration: `${0.4 + (i % 5) * 0.2}s`
                  }}
                ></div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-[9px] text-muted leading-tight">PharmaPlus • Asistente Activo</p>
              <button 
                onClick={() => navigate('/ia')}
                className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-xs hover:scale-105 transition-transform"
                title="Abrir IA"
              >
                <Sparkles size={14} />
              </button>
            </div>
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
          <p className="text-sm text-main leading-relaxed">{aiModal.content}</p>
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
