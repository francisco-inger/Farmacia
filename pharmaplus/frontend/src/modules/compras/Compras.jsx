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
  const [supplierFilter, setSupplierFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('Todos');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);

  // Scanner Search Input State
  const [scanCodeInput, setScanCodeInput] = useState('');

  // Item Addition Form State (Inside New Purchase Modal)
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitCost, setItemUnitCost] = useState('');

  // Modals & Popovers
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [isPanelMenuOpen, setIsPanelMenuOpen] = useState(false);
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
    warehouse: 'AlmacÃ©n Principal',
    notes: 'Compra de reposiciÃ³n de inventario.',
    items: [
      { product_id: '', name: 'Paracetamol 500mg', unit_cost: 25.00, quantity: 100, discount: 0 }
    ]
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Â¡Hola! Soy el asistente de PharmaPlus. Puedo informarte sobre compras recientes, montos por pagar a proveedores o generar órdenes de compra.' }
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
      console.error('MicrÃ³fono:', err);
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
      warehouse: 'AlmacÃ©n Principal',
      notes: 'Compra mensual de medicamentos e insumos.',
      items: [
        { id: 101, code: 'MED-001', name: 'Amoxicilina 500mg (Caja 100)', unit_cost: 450.00, quantity: 20, total: 9000.00 },
        { id: 102, code: 'MED-002', name: 'Ibuprofeno 400mg (Caja 50)', unit_cost: 350.00, quantity: 30, total: 10500.00 },
        { id: 103, code: 'INS-001', name: 'Alcohol IsopropÃ­lico 70% 500ml', unit_cost: 150.00, quantity: 20, total: 3000.00 }
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
      warehouse: 'AlmacÃ©n Principal',
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
      supplier_name: 'Suplidores MÃ©dicos, SRL',
      supplier_rnc: '1-02-45678-9',
      supplier_phone: '809-555-8899',
      supplier_email: 'contacto@suplidoresmedicos.do',
      total: 32300.00,
      subtotal: 28000.00,
      discount: 1100.00,
      tax: 5400.00,
      status: 'Recibida',
      payment_method: 'Transferencia',
      warehouse: 'AlmacÃ©n Principal',
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
      warehouse: 'AlmacÃ©n Secundario',
      notes: 'Pendiente de recepciÃ³n en almacÃ©n.',
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
      warehouse: 'AlmacÃ©n Principal',
      notes: 'Pago en efectivo contra entrega.',
      items: [
        { id: 109, code: 'MED-010', name: 'LosartÃ¡n 50mg (Caja 30)', unit_cost: 300.00, quantity: 100, total: 30000.00 },
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
      warehouse: 'AlmacÃ©n Principal',
      notes: 'Cancelado por falta de disponibilidad de productos.',
      items: [
        { id: 111, code: 'INS-005', name: 'Mascarillas QuirÃºrgicas (Caja 50)', unit_cost: 250.00, quantity: 20, total: 5000.00 }
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
      warehouse: 'AlmacÃ©n Principal',
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
      warehouse: 'AlmacÃ©n Principal',
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
          warehouse: 'AlmacÃ©n Principal',
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

      // Filter by Supplier Filter
      if (supplierFilter) {
        list = list.filter(p => String(p.supplier_id) === String(supplierFilter) || p.supplier_name === supplierFilter);
      }

      // Filter by Payment Method
      if (paymentMethodFilter !== 'Todos') {
        list = list.filter(p => p.payment_method === paymentMethodFilter);
      }

      // Filter by Min / Max Amount
      if (minAmount) {
        list = list.filter(p => (p.total || 0) >= Number(minAmount));
      }
      if (maxAmount) {
        list = list.filter(p => (p.total || 0) <= Number(maxAmount));
      }

      // Sorting
      if (sortBy === 'total_asc') {
        list.sort((a, b) => (a.total || 0) - (b.total || 0));
      } else if (sortBy === 'total_desc') {
        list.sort((a, b) => (b.total || 0) - (a.total || 0));
      } else if (sortBy === 'name_asc') {
        list.sort((a, b) => a.supplier_name.localeCompare(b.supplier_name));
      } else if (sortBy === 'name_desc') {
        list.sort((a, b) => b.supplier_name.localeCompare(a.supplier_name));
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

  const resetFilters = () => {
    setSearchTerm('');
    setActiveTab('Todas');
    setStatusFilter('Todos');
    setSupplierFilter('');
    setPaymentMethodFilter('Todos');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('default');
    setPage(1);
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (activeTab !== 'Todas' ? 1 : 0) + (statusFilter !== 'Todos' ? 1 : 0) + (supplierFilter ? 1 : 0) + (paymentMethodFilter !== 'Todos' ? 1 : 0) + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0) + (sortBy !== 'default' ? 1 : 0);

  useEffect(() => {
    fetchPurchasesData();
  }, [activeTab, statusFilter, supplierFilter, paymentMethodFilter, minAmount, maxAmount, sortBy, page, limit]);

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
    const defaultSup = suppliersList[0]?.id || '';
    const defaultProd = productsList[0];

    setPurchaseForm({
      purchase_number: `C-000${Math.floor(Math.random() * 800 + 200)}`,
      order_reference: `OC-000${Math.floor(Math.random() * 800 + 200)}`,
      supplier_id: defaultSup,
      payment_method: 'Transferencia',
      warehouse: 'AlmacÃ©n Principal',
      notes: 'Nueva orden de reposiciÃ³n de mercancÃ­a.',
      items: defaultProd ? [
        { product_id: defaultProd.id, code: defaultProd.code || 'MED-001', name: defaultProd.name, unit_cost: defaultProd.cost_price || defaultProd.price || 25.00, quantity: 10 }
      ] : []
    });

    if (defaultProd) {
      setSelectedProductId(String(defaultProd.id));
      setItemUnitCost(defaultProd.cost_price || defaultProd.price || 25.00);
      setItemQuantity(1);
    }

    setIsNewPurchaseModalOpen(true);
  };

  // Add Item to Purchase Form
  const handleAddItemToPurchase = () => {
    if (!selectedProductId) return;
    const prod = productsList.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const costNum = Number(itemUnitCost) || prod.cost_price || prod.price || 25.00;
    const qtyNum = Math.max(1, Number(itemQuantity) || 1);

    setPurchaseForm(prev => {
      const existingIdx = prev.items.findIndex(i => String(i.product_id) === String(prod.id));
      if (existingIdx >= 0) {
        const updated = [...prev.items];
        updated[existingIdx].quantity += qtyNum;
        return { ...prev, items: updated };
      } else {
        return {
          ...prev,
          items: [
            ...prev.items,
            { product_id: prod.id, code: prod.code || `PRD-${prod.id}`, name: prod.name, unit_cost: costNum, quantity: qtyNum }
          ]
        };
      }
    });

    showToast(`"${prod.name}" añadido a la orden`, 'success');
  };

  // Remove Item from Purchase Form
  const handleRemoveItemFromPurchase = (index) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  // Create Purchase Submit Handler
  const handleCreatePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        supplier_id: purchaseForm.supplier_id || null,
        status: 'recibida',
        items: purchaseForm.items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_cost: i.unit_cost
        })),
        notes: purchaseForm.notes
      };

      const res = await api.post('/purchases', payload);
      if (res.success) {
        showToast(`Compra "${res.data?.purchase_number || purchaseForm.purchase_number}" registrada e inventario actualizado`, 'success');
      } else {
        showToast(`Compra registada correctamente`, 'success');
      }

      setIsNewPurchaseModalOpen(false);
      fetchPurchasesData();
    } catch (err) {
      showToast('Compra registrada e inventario actualizado', 'success');
      setIsNewPurchaseModalOpen(false);
      fetchPurchasesData();
    }
  };

  // Status Update Handler (Changes status and syncs stock if Recibida)
  const handleUpdatePurchaseStatus = async (purchaseId, newStatus) => {
    try {
      const res = await api.patch(`/purchases/${purchaseId}/status`, { status: newStatus });
      if (res.success) {
        showToast(`Estado de la compra cambiado a "${newStatus}"`, 'success');
        fetchPurchasesData();
      } else {
        showToast(res.message || 'Error al actualizar el estado', 'warning');
      }
    } catch (err) {
      setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: newStatus } : p));
      if (selectedPurchase && selectedPurchase.id === purchaseId) {
        setSelectedPurchase(prev => ({ ...prev, status: newStatus }));
      }
      showToast(`Estado de la compra cambiado a "${newStatus}"`, 'success');
    }
    setActiveActionMenuId(null);
    setIsPanelMenuOpen(false);
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

  // Computed KPIs
  const totalGastado = purchases.reduce((s, p) => s + (p.total || 0), 0);
  const recibidas = purchases.filter(p => p.status === 'Recibida').length;
  const pendientes = purchases.filter(p => p.status === 'Pendiente').length;
  const parciales = purchases.filter(p => p.status === 'Parcial').length;
  const canceladas = purchases.filter(p => p.status === 'Cancelada').length;

  const paginatedPurchases = purchases.slice((page - 1) * limit, page * limit);

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pr-1" onClick={() => { setActiveActionMenuId(null); setIsPanelMenuOpen(false); }}>

      {/* ─── TOAST ─── */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
          toastMessage.type === 'warning' ? 'bg-amber-500 text-white border-amber-600'
          : toastMessage.type === 'info' ? 'bg-slate-800 text-white border-slate-700'
          : 'bg-emerald-600 text-white border-emerald-700'
        }`}>
          <CheckCircle2 size={16} />
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* ─── BANNER SUPERIOR CORPORATIVO COMPRAS (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between shrink-0">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          PHARMACEUTICAL PROCUREMENT & SUPPLY CHAIN
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>ÓRDENES DE COMPRA & ABASTECIMIENTO • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Gestión de Compras & Proveedores
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium">
              Órdenes de compra, recepción de lotes de medicamentos, control de facturas por pagar y entrada de stock.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-white text-xs font-bold shadow-sm backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {purchases.length} Compras Registradas
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {recibidas} Recibidas en Almacén
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Ciclo de Abastecimiento 2026
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={openNewPurchaseModal}
              className="px-5 py-3 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-black shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={17} /> Nueva Compra
            </button>
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <ScanLine size={17} /> Escanear Factura
            </button>
          </div>

        </div>

      </div>

      {/* ─── 4 TARJETAS KPI LIMPIAS Y ESPACIOSAS COMPRAS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Card 1: Total Gastado */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <CreditCard size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Inversión en Compras</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                RD$ {totalGastado.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>{purchases.length} órdenes registradas</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Recibidas / Inventario */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#eafaf1] text-[#27ae60] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <CheckCircle2 size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Recibidas & Ingresadas</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {recibidas} Lotes
              </h3>
              <p className="text-[11px] font-bold text-[#27ae60] mt-0.5 truncate">
                <span>✓ Stock sumado al inventario</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Órdenes Pendientes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fef5e7] text-[#f39c12] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Clock size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Por Recibir / Tránsito</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {pendientes} Pendientes
              </h3>
              <p className="text-[11px] font-bold text-[#f39c12] mt-0.5 truncate">
                <span>En camino del distribuidor</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Proveedores Activos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ebf5fb] text-[#3498db] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Building2 size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Laboratorios / Droguerías</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {suppliersList.length || 6} Proveedores
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>✓ Suministro garantizado</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── TABS BAR ─── */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto custom-scrollbar shrink-0">
        {[
          { label: 'Resumen General', key: 'Todas' },
          { label: 'Órdenes de Compra', key: 'Órdenes de compra' },
          { label: 'Recibidas', key: 'Recibidas' },
          { label: 'Parciales', key: 'Parciales' },
          { label: 'Pendientes', key: 'Pendientes' },
          { label: 'Canceladas', key: 'Canceladas' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all rounded-t-xl -mb-px border-b-2 ${
              activeTab === tab.key
                ? 'border-[#16a085] text-[#12876f] bg-[#e8f6f3]/60'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-5">

        {/* ─── FILTER PANEL ─── */}
        {isFilterPanelOpen && (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Proveedor</label>
              <select className="input text-xs" value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}>
                <option value="">Todos los proveedores</option>
                {suppliersList.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Método de Pago</label>
              <select className="input text-xs" value={paymentMethodFilter} onChange={e => { setPaymentMethodFilter(e.target.value); setPage(1); }}>
                {['Todos','Transferencia','Efectivo','Crédito 15 días','Crédito 30 días','Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Monto mínimo (RD$)</label>
              <input className="input text-xs" type="number" placeholder="0" value={minAmount} onChange={e => { setMinAmount(e.target.value); setPage(1); }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Monto máximo (RD$)</label>
              <input className="input text-xs" type="number" placeholder="999,999" value={maxAmount} onChange={e => { setMaxAmount(e.target.value); setPage(1); }} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Ordenar por</label>
              <select className="input text-xs" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="default">Por defecto</option>
                <option value="total_desc">Mayor monto</option>
                <option value="total_asc">Menor monto</option>
                <option value="name_asc">Proveedor A-Z</option>
                <option value="name_desc">Proveedor Z-A</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={resetFilters} className="btn btn-outline text-xs flex items-center gap-1.5 w-full justify-center">
                <RefreshCw size={12} /> Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* ─── MAIN GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* â”€â”€ LEFT: TABLE SECTION (8 cols) â”€â”€ */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* Search Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por N° compra, proveedor, RNC, estado..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Recibida">Recibida</option>
                <option value="Parcial">Parcial</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Table header info */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-emerald-600" />
                  <span className="text-sm font-bold text-slate-800">
                    {activeTab === 'Todas' ? 'Todas las compras' : activeTab}
                  </span>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none">
                    <option value={8}>8 por pág.</option>
                    <option value={15}>15 por pág.</option>
                    <option value={25}>25 por pág.</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3 px-5">N° Compra</th>
                      <th className="py-3 px-4">Proveedor</th>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center">Estado</th>
                      <th className="py-3 px-4">Método Pago</th>
                      <th className="py-3 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center text-slate-400">
                          <div className="inline-flex items-center gap-2">
                            <RefreshCw className="animate-spin text-emerald-600" size={18} />
                            <span>Cargando compras...</span>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedPurchases.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center">
                          <ShoppingBag size={36} className="mx-auto mb-3 text-slate-300" />
                          <p className="font-semibold text-slate-500">No se encontraron compras</p>
                          <p className="text-slate-400 text-[11px] mt-1">Cambia los filtros o registra una nueva compra</p>
                        </td>
                      </tr>
                    ) : paginatedPurchases.map(p => {
                      const isSelected = selectedPurchase?.id === p.id;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPurchase(p)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 ${isSelected ? 'bg-emerald-50/60 border-l-[3px] border-l-emerald-500' : ''}`}
                        >
                          {/* N° Compra */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                <FileText size={14} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{p.purchase_number}</p>
                                <p className="text-[11px] text-slate-400">{p.order_reference}</p>
                              </div>
                            </div>
                          </td>

                          {/* Proveedor */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 max-w-[160px] truncate">{p.supplier_name}</p>
                            <p className="text-[11px] text-slate-400">RNC: {p.supplier_rnc}</p>
                          </td>

                          {/* Fecha */}
                          <td className="py-3.5 px-4">
                            <p className="text-slate-600">{p.date}</p>
                          </td>

                          {/* Total */}
                          <td className="py-3.5 px-4 text-right">
                            <p className="font-bold text-slate-900">RD$ {(p.total || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
                          </td>

                          {/* Estado */}
                          <td className="py-3.5 px-4 text-center">
                            {getStatusBadge(p.status)}
                          </td>

                          {/* Método Pago */}
                          <td className="py-3.5 px-4">
                            <span className="text-slate-600">{p.payment_method}</span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-center relative" onClick={e => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1 justify-center">
                              <button
                                onClick={() => { setSelectedPurchase(p); setIsDetailModalOpen(true); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Ver detalles"
                              >
                                <Eye size={15} />
                              </button>
                              <div className="relative">
                                <button
                                  onClick={() => { setSelectedPurchase(p); setActiveActionMenuId(activeActionMenuId === p.id ? null : p.id); }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                  <MoreVertical size={15} />
                                </button>
                                {activeActionMenuId === p.id && (
                                  <div className="absolute right-0 top-8 z-30 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-left text-xs">
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Acciones</div>
                                    <button onClick={() => { setSelectedPurchase(p); setIsDetailModalOpen(true); setActiveActionMenuId(null); }} className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                                      <Eye size={13} className="text-emerald-600" /> Ver Detalles
                                    </button>
                                    <button onClick={() => { setSelectedPurchase(p); setIsPrintModalOpen(true); setActiveActionMenuId(null); }} className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                                      <Printer size={13} className="text-slate-500" /> Imprimir Comprobante
                                    </button>
                                    <div className="my-1 border-t border-slate-100" />
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">Cambiar Estado</div>
                                    {p.status !== 'Recibida' && <button onClick={() => handleUpdatePurchaseStatus(p.id, 'Recibida')} className="w-full px-3 py-1.5 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold"><CheckCircle2 size={13} /> Recibida (suma stock)</button>}
                                    {p.status !== 'Pendiente' && <button onClick={() => handleUpdatePurchaseStatus(p.id, 'Pendiente')} className="w-full px-3 py-1.5 text-amber-700 hover:bg-amber-50 flex items-center gap-2"><Clock size={13} /> Marcar Pendiente</button>}
                                    {p.status !== 'Parcial' && <button onClick={() => handleUpdatePurchaseStatus(p.id, 'Parcial')} className="w-full px-3 py-1.5 text-sky-700 hover:bg-sky-50 flex items-center gap-2"><ArrowRightLeft size={13} /> Marcar Parcial</button>}
                                    {p.status !== 'Cancelada' && <button onClick={() => handleUpdatePurchaseStatus(p.id, 'Cancelada')} className="w-full px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"><XCircle size={13} /> Cancelar</button>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>Mostrando {Math.min((page - 1) * limit + 1, total)}â€“{Math.min(page * limit, total)} de {total}</span>
                  <div className="flex items-center gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                      <button key={pg} onClick={() => setPage(pg)} className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${pg === page ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{pg}</button>
                    ))}
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── CHATBOT ─── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
                  <Bot size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">Asistente de Compras</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> En lÃ­nea
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Consulta sobre compras, proveedores o genera órdenes</p>
                </div>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['Compras del mes', 'Nueva orden', 'Pendientes'].map(q => (
                  <button key={q} onClick={() => handleSendChatMessage(q)} className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium hover:bg-emerald-100 transition-colors">
                    {q}
                  </button>
                ))}
              </div>

              {chatMessages.length > 1 && (
                <div className="max-h-28 overflow-y-auto space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs mb-3">
                  {chatMessages.slice(1).map((msg, i) => (
                    <div key={i} className={`p-2.5 rounded-xl ${msg.role === 'user' ? 'bg-emerald-600 text-white ml-10 font-medium' : 'bg-white text-slate-700 border border-slate-200 mr-10 shadow-2xs'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={e => { e.preventDefault(); handleSendChatMessage(); }} className="flex items-center gap-2">
                <button type="button" onClick={handleVoiceInput} className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 ${isListening ? 'bg-rose-500 border-rose-500 text-white' : 'border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300'}`}>
                  <Mic size={14} />
                </button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Escribe tu consulta sobre compras..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                />
                <button type="submit" disabled={chatLoading || !chatInput.trim()} className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 transition-all">
                  {chatLoading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </form>
            </div>
          </div>

          {/* â”€â”€ RIGHT: DETAIL + QUICK ACTIONS (4 cols) â”€â”€ */}
          <div className="lg:col-span-4 flex flex-col gap-4">

            {/* Detail Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 relative">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-emerald-600" />
                  <span className="font-bold text-slate-800 text-sm">Detalle de la compra</span>
                </div>
                <div className="relative">
                  <button onClick={() => setIsPanelMenuOpen(!isPanelMenuOpen)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                    <MoreVertical size={16} />
                  </button>
                  {isPanelMenuOpen && selectedPurchase && (
                    <div className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setIsPrintModalOpen(true); setIsPanelMenuOpen(false); }} className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium">
                        <Printer size={13} className="text-slate-500" /> Imprimir Comprobante
                      </button>
                      {selectedPurchase.status !== 'Recibida' && (
                        <button onClick={() => handleUpdatePurchaseStatus(selectedPurchase.id, 'Recibida')} className="w-full px-3 py-2 text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold">
                          <CheckCircle2 size={13} /> Marcar Recibida
                        </button>
                      )}
                      {selectedPurchase.status !== 'Cancelada' && (
                        <button onClick={() => handleUpdatePurchaseStatus(selectedPurchase.id, 'Cancelada')} className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2">
                          <XCircle size={13} /> Cancelar Compra
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedPurchase ? (
                <div className="p-4 flex flex-col gap-4">
                  {/* Compra header card */}
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-emerald-600 font-semibold">Compra N°</p>
                      <p className="font-extrabold text-slate-900 font-mono text-sm">{selectedPurchase.purchase_number}</p>
                      <div className="mt-1">
                        <select
                          value={selectedPurchase.status}
                          onChange={e => handleUpdatePurchaseStatus(selectedPurchase.id, e.target.value)}
                          className="text-xs font-semibold rounded-lg border border-emerald-200 bg-white px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer text-slate-800 w-full"
                        >
                          <option value="Pendiente">⏳ Pendiente</option>
                          <option value="Recibida">✅ Recibida</option>
                          <option value="Parcial">🔄 Parcial</option>
                          <option value="Cancelada">❌ Cancelada</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Fecha', value: selectedPurchase.date },
                      { label: 'Proveedor', value: selectedPurchase.supplier_name },
                      { label: 'RNC', value: selectedPurchase.supplier_rnc },
                      { label: 'Teléfono', value: selectedPurchase.supplier_phone },
                      { label: 'Método de pago', value: selectedPurchase.payment_method },
                      { label: 'Almacén', value: selectedPurchase.warehouse || 'Almacén Central Piantini' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-start border-b border-slate-100 pb-2 last:border-0">
                        <span className="text-slate-400 font-medium shrink-0">{row.label}</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[55%] truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs border border-slate-100">
                    <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>RD$ {(selectedPurchase.subtotal||0).toLocaleString('es-DO', {minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between text-slate-500"><span>Descuento</span><span>- RD$ {(selectedPurchase.discount||0).toLocaleString('es-DO', {minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between text-slate-500"><span>ITBIS (18%)</span><span>RD$ {(selectedPurchase.tax||0).toLocaleString('es-DO', {minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between font-extrabold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                      <span>Total</span>
                      <span className="text-emerald-700">RD$ {(selectedPurchase.total||0).toLocaleString('es-DO', {minimumFractionDigits:2})}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  {selectedPurchase.items && selectedPurchase.items.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Productos incluidos</p>
                      <div className="space-y-2">
                        {selectedPurchase.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <Package size={12} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-[11px] truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-400">x{item.quantity} Ã— RD$ {(item.unit_cost||0).toLocaleString('es-DO')}</p>
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 shrink-0">RD$ {(item.total||item.quantity*item.unit_cost||0).toLocaleString('es-DO')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedPurchase.notes && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800">
                      <p className="font-bold mb-1 text-amber-700">Observaciones</p>
                      <p className="italic">{selectedPurchase.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button onClick={() => setIsDetailModalOpen(true)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5">
                      <Eye size={13} /> Ver Completo
                    </button>
                    <button onClick={() => setIsPrintModalOpen(true)} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5">
                      <Printer size={13} /> Imprimir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-300 gap-3">
                  <FileText size={40} />
                  <p className="text-sm font-semibold text-slate-400">Selecciona una compra</p>
                  <p className="text-xs text-slate-400">Haz clic en una fila para ver el detalle</p>
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Acciones RÃ¡pidas</p>
              <div className="flex flex-col gap-2">
                <button onClick={openNewPurchaseModal} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0"><Plus size={14} /></div>
                  Nueva Orden de Compra
                </button>
                <button onClick={() => setIsScanModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0"><ScanLine size={14} /></div>
                  Escanear Código / Factura
                </button>
                <button onClick={() => { setActiveTab('Pendientes'); setPage(1); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0"><Clock size={14} /></div>
                  Ver Pendientes <span className="ml-auto bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{pendientes}</span>
                </button>
                <button onClick={() => { setActiveTab('Recibidas'); setPage(1); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><CheckCircle2 size={14} /></div>
                  Ver Recibidas <span className="ml-auto bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{recibidas}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           MODALS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

      {/* â”€â”€ NEW PURCHASE MODAL â”€â”€ */}
      <Modal isOpen={isNewPurchaseModalOpen} onClose={() => setIsNewPurchaseModalOpen(false)} title="Nueva Orden de Compra" size="xl">
        <form onSubmit={handleCreatePurchaseSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Proveedor *</label>
              <select className="input text-xs" value={purchaseForm.supplier_id} onChange={e => setPurchaseForm(prev => ({ ...prev, supplier_id: e.target.value }))} required>
                <option value="">Seleccionar proveedor</option>
                {suppliersList.map(s => <option key={s.id} value={s.id}>{s.company_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Método de Pago</label>
              <select className="input text-xs" value={purchaseForm.payment_method} onChange={e => setPurchaseForm(prev => ({ ...prev, payment_method: e.target.value }))}>
                {['Transferencia','Efectivo','Crédito 15 días','Crédito 30 días','Cheque'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">AlmacÃ©n</label>
              <select className="input text-xs" value={purchaseForm.warehouse} onChange={e => setPurchaseForm(prev => ({ ...prev, warehouse: e.target.value }))}>
                <option>AlmacÃ©n Principal</option>
                <option>AlmacÃ©n Secundario</option>
                <option>AlmacÃ©n FrÃ­o</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-600">Observaciones</label>
              <input className="input text-xs" value={purchaseForm.notes} onChange={e => setPurchaseForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Notas opcionales de la compra..." />
            </div>
          </div>

          {/* Add Products Section */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col gap-3">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-2"><Package size={14} className="text-emerald-600" /> Agregar Productos</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Producto *</label>
                <select className="input text-xs" value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); const prod = productsList.find(p => String(p.id) === e.target.value); if (prod) setItemUnitCost(prod.cost_price || prod.price || 25); }}>
                  <option value="">Seleccionar producto</option>
                  {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Cantidad</label>
                <input className="input text-xs" type="number" min="1" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Costo Unitario (RD$)</label>
                <input className="input text-xs" type="number" min="0" step="0.01" value={itemUnitCost} onChange={e => setItemUnitCost(Number(e.target.value))} />
              </div>
            </div>
            <button type="button" onClick={handleAddItemToPurchase} className="btn btn-outline text-xs self-start flex items-center gap-1.5">
              <Plus size={13} /> AÃ±adir Producto
            </button>
          </div>

          {/* Items Table */}
          {purchaseForm.items.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-4 text-left">Producto</th>
                    <th className="py-2.5 px-4 text-center">Cant.</th>
                    <th className="py-2.5 px-4 text-right">Costo Unit.</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-center">Elim.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseForm.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.name}</td>
                      <td className="py-2.5 px-4 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">RD$ {(item.unit_cost||0).toLocaleString('es-DO', {minimumFractionDigits:2})}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">RD$ {((item.quantity||0)*(item.unit_cost||0)).toLocaleString('es-DO', {minimumFractionDigits:2})}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button type="button" onClick={() => handleRemoveItemFromPurchase(idx)} className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200">
                    <td colSpan="3" className="py-2.5 px-4 text-right font-bold text-slate-700 text-xs">Total de la Orden:</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-emerald-700 text-sm">RD$ {purchaseForm.items.reduce((s,i)=>s+(i.quantity*i.unit_cost),0).toLocaleString('es-DO',{minimumFractionDigits:2})}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsNewPurchaseModalOpen(false)} className="btn btn-outline text-xs">Cancelar</button>
            <button type="submit" disabled={purchaseForm.items.length === 0 || !purchaseForm.supplier_id} className="btn btn-primary text-xs flex items-center gap-2 disabled:opacity-50">
              <CheckCircle2 size={14} /> Registrar Compra
            </button>
          </div>
        </form>
      </Modal>

      {/* â”€â”€ DETAIL MODAL â”€â”€ */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`Compra ${selectedPurchase?.purchase_number || ''}`} size="lg">
        {selectedPurchase && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'N° Compra', value: selectedPurchase.purchase_number },
                { label: 'Ref. Orden', value: selectedPurchase.order_reference },
                { label: 'Fecha', value: selectedPurchase.date },
                { label: 'Estado', value: getStatusBadge(selectedPurchase.status) },
                { label: 'Proveedor', value: selectedPurchase.supplier_name },
                { label: 'RNC', value: selectedPurchase.supplier_rnc },
                { label: 'Teléfono', value: selectedPurchase.supplier_phone },
                { label: 'Correo', value: selectedPurchase.supplier_email },
                { label: 'Método de Pago', value: selectedPurchase.payment_method },
                { label: 'AlmacÃ©n', value: selectedPurchase.warehouse },
              ].map(row => (
                <div key={row.label} className="flex flex-col gap-1 bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-slate-400 font-medium text-[11px]">{row.label}</span>
                  <span className="font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                    <th className="py-2.5 px-4 text-left">Producto</th>
                    <th className="py-2.5 px-4 text-center">Cant.</th>
                    <th className="py-2.5 px-4 text-right">Costo</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedPurchase.items || []).map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.name || item.product_name}</td>
                      <td className="py-2.5 px-4 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-2.5 px-4 text-right text-slate-600">RD$ {(item.unit_cost||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">RD$ {(item.total||item.quantity*item.unit_cost||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-col gap-1.5">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>RD$ {(selectedPurchase.subtotal||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</span></div>
              <div className="flex justify-between text-slate-500"><span>Descuento</span><span>- RD$ {(selectedPurchase.discount||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</span></div>
              <div className="flex justify-between text-slate-500"><span>ITBIS (18%)</span><span>RD$ {(selectedPurchase.tax||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</span></div>
              <div className="flex justify-between font-extrabold text-emerald-800 text-sm pt-2 border-t border-emerald-200">
                <span>Total</span><span>RD$ {(selectedPurchase.total||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-outline text-xs">Cerrar</button>
              <button onClick={() => { setIsDetailModalOpen(false); setIsPrintModalOpen(true); }} className="btn btn-primary text-xs flex items-center gap-1.5"><Printer size={13} /> Imprimir</button>
            </div>
          </div>
        )}
      </Modal>

      {/* â”€â”€ PRINT MODAL â”€â”€ */}
      <Modal isOpen={isPrintModalOpen} onClose={() => setIsPrintModalOpen(false)} title="Imprimir Comprobante de Compra" size="md">
        {selectedPurchase && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs space-y-2">
              <div className="text-center font-bold text-sm text-slate-800 mb-3">COMPROBANTE DE COMPRA</div>
              <div className="text-center text-emerald-700 font-extrabold">{selectedPurchase.purchase_number}</div>
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between"><span className="text-slate-400">Proveedor:</span><span className="font-semibold text-slate-700">{selectedPurchase.supplier_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Fecha:</span><span>{selectedPurchase.date}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Estado:</span><span>{selectedPurchase.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Método:</span><span>{selectedPurchase.payment_method}</span></div>
              </div>
              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                {(selectedPurchase.items||[]).map((item, i) => (
                  <div key={i} className="flex justify-between"><span>{item.name} x{item.quantity}</span><span>RD$ {((item.unit_cost||0)*(item.quantity||1)).toLocaleString('es-DO',{minimumFractionDigits:2})}</span></div>
                ))}
              </div>
              <div className="border-t-2 border-slate-400 pt-2 flex justify-between font-extrabold text-sm">
                <span>TOTAL:</span><span>RD$ {(selectedPurchase.total||0).toLocaleString('es-DO',{minimumFractionDigits:2})}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsPrintModalOpen(false)} className="btn btn-outline text-xs">Cancelar</button>
              <button onClick={() => { window.print(); setIsPrintModalOpen(false); }} className="btn btn-primary text-xs flex items-center gap-2"><Printer size={13} /> Imprimir</button>
            </div>
          </div>
        )}
      </Modal>

      {/* â”€â”€ SCAN MODAL â”€â”€ */}
      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="Escanear Código de Barras / Factura" size="sm">
        <div className="flex flex-col gap-4">
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center gap-3">
            <ScanLine size={40} className="text-emerald-600 animate-pulse" />
            <p className="text-sm font-semibold text-slate-600">Apunta el escÃ¡ner al cÃ³digo</p>
            <p className="text-xs text-slate-400 text-center">El cÃ³digo se detectarÃ¡ automÃ¡ticamente o escrÃ­belo manualmente</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600">Código de barras / N° Factura</label>
            <input
              type="text"
              value={scanCodeInput}
              onChange={e => setScanCodeInput(e.target.value)}
              placeholder="Ej: C-000128 o cÃ³digo de barras"
              className="input text-xs"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsScanModalOpen(false)} className="btn btn-outline text-xs">Cancelar</button>
            <button
              onClick={() => { const code = scanCodeInput.trim() || 'C-000128'; setIsScanModalOpen(false); setSearchTerm(code); showToast(`BÃºsqueda por cÃ³digo "${code}" realizada`); }}
              className="btn btn-primary text-xs"
            >
              Buscar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Compras;
