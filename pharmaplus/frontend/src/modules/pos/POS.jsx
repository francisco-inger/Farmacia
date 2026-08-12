import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Trash2, User, CreditCard, Banknote, ShoppingCart, 
  CheckCircle, Printer, ScanLine, X, Home, Lock, RefreshCw, Eye, EyeOff,
  Percent, FileText, ArrowLeft, ShieldAlert, Sparkles, Send, Mic, Volume2, Bot, MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { playScannerBeep } from '../../utils/sound';
import { AuthContext } from '../../context/AuthContext';

const POS = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // App States
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [cashierUsers, setCashierUsers] = useState([]);
  
  // NCF and DGII states
  const [ncfType, setNcfType] = useState('B02'); // Default: Consumidor Final
  const [rncCedula, setRncCedula] = useState('');
  
  // Cash Register State
  const [cashStatus, setCashStatus] = useState(null); // 'closed' or open register object
  const [loading, setLoading] = useState(false);
  const [checkingCash, setCheckingCash] = useState(true);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // AI Chatbot Widget States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { 
      sender: 'ai', 
      text: '¡Hola! Soy tu asistente de ventas POS. Pregúntame por inventario, precios o pídeme agregar productos al carrito.' 
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Cash Register Opening State
  const [openRegisterForm, setOpenRegisterForm] = useState({
    name: '',
    initialAmount: '1000',
    password: '',
    showPassword: false,
    error: ''
  });

  // Cash Register Closing State
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closeRegisterForm, setCloseRegisterForm] = useState({
    countedAmount: '',
    notes: '',
    password: '',
    showPassword: false,
    error: '',
    totals: null
  });

  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountPaid, setAmountPaid] = useState('');
  const [saleResult, setSaleResult] = useState(null);
  const [paymentError, setPaymentError] = useState('');

  // Handle Barcode Scan (both hardware USB scanner and Camera scanner)
  const handleBarcodeScanned = async (code) => {
    // Try matching locally first
    const localMatch = allProducts.find(p => p.barcode === code || p.code === code);
    if (localMatch) {
      playScannerBeep();
      addToCart(localMatch);
      setSearchTerm('');
    } else {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(code)}&limit=5`);
        if (res.data && res.data.length > 0) {
          const exactMatch = res.data.find(p => p.barcode === code || p.code === code) || res.data[0];
          playScannerBeep();
          addToCart(exactMatch);
          setSearchTerm('');
        } else {
          alert(`No se encontró ningún producto con el código: ${code}`);
        }
      } catch (err) {
        console.error('Error procesando escaneo de código:', err);
      }
    }
  };

  // Hardware USB/Bluetooth Scanner Listener
  useBarcodeScanner(handleBarcodeScanned);

  useEffect(() => {
    checkCashStatus();
    loadClients();
    loadCashiers();
    loadAllProducts();
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const checkCashStatus = async () => {
    setCheckingCash(true);
    try {
      const res = await api.get('/cash-registers');
      const openCash = res.data?.find(c => c.status === 'abierta' && c.user_id === user?.id) || 
                       res.data?.find(c => c.status === 'abierta');
      setCashStatus(openCash || 'closed');
    } catch (err) {
      console.error('Error checking cash register:', err);
      setCashStatus('closed');
    } finally {
      setCheckingCash(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await api.get('/clients?limit=100');
      setClients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCashiers = async () => {
    try {
      const res = await api.get('/users?role=cajero&limit=100');
      const list = res.data || [];
      setCashierUsers(list);
      if (list.length > 0) {
        setOpenRegisterForm(prev => ({ ...prev, name: list[0].name }));
      }
    } catch (err) {
      console.error('Error loading cashiers:', err);
      const fallback = [
        { id: 1, name: 'Ana Cajera' },
        { id: 2, name: 'Sofía Ramírez' },
        { id: 3, name: 'Juan Pérez (Cajero)' }
      ];
      setCashierUsers(fallback);
      setOpenRegisterForm(prev => ({ ...prev, name: fallback[0].name }));
    }
  };

  const loadAllProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      setAllProducts(res.data || []);
    } catch (err) {
      console.error('Error loading products from DB:', err);
    }
  };
  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim().length > 0) {
      handleBarcodeScanned(searchTerm.trim());
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Producto agotado en inventario');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('No hay más stock disponible');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) return;
    const prod = cart.find(i => i.id === id);
    if (newQty > prod.stock) {
      alert(`Stock máximo disponible: ${prod.stock}`);
      return;
    }
    setCart(cart.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const updateItemDiscount = (id, discountVal) => {
    const discount = parseFloat(discountVal) || 0;
    setCart(cart.map(item => item.id === id ? { ...item, discount } : item));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
    const discount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = taxableAmount * 0.18; // 18% ITBIS
    const total = taxableAmount + tax;
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  // Local filtering of products
  const filteredProducts = allProducts.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.active_ingredient && p.active_ingredient.toLowerCase().includes(q))
    );
  });

  // Open register submit
  const handleOpenRegisterSubmit = async (e) => {
    e.preventDefault();
    setOpenRegisterForm(prev => ({ ...prev, error: '' }));
    
    if (user?.role !== 'admin' && user?.role !== 'cajero') {
      setOpenRegisterForm(prev => ({ ...prev, error: 'Acceso Denegado: Solo cajeros o administradores pueden abrir caja.' }));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/login', { email: user.email, password: openRegisterForm.password });
      const openRes = await api.post('/cash-registers/open', {
        name: openRegisterForm.name,
        initial_amount: parseFloat(openRegisterForm.initialAmount) || 0
      });

      if (openRes.success) {
        setCashStatus(openRes.data);
        setOpenRegisterForm(prev => ({ ...prev, password: '', error: '' }));
        setTimeout(() => searchInputRef.current?.focus(), 200);
      }
    } catch (err) {
      setOpenRegisterForm(prev => ({ ...prev, error: err.message || 'Contraseña incorrecta o error de red.' }));
    } finally {
      setLoading(false);
    }
  };

  // Close register load stats
  const triggerCloseRegister = async () => {
    if (cashStatus === 'closed') return;
    setLoading(true);
    try {
      const res = await api.get(`/cash-registers/${cashStatus.id}/movements`);
      const movements = res.data || [];
      
      let expected = cashStatus.initial_amount;
      movements.forEach(m => {
        if (['venta', 'ingreso', 'apertura'].includes(m.movement_type)) {
          if (m.movement_type !== 'apertura') expected += m.amount;
        } else if (['retiro', 'devolucion', 'gasto'].includes(m.movement_type)) {
          expected -= m.amount;
        }
      });

      setCloseRegisterForm(prev => ({
        ...prev,
        countedAmount: expected.toFixed(2),
        notes: '',
        password: '',
        error: '',
        totals: {
          initial: cashStatus.initial_amount,
          sales: expected - cashStatus.initial_amount,
          expected: expected
        }
      }));
      setIsClosingModalOpen(true);
    } catch (err) {
      alert('Error cargando movimientos de caja: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRegisterSubmit = async (e) => {
    e.preventDefault();
    setCloseRegisterForm(prev => ({ ...prev, error: '' }));

    setLoading(true);
    try {
      await api.post('/auth/login', { email: user.email, password: closeRegisterForm.password });
      const closeRes = await api.post(`/cash-registers/${cashStatus.id}/close`, {
        counted_amount: parseFloat(closeRegisterForm.countedAmount) || 0,
        notes: closeRegisterForm.notes
      });

      if (closeRes.success) {
        setIsClosingModalOpen(false);
        setCashStatus('closed');
        setCart([]);
        alert('Caja cerrada con éxito. El arqueo ha sido registrado.');
      }
    } catch (err) {
      setCloseRegisterForm(prev => ({ ...prev, error: err.message || 'Contraseña incorrecta.' }));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (cashStatus === 'closed') {
      alert('Debe abrir una caja antes de facturar.');
      return;
    }
    setAmountPaid(totals.total.toFixed(2));
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const processPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (paymentMethod === 'efectivo' && parseFloat(amountPaid) < totals.total) {
      setPaymentError('El monto pagado es menor al total a pagar.');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        client_id: selectedClient?.id || null,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.sale_price,
          discount: item.discount || 0
        })),
        payments: [{
          method: paymentMethod,
          amount: paymentMethod === 'efectivo' ? parseFloat(amountPaid) : totals.total
        }],
        discount: totals.discount,
        notes: `Facturado con comprobante ${ncfType}`
      };

      const saleRes = await api.post('/pos/sales', saleData);
      
      if (saleRes.success && saleRes.data) {
        const sale = saleRes.data;

        let invoiceData = {
          sale_id: sale.id,
          client_id: selectedClient?.id || null,
          ncf_type: ncfType,
          rnc_cedula: rncCedula || selectedClient?.cedula || '',
          client_name: selectedClient?.name || 'Consumidor Final',
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total
        };

        const invRes = await api.post('/facturacion', invoiceData);
        
        setSaleResult({
          ...sale,
          ncf: invRes.data?.ncf || 'Factura de Consumo',
          ncfName: invRes.data?.ncf_type || ncfType,
          clientName: invoiceData.client_name,
          rnc: invoiceData.rnc_cedula,
          tax: totals.tax,
          change: paymentMethod === 'efectivo' ? (parseFloat(amountPaid) - totals.total) : 0
        });

        setCart([]);
        setSelectedClient(null);
        setRncCedula('');
        setNcfType('B02');
        setIsPaymentModalOpen(false);
        loadAllProducts(); // reload products to update stocks in UI catalog
      }
    } catch (err) {
      setPaymentError(err.message || 'Error procesando la venta y facturación fiscal.');
    } finally {
      setLoading(false);
    }
  };

  // AI Chatbot actions
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendChat = async (typedText) => {
    const text = typedText || chatInput;
    if (!text.trim()) return;

    // Add user message
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const lower = text.toLowerCase();
      let responseText = '';
      let suggestedProduct = null;

      // Simple keywords router simulating POS agentic brain
      if (lower.includes('stock bajo') || lower.includes('alertas') || lower.includes('minimo')) {
        const lowStockList = allProducts.filter(p => p.stock <= p.min_stock);
        if (lowStockList.length > 0) {
          responseText = `Encontré ${lowStockList.length} productos con stock bajo: ${lowStockList.map(p => `${p.name} (Stock: ${p.stock})`).join(', ')}.`;
        } else {
          responseText = "Todos los productos del inventario se encuentran por encima de sus límites mínimos recomendados.";
        }
      } else if (lower.includes('agotado') || lower.includes('sin stock')) {
        const outOfStockList = allProducts.filter(p => p.stock <= 0);
        if (outOfStockList.length > 0) {
          responseText = `Los siguientes productos están agotados: ${outOfStockList.map(p => p.name).join(', ')}. Te sugiero gestionar una compra.`;
        } else {
          responseText = "Excelente noticia. No hay ningún producto agotado en este momento.";
        }
      } else if (lower.includes('paracetamol')) {
        const p = allProducts.find(p => p.name.toLowerCase().includes('paracetamol'));
        if (p) {
          suggestedProduct = p;
          responseText = `Tenemos ${p.name} en stock (${p.stock} unidades) a un precio de RD$ ${p.sale_price.toFixed(2)}. ¿Deseas agregarlo a la factura actual?`;
        } else {
          responseText = "No encontré Paracetamol registrado en el inventario.";
        }
      } else if (lower.includes('ibuprofeno')) {
        const p = allProducts.find(p => p.name.toLowerCase().includes('ibuprofeno'));
        if (p) {
          suggestedProduct = p;
          responseText = `El ${p.name} tiene un precio de RD$ ${p.sale_price.toFixed(2)} y disponemos de ${p.stock} unidades en stock. ¿Lo agregamos?`;
        } else {
          responseText = "No encontré Ibuprofeno en la base de datos.";
        }
      } else if (lower.includes('amoxicilina')) {
        const p = allProducts.find(p => p.name.toLowerCase().includes('amoxicilina'));
        if (p) {
          suggestedProduct = p;
          responseText = `La ${p.name} requiere receta médica, cuesta RD$ ${p.sale_price.toFixed(2)} y hay ${p.stock} unidades. ¿Deseas agregarla?`;
        } else {
          responseText = "No encontré Amoxicilina registrada.";
        }
      } else {
        // Generic search match
        const matching = allProducts.find(p => p.name.toLowerCase().split(' ').some(word => word.length > 3 && lower.includes(word)));
        if (matching) {
          suggestedProduct = matching;
          responseText = `Encontré el producto: ${matching.name} con un precio de RD$ ${matching.sale_price.toFixed(2)} y stock de ${matching.stock} unidades. ¿Quieres agregarlo a la factura?`;
        } else {
          responseText = `He analizado tu consulta sobre "${text}". No encontré coincidencias directas en la base de datos, pero puedes escanear el código de barras para cargarlo al POS.`;
        }
      }

      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: responseText,
        product: suggestedProduct
      }]);

      speakText(responseText);

    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Lo siento, ocurrió un error procesando tu consulta de inventario.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleVoiceMode = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // Simulate voice detection after 3 seconds
    setTimeout(() => {
      if (isListening) return; // if user toggled off in the meantime
      
      const simulatedQuestions = [
        '¿Qué productos tienen stock bajo?',
        '¿Tienes Paracetamol en el catálogo?',
        '¿Cuál es el stock de Ibuprofeno?',
        '¿Qué medicamentos están agotados?'
      ];
      const randomQ = simulatedQuestions[Math.floor(Math.random() * simulatedQuestions.length)];
      
      setIsListening(false);
      handleSendChat(randomQ);
    }, 300);
  };

  if (checkingCash) {
    return (
      <div className="flex h-screen w-screen items-center justify-center flex-col gap-3 bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-muted">Verificando estado de caja...</p>
      </div>
    );
  }

  // Render Open Register View if closed
  if (cashStatus === 'closed') {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e8f6f3 100%)' }}>
        <div className="card w-full max-w-md shadow-2xl p-8 border border-[#16a085]/10 animate-fade-in">
          
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary-light text-primary rounded-xl flex items-center justify-center mb-1">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-black text-main">Apertura de Caja</h2>
            <p className="text-xs text-muted text-center max-w-[280px]">Ingrese el monto inicial en efectivo y confirme con su contraseña para iniciar el turno.</p>
          </div>

          {openRegisterForm.error && (
            <div className="bg-danger-light text-danger p-3 rounded-lg text-xs font-semibold border border-danger/20 mb-4">
              {openRegisterForm.error}
            </div>
          )}

          <form onSubmit={handleOpenRegisterSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600">Nombre de Caja / Terminal (Cajero)</label>
              <select 
                className="input text-sm py-2"
                required
                value={openRegisterForm.name}
                onChange={(e) => setOpenRegisterForm(prev => ({ ...prev, name: e.target.value }))}
              >
                <option value="" disabled>Seleccione Cajero</option>
                {cashierUsers.map(u => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600 font-mono">Fondo Inicial en Caja (Efectivo)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">RD$</span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  required
                  className="input pl-11 text-sm font-bold"
                  value={openRegisterForm.initialAmount}
                  onChange={(e) => setOpenRegisterForm(prev => ({ ...prev, initialAmount: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-600">Confirmar con su Contraseña</label>
              <div className="relative">
                <input 
                  type={openRegisterForm.showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="input text-sm pr-10"
                  value={openRegisterForm.password}
                  onChange={(e) => setOpenRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setOpenRegisterForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {openRegisterForm.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 mt-2 text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Validando...' : 'Iniciar Turno y Abrir Caja'}
            </button>

            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline w-full py-2 text-xs mt-1"
            >
              <ArrowLeft size={14} /> Volver al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#f1f5f9] flex overflow-hidden font-sans">
      
      {/* 1. Left Collapsed POS Sidebar */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-5 shrink-0 justify-between">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg mb-2">
            <ShoppingCart size={22} />
          </div>

          {/* POS mode button - Active */}
          <button 
            className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center transition-colors"
            title="Terminal POS"
          >
            <Printer size={20} />
          </button>

          {/* Cash Register movements */}
          <button 
            onClick={triggerCloseRegister}
            className="w-12 h-12 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Arqueo / Cierre de Caja"
          >
            <Banknote size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          {/* Back to main app */}
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-12 h-12 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
            title="Volver al Dashboard"
          >
            <Home size={20} />
          </button>

          {/* User widget */}
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shadow-inner" title={user?.name}>
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>

      {/* 2. Main POS Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">Facturación DGII</h1>
            <p className="text-[10px] text-muted font-semibold tracking-wide">GESTIÓN DE COMPROBANTES FISCALES (NCF)</p>
          </div>

          {/* Search bar inside header */}
          <div className="w-full max-w-xl mx-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Buscar producto por nombre, código o escanear código de barras..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-10 text-xs focus:outline-none focus:border-primary focus:bg-white transition-all font-medium text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDownSearch}
            />
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary hover:bg-primary-light rounded-md"
              title="Cámara Scanner"
            >
              <ScanLine size={16} />
            </button>
          </div>

          {/* Cash & User Info banner */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Caja: {cashStatus.name}</span>
            </div>
          </div>
        </header>

        {/* Workspace body split */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0 relative">
          
          {/* Left Column: Product Catalog upper + Added items lower */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
            
            {/* Catalog Grid Cards */}
            <div className="h-[45%] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden p-4">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Catálogo de Productos</h2>
                <span className="text-[10px] font-bold text-muted bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredProducts.length} productos
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-1">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.stock <= 0;
                  return (
                    <div 
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`bg-white border rounded-xl p-3 flex flex-col justify-between transition-all relative select-none ${
                        isOutOfStock 
                        ? 'opacity-50 cursor-not-allowed border-slate-200' 
                        : 'hover:border-primary hover:shadow-md cursor-pointer border-slate-200/80'
                      }`}
                    >
                      <span className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isOutOfStock ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary'
                      }`}>
                        {isOutOfStock ? 'Agotado' : `Stock: ${product.stock}`}
                      </span>

                      <div className="h-16 w-full bg-slate-50 rounded-lg flex items-center justify-center mb-2.5 overflow-hidden border border-slate-100 shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-primary/70 bg-primary-light/40 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                            <ShoppingCart size={18} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-h-[45px]">
                        <div>
                          <h3 className="text-[11px] font-bold text-slate-800 leading-tight line-clamp-2">{product.name}</h3>
                          <p className="text-[8px] text-slate-400 font-mono mt-0.5 leading-none">{product.code}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-50 shrink-0">
                          <span className="text-[11px] font-black text-primary">RD$ {product.sale_price.toFixed(2)}</span>
                          <button 
                            disabled={isOutOfStock}
                            className="w-5 h-5 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center justify-center transition-transform hover:scale-105"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Added products table */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Productos agregados</h2>
                <span className="bg-primary-light text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/10">
                  {cart.length} {cart.length === 1 ? 'línea' : 'líneas'} en factura
                </span>
              </div>

              {/* Cart Table list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 border-b border-slate-100 uppercase tracking-wider">
                      <th className="px-5 py-2.5 font-semibold">Producto</th>
                      <th className="px-5 py-2.5 font-semibold text-center w-28">Cantidad</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Precio Unit.</th>
                      <th className="px-5 py-2.5 font-semibold text-center w-20">Descuento</th>
                      <th className="px-5 py-2.5 font-semibold text-right">ITBIS (18%)</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Total</th>
                      <th className="px-5 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-slate-400">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p className="text-xs font-bold text-slate-500">Ningún producto agregado</p>
                            <p className="text-[10px] text-slate-400">Seleccione productos del catálogo superior para facturar.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      cart.map(item => {
                        const itemSubtotal = item.sale_price * item.quantity;
                        const itemTaxable = Math.max(0, itemSubtotal - (item.discount || 0));
                        const itemTax = itemTaxable * 0.18;
                        const itemTotal = itemTaxable + itemTax;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-2.5">
                              <p className="text-xs font-bold text-slate-800 leading-tight">{item.name}</p>
                              <p className="text-[9px] font-mono text-slate-400 leading-tight mt-0.5">{item.barcode || item.code}</p>
                            </td>
                            <td className="px-5 py-2.5">
                              <div className="flex items-center justify-between bg-slate-50 rounded-lg border border-slate-200 px-2 py-0.5 max-w-[90px] mx-auto">
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="text-slate-400 hover:text-slate-800 font-extrabold text-xs w-4 text-center focus:outline-none"
                                >
                                  -
                                </button>
                                <span className="text-xs font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="text-slate-400 hover:text-slate-800 font-extrabold text-xs w-4 text-center focus:outline-none"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-2.5 text-right text-xs font-bold text-slate-700">
                              RD$ {item.sale_price.toFixed(2)}
                            </td>
                            <td className="px-5 py-2.5 text-center">
                              <input 
                                type="number" 
                                min="0"
                                step="0.01"
                                className="input text-xs font-bold py-0.5 px-1 text-center max-w-[65px] mx-auto"
                                value={item.discount || ''}
                                placeholder="0.00"
                                onChange={(e) => updateItemDiscount(item.id, e.target.value)}
                              />
                            </td>
                            <td className="px-5 py-2.5 text-right text-xs font-bold text-slate-500">
                              RD$ {itemTax.toFixed(2)}
                            </td>
                            <td className="px-5 py-2.5 text-right text-xs font-black text-slate-900">
                              RD$ {itemTotal.toFixed(2)}
                            </td>
                            <td className="px-5 py-2.5 text-center">
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-slate-300 hover:text-danger p-1 rounded-md hover:bg-danger-light transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right card: Totals and options */}
          <div className="w-[360px] bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-black text-slate-900">Resumen de Factura</h2>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 font-sans">Datos del cliente</label>
                <select 
                  className="input text-xs py-2"
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const cl = clients.find(c => c.id === parseInt(e.target.value));
                    setSelectedClient(cl || null);
                    if (cl) setRncCedula(cl.cedula || '');
                  }}
                >
                  <option value="">Consumidor Final (Por defecto)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600">RNC / Cédula (opcional)</label>
                <input 
                  type="text" 
                  className="input text-xs py-2"
                  placeholder="Ej. 101-12345-6"
                  value={rncCedula}
                  onChange={(e) => setRncCedula(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600">Tipo de Comprobante</label>
                <select 
                  className="input text-xs py-2"
                  value={ncfType}
                  onChange={(e) => setNcfType(e.target.value)}
                >
                  <option value="B02">B02 - Factura Consumidor Final</option>
                  <option value="B01">B01 - Factura de Crédito Fiscal</option>
                  <option value="B14">B14 - Regímenes Especiales</option>
                  <option value="B15">B15 - Gubernamentales</option>
                </select>
              </div>

              <div className="border-t border-slate-100 my-2"></div>

              <div className="flex flex-col gap-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100 mt-1">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>Subtotal</span>
                  <span>RD$ {totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold text-danger">
                    <span>Descuento</span>
                    <span>- RD$ {totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>ITBIS (18%)</span>
                  <span>RD$ {totals.tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200/50 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800">Total a Pagar</span>
                  <span className="text-xl font-black text-primary">RD$ {totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 shrink-0">
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn btn-primary w-full py-3.5 text-sm font-black shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                Cobrar y Facturar (F8)
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={triggerCloseRegister}
                  className="btn btn-outline flex-1 py-2 text-xs font-bold text-danger border-danger/10 hover:bg-danger-light hover:text-danger"
                >
                  <Lock size={14} /> Cerrar Caja
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-outline flex-1 py-2 text-xs font-bold"
                >
                  <Home size={14} /> Dashboard
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 3. AI CHATBOT FLOAT WIDGET */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Chat Window */}
          {isChatOpen && (
            <div className="w-80 h-[450px] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden mb-3 animate-fade-in relative">
              {/* Header */}
              <div className="bg-primary px-4 py-3 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Bot size={18} />
                  <div>
                    <h3 className="text-xs font-bold leading-tight">Asistente POS IA</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                      <span className="text-[9px] text-emerald-100 leading-none">En línea</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleToggleVoiceMode}
                    className={`p-1 rounded-md hover:bg-primary-dark transition-colors ${isListening ? 'bg-danger text-white' : ''}`}
                    title="Modo Voz"
                  >
                    <Mic size={14} className={isListening ? 'animate-pulse' : ''} />
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 rounded-md hover:bg-primary-dark transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-2.5 bg-slate-50">
                {chatMessages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[85%] ${m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      m.sender === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                    }`}>
                      {m.text}
                      
                      {/* Interactive Add Product action in chatbot bubble */}
                      {m.product && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                            <span>{m.product.name}</span>
                            <span className="font-bold text-primary">RD$ {m.product.sale_price.toFixed(2)}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => addToCart(m.product)}
                            className="btn btn-primary text-[10px] py-1 mt-1 font-bold w-full flex items-center justify-center gap-1"
                          >
                            <Plus size={10} /> Agregar al Carrito
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="self-start flex gap-1 items-center bg-white border rounded-xl px-3 py-2 text-xs text-muted shadow-2xs">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
                
                {isListening && (
                  <div className="flex flex-col items-center justify-center p-3 border border-danger/10 bg-danger-light/35 rounded-xl gap-2 mt-auto">
                    <div className="flex gap-1 h-4 items-center shrink-0">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-0.5 h-full bg-danger rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-danger">Escuchando comando de voz...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <div className="p-2 border-t border-slate-100 bg-white flex gap-2 shrink-0">
                <input 
                  type="text" 
                  className="input text-xs py-1.5 flex-1 pr-8"
                  placeholder="Pregunte o busque..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                />
                <button 
                  onClick={() => handleSendChat()}
                  className="btn btn-primary p-2 rounded-xl text-white"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}

          {/* Toggle button */}
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 hover:bg-primary-dark transition-all relative border border-white/25"
            title="Asistente de Voz POS"
          >
            {isChatOpen ? <X size={20} /> : <MessageSquare size={20} />}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white leading-none"></span>
          </button>
        </div>

      </div>

      {/* 4. PAYMENT MODAL */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Procesar Cobro Fiscal">
        <form onSubmit={processPayment} className="flex flex-col gap-5">
          {paymentError && (
            <div className="bg-danger-light text-danger p-3 rounded-lg text-xs font-semibold border border-danger/20">
              {paymentError}
            </div>
          )}

          <div className="bg-primary-light text-primary text-center p-4 rounded-xl border border-primary/20">
            <p className="text-xs font-bold mb-1 uppercase tracking-wide">Monto Neto a Cobrar</p>
            <h2 className="text-4xl font-black">RD$ {totals.total.toFixed(2)}</h2>
            <div className="flex justify-center gap-4 text-[10px] font-semibold mt-2 pt-2 border-t border-primary/10">
              <span>Subt: RD$ {totals.subtotal.toFixed(2)}</span>
              <span>ITBIS: RD$ {totals.tax.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-700 mb-2">Método de Pago</p>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'efectivo' ? 'bg-primary-light border-primary text-primary' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="efectivo" checked={paymentMethod === 'efectivo'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                <Banknote size={18} /> <span className="font-bold text-xs">Efectivo</span>
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${paymentMethod === 'tarjeta' ? 'bg-primary-light border-primary text-primary' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <input type="radio" name="payment" value="tarjeta" checked={paymentMethod === 'tarjeta'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                <CreditCard size={18} /> <span className="font-bold text-xs">Tarjeta / POS</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'efectivo' && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-xs font-bold text-slate-700">Monto Recibido</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">RD$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  min={totals.total}
                  required
                  className="input pl-11 text-xl font-bold py-2.5" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)} 
                />
              </div>
              {parseFloat(amountPaid) > totals.total && (
                <div className="flex justify-between items-center mt-1 p-3 bg-warning-light text-warning rounded-xl border border-warning/15">
                  <span className="text-xs font-bold">Cambio / Devuelta:</span>
                  <span className="text-base font-black">RD$ {(parseFloat(amountPaid) - totals.total).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (paymentMethod === 'efectivo' && parseFloat(amountPaid) < totals.total)}
            className="btn btn-primary w-full py-3.5 text-sm font-black shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Confirmando...' : 'Completar Venta y Generar NCF'}
          </button>
        </form>
      </Modal>

      {/* 5. SUCCESS RECEIPT MODAL */}
      <Modal isOpen={!!saleResult} onClose={() => setSaleResult(null)} title="Factura Generada Exitosamente">
        {saleResult && (
          <div className="flex flex-col items-center py-4 gap-4 animate-fade-in">
            <div className="w-14 h-14 bg-success-light text-success rounded-full flex items-center justify-center">
              <CheckCircle size={36} />
            </div>
            
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-900 leading-tight">Facturación Exitosa</h2>
              <p className="text-xs text-muted mt-0.5">Comprobante Fiscal registrado en DGII</p>
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 p-5 rounded-xl font-mono text-[11px] text-slate-700 shadow-inner flex flex-col gap-1 my-2">
              <p className="text-center font-black text-sm text-slate-800">PHARMAPLUS SRL</p>
              <p className="text-center">RNC: 130-00001-1</p>
              <p className="text-center text-[10px] text-slate-500">Av. 27 de Febrero #123, Santo Domingo</p>
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              
              <div className="flex justify-between">
                <span>Comprobante:</span>
                <span className="font-bold text-slate-900">{saleResult.ncf}</span>
              </div>
              <div className="flex justify-between">
                <span>Tipo NCF:</span>
                <span className="font-bold">{saleResult.ncfName}</span>
              </div>
              <div className="flex justify-between">
                <span>Venta No:</span>
                <span>{saleResult.sale_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="truncate max-w-[150px]">{saleResult.clientName}</span>
              </div>
              {saleResult.rnc && (
                <div className="flex justify-between">
                  <span>RNC/Cédula:</span>
                  <span>{saleResult.rnc}</span>
                </div>
              )}
              
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              
              <div className="flex justify-between font-semibold">
                <span>Subtotal:</span>
                <span>RD$ {(saleResult.total - saleResult.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>ITBIS (18%):</span>
                <span>RD$ {saleResult.tax.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-dashed border-slate-300 my-1"></div>
              
              <div className="flex justify-between font-black text-slate-900 text-sm py-0.5">
                <span>TOTAL:</span>
                <span>RD$ {saleResult.total.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-dashed border-slate-300 my-2"></div>
              
              <div className="flex justify-between">
                <span>Método:</span>
                <span className="capitalize">{saleResult.payment_method}</span>
              </div>
              {saleResult.change > 0 && (
                <div className="flex justify-between font-bold text-warning-dark">
                  <span>Devuelta:</span>
                  <span>RD$ {saleResult.change.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex w-full gap-3 mt-2">
              <button 
                onClick={() => setSaleResult(null)}
                className="btn btn-primary flex-1 py-3 text-xs font-bold"
              >
                Nueva Venta (POS)
              </button>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="btn btn-outline py-3 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. CLOSE REGISTER MODAL (ARQUEO) */}
      <Modal isOpen={isClosingModalOpen} onClose={() => setIsClosingModalOpen(false)} title="Cierre de Caja y Arqueo">
        {closeRegisterForm.totals && (
          <form onSubmit={handleCloseRegisterSubmit} className="flex flex-col gap-4">
            
            {closeRegisterForm.error && (
              <div className="bg-danger-light text-danger p-3 rounded-lg text-xs font-semibold border border-danger/20">
                {closeRegisterForm.error}
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>Fondo Inicial:</span>
                <span>RD$ {closeRegisterForm.totals.initial.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>Ventas del Turno:</span>
                <span className="text-success font-bold">+ RD$ {closeRegisterForm.totals.sales.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 my-1"></div>
              <div className="flex justify-between text-sm font-black text-slate-800">
                <span>Esperado en Caja:</span>
                <span>RD$ {closeRegisterForm.totals.expected.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Monto Contado en Efectivo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">RD$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  className="input pl-11 text-base font-bold py-2"
                  value={closeRegisterForm.countedAmount}
                  onChange={(e) => setCloseRegisterForm(prev => ({ ...prev, countedAmount: e.target.value }))}
                />
              </div>
              {parseFloat(closeRegisterForm.countedAmount) !== closeRegisterForm.totals.expected && (
                <div className={`mt-1 text-[11px] font-bold ${parseFloat(closeRegisterForm.countedAmount) > closeRegisterForm.totals.expected ? 'text-success' : 'text-danger'}`}>
                  Diferencia: RD$ {(parseFloat(closeRegisterForm.countedAmount) - closeRegisterForm.totals.expected).toFixed(2)}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Notas / Observaciones</label>
              <textarea 
                className="input text-xs py-2 min-h-[60px]"
                placeholder="Ej. Arqueo sin novedades..."
                value={closeRegisterForm.notes}
                onChange={(e) => setCloseRegisterForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Confirmar con su Contraseña</label>
              <div className="relative">
                <input 
                  type={closeRegisterForm.showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="input text-xs pr-10 py-2"
                  value={closeRegisterForm.password}
                  onChange={(e) => setCloseRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setCloseRegisterForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {closeRegisterForm.showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full py-3 text-sm font-black shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Cierre de Caja'}
            </button>
          </form>
        )}
      </Modal>

      {/* Camera Scanner Modal */}
      <BarcodeScannerModal 
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Lector de Código de Barras POS"
      />

    </div>
  );
};

export default POS;
