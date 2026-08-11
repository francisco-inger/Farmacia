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
    <div className="flex flex-col lg:flex-row gap-6 h-full relative">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div 
            onClick={() => navigate('/pos')}
            className="card p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingCart size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">Ventas del día</p>
                <h3 className="text-lg font-bold text-main leading-tight">{formatCurrency(s.today_sales)}</h3>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-success font-bold">↑ Actualizado</span>
              <span className="text-primary group-hover:underline font-semibold">Ir a POS →</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/pos')}
            className="card p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">Transacciones</p>
                <h3 className="text-lg font-bold text-main leading-tight">{s.today_transactions}</h3>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-muted font-medium">Facturas del día</span>
              <span className="text-primary group-hover:underline font-semibold">Ver detalle →</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/reportes')}
            className="card p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Banknote size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">Ticket promedio</p>
                <h3 className="text-lg font-bold text-main leading-tight">{formatCurrency(s.avg_ticket)}</h3>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-muted font-medium">Por compra</span>
              <span className="text-primary group-hover:underline font-semibold">Reportes →</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/inventario?filter=low_stock')}
            className="card p-4 flex flex-col justify-between border-rose-200 bg-rose-50/60 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer group shadow-2xs"
            title="Ver productos con stock bajo"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white border border-rose-200 w-10 h-10 rounded-xl flex items-center justify-center text-rose-600 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                <TriangleAlert size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">Stock bajo</p>
                <h3 className="text-xl font-extrabold text-rose-600 leading-tight">{s.low_stock}</h3>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-center justify-between text-[11px] font-bold text-rose-700 whitespace-nowrap gap-1">
              <span className="truncate">Requiere reposición</span>
              <span className="group-hover:underline shrink-0 flex items-center gap-0.5">Revisar &rarr;</span>
            </div>
          </div>

          <div 
            onClick={() => navigate('/cajas')}
            className="card p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <MonitorSpeaker size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted">Cajas activas</p>
                <h3 className="text-lg font-bold text-main leading-tight">{s.active_cashes} / {s.total_cashes}</h3>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px]">
              <span className="text-success font-bold">Turno en curso</span>
              <span className="text-primary group-hover:underline font-semibold">Cajas →</span>
            </div>
          </div>
          
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Main Chart */}
          <div className="card lg:col-span-1 xl:col-span-1 min-h-[300px] flex flex-col p-4">
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.alert_type === 'agotado' ? 'bg-danger-light text-danger' : 'bg-warning-light text-warning'}`}>
                      <TriangleAlert size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-bold text-main truncate">{item.name}</p>
                      <p className="text-[10px] text-muted">Stock actual: <span className="font-bold text-danger">{item.stock}</span> (Mínimo: {item.min_stock})</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div onClick={() => navigate('/inventario')} className="flex gap-3 items-start border-b border-border/50 pb-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-danger-light text-danger flex items-center justify-center shrink-0">
                      <TriangleAlert size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-main">{s.low_stock} productos con stock bajo</p>
                      <p className="text-[10px] text-muted">Requieren reposición en inventario</p>
                    </div>
                  </div>

                  <div onClick={() => navigate('/inventario')} className="flex gap-3 items-start border-b border-border/50 pb-3 cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-warning-light text-warning flex items-center justify-center shrink-0">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-main">{s.expiring_soon} lotes por vencer en 30 días</p>
                      <p className="text-[10px] text-primary hover:underline font-semibold">Revisar fecha de caducidad</p>
                    </div>
                  </div>

                  <div onClick={() => navigate('/recetas')} className="flex gap-3 items-start cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[250px]">
          
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

          <div className="card flex flex-col p-4">
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
      <div className="w-full lg:w-[320px] flex flex-col shrink-0 gap-4">
        
        {/* Assistant Header */}
        <div className="card flex items-center justify-between p-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-main leading-tight">Asistente IA Pharma</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-[10px] text-muted leading-tight">En línea (Groq Powered)</span>
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
              <p className="text-[9px] text-muted leading-tight">PharmaPlus AI • Groq Model</p>
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
