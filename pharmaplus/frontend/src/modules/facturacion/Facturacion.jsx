import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, Printer, AlertTriangle, CheckCircle2, 
  XCircle, Clock, ShieldCheck, DollarSign, Layers, Hash, Calendar, 
  Building, User, ChevronRight, X, RefreshCw, Download, Eye, Ban
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';

const Facturacion = () => {
  const [invoices, setInvoices] = useState([]);
  const [ncfSequences, setNcfSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ncfTypeFilter, setNcfTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNcfModalOpen, setIsNcfModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Create Invoice Form
  const [createForm, setCreateForm] = useState({
    client_name: '',
    rnc_cedula: '',
    ncf_type: 'B02',
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0
  });

  // NCF Types Mapping
  const ncfNames = {
    'B01': 'Factura de Crédito Fiscal',
    'B02': 'Factura de Consumo',
    'B04': 'Nota de Débito',
    'B14': 'Regímenes Especiales',
    'B15': 'Gubernamentales'
  };

  // Fetch Invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/invoices?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      
      const res = await api.get(url);
      if (res.success) {
        let list = res.data || [];
        
        // Client-side filter for search and NCF type if needed
        if (searchTerm.trim()) {
          const lower = searchTerm.toLowerCase();
          list = list.filter(i => 
            (i.invoice_number && i.invoice_number.toLowerCase().includes(lower)) ||
            (i.ncf && i.ncf.toLowerCase().includes(lower)) ||
            (i.client_name && i.client_name.toLowerCase().includes(lower)) ||
            (i.rnc_cedula && i.rnc_cedula.includes(lower))
          );
        }

        if (ncfTypeFilter) {
          list = list.filter(i => i.ncf_type === ncfTypeFilter);
        }

        setInvoices(list);
        setTotal(res.pagination?.total || list.length);
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch NCF Sequences
  const fetchNcfSequences = async () => {
    try {
      const res = await api.get('/invoices/ncf-sequences');
      if (res.success) {
        setNcfSequences(res.data || []);
      }
    } catch (err) {
      console.error('Error cargando secuencias NCF:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchNcfSequences();
  }, [page, limit, statusFilter, ncfTypeFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Handle Calculate Totals in Form
  const handleSubtotalChange = (val) => {
    const sub = parseFloat(val) || 0;
    const itbis = Math.round(sub * 0.18 * 100) / 100;
    const tot = Math.round((sub + itbis - (createForm.discount || 0)) * 100) / 100;
    setCreateForm(prev => ({ ...prev, subtotal: sub, tax: itbis, total: tot }));
  };

  // Handle Create Invoice
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/invoices', createForm);
      if (res.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          client_name: '',
          rnc_cedula: '',
          ncf_type: 'B02',
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0
        });
        fetchInvoices();
        fetchNcfSequences();
        setSelectedInvoice(res.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      alert(err.message || 'Error emitiendo comprobante fiscal');
    }
  };

  // Handle Cancel Invoice
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      await api.post(`/invoices/${selectedInvoice.id}/cancel`, { reason: cancelReason });
      setIsCancelModalOpen(false);
      setCancelReason('');
      fetchInvoices();
    } catch (err) {
      alert(err.message || 'Error anulando factura');
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'emitida':
      case 'pagada':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={13}/> Emitida / DGII OK</span>;
      case 'anulada':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={13}/> Anulada</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock size={13}/> Pendiente</span>;
    }
  };

  // Statistics
  const totalFacturado = invoices.reduce((acc, i) => i.status !== 'anulada' ? acc + (i.total || 0) : acc, 0);
  const facturasEmitidas = invoices.filter(i => i.status !== 'anulada').length;
  const facturasAnuladas = invoices.filter(i => i.status === 'anulada').length;

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pr-1">
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Facturación DGII</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              <ShieldCheck size={14} />
              e-CF Cumplimiento 2026
            </span>
          </div>
          <p className="text-sm text-slate-500">Gestión y emisión de Comprobantes Fiscales Electrónicos (NCF)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNcfModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm"
          >
            <Layers size={18} className="text-indigo-600" />
            <span>Secuencias NCF</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Emitir Comprobante</span>
          </button>
        </div>
      </div>

      {/* ─── KPI SUMMARY CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Facturado</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">RD$ {totalFacturado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        {/* Facturas Emitidas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturas Validadas</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{facturasEmitidas} comprobantes</h3>
          </div>
        </div>

        {/* NCF Disponibles */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Secuencias Activas</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{ncfSequences.filter(s => s.is_active).length} tipos NCF</h3>
          </div>
        </div>

        {/* Facturas Anuladas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Ban size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Facturas Anuladas</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{facturasAnuladas} registros</h3>
          </div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH BAR ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por # Factura, NCF, RNC o Nombre..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Tipo NCF */}
          <select
            value={ncfTypeFilter}
            onChange={(e) => { setNcfTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los Tipos NCF</option>
            <option value="B01">B01 - Crédito Fiscal</option>
            <option value="B02">B02 - Consumo</option>
            <option value="B04">B04 - Nota de Débito</option>
            <option value="B14">B14 - Regímenes Esp.</option>
            <option value="B15">B15 - Gubernamental</option>
          </select>

          {/* Estado */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos los Estados</option>
            <option value="emitida">Emitida / Pagada</option>
            <option value="anulada">Anulada</option>
          </select>

          {(searchTerm || ncfTypeFilter || statusFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setNcfTypeFilter(''); setStatusFilter(''); setPage(1); }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline px-1"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ─── INVOICES TABLE ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4"># Factura</th>
                <th className="py-3.5 px-4">NCF (DGII)</th>
                <th className="py-3.5 px-4">Tipo NCF</th>
                <th className="py-3.5 px-4">Cliente / RNC</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">ITBIS (18%)</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="animate-spin text-indigo-600" size={20} />
                      <span>Cargando comprobantes fiscales...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-slate-600">No se encontraron facturas ni comprobantes</p>
                    <p className="text-xs text-slate-400 mt-1">Intenta ajustando los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Invoice Number */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800 font-mono text-xs">
                      {inv.invoice_number}
                    </td>

                    {/* NCF */}
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600">
                      {inv.ncf || 'Sin NCF'}
                    </td>

                    {/* Tipo NCF */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {inv.ncf_type || 'B02'} - {ncfNames[inv.ncf_type] || 'Consumo'}
                      </span>
                    </td>

                    {/* Cliente / RNC */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-medium text-slate-800 leading-snug">{inv.client_name || 'Cliente Consumo Final'}</p>
                        {inv.rnc_cedula && (
                          <p className="text-[11px] font-mono text-slate-400">RNC: {inv.rnc_cedula}</p>
                        )}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(inv.issued_at).toLocaleDateString('es-DO')}
                    </td>

                    {/* ITBIS */}
                    <td className="py-3.5 px-4 text-slate-600">
                      RD$ {(inv.tax || 0).toFixed(2)}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      RD$ {(inv.total || 0).toFixed(2)}
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSelectedInvoice(inv); setIsDetailModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Ver Comprobante Fiscal"
                        >
                          <Eye size={16} />
                        </button>

                        {inv.status !== 'anulada' && (
                          <button
                            onClick={() => { setSelectedInvoice(inv); setIsCancelModalOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Anular Factura"
                          >
                            <Ban size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: COMPROBANTE FISCAL DETALLE (DGII VOUCHER) ────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Comprobante Fiscal Electrónico (DGII)"
        maxWidth="max-w-md"
      >
        {selectedInvoice && (
          <div className="flex flex-col gap-4 text-slate-800 text-xs">
            {/* Header Voucher */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <h2 className="font-bold text-slate-900 text-base uppercase">PharmaPlus SRL</h2>
              <p className="text-slate-500 font-mono">RNC: 130-00001-1</p>
              <p className="text-slate-500">Av. 27 de Febrero #123, Santo Domingo</p>
              <p className="text-slate-500">Tel: 809-555-0000</p>
              
              <div className="my-3 border-t border-dashed border-slate-300"></div>

              <span className="font-bold text-indigo-700 text-sm block">
                {ncfNames[selectedInvoice.ncf_type] || 'Factura de Consumo'}
              </span>
              <p className="font-mono text-sm font-bold text-slate-900 mt-1">NCF: {selectedInvoice.ncf || 'B0200000001'}</p>
              <p className="text-slate-400 font-mono text-[11px]">Número Interno: {selectedInvoice.invoice_number}</p>
            </div>

            {/* Datos Cliente */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <p><span className="font-semibold text-slate-500">Cliente:</span> {selectedInvoice.client_name || 'Consumidor Final'}</p>
              {selectedInvoice.rnc_cedula && (
                <p><span className="font-semibold text-slate-500">RNC/Cédula Cliente:</span> {selectedInvoice.rnc_cedula}</p>
              )}
              <p><span className="font-semibold text-slate-500">Fecha de Emisión:</span> {new Date(selectedInvoice.issued_at).toLocaleString('es-DO')}</p>
            </div>

            {/* Totales */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Net:</span>
                <span>RD$ {(selectedInvoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ITBIS (18%):</span>
                <span>RD$ {(selectedInvoice.tax || 0).toFixed(2)}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento:</span>
                  <span>- RD$ {selectedInvoice.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900 text-sm">
                <span>TOTAL A PAGAR:</span>
                <span className="text-indigo-700">RD$ {(selectedInvoice.total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Status */}
            <div className="text-center pt-2">
              {getStatusBadge(selectedInvoice.status)}
              <p className="text-[10px] text-slate-400 mt-2">Documento verificado conforme a la Norma General DGII República Dominicana</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => window.print()}
                className="btn btn-outline text-xs inline-flex items-center gap-1.5"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="btn btn-primary text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: GESTOR DE SECUENCIAS NCF (DGII) ─────────────────────────── */}
      <Modal
        isOpen={isNcfModalOpen}
        onClose={() => setIsNcfModalOpen(false)}
        title="Secuencias de Comprobantes Fiscales (NCF)"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Secuencias autorizadas por la Dirección General de Impuestos Internos (DGII) para PharmaPlus SRL.
          </p>

          <div className="space-y-3">
            {ncfSequences.map((seq) => {
              const pct = Math.min(100, Math.round((seq.current_sequence / seq.max_sequence) * 100));
              return (
                <div key={seq.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 text-sm">{seq.ncf_type}</span>
                      <span className="text-xs font-semibold text-slate-800 ml-2">{seq.ncf_type_name}</span>
                    </div>
                    <span className="text-xs text-slate-500">Vence: {new Date(seq.expiry_date).toLocaleDateString('es-DO')}</span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Secuencia actual: <strong className="font-mono text-slate-900">{seq.prefix}{String(seq.current_sequence).padStart(8, '0')}</strong></span>
                    <span>Límite: <strong className="font-mono text-slate-900">{seq.max_sequence}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-2">
            <button onClick={() => setIsNcfModalOpen(false)} className="btn btn-outline text-xs">
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: EMITIR NUEVA FACTURA / NCF ───────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Emitir Comprobante Fiscal NCF"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Tipo de Comprobante NCF *</label>
            <select
              required
              className="input text-sm"
              value={createForm.ncf_type}
              onChange={(e) => setCreateForm({ ...createForm, ncf_type: e.target.value })}
            >
              <option value="B02">B02 - Factura de Consumo</option>
              <option value="B01">B01 - Factura de Crédito Fiscal</option>
              <option value="B04">B04 - Nota de Débito</option>
              <option value="B14">B14 - Regímenes Especiales</option>
              <option value="B15">B15 - Gubernamental</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Nombre del Cliente / Razón Social</label>
            <input
              type="text"
              placeholder="Ej. Farmacéutica Dominicana SRL"
              className="input text-sm"
              value={createForm.client_name}
              onChange={(e) => setCreateForm({ ...createForm, client_name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">RNC o Cédula del Cliente</label>
            <input
              type="text"
              placeholder="101-12345-6"
              className="input text-sm font-mono"
              value={createForm.rnc_cedula}
              onChange={(e) => setCreateForm({ ...createForm, rnc_cedula: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Monto Subtotal (RD$) *</label>
            <input
              required
              type="number"
              step="0.01"
              min="1"
              className="input text-sm font-bold"
              value={createForm.subtotal || ''}
              onChange={(e) => handleSubtotalChange(e.target.value)}
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span>ITBIS Calculado (18%):</span>
              <span className="font-bold">RD$ {createForm.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-indigo-700 text-sm pt-1 border-t border-slate-200">
              <span>Monto Total NCF:</span>
              <span>RD$ {createForm.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              Generar NCF y Emitir
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: ANULAR FACTURA ───────────────────────────────────────────── */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Anular Comprobante Fiscal"
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleCancelSubmit} className="flex flex-col gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={20} />
          </div>

          <p className="text-xs text-slate-600 text-center">
            Se registrará la anulación del comprobante NCF <strong className="font-mono">{selectedInvoice?.ncf}</strong> ante la auditoría del sistema.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Motivo de Anulación *</label>
            <textarea
              required
              rows={3}
              placeholder="Ej. Devolución de mercancía / Error en RNC"
              className="input text-xs"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <div className="flex justify-center gap-3 mt-2">
            <button type="button" onClick={() => setIsCancelModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors">
              Confirmar Anulación
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Facturacion;
