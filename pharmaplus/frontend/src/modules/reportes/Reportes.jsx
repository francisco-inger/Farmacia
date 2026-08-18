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
  const [selectedCollaborator, setSelectedCollaborator] = useState('all');
  const [collaborators, setCollaborators] = useState([]);

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
  }, [activeTab, period, dateFrom, dateTo, selectedCollaborator]);

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
      if (selectedCollaborator && selectedCollaborator !== 'all') queryParams += `&user_id=${selectedCollaborator}`;

      // Cargar siempre en paralelo los resúmenes globales para que los 4 KPIs superiores nunca queden en 0
      const [salesRes, invRes] = await Promise.all([
        api.get(`/reportes/ventas${queryParams}`),
        api.get('/reportes/inventario')
      ]);

      const salesSummaryData = salesRes?.summary || salesRes?.data?.summary;
      const invSummaryData = invRes?.summary || invRes?.data?.summary;

      if (salesSummaryData) setSalesSummary(salesSummaryData);
      if (invSummaryData) setInventorySummary(invSummaryData);
      if (salesRes?.collaborators) setCollaborators(salesRes.collaborators);

      if (activeTab === 'ventas') {
        const rows = Array.isArray(salesRes?.data) ? salesRes.data : (Array.isArray(salesRes) ? salesRes : []);
        setSalesData(rows);
      } else if (activeTab === 'inventario') {
        const rows = Array.isArray(invRes?.data) ? invRes.data : (Array.isArray(invRes) ? invRes : []);
        setInventoryData(rows);
      } else if (activeTab === 'top_productos') {
        const res = await api.get(`/reportes/top-productos${queryParams}`);
        const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setTopProductsData(rows);
      } else if (activeTab === 'caja') {
        const res = await api.get(`/reportes/caja${queryParams}`);
        const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setCashData(rows);
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
    } else if (activeTab === 'caja') {
      csvContent += 'ID Turno,Cajero,Apertura,Monto Inicial,Ventas Efectivo,Monto Cierre,Estado\n';
      cashData.forEach(c => {
        csvContent += `#C-00${c.id},"${c.user_name}",${c.opened_at},${c.initial_amount},${c.cash_sales || 0},${c.closed_amount || 0},${c.status}\n`;
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

      {/* ─── BANNER SUPERIOR CORPORATIVO REPORTES (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between shrink-0">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          FINANCIAL INTELLIGENCE & PHARMACEUTICAL ANALYTICS
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>ESTADÍSTICAS & INTELIGENCIA DE NEGOCIOS • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Reportes & Analítica Financiera
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl drop-shadow">
              Informes detallados de ventas por periodo, valoración monetaria de inventarios, rentabilidad de medicamentos top y arqueos de caja.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {salesSummary.total_sales ?? 0} Facturas Procesadas
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Margen Real: {salesSummary.profit_margin_percent ?? 0}%
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {selectedCollaborator !== 'all' ? 'Vista por Colaborador' : 'Consolidado Global'}
              </span>
            </div>
          </div>

          {/* Filter Controls & Export Button */}
          <div className="flex flex-wrap items-center gap-2.5 z-10 bg-black/30 p-3 rounded-2xl border border-emerald-300/30 backdrop-blur-md">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3.5 py-2.5 bg-black/40 text-white font-bold border border-emerald-400/30 rounded-xl text-xs focus:outline-none"
            >
              <option value="daily" className="text-slate-800">Vista: Diaria</option>
              <option value="monthly" className="text-slate-800">Vista: Mensual</option>
              <option value="yearly" className="text-slate-800">Vista: Anual</option>
            </select>

            {collaborators.length > 0 && (
              <select
                value={selectedCollaborator}
                onChange={(e) => setSelectedCollaborator(e.target.value)}
                className="px-3.5 py-2.5 bg-black/40 text-white font-bold border border-emerald-400/30 rounded-xl text-xs focus:outline-none"
              >
                <option value="all" className="text-slate-800">Todos los Colaboradores</option>
                {collaborators.map(collab => (
                  <option key={collab.id} value={collab.id} className="text-slate-800">
                    {collab.name} ({collab.role_name || 'Operador'})
                  </option>
                ))}
              </select>
            )}

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3.5 py-2.5 bg-black/40 text-white font-medium border border-emerald-400/30 rounded-xl text-xs focus:outline-none"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3.5 py-2.5 bg-black/40 text-white font-medium border border-emerald-400/30 rounded-xl text-xs focus:outline-none"
            />

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-white text-[#12876f] hover:bg-emerald-50 px-4 py-2.5 rounded-xl text-xs font-black shadow-lg transition active:scale-95"
            >
              <Download size={15} />
              <span>Exportar CSV</span>
            </button>
          </div>

        </div>

      </div>

      {/* ─── 4 TARJETAS KPI LIMPIAS Y ESPACIOSAS REPORTES ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ingresos Totales</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{formatCurrency(salesSummary.total_revenue || 0)}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">✓ {salesSummary.total_sales || 0} transacciones</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShoppingCart size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventas Facturadas</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{salesSummary.total_sales || 0} facturas</h3>
            <p className="text-[11px] text-sky-600 font-semibold mt-0.5">✓ 100% completadas</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{formatCurrency(salesSummary.avg_ticket || 0)}</h3>
            <p className="text-[11px] text-purple-600 font-semibold mt-0.5">✓ Promedio por cliente</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Package size={22} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Valor del Inventario</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{formatCurrency(inventorySummary.total_value || 0)}</h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">✓ Stock valorizado en costo</p>
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
              <span className="text-xs text-slate-500 font-semibold">Total Productos: {inventorySummary.total_products || 0}</span>
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
          <div className="space-y-6">
            <div className="h-72 w-full pt-2">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Ranking de Medicamentos Más Vendidos (Unidades)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                  <RechartsTooltip formatter={(val) => [`${val} unidades`, 'Vendidas']} />
                  <Bar dataKey="total_sold" fill="#3498db" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto pt-4 border-t border-slate-100">
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
