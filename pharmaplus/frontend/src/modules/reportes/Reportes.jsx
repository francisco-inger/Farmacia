import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Calendar, Download, 
  Filter, Search, RefreshCw, ShoppingCart, ArrowUpRight, Award, 
  FileText, ShieldCheck, CheckCircle2, BotMessageSquare, Send, Sparkles, Layers
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

const Reportes = () => {
  const { user } = useContext(AuthContext);

  // Tabs: 'ventas' | 'inventario' | 'top_productos' | 'caja'
  const [activeTab, setActiveTab] = useState('ventas');

  // Filter States
  const [period, setPeriod] = useState('daily'); // 'daily', 'monthly', 'yearly'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data States
  const [salesData, setSalesData] = useState([]);
  const [salesSummary, setSalesSummary] = useState({});
  const [inventoryData, setInventoryData] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({});
  const [topProductsData, setTopProductsData] = useState([]);
  const [cashData, setCashData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, period, dateFrom, dateTo]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const formatCurrency = (val) => `RD$ ${Number(val || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let queryParams = `?period=${period}`;
      if (dateFrom) queryParams += `&date_from=${dateFrom}`;
      if (dateTo) queryParams += `&date_to=${dateTo}`;

      if (activeTab === 'ventas') {
        const res = await api.get(`/reportes/ventas${queryParams}`);
        const payload = res.data || res;
        setSalesData(payload.data || []);
        setSalesSummary(payload.summary || {});
      } else if (activeTab === 'inventario') {
        const res = await api.get(`/reportes/inventario`);
        const payload = res.data || res;
        setInventoryData(payload.data || []);
        setInventorySummary(payload.summary || {});
      } else if (activeTab === 'top_productos') {
        const res = await api.get(`/reportes/top-productos${queryParams}`);
        const payload = res.data || res;
        setTopProductsData(payload.data || []);
      } else if (activeTab === 'caja') {
        const res = await api.get(`/reportes/caja${queryParams}`);
        const payload = res.data || res;
        setCashData(payload.data || []);
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'ventas') {
      csvContent += 'Periodo,Transacciones,Ingresos,Descuentos,Ticket Promedio\n';
      salesData.forEach(r => {
        csvContent += `${r.period},${r.transactions},${r.revenue},${r.discounts},${r.avg_ticket}\n`;
      });
    } else if (activeTab === 'inventario') {
      csvContent += 'Codigo,Producto,Categoria,Stock,Precio Costo,Precio Venta,Valor Total,Estado\n';
      inventoryData.forEach(p => {
        csvContent += `${p.code},"${p.name}",${p.category},${p.stock},${p.cost_price},${p.sale_price},${p.stock_value},${p.status}\n`;
      });
    } else if (activeTab === 'top_productos') {
      csvContent += 'Codigo,Producto,Unidades Vendidas,Ingreso Total,Costo Total,Ganancia Neta\n';
      topProductsData.forEach(p => {
        csvContent += `${p.code},"${p.name}",${p.total_sold},${p.total_revenue},${p.total_cost},${p.profit}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_PharmaPlus_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte exportado exitosamente en formato CSV', 'success');
  };

  const handleChatAction = async (promptText) => {
    setChatInput(promptText);
    setChatLoading(true);
    try {
      const res = await api.post('/ia/chat', { message: promptText });
      const msg = res.data?.data?.message?.content || res.data?.message?.content || 'Informe analizado correctamente.';
      setChatResponse(msg);
    } catch (err) {
      setChatResponse('Error consultando el Asistente de Informes.');
    } finally {
      setChatLoading(false);
    }
  };

  const COLORS = ['#16a085', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#2ecc71'];

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen space-y-6 font-sans text-[#2c3e50]">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-white font-medium bg-[#16a085] flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Sleek Green Header Banner */}
      <div className="bg-[#16a085] rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Reportes e Informes Financieros</h2>
        </div>

        {/* Filter Controls & Export Button */}
        <div className="flex flex-wrap items-center gap-2 z-10">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white/20 text-white font-bold border border-white/30 rounded-xl text-xs focus:outline-none"
          >
            <option value="daily" className="text-slate-800">Vista: Diaria</option>
            <option value="monthly" className="text-slate-800">Vista: Mensual</option>
            <option value="yearly" className="text-slate-800">Vista: Anual</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 bg-white/20 text-white font-medium border border-white/30 rounded-xl text-xs focus:outline-none"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 bg-white/20 text-white font-medium border border-white/30 rounded-xl text-xs focus:outline-none"
          />

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white text-[#16a085] hover:bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold shadow transition"
          >
            <Download size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
        
        <div className="shrink-0 h-16 md:h-20 flex items-center justify-center z-10">
          <img 
            src="/modules/reportes.png" 
            alt="Reportes" 
            className="h-full w-auto max-w-[240px] object-contain rounded-xl drop-shadow-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
            <h3 className="text-xl font-extrabold text-slate-900">{formatCurrency(salesSummary.total_revenue ?? 0)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transacciones</p>
            <h3 className="text-xl font-extrabold text-slate-900">{salesSummary.total_sales ?? 0} ventas</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
            <h3 className="text-xl font-extrabold text-slate-900">{formatCurrency(salesSummary.avg_ticket ?? 0)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Valor del Inventario</p>
            <h3 className="text-xl font-extrabold text-slate-900">{formatCurrency(inventorySummary.total_value ?? 0)}</h3>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex border-b border-slate-200 pb-3 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ventas')}
            className={`pb-2 transition border-b-2 ${
              activeTab === 'ventas' ? 'border-[#16a085] text-[#16a085]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            📈 Informe de Ventas
          </button>

          <button
            onClick={() => setActiveTab('inventario')}
            className={`pb-2 transition border-b-2 ${
              activeTab === 'inventario' ? 'border-[#16a085] text-[#16a085]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            📦 Valoración de Inventario
          </button>

          <button
            onClick={() => setActiveTab('top_productos')}
            className={`pb-2 transition border-b-2 ${
              activeTab === 'top_productos' ? 'border-[#16a085] text-[#16a085]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            🏆 Productos Más Vendidos
          </button>

          <button
            onClick={() => setActiveTab('caja')}
            className={`pb-2 transition border-b-2 ${
              activeTab === 'caja' ? 'border-[#16a085] text-[#16a085]' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            💵 Arqueos de Caja
          </button>
        </div>

        {/* TAB 1: INFORME DE VENTAS */}
        {activeTab === 'ventas' && (
          <div className="space-y-6">
            <div className="h-72 w-full pt-2">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Evolución de Ingresos por Ventas</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `RD$ ${v}`} />
                  <RechartsTooltip formatter={(val) => [formatCurrency(val), 'Ingresos']} />
                  <Bar dataKey="revenue" fill="#16a085" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto pt-4 border-t border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Periodo / Fecha</th>
                    <th className="p-3">Transacciones</th>
                    <th className="p-3">Ingresos Totales</th>
                    <th className="p-3">Descuentos</th>
                    <th className="p-3">Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{r.period}</td>
                      <td className="p-3 text-slate-600 font-semibold">{r.transactions} facturas</td>
                      <td className="p-3 font-bold text-[#16a085]">{formatCurrency(r.revenue)}</td>
                      <td className="p-3 text-slate-500">{formatCurrency(r.discounts)}</td>
                      <td className="p-3 font-semibold text-slate-800">{formatCurrency(r.avg_ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: VALORACIÓN DE INVENTARIO */}
        {activeTab === 'inventario' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700">Estado y Valorización del Almacén</h4>
              <span className="text-xs text-slate-500 font-semibold">Total Productos: {inventorySummary.total_products || 245}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Precio Costo</th>
                    <th className="p-3">Precio Venta</th>
                    <th className="p-3">Valor Total Costo</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryData.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{p.code}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-500">{p.category || 'General'}</td>
                      <td className="p-3 font-extrabold text-slate-900">{p.stock}</td>
                      <td className="p-3 text-slate-600">{formatCurrency(p.cost_price)}</td>
                      <td className="p-3 text-slate-800 font-semibold">{formatCurrency(p.sale_price)}</td>
                      <td className="p-3 font-bold text-[#16a085]">{formatCurrency(p.stock_value)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'agotado' ? 'bg-rose-100 text-rose-700' : p.status === 'bajo' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.status === 'normal' ? 'Normal' : p.status === 'bajo' ? 'Stock Bajo' : 'Agotado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOP PRODUCTOS Y RENTABILIDAD */}
        {activeTab === 'top_productos' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700">Productos con Mayor Margen y Volumen de Ventas</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">Posición</th>
                    <th className="p-3">Producto</th>
                    <th className="p-3">Unidades Vendidas</th>
                    <th className="p-3">Ingreso Total</th>
                    <th className="p-3">Costo Total</th>
                    <th className="p-3">Ganancia Neta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProductsData.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#16a085]">#{i + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 font-bold text-slate-700">{p.total_sold} unidades</td>
                      <td className="p-3 text-slate-800 font-semibold">{formatCurrency(p.total_revenue)}</td>
                      <td className="p-3 text-slate-500">{formatCurrency(p.total_cost)}</td>
                      <td className="p-3 font-extrabold text-emerald-600">{formatCurrency(p.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ARQUEOS Y CAJAS */}
        {activeTab === 'caja' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700">Historial de Turnos y Cierres de Caja</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3">ID Turno</th>
                    <th className="p-3">Cajero</th>
                    <th className="p-3">Apertura</th>
                    <th className="p-3">Monto Inicial</th>
                    <th className="p-3">Ventas Contado</th>
                    <th className="p-3">Monto Cierre</th>
                    <th className="p-3">Diferencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashData.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">#C-00{c.id}</td>
                      <td className="p-3 font-semibold text-slate-800">{c.user_name}</td>
                      <td className="p-3 text-slate-500">{c.opened_at}</td>
                      <td className="p-3 text-slate-700">{formatCurrency(c.initial_amount)}</td>
                      <td className="p-3 font-bold text-[#16a085]">{formatCurrency(c.cash_sales)}</td>
                      <td className="p-3 font-extrabold text-slate-900">{formatCurrency(c.closed_amount)}</td>
                      <td className="p-3 text-emerald-600 font-bold">RD$ 0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Chatbot PharmaPlus Banner Widget */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0 shadow-sm">
              <BotMessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#2c3e50] text-sm">Asistente de Informes PharmaPlus</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Analista Activo
                </span>
              </div>
              <p className="text-xs text-slate-500">¿Qué datos financieros deseas consultar?</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => handleChatAction('Resumen de ventas de este mes')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Ventas de este mes
            </button>
            <button 
              onClick={() => handleChatAction('Top 5 productos más rentables')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Top 5 productos
            </button>
            <button 
              onClick={() => handleChatAction('Margen de ganancia promedio')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Margen de ganancia
            </button>
            <button 
              onClick={() => handleChatAction('Valor total del inventario')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Valor del inventario
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatAction(chatInput)}
            placeholder="Escribe tu consulta analítica..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#16a085] focus:bg-white transition"
          />
          <button
            onClick={() => handleChatAction(chatInput)}
            disabled={chatLoading}
            className="p-2.5 bg-[#16a085] hover:bg-[#12876f] text-white rounded-xl shadow transition shrink-0"
          >
            {chatLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {chatResponse && (
          <div className="p-3.5 bg-[#e8f6f3] rounded-xl border border-teal-100 text-xs text-[#2c3e50] leading-relaxed shadow-inner">
            <span className="font-bold text-[#16a085]">Análisis de IA:</span> {chatResponse}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;
