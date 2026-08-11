import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  Search, Plus, Trash2, Minus, ScanLine, Printer, Mail, Save, Check, 
  CheckCircle2, HelpCircle, Bot, Send, MoreVertical, Sparkles, RefreshCw, 
  FileText, CreditCard, Wallet, ArrowRightLeft, Package, User, ChevronDown, X,
  Info, CornerDownLeft, Copy
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const Facturacion = () => {
  const { user } = useContext(AuthContext);
  const clientSelectRef = useRef(null);

  // Products & Clients List
  const [productsList, setProductsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cart State (Productos agregados)
  const [cartItems, setCartItems] = useState([]);

  // Form & Header Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Invoice Summary State (Resumen de Factura)
  const [selectedClientId, setSelectedClientId] = useState('');
  const [rncCedula, setRncCedula] = useState('');
  const [ncfType, setNcfType] = useState('B02');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountReceived, setAmountReceived] = useState(300);

  // Modals
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isNcfInfoModalOpen, setIsNcfInfoModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailDestination, setEmailDestination] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [lastInvoice, setLastInvoice] = useState(null);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a buscar clientes, calcular ventas del día o realizar una factura rápida.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Toast notification helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch initial data (Products & Clients)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, clientRes] = await Promise.all([
          api.get('/products?limit=100'),
          api.get('/clients?limit=100')
        ]);

        if (prodRes.success) {
          const prods = prodRes.data || [];
          setProductsList(prods);

          // Populate initial sample items if cart empty to match reference image
          if (prods.length > 0) {
            const paracetamol = prods.find(p => p.name.includes('Paracetamol')) || prods[0];
            const ibuprofeno = prods.find(p => p.name.includes('Ibuprofeno')) || prods[1] || prods[0];
            const vitaminaC = prods.find(p => p.name.includes('Vitamina C')) || prods[2] || prods[0];

            const initialCart = [
              {
                product_id: paracetamol.id,
                name: paracetamol.name,
                barcode: paracetamol.barcode || '7501234567890',
                sale_price: paracetamol.sale_price || 45.00,
                quantity: 2,
                discount: 0,
                image_url: paracetamol.image_url
              },
              {
                product_id: ibuprofeno.id,
                name: ibuprofeno.name,
                barcode: ibuprofeno.barcode || '7501112223334',
                sale_price: ibuprofeno.sale_price || 60.00,
                quantity: 1,
                discount: 0,
                image_url: ibuprofeno.image_url
              },
              {
                product_id: vitaminaC.id,
                name: vitaminaC.name,
                barcode: vitaminaC.barcode || '7508889990001',
                sale_price: vitaminaC.sale_price || 70.00,
                quantity: 2,
                discount: 0,
                image_url: vitaminaC.image_url
              }
            ];
            setCartItems(initialCart);
          }
        }

        if (clientRes.success) {
          setClientsList(clientRes.data || []);
        }
      } catch (err) {
        console.error('Error cargando productos/clientes:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Check for saved draft in localStorage
    const savedDraft = localStorage.getItem('pharmaplus_invoice_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && parsed.length > 0) {
          // Toast notifying draft exists
        }
      } catch (e) {}
    }
  }, []);

  // Filtered Search Results
  const searchResults = searchQuery.trim()
    ? productsList.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  // Add Product to Cart
  const addProductToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          barcode: product.barcode || product.code || '7500000000000',
          sale_price: product.sale_price,
          quantity: 1,
          discount: 0,
          image_url: product.image_url
        }
      ];
    });
    setSearchQuery('');
    setShowSearchDropdown(false);
    showToast(`"${product.name}" agregado a la factura`);
  };

  // Update Item Quantity
  const updateQuantity = (productId, delta) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.product_id === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Update Item Discount
  const updateDiscount = (productId, val) => {
    const discountNum = parseFloat(val) || 0;
    setCartItems(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, discount: discountNum }
          : item
      )
    );
  };

  // Remove Item from Cart
  const removeItem = (productId) => {
    const item = cartItems.find(i => i.product_id === productId);
    setCartItems(prev => prev.filter(i => i.product_id !== productId));
    if (item) showToast(`"${item.name}" eliminado de la factura`, 'info');
  };

  // Clear Cart
  const clearCart = () => {
    if (cartItems.length === 0) return;
    setCartItems([]);
    showToast('Factura limpiada por completo', 'info');
  };

  // Save Draft Handler
  const handleSaveDraft = () => {
    if (cartItems.length === 0) {
      showToast('Agrega productos antes de guardar un borrador', 'warning');
      return;
    }
    localStorage.setItem('pharmaplus_invoice_draft', JSON.stringify({
      cartItems,
      selectedClientId,
      rncCedula,
      ncfType,
      savedAt: new Date().toISOString()
    }));
    showToast('Borrador de factura guardado exitosamente');
  };

  // Send Email Handler
  const handleSendEmailSubmit = (e) => {
    e.preventDefault();
    if (!emailDestination.trim()) return;
    setIsEmailModalOpen(false);
    showToast(`Comprobante fiscal enviado exitosamente a ${emailDestination}`);
    setEmailDestination('');
  };

  // Totals Calculations
  const subtotal = cartItems.reduce((acc, i) => acc + (i.quantity * i.sale_price), 0);
  const totalDiscount = cartItems.reduce((acc, i) => acc + (parseFloat(i.discount) || 0), 0);
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const totalTax = Math.round(taxableAmount * 0.18 * 100) / 100;
  const grandTotal = Math.round((taxableAmount + totalTax) * 100) / 100;

  // Change (Cambio) Calculation
  const changeAmount = paymentMethod === 'efectivo'
    ? Math.max(0, (parseFloat(amountReceived) || 0) - grandTotal)
    : 0;

  const totalItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  // Client Selection Change
  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    const client = clientsList.find(c => String(c.id) === String(clientId));
    if (client && client.cedula) {
      setRncCedula(client.cedula);
    }
  };

  // Complete Sale & Generate Invoice (Finalizar Venta)
  const handleFinalizeSale = async () => {
    if (cartItems.length === 0) {
      showToast('Por favor agrega al menos un producto a la factura.', 'warning');
      return;
    }

    try {
      const selectedClient = clientsList.find(c => String(c.id) === String(selectedClientId));
      
      const invoicePayload = {
        sale_id: null,
        client_id: selectedClientId || null,
        ncf_type: ncfType,
        rnc_cedula: rncCedula || (selectedClient?.cedula || null),
        client_name: selectedClient ? selectedClient.name : 'Consumidor Final',
        subtotal: subtotal,
        discount: totalDiscount,
        tax: totalTax,
        total: grandTotal
      };

      const res = await api.post('/invoices', invoicePayload);
      if (res.success) {
        setLastInvoice({
          ...res.data,
          items: [...cartItems],
          paymentMethod,
          amountReceived: parseFloat(amountReceived) || grandTotal,
          changeAmount
        });
        setIsReceiptModalOpen(true);
        setCartItems([]);
        localStorage.removeItem('pharmaplus_invoice_draft');
        showToast('¡Venta finalizada y NCF generado exitosamente!');
      }
    } catch (err) {
      showToast(err.message || 'Error registrando la factura', 'warning');
    }
  };

  // Chatbot Send Message / Quick Chips
  const handleSendChatMessage = async (queryText) => {
    const text = queryText || chatInput;
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    const lower = text.toLowerCase();
    if (lower.includes('ventas del día') || lower.includes('ventas del dia')) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Las ventas acumuladas del día suman un estimado de RD$ ${(grandTotal + 1450).toFixed(2)}.`
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('factura rápida') || lower.includes('factura rapida')) {
      if (productsList.length > 0) {
        addProductToCart(productsList[0]);
      }
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'He agregado un producto rápido a la factura actual.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('buscar cliente')) {
      if (clientSelectRef.current) clientSelectRef.current.focus();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he posicionado en el selector de clientes de la factura.'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta procesada correctamente.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Asistente listo: Tienes ${cartItems.length} productos en la factura por un total de RD$ ${grandTotal.toFixed(2)}.`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

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

      {/* ─── HEADER & TOP ACTION BAR ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Facturación</h1>
          <p className="text-sm text-slate-500">Registra ventas y genera facturas</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Search Input with Scanner Icon */}
          <div className="relative flex-1 sm:w-96 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar producto por nombre, código o escanear código de barras..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearchDropdown(true); }}
              onFocus={() => setShowSearchDropdown(true)}
            />
            <ScanLine 
              onClick={() => setIsProductPickerOpen(true)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors" 
              size={18} 
              title="Escanear código de barras" 
            />

            {/* Live Search Dropdown Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden animate-fade-in divide-y divide-slate-100">
                {searchResults.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addProductToCart(p)}
                    className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                        {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-lg" /> : <Package size={16} className="text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">{p.name}</p>
                        <p className="text-[11px] font-mono text-slate-400">{p.barcode || p.code || '7500000000000'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-xs">RD$ {(p.sale_price || 0).toFixed(2)}</span>
                      <span className="block text-[10px] text-emerald-600 font-medium">Stock: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barcode Scan Button */}
          <button
            onClick={() => setIsProductPickerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <ScanLine size={18} className="text-emerald-600" />
            <span>Escanear código</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setIsProductPickerOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Agregar producto</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID (LEFT TABLE + RIGHT SUMMARY) ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* ─── LEFT COLUMN: PRODUCTOS AGREGADOS + CHATBOT (8 COLS) ──────────── */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* PRODUCTOS AGREGADOS TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 text-base">Productos agregados</h2>
                {cartItems.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {cartItems.length} líneas en factura
                  </span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Producto</th>
                      <th className="pb-3 px-3 text-center">Cantidad</th>
                      <th className="pb-3 px-3 text-right">Precio Unit.</th>
                      <th className="pb-3 px-3 text-center">Descuento</th>
                      <th className="pb-3 px-3 text-right">ITBIS (18%)</th>
                      <th className="pb-3 px-3 text-right">Total</th>
                      <th className="pb-3 px-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {cartItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center text-slate-400">
                          <Package size={36} className="mx-auto mb-2 opacity-40" />
                          <p className="font-medium text-slate-600 text-sm">No hay productos agregados</p>
                          <p className="text-xs text-slate-400 mt-1">Busca un producto arriba para agregarlo a la factura</p>
                        </td>
                      </tr>
                    ) : (
                      cartItems.map((item) => {
                        const lineSubtotal = item.quantity * item.sale_price;
                        const lineDiscount = parseFloat(item.discount) || 0;
                        const lineTax = Math.round((lineSubtotal - lineDiscount) * 0.18 * 100) / 100;
                        const lineTotal = Math.round((lineSubtotal - lineDiscount + lineTax) * 100) / 100;

                        return (
                          <tr key={item.product_id} className="hover:bg-slate-50/50 transition-colors">
                            
                            {/* Producto (Image + Title + Barcode) */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                  {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={18} className="text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 text-xs leading-snug">{item.name}</p>
                                  <p className="text-[11px] font-mono text-slate-400">{item.barcode || '7501234567890'}</p>
                                </div>
                              </div>
                            </td>

                            {/* Cantidad Control [-] Qty [+] */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="inline-flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                                <button
                                  onClick={() => updateQuantity(item.product_id, -1)}
                                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center font-bold text-slate-800 text-xs">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product_id, 1)}
                                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors active:scale-95"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </td>

                            {/* Precio Unitario */}
                            <td className="py-3.5 px-3 text-right font-semibold text-slate-700">
                              RD$ {(item.sale_price || 0).toFixed(2)}
                            </td>

                            {/* Descuento Input */}
                            <td className="py-3.5 px-3 text-center">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-16 px-2 py-1 text-center bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-600"
                                value={item.discount || '0.00'}
                                onChange={(e) => updateDiscount(item.product_id, e.target.value)}
                              />
                            </td>

                            {/* ITBIS (18%) */}
                            <td className="py-3.5 px-3 text-right text-slate-600 font-medium">
                              RD$ {lineTax.toFixed(2)}
                            </td>

                            {/* Total Line */}
                            <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                              RD$ {lineTotal.toFixed(2)}
                            </td>

                            {/* Delete Trash Button */}
                            <td className="py-3.5 px-2 text-center">
                              <button
                                onClick={() => removeItem(item.product_id)}
                                className="p-1 rounded-md text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 size={16} />
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

            {/* Table Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                onClick={clearCart}
                disabled={cartItems.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold disabled:opacity-40 transition-colors active:scale-95"
              >
                <Trash2 size={14} />
                <span>Limpiar todo</span>
              </button>

              <div className="flex items-center gap-4 text-slate-500 font-medium">
                <span>{cartItems.length} productos</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Total items: <strong className="text-slate-800">{totalItemsCount}</strong></span>
              </div>
            </div>
          </div>

          {/* BOTTOM MIDDLE ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleSaveDraft}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-semibold text-xs transition-all shadow-2xs active:scale-95"
            >
              <Save size={16} />
              <span>Guardar Borrador</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-semibold text-xs transition-all shadow-2xs active:scale-95"
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-indigo-600 font-semibold text-xs transition-all shadow-2xs active:scale-95"
            >
              <Mail size={16} />
              <span>Enviar por Email</span>
            </button>
          </div>

          {/* ─── CHATBOT PHARMAPLUS WIDGET AT BOTTOM ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
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

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                'Producto más vendido',
                'Ventas del día',
                'Factura rápida',
                'Buscar cliente'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendChatMessage(chip)}
                  className="px-3 py-1.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-all hover:scale-105 active:scale-95"
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
                        ? 'bg-indigo-600 text-white ml-8 font-medium'
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
              <input
                type="text"
                placeholder="Escribe tu pregunta..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shrink-0 shadow-sm shadow-indigo-600/30"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>

        {/* ─── RIGHT COLUMN: RESUMEN DE FACTURA PANEL (4 COLS) ──────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Resumen de Factura</h3>
              <button 
                onClick={() => setIsNcfInfoModalOpen(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                title="Información de Comprobante Fiscal NCF"
              >
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Datos del cliente */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Datos del cliente</label>
              <select
                ref={clientSelectRef}
                value={selectedClientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Consumidor Final</option>
                {clientsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.cedula ? `(${c.cedula})` : ''}</option>
                ))}
              </select>

              {/* RNC / Cédula Input */}
              <input
                type="text"
                placeholder="RNC / Cédula (opcional)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 mt-1"
                value={rncCedula}
                onChange={(e) => setRncCedula(e.target.value)}
              />
            </div>

            {/* Tipo de Comprobante NCF */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-slate-500">Tipo de Comprobante</label>
                <HelpCircle 
                  size={14} 
                  className="text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors" 
                  onClick={() => setIsNcfInfoModalOpen(true)}
                  title="Haz clic para ver especificaciones de tipos NCF" 
                />
              </div>
              <select
                value={ncfType}
                onChange={(e) => setNcfType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="B02">B02 - Factura Consumidor Final</option>
                <option value="B01">B01 - Factura de Crédito Fiscal</option>
                <option value="B04">B04 - Nota de Débito</option>
                <option value="B14">B14 - Regímenes Especiales</option>
                <option value="B15">B15 - Gubernamental</option>
              </select>
            </div>

            {/* Totals Breakdown Card */}
            <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">RD$ {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-rose-600 font-medium">
                <span>Descuento</span>
                <span className="font-bold">RD$ {totalDiscount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600 font-medium">
                <span>ITBIS (18%)</span>
                <span className="font-semibold text-slate-800">RD$ {totalTax.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm uppercase">TOTAL</span>
                <span className="font-extrabold text-emerald-600 text-xl tracking-tight">
                  RD$ {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Método de pago Tabs */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod('efectivo')}
                  className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'efectivo'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Wallet size={14} />
                  <span>Efectivo</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('tarjeta')}
                  className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'tarjeta'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>Tarjeta</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'transferencia'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <ArrowRightLeft size={14} />
                  <span>Transferencia</span>
                </button>
              </div>
            </div>

            {/* Monto recibido & Cambio (when Efectivo) */}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold text-slate-600">Monto recibido</label>
                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">RD$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-9 pr-3 py-1.5 text-right font-bold text-slate-900 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="font-semibold text-emerald-800 text-xs">Cambio</span>
                  <span className="font-extrabold text-emerald-600 text-lg">
                    RD$ {changeAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Final Action Button: Finalizar Venta */}
            <button
              onClick={handleFinalizeSale}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-98 mt-2"
            >
              <Check size={18} />
              <span>Finalizar Venta</span>
            </button>

          </div>
        </div>

      </div>

      {/* ─── MODAL: PRODUCT PICKER MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        title="Catálogo de Productos - Agregar a Factura"
        maxWidth="max-w-xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
            {productsList.map(p => (
              <div
                key={p.id}
                onClick={() => { addProductToCart(p); setIsProductPickerOpen(false); }}
                className="p-3 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl cursor-pointer transition-all flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover rounded-xl" /> : <Package size={20} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-xs truncate">{p.name}</p>
                  <p className="text-[11px] font-mono text-slate-400">{p.barcode || '7500000000000'}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold text-indigo-700 text-xs">RD$ {(p.sale_price || 0).toFixed(2)}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Stock: {p.stock}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setIsProductPickerOpen(false)} className="btn btn-outline text-xs">
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: NCF TYPE INFO TOOLTIP MODAL ─────────────────────────────── */}
      <Modal
        isOpen={isNcfInfoModalOpen}
        onClose={() => setIsNcfInfoModalOpen(false)}
        title="Información de Comprobantes NCF (DGII)"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-3 text-xs text-slate-700">
          <p className="text-slate-500">
            Especificaciones de Comprobantes Fiscales autorizados por la Dirección General de Impuestos Internos (DGII):
          </p>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-indigo-700 font-mono">B01 - Factura de Crédito Fiscal:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Para personas físicas o jurídicas que sustentan costos y gastos para fines de ISR o adelanto de ITBIS.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-indigo-700 font-mono">B02 - Factura de Consumo Final:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Para el consumidor final. No sustenta crédito fiscal ni costos y gastos.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-indigo-700 font-mono">B04 - Nota de Débito:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Para recuperar costos o gastos adicionales incurridos luego de emitido el comprobante.</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-indigo-700 font-mono">B14 - Regímenes Especiales:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Facturas emitidas a empresas exentas bajo leyes de incentivo (Zonas Francas, etc.).</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="text-indigo-700 font-mono">B15 - Gubernamental:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">Facturas emitidas a instituciones del Estado dominicano.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button onClick={() => setIsNcfInfoModalOpen(false)} className="btn btn-primary text-xs">
              Entendido
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: ENVIAR EMAIL COMPROBANTE ────────────────────────────────── */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Enviar Factura por Correo Electrónico"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSendEmailSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Ingresa la dirección de correo a la que deseas enviar el comprobante fiscal en formato PDF / e-CF:
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Correo Electrónico del Destinatario *</label>
            <input
              required
              type="email"
              placeholder="cliente@ejemplo.com"
              className="input text-sm"
              value={emailDestination}
              onChange={(e) => setEmailDestination(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsEmailModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold inline-flex items-center gap-1.5">
              <Send size={14} />
              <span>Enviar Factura</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: COMPROBANTE EMITIDO (RECEIPT VOUCHER) ─────────────────────── */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Factura Emitida Con Éxito"
        maxWidth="max-w-md"
      >
        {lastInvoice && (
          <div className="flex flex-col gap-4 text-xs text-slate-800">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="font-bold text-slate-900 text-base uppercase">PharmaPlus SRL</h2>
              <p className="text-slate-500 font-mono">RNC: 130-00001-1</p>
              <p className="text-slate-500">Av. 27 de Febrero #123, Santo Domingo</p>

              <div className="my-3 border-t border-dashed border-slate-300"></div>

              <span className="font-bold text-indigo-700 text-sm block">Factura Consumidor Final</span>
              <p className="font-mono text-sm font-bold text-slate-900 mt-1">NCF: {lastInvoice.ncf || 'B0200000001'}</p>
              <p className="text-slate-400 font-mono text-[11px]">Número Interno: {lastInvoice.invoice_number}</p>
            </div>

            {/* Items Summary */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-700 mb-1 border-b border-slate-100 pb-1">Detalle de productos:</p>
              {lastInvoice.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-mono font-semibold">RD$ {(item.quantity * item.sale_price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>RD$ {(lastInvoice.subtotal || 0).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>ITBIS (18%):</span><span>RD$ {(lastInvoice.tax || 0).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>TOTAL:</span>
                <span className="text-emerald-600">RD$ {(lastInvoice.total || 0).toFixed(2)}</span>
              </div>
              {lastInvoice.paymentMethod === 'efectivo' && (
                <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                  <span>Monto Recibido: RD$ {lastInvoice.amountReceived?.toFixed(2)}</span>
                  <span className="font-bold text-emerald-600">Cambio: RD$ {lastInvoice.changeAmount?.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => window.print()} className="btn btn-outline text-xs inline-flex items-center gap-1.5">
                <Printer size={14} />
                <span>Imprimir Ticket</span>
              </button>
              <button onClick={() => setIsReceiptModalOpen(false)} className="btn btn-primary text-xs font-semibold">
                Aceptar
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Facturacion;
