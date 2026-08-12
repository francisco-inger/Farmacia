import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, DollarSign, ShoppingCart, Package, AlertTriangle, Download, Calendar, Filter, RefreshCw, Award, Wallet, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function Reportes() {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Data states
  const [salesData, setSalesData] = useState({ data: [], summary: {} });
  const [inventoryData, setInventoryData] = useState({ data: [], summary: {} });
  const [topProducts, setTopProducts] = useState([]);
  const [cashData, setCashData] = useState([]);

  // Fetch report data
  const fetchReports = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const params = { period, date_from: dateFrom, date_to: dateTo };

    try {
      if (activeTab === 'sales') {
        const res = await axios.get(`${API_BASE}/reports/sales`, { headers, params });
        setSalesData(res.data);
      } else if (activeTab === 'inventory') {
        const res = await axios.get(`${API_BASE}/reports/inventory`, { headers });
        setInventoryData(res.data);
      } else if (activeTab === 'top') {
        const res = await axios.get(`${API_BASE}/reports/top-products`, { headers, params: { ...params, limit: 10 } });
        setTopProducts(res.data.data || []);
      } else if (activeTab === 'cash') {
        const res = await axios.get(`${API_BASE}/reports/cash`, { headers, params });
        setCashData(res.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, period]);

  // Export CSV Helper
  const exportToCSV = (filename, data) => {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csvRows = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${row[k] ?? ''}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={28} />
            Informes y Reportes Analíticos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Análisis financiero, volumen de ventas, rendimiento de productos y estado del inventario
          </p>
        </div>
        
        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchReports} 
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          
          <button 
            onClick={() => {
              if (activeTab === 'sales') exportToCSV('reporte_ventas', salesData.data);
              if (activeTab === 'inventory') exportToCSV('reporte_inventario', inventoryData.data);
              if (activeTab === 'top') exportToCSV('top_productos', topProducts);
              if (activeTab === 'cash') exportToCSV('reporte_cajas', cashData);
            }} 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-3 rounded-t-xl">
        {[
          { id: 'sales', label: 'Reporte de Ventas', icon: ShoppingCart },
          { id: 'inventory', label: 'Inventario y Valoración', icon: Package },
          { id: 'top', label: 'Top Productos y Ganancias', icon: Award },
          { id: 'cash', label: 'Cajas y Cierres', icon: Wallet },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
                isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar */}
      {(activeTab === 'sales' || activeTab === 'top' || activeTab === 'cash') && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-700">Filtros:</span>
          </div>

          {activeTab === 'sales' && (
            <div className="flex items-center gap-2">
              <label className="text-gray-600 font-medium">Periodo:</label>
              <select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Diario</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <label className="text-gray-600 font-medium">Desde:</label>
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-gray-600 font-medium">Hasta:</label>
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button 
            onClick={fetchReports}
            className="px-4 py-1.5 bg-gray-900 text-white hover:bg-black rounded-lg font-medium transition-colors"
          >
            Aplicar Filtro
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-500">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
          <p className="font-medium">Generando reporte analítico...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: REPORTE DE VENTAS */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">RD$ {(salesData.summary?.total_revenue || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total de Transacciones</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{salesData.summary?.total_sales || 0}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShoppingCart size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">RD$ {(salesData.summary?.avg_ticket || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descuentos Aplicados</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">RD$ {(salesData.summary?.total_discounts || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <ArrowDownRight size={24} />
                  </div>
                </div>
              </div>

              {/* Sales Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Comportamiento de Ventas ({period.toUpperCase()})</h3>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData.data || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                      <Tooltip formatter={(val, name) => [name === 'revenue' ? `RD$ ${val.toLocaleString()}` : val, name === 'revenue' ? 'Ingresos' : 'Transacciones']} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" name="Ingresos (RD$)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="transactions" name="Transacciones" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Desglose Detallado por Periodo</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3">Periodo</th>
                        <th className="px-6 py-3">Transacciones</th>
                        <th className="px-6 py-3">Ingresos Totales</th>
                        <th className="px-6 py-3">Descuentos</th>
                        <th className="px-6 py-3">Ticket Promedio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {salesData.data && salesData.data.length > 0 ? (
                        salesData.data.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-medium text-gray-900">{row.period}</td>
                            <td className="px-6 py-3">{row.transactions}</td>
                            <td className="px-6 py-3 font-bold text-gray-900">RD$ {(row.revenue || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-3 text-amber-600">RD$ {(row.discounts || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-3">RD$ {(row.avg_ticket || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-400">No hay ventas registradas en este periodo</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTARIO Y VALORACIÓN */}
          {activeTab === 'inventory' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor en Almacén (Costo)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">RD$ {(inventoryData.summary?.total_value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <Package size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Proyectado (Venta)</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">RD$ {(inventoryData.summary?.total_sale_value || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Bajo (Alerta)</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{inventoryData.summary?.low_stock || 0} productos</p>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agotados</p>
                    <p className="text-2xl font-bold text-rose-600 mt-1">{inventoryData.summary?.out_of_stock || 0} productos</p>
                  </div>
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              {/* Table Products List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900 flex justify-between items-center">
                  <span>Valoración por Producto e Inventario</span>
                  <span className="text-xs text-gray-500 font-normal">Total productos activos: {inventoryData.summary?.total_products || 0}</span>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-6 py-3">Producto</th>
                        <th className="px-6 py-3">Categoría</th>
                        <th className="px-6 py-3">Stock Actual</th>
                        <th className="px-6 py-3">Costo Unitario</th>
                        <th className="px-6 py-3">Precio Venta</th>
                        <th className="px-6 py-3">Valor Total (Costo)</th>
                        <th className="px-6 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventoryData.data && inventoryData.data.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3">
                            <div className="font-semibold text-gray-900">{p.name}</div>
                            <div className="text-xs text-gray-400">{p.code}</div>
                          </td>
                          <td className="px-6 py-3 text-gray-600">{p.category || 'Sin categoría'}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{p.stock}</td>
                          <td className="px-6 py-3">RD$ {p.cost_price?.toFixed(2)}</td>
                          <td className="px-6 py-3">RD$ {p.sale_price?.toFixed(2)}</td>
                          <td className="px-6 py-3 font-bold text-gray-900">RD$ {(p.stock_value || 0).toFixed(2)}</td>
                          <td className="px-6 py-3">
                            {p.status === 'agotado' && <span className="bg-rose-100 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">Agotado</span>}
                            {p.status === 'bajo' && <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">Stock Bajo</span>}
                            {p.status === 'normal' && <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium">Normal</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOP PRODUCTOS Y GANANCIAS */}
          {activeTab === 'top' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Productos Más Vendidos y Rentables</h3>
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip formatter={(val, name) => [name === 'profit' ? `RD$ ${val.toLocaleString()}` : val, name === 'profit' ? 'Ganancia Neta' : 'Unidades Vendidas']} />
                      <Legend />
                      <Bar dataKey="total_sold" name="Unidades Vendidas" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="profit" name="Ganancia (RD$)" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table Top Products */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Tabla de Rendimiento de Productos</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3">Posición</th>
                        <th className="px-6 py-3">Producto</th>
                        <th className="px-6 py-3">Unidades Vendidas</th>
                        <th className="px-6 py-3">Ingresos Generados</th>
                        <th className="px-6 py-3">Costo Total</th>
                        <th className="px-6 py-3">Ganancia Neta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topProducts.length > 0 ? (
                        topProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-bold text-gray-400">#{idx + 1}</td>
                            <td className="px-6 py-3 font-semibold text-gray-900">{p.name} ({p.code})</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{p.total_sold}</td>
                            <td className="px-6 py-3 font-semibold text-gray-900">RD$ {(p.total_revenue || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-3 text-gray-500">RD$ {(p.total_cost || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-3 font-bold text-emerald-600">+ RD$ {(p.profit || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-400">No se encontraron productos vendidos en este rango</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAJAS Y CIERRES */}
          {activeTab === 'cash' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 font-bold text-gray-900">Historial de Cajas y Cierres de Turno</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3">ID Caja</th>
                        <th className="px-6 py-3">Usuario</th>
                        <th className="px-6 py-3">Apertura</th>
                        <th className="px-6 py-3">Cierre</th>
                        <th className="px-6 py-3">Monto Inicial</th>
                        <th className="px-6 py-3">Ventas Calculadas</th>
                        <th className="px-6 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cashData.length > 0 ? (
                        cashData.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3 font-bold text-gray-900">#CAJA-{c.id}</td>
                            <td className="px-6 py-3 font-medium text-gray-900">{c.user_name}</td>
                            <td className="px-6 py-3 text-gray-500">{new Date(c.opened_at).toLocaleString()}</td>
                            <td className="px-6 py-3 text-gray-500">{c.closed_at ? new Date(c.closed_at).toLocaleString() : 'En curso'}</td>
                            <td className="px-6 py-3 font-medium">RD$ {(c.initial_amount || 0).toFixed(2)}</td>
                            <td className="px-6 py-3 font-bold text-gray-900">RD$ {(c.calculated_cash || 0).toFixed(2)}</td>
                            <td className="px-6 py-3">
                              {c.status === 'open' ? (
                                <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">Abierta</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">Cerrada</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400">No hay turnos de caja registrados en este rango</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
