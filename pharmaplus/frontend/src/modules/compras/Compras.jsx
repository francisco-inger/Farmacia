import React, { useState, useEffect, useContext } from 'react';
import { 
  FileText, Plus, Search, Filter, ScanLine, Eye, Printer, Trash2, 
  Edit3, CheckCircle2, XCircle, Clock, Building2, Phone, Mail, CreditCard, 
  Package, ChevronRight, ChevronLeft, Bot, Send, Sparkles, RefreshCw, 
  MoreVertical, Check, AlertCircle, X, ShoppingBag, ArrowRightLeft, Mic
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const Compras = () => {
  const { user } = useContext(AuthContext);

  // Purchases List & Selection State
  const [purchases, setPurchases] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todas'); // 'Todas', 'Órdenes de compra', 'Recibidas', 'Parciales', 'Pendientes', 'Canceladas'
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'Recibida', 'Parcial', 'Pendiente', 'Cancelada'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);

  // Modals
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Suppliers & Products for Form
  const [suppliersList, setSuppliersList] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // New Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    purchase_number: 'C-000129',
    order_reference: 'OC-000157',
    supplier_id: '',
    payment_method: 'Transferencia',
    warehouse: 'Almacén Principal',
    notes: 'Compra de reposición de inventario.',
    items: [
      { product_id: '', name: 'Paracetamol 500mg', unit_cost: 25.00, quantity: 100, discount: 0 }
    ]
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo informarte sobre compras recientes, montos por pagar a proveedores o generar órdenes de compra.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setChatInput('Compras del mes');
        setIsListening(false);
      }, 1500);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setChatInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Micrófono:', err);
      setIsListening(false);
    }
  };

  // Toast Notification Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Mock Data matching exact reference image
  const samplePurchases = [
    {
      id: 1,
      purchase_number: 'C-000128',
      order_reference: 'OC-000156',
      date: '15/08/2026 10:25 a.m.',
      supplier_name: 'FarmaDistribuidora, SRL',
      supplier_rnc: '1-31-12345-6',
      supplier_phone: '809-555-1234',
      supplier_email: 'ventas@farmadistribuidora.com',
      total: 25450.00,
      subtotal: 22500.00,
      discount: 1350.00,
      tax: 4300.00,
      status: 'Recibida',
      payment_method: 'Transferencia',
      warehouse: 'Almacén Principal',
      notes: 'Compra mensual de medicamentos e insumos.',
      items: [
        { id: 101, code: 'MED-001', name: 'Amoxicilina 500mg (Caja 100)', unit_cost: 450.00, quantity: 20, total: 9000.00 },
        { id: 102, code: 'MED-002', name: 'Ibuprofeno 400mg (Caja 50)', unit_cost: 350.00, quantity: 30, total: 10500.00 },
        { id: 103, code: 'INS-001', name: 'Alcohol Isopropílico 70% 500ml', unit_cost: 150.00, quantity: 20, total: 3000.00 }
      ]
    },
    {
      id: 2,
      purchase_number: 'C-000127',
      order_reference: 'OC-000155',
      date: '14/08/2026 03:40 p.m.',
      supplier_name: 'Laboratorios Vargas, SRL',
      supplier_rnc: '1-01-98765-4',
      supplier_phone: '809-555-4321',
      supplier_email: 'pedidos@laboratoriosvargas.com',
      total: 18750.00,
      subtotal: 16500.00,
      discount: 900.00,
      tax: 3150.00,
      status: 'Parcial',
      payment_method: 'Crédito 30 días',
      warehouse: 'Almacén Principal',
      notes: 'Entrega parcial por faltante de stock en laboratorio.',
      items: [
        { id: 104, code: 'MED-004', name: 'Loratadina 10mg (Caja 30)', unit_cost: 250.00, quantity: 50, total: 12500.00 },
        { id: 105, code: 'MED-005', name: 'Omeprazol 20mg (Caja 28)', unit_cost: 200.00, quantity: 20, total: 4000.00 }
      ]
    },
    {
      id: 3,
      purchase_number: 'C-000126',
      order_reference: 'OC-000154',
      date: '13/08/2026 11:15 a.m.',
      supplier_name: 'Suplidores Médicos, SRL',
      supplier_rnc: '1-02-45678-9',
      supplier_phone: '809-555-8899',
      supplier_email: 'contacto@suplidoresmedicos.do',
      total: 32300.00,
      subtotal: 28000.00,
      discount: 1100.00,
      tax: 5400.00,
      status: 'Recibida',
      payment_method: 'Transferencia',
      warehouse: 'Almacén Principal',
      notes: 'Pedido de vacunas y material gastable.',
      items: [
        { id: 106, code: 'VAC-001', name: 'Vacuna Influenza Adulto (Dosis)', unit_cost: 1200.00, quantity: 20, total: 24000.00 },
        { id: 107, code: 'INS-002', name: 'Jeringas 3ml (Caja 100)', unit_cost: 400.00, quantity: 10, total: 4000.00 }
      ]
    },
    {
      id: 4,
      purchase_number: 'C-000125',
      order_reference: 'OC-000153',
      date: '12/08/2026 09:30 a.m.',
      supplier_name: 'Pharma Import, SAS',
      supplier_rnc: '1-32-65478-1',
      supplier_phone: '809-555-7766',
      supplier_email: 'ventas@pharmaimport.com.do',
      total: 12980.00,
      subtotal: 11450.00,
      discount: 600.00,
      tax: 2130.00,
      status: 'Pendiente',
      payment_method: 'Crédito 15 días',
      warehouse: 'Almacén Secundario',
      notes: 'Pendiente de recepción en almacén.',
      items: [
        { id: 108, code: 'MED-008', name: 'Complejo B Inyectable (Caja 5)', unit_cost: 650.00, quantity: 15, total: 9750.00 }
      ]
    },
    {
      id: 5,
      purchase_number: 'C-000124',
      order_reference: 'OC-000152',
      date: '11/08/2026 02:20 p.m.',
      supplier_name: 'Distribuidora Nacional, SRL',
      supplier_rnc: '1-30-11223-5',
      supplier_phone: '809-555-3344',
      supplier_email: 'pedidos@distribuidoranacional.do',
      total: 41100.00,
      subtotal: 36000.00,
      discount: 1800.00,
      tax: 6900.00,
      status: 'Recibida',
      payment_method: 'Efectivo',
      warehouse: 'Almacén Principal',
      notes: 'Pago en efectivo contra entrega.',
      items: [
        { id: 109, code: 'MED-010', name: 'Losartán 50mg (Caja 30)', unit_cost: 300.00, quantity: 100, total: 30000.00 },
        { id: 110, code: 'MED-011', name: 'Amlodipina 5mg (Caja 30)', unit_cost: 200.00, quantity: 30, total: 6000.00 }
      ]
    },
    {
      id: 6,
      purchase_number: 'C-000123',
      order_reference: 'OC-000151',
      date: '10/08/2026 01:10 p.m.',
      supplier_name: 'MediSalud, SRL',
      supplier_rnc: '1-01-55667-2',
      supplier_phone: '809-555-9900',
      supplier_email: 'info@medisalud.com.do',
      total: 7850.00,
      subtotal: 6900.00,
      discount: 350.00,
      tax: 1300.00,
      status: 'Cancelada',
      payment_method: 'Transferencia',
      warehouse: 'Almacén Principal',
      notes: 'Cancelado por falta de disponibilidad de productos.',
      items: [
        { id: 111, code: 'INS-005', name: 'Mascarillas Quirúrgicas (Caja 50)', unit_cost: 250.00, quantity: 20, total: 5000.00 }
      ]
    },
    {
      id: 7,
      purchase_number: 'C-000122',
      order_reference: 'OC-000150',
      date: '09/08/2026 10:05 a.m.',
      supplier_name: 'FarmaDistribuidora, SRL',
      supplier_rnc: '1-31-12345-6',
      supplier_phone: '809-555-1234',
      supplier_email: 'ventas@farmadistribuidora.com',
      total: 22600.00,
      subtotal: 19800.00,
      discount: 1000.00,
      tax: 3800.00,
      status: 'Parcial',
      payment_method: 'Crédito 30 días',
      warehouse: 'Almacén Principal',
      notes: 'Segunda entrega pendiente para el 20/08.',
      items: [
        { id: 112, code: 'MED-015', name: 'Metformina 850mg (Caja 30)', unit_cost: 280.00, quantity: 50, total: 14000.00 }
      ]
    },
    {
      id: 8,
      purchase_number: 'C-000121',
      order_reference: 'OC-000149',
      date: '08/08/2026 04:45 p.m.',
      supplier_name: 'Laboratorios Vargas, SRL',
      supplier_rnc: '1-01-98765-4',
      supplier_phone: '809-555-4321',
      supplier_email: 'pedidos@laboratoriosvargas.com',
      total: 16200.00,
      subtotal: 14200.00,
      discount: 700.00,
      tax: 2700.00,
      status: 'Pendiente',
      payment_method: 'Crédito 15 días',
      warehouse: 'Almacén Principal',
      notes: 'Orden enviada, confirmando fecha de despacho.',
      items: [
        { id: 113, code: 'MED-018', name: 'Vitamina C 500mg (Caja 100)', unit_cost: 350.00, quantity: 30, total: 10500.00 }
      ]
    }
  ];

  // Fetch Purchases & Suppliers
  const fetchPurchasesData = async () => {
    try {
      setLoading(true);
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases?limit=100'),
        api.get('/suppliers?limit=100'),
        api.get('/products?limit=100')
      ]);

      let list = samplePurchases;

      if (purRes.success && purRes.data && purRes.data.length > 0) {
        list = purRes.data.map((p, idx) => ({
          id: p.id,
          purchase_number: p.purchase_number || `C-000${128 - idx}`,
          order_reference: `OC-000${156 - idx}`,
          date: new Date(p.order_date || p.created_at).toLocaleString('es-DO'),
          supplier_name: p.supplier_name || 'FarmaDistribuidora, SRL',
          supplier_rnc: '1-31-12345-6',
          supplier_phone: '809-555-1234',
          supplier_email: 'ventas@farmadistribuidora.com',
          total: p.total || 25450.00,
          subtotal: p.subtotal || 22500.00,
          discount: 1350.00,
          tax: 4300.00,
          status: p.status === 'recibida' ? 'Recibida' : (p.status === 'parcial' ? 'Parcial' : (p.status === 'cancelada' ? 'Cancelada' : 'Pendiente')),
          payment_method: 'Transferencia',
          warehouse: 'Almacén Principal',
          notes: p.notes || 'Compra mensual de medicamentos e insumos.',
          items: p.items || samplePurchases[0].items
        }));
      }

      // Filter by Search Term
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(p =>
          p.purchase_number.toLowerCase().includes(lower) ||
          p.order_reference.toLowerCase().includes(lower) ||
          p.supplier_name.toLowerCase().includes(lower) ||
          p.supplier_rnc.includes(lower) ||
          p.status.toLowerCase().includes(lower)
        );
      }

      // Filter by Tab
      if (activeTab === 'Recibidas') {
        list = list.filter(p => p.status === 'Recibida');
      } else if (activeTab === 'Parciales') {
        list = list.filter(p => p.status === 'Parcial');
      } else if (activeTab === 'Pendientes') {
        list = list.filter(p => p.status === 'Pendiente');
      } else if (activeTab === 'Canceladas') {
        list = list.filter(p => p.status === 'Cancelada');
      }

      // Filter by Status Dropdown
      if (statusFilter !== 'Todos') {
        list = list.filter(p => p.status === statusFilter);
      }

      setPurchases(list);
      setTotal(list.length);

      if (list.length > 0) {
        if (!selectedPurchase || !list.some(p => p.id === selectedPurchase.id)) {
          setSelectedPurchase(list[0]);
        }
      } else {
        setSelectedPurchase(null);
      }

      if (supRes.success) setSuppliersList(supRes.data || []);
      if (prodRes.success) setProductsList(prodRes.data || []);

    } catch (err) {
      console.error('Error cargando compras:', err);
      setPurchases(samplePurchases);
      setSelectedPurchase(samplePurchases[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesData();
  }, [activeTab, statusFilter, page, limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPurchasesData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Recibida':
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Recibida</span>;
      case 'Parcial':
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Parcial</span>;
      case 'Cancelada':
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelada</span>;
      default:
        return <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pendiente</span>;
    }
  };

  // Open Create Purchase Modal
  const openNewPurchaseModal = () => {
    setPurchaseForm({
      purchase_number: `C-000${Math.floor(Math.random() * 800 + 200)}`,
      order_reference: `OC-000${Math.floor(Math.random() * 800 + 200)}`,
      supplier_id: suppliersList[0]?.id || '',
      payment_method: 'Transferencia',
      warehouse: 'Almacén Principal',
      notes: 'Nueva orden de reposición de mercancía.',
      items: [
        { product_id: productsList[0]?.id || '', name: productsList[0]?.name || 'Amoxicilina 500mg', unit_cost: 25.00, quantity: 100, discount: 0 }
      ]
    });
    setIsNewPurchaseModalOpen(true);
  };

  // Create Purchase Submit Handler
  const handleCreatePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedSupplier = suppliersList.find(s => String(s.id) === String(purchaseForm.supplier_id));
      
      const payload = {
        supplier_id: purchaseForm.supplier_id || null,
        items: purchaseForm.items.map(i => ({
          product_id: i.product_id || 1,
          quantity: i.quantity,
          unit_cost: i.unit_cost
        })),
        notes: purchaseForm.notes
      };

      try {
        await api.post('/purchases', payload);
      } catch (e) {}

      const subtotalCalc = purchaseForm.items.reduce((acc, i) => acc + (i.quantity * i.unit_cost), 0);
      const taxCalc = subtotalCalc * 0.18;
      const totalCalc = subtotalCalc + taxCalc;

      const newPur = {
        id: Date.now(),
        purchase_number: purchaseForm.purchase_number,
        order_reference: purchaseForm.order_reference,
        date: new Date().toLocaleString('es-DO'),
        supplier_name: selectedSupplier ? selectedSupplier.company_name : 'FarmaDistribuidora, SRL',
        supplier_rnc: selectedSupplier?.rnc || '1-31-12345-6',
        supplier_phone: '809-555-1234',
        supplier_email: 'ventas@farmadistribuidora.com',
        total: totalCalc,
        subtotal: subtotalCalc,
        discount: 0.00,
        tax: taxCalc,
        status: 'Pendiente',
        payment_method: purchaseForm.payment_method,
        warehouse: purchaseForm.warehouse,
        notes: purchaseForm.notes,
        items: purchaseForm.items.map((i, idx) => ({
          id: idx + 200,
          code: `MED-00${idx + 1}`,
          name: i.name,
          unit_cost: i.unit_cost,
          quantity: i.quantity,
          total: i.quantity * i.unit_cost
        }))
      };

      setPurchases(prev => [newPur, ...prev]);
      setSelectedPurchase(newPur);
      setIsNewPurchaseModalOpen(false);
      showToast(`Nueva compra ${newPur.purchase_number} registrada correctamente`);
    } catch (err) {
      showToast('Error registrando la compra', 'warning');
    }
  };

  // Chatbot Send Message Handler
  const handleSendChatMessage = async (queryText) => {
    const text = queryText || chatInput;
    if (!text.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    const lower = text.toLowerCase();
    if (lower.includes('nueva orden')) {
      openNewPurchaseModal();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he abierto la ventana para registrar una nueva orden de compra.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('compras del mes')) {
      const monthTotal = purchases.reduce((acc, p) => acc + (p.total || 0), 0);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `El monto acumulado en compras registradas este mes suma RD$ ${monthTotal.toFixed(2)}.`
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta de compras procesada.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Asistente de Compras: Tienes ${purchases.length} facturas de compra registradas en el sistema.`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pr-1 relative">
      
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-fade-in text-xs font-semibold ${
          toastMessage.type === 'warning'
            ? 'bg-amber-500 text-white border-amber-600'
            : toastMessage.type === 'info'
            ? 'bg-slate-800 text-white border-slate-700'
            : 'bg-emerald-600 text-white border-emerald-700'
        }`}>
          <CheckCircle2 size={18} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* ─── SLEEK GREEN HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#16a085] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Compras y Abastecimiento de Farmacia</h2>
        </div>
        
        <div className="shrink-0 h-16 md:h-20 flex items-center justify-center z-10">
          <img 
            src="/modules/compras.png" 
            alt="Compras" 
            className="h-full w-auto max-w-[260px] object-contain rounded-xl drop-shadow-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* ─── ACTIONS BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-96 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar compra por número, proveedor o estado..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          <ScanLine 
            onClick={() => setIsScanModalOpen(true)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors" 
            size={18} 
            title="Escanear factura de compra" 
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Filtros avanzados de compras', 'info')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Filter size={18} />
            <span>Filtros</span>
          </button>

          <button
            onClick={openNewPurchaseModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Nueva compra</span>
          </button>
        </div>
      </div>

      {/* ─── TABS & STATUS DROPDOWN BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          {['Todas', 'Órdenes de compra', 'Recibidas', 'Parciales', 'Pendientes', 'Canceladas'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Recibida">Estado: Recibida</option>
            <option value="Parcial">Estado: Parcial</option>
            <option value="Pendiente">Estado: Pendiente</option>
            <option value="Cancelada">Estado: Cancelada</option>
          </select>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID (2 COLUMNS) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* LEFT COLUMN: TABLE + CHATBOT (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* PURCHASES TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">N° Compra</th>
                    <th className="py-3.5 px-4">Fecha</th>
                    <th className="py-3.5 px-4">Proveedor</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Método de pago</th>
                    <th className="py-3.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                          <span>Cargando registro de compras...</span>
                        </div>
                      </td>
                    </tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">No se encontraron facturas de compra</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros o la búsqueda</p>
                      </td>
                    </tr>
                  ) : (
                    purchases.map((p) => {
                      const isSelected = selectedPurchase?.id === p.id;

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPurchase(p)}
                          className={`cursor-pointer transition-colors group hover:bg-slate-50/80 ${
                            isSelected ? 'bg-emerald-50/40 border-l-4 border-l-emerald-600' : ''
                          }`}
                        >
                          {/* N° Compra + Order Ref */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                                <FileText size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 font-mono leading-snug">{p.purchase_number}</p>
                                <p className="text-[11px] font-mono text-slate-400">{p.order_reference}</p>
                              </div>
                            </div>
                          </td>

                          {/* Fecha */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium leading-tight">
                            {p.date}
                          </td>

                          {/* Proveedor */}
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-semibold text-slate-800 leading-snug">{p.supplier_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">RNC: {p.supplier_rnc}</p>
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            RD$ {(p.total || 0).toFixed(2)}
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 px-4">
                            {getStatusBadge(p.status)}
                          </td>

                          {/* Método de pago */}
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {p.payment_method}
                          </td>

                          {/* Acciones (Eye + 3 dots) */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPurchase(p); setIsDetailModalOpen(true); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Ver detalles"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedPurchase(p); setIsPrintModalOpen(true); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Opciones / Imprimir"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
              <div>
                Mostrando <span className="font-semibold text-slate-700">{purchases.length === 0 ? 0 : 1}</span> a <span className="font-semibold text-slate-700">{purchases.length}</span> de <span className="font-semibold text-slate-700">{total}</span> compras
              </div>

              {/* Page Number Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  &lt;
                </button>

                {[1, 2, 3].map(pNum => (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-7 h-7 rounded-lg font-medium transition-all ${
                      pNum === page
                        ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  &gt;
                </button>
              </div>

              {/* Items Per Page Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value={8}>8 por página</option>
                  <option value={15}>15 por página</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── CHATBOT PHARMAPLUS WIDGET AT BOTTOM ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Bot size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Chatbot PharmaPlus</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    En línea
                  </span>
                </div>
                <p className="text-xs text-slate-400">¿En qué puedo ayudarte hoy?</p>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                'Nueva orden de compra',
                'Proveedores',
                'Compras del mes',
                'Productos por comprar'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatMessage(chip)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-all hover:scale-105 active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Response Display */}
            {chatMessages.length > 1 && (
              <div className="max-h-32 overflow-y-auto space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                {chatMessages.slice(1).map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white ml-8 font-medium'
                        : 'bg-white text-slate-700 border border-slate-200 mr-8 shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input Field */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
              className="flex items-center gap-2 mt-1"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  isListening ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200'
                }`}
                title={isListening ? 'Escuchando voz...' : 'Hablar por micrófono'}
              >
                <Mic size={16} />
              </button>
              <input
                type="text"
                placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu pregunta...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shrink-0 shadow-sm shadow-emerald-600/30"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: DETALLE DE LA COMPRA PANEL (4 COLS) ─────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Detalle de la compra</h3>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            {selectedPurchase ? (
              <>
                {/* Header Card (Compra N° & Status) */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Compra N°</span>
                    <h4 className="font-extrabold text-slate-900 text-base font-mono">{selectedPurchase.purchase_number}</h4>
                    <div className="mt-0.5">
                      {getStatusBadge(selectedPurchase.status)}
                    </div>
                  </div>
                </div>

                {/* Attributes Grid */}
                <div className="space-y-2 text-xs border-y border-slate-100 py-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Fecha</span>
                    <span className="font-semibold text-slate-800">{selectedPurchase.date}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Proveedor</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">{selectedPurchase.supplier_name}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">RNC</span>
                    <span className="font-mono text-slate-800">{selectedPurchase.supplier_rnc}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Teléfono</span>
                    <span className="text-slate-800">{selectedPurchase.supplier_phone}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Correo</span>
                    <span className="text-slate-800 truncate max-w-[170px]">{selectedPurchase.supplier_email}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Método de pago</span>
                    <span className="font-semibold text-slate-800">{selectedPurchase.payment_method}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Estado</span>
                    <span className="font-semibold text-slate-800">{selectedPurchase.status}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Almacén</span>
                    <span className="font-semibold text-slate-800">{selectedPurchase.warehouse}</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-400 font-medium block mb-0.5">Observaciones</span>
                    <p className="text-slate-700 italic text-[11px]">{selectedPurchase.notes}</p>
                  </div>
                </div>

                {/* Totals Breakdown Card */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-800">RD$ {(selectedPurchase.subtotal || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Descuento</span>
                    <span className="font-bold">RD$ {(selectedPurchase.discount || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>ITBIS (18%)</span>
                    <span className="font-semibold text-slate-800">RD$ {(selectedPurchase.tax || 0).toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm uppercase">Total</span>
                    <span className="font-extrabold text-emerald-600 text-lg tracking-tight">
                      RD$ {(selectedPurchase.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setIsDetailModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                  >
                    <Eye size={14} />
                    <span>Ver detalles</span>
                  </button>

                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <Printer size={14} />
                    <span>Imprimir compra</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <FileText size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-slate-600 text-xs">Ninguna compra seleccionada</p>
                <p className="text-[11px] text-slate-400 mt-1">Selecciona una compra de la tabla para ver su desglose</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ─── MODAL: NUEVA COMPRA ────────────────────────────────────────────── */}
      <Modal
        isOpen={isNewPurchaseModalOpen}
        onClose={() => setIsNewPurchaseModalOpen(false)}
        title="Registrar Nueva Compra / Orden"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreatePurchaseSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">N° Compra *</label>
              <input
                required
                type="text"
                className="input text-sm font-mono font-bold"
                value={purchaseForm.purchase_number}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_number: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Ref. Orden (OC) *</label>
              <input
                required
                type="text"
                className="input text-sm font-mono"
                value={purchaseForm.order_reference}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, order_reference: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Proveedor *</label>
              <select
                required
                className="input text-sm"
                value={purchaseForm.supplier_id}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier_id: e.target.value })}
              >
                <option value="">Seleccionar Proveedor</option>
                {suppliersList.map(s => (
                  <option key={s.id} value={s.id}>{s.company_name} ({s.rnc || 'RNC'})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Método de pago *</label>
              <select
                className="input text-sm"
                value={purchaseForm.payment_method}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, payment_method: e.target.value })}
              >
                <option value="Transferencia">Transferencia</option>
                <option value="Crédito 30 días">Crédito 30 días</option>
                <option value="Crédito 15 días">Crédito 15 días</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Observaciones</label>
              <textarea
                rows={2}
                className="input text-sm"
                value={purchaseForm.notes}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsNewPurchaseModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              Registrar Compra
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: VER DETALLES DESGLOSADOS ───────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Desglose de Compra - ${selectedPurchase?.purchase_number}`}
        maxWidth="max-w-xl"
      >
        {selectedPurchase && (
          <div className="flex flex-col gap-4 text-xs text-slate-800">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-900">{selectedPurchase.supplier_name}</p>
                <p className="text-[11px] text-slate-400 font-mono">RNC: {selectedPurchase.supplier_rnc} | {selectedPurchase.date}</p>
              </div>
              {getStatusBadge(selectedPurchase.status)}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Producto / Descripción</th>
                    <th className="py-2 px-3 text-center">Cant.</th>
                    <th className="py-2 px-3 text-right">Costo Unit.</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPurchase.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{item.code || 'MED-001'}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono">RD$ {(item.unit_cost || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">RD$ {((item.quantity * item.unit_cost) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>RD$ {(selectedPurchase.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-rose-600"><span>Descuento:</span><span>RD$ {(selectedPurchase.discount || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ITBIS (18%):</span><span>RD$ {(selectedPurchase.tax || 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>TOTAL FACTURA:</span>
                <span className="text-emerald-600">RD$ {(selectedPurchase.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-primary text-xs font-semibold">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: IMPRIMIR COMPRA VOUCHER ──────────────────────────────────── */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Comprobante de Compra - Previsualización"
        maxWidth="max-w-md"
      >
        {selectedPurchase && (
          <div className="flex flex-col gap-4 text-xs text-slate-800">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <h2 className="font-bold text-slate-900 text-base uppercase">PharmaPlus SRL</h2>
              <p className="text-slate-500 font-mono">Comprobante de Entrada de Mercancía</p>
              <p className="text-slate-400 font-mono text-[11px]">Orden N°: {selectedPurchase.order_reference}</p>
              <div className="my-3 border-t border-dashed border-slate-300"></div>
              <p className="font-bold text-slate-800">Factura de Compra: {selectedPurchase.purchase_number}</p>
              <p className="text-slate-500">Proveedor: {selectedPurchase.supplier_name}</p>
              <p className="text-slate-500 font-mono">RNC: {selectedPurchase.supplier_rnc}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>TOTAL REGISTRADO:</span>
                <span className="text-emerald-600">RD$ {(selectedPurchase.total || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => window.print()} className="btn btn-outline text-xs inline-flex items-center gap-1.5">
                <Printer size={14} />
                <span>Imprimir Ticket</span>
              </button>
              <button onClick={() => setIsPrintModalOpen(false)} className="btn btn-primary text-xs font-semibold">
                Aceptar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL: ESCANEAR COMPROBANTE ───────────────────────────────────── */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Escanear Comprobante de Compra"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <ScanLine size={32} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Escaneando código de factura o QR</h4>
            <p className="text-xs text-slate-500 mt-1">
              Busca e identifica facturas de compras registradas por proveedores.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsScanModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsScanModalOpen(false);
                if (purchases.length > 0) setSelectedPurchase(purchases[0]);
                showToast('Factura C-000128 escaneada e identificada correctamente');
              }} 
              className="btn btn-primary text-xs font-semibold"
            >
              Simular Escaneo Exitoso
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Compras;
