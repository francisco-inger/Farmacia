import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, User, CreditCard, Banknote, ShoppingCart, CheckCircle, Printer, ScanLine, Camera } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { playScannerBeep } from '../../utils/sound';

const POS = () => {
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [cashStatus, setCashStatus] = useState(null); // Check if cash register is open
  
  const [loading, setLoading] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Payment State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountPaid, setAmountPaid] = useState('');
  const [saleResult, setSaleResult] = useState(null);

  // Handle Barcode Scan (both hardware USB scanner and Camera scanner)
  const handleBarcodeScanned = async (code) => {
    try {
      const res = await api.get(`/products?search=${encodeURIComponent(code)}&limit=5`);
      if (res.data && res.data.length > 0) {
        // Exact barcode match or first match
        const exactMatch = res.data.find(p => p.code === code) || res.data[0];
        playScannerBeep();
        addToCart(exactMatch);
      } else {
        alert(`No se encontró ningún producto con el código: ${code}`);
      }
    } catch (err) {
      console.error('Error procesando escaneo de código:', err);
    }
  };

  // Hardware USB/Bluetooth Scanner Listener
  useBarcodeScanner(handleBarcodeScanned);

  useEffect(() => {
    // Check cash register status
    api.get('/cash-registers')
      .then(res => {
        const openCash = res.data.find(c => c.status === 'abierta');
        setCashStatus(openCash || 'closed');
      })
      .catch(err => console.error(err));
    
    // Load top clients for quick selection
    api.get('/clients?limit=5')
      .then(res => setClients(res.data))
      .catch(err => console.error(err));
      
    // Focus search input
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delay = setTimeout(() => {
        api.get(`/products?search=${searchTerm}&limit=10`)
          .then(res => setProducts(res.data))
          .catch(err => console.error(err));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setProducts([]);
    }
  }, [searchTerm]);

  const handleKeyDownSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim().length > 0) {
      handleBarcodeScanned(searchTerm.trim());
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Producto agotado');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setSearchTerm('');
    setProducts([]);
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

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);
    const tax = subtotal * 0.18; // ITBIS
    const total = subtotal; // Assuming prices include tax for simplicity in this demo
    return { subtotal, tax, total };
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (cashStatus === 'closed') {
      alert('Debes abrir la caja registradora primero');
      return;
    }
    setAmountPaid(calculateTotals().total.toFixed(2));
    setIsPaymentModalOpen(true);
  };

  const processPayment = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'efectivo' && parseFloat(amountPaid) < calculateTotals().total) {
      alert('El monto pagado es menor al total');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        client_id: selectedClient?.id || null,
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity, unit_price: item.sale_price })),
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid) || calculateTotals().total,
        discount: 0
      };
      const res = await api.post('/pos/sales', saleData);
      setSaleResult(res.data);
      setCart([]);
      setSelectedClient(null);
      setIsPaymentModalOpen(false);
    } catch (err) {
      alert(err.message || 'Error procesando la venta');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (cashStatus === 'closed') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <div className="w-16 h-16 bg-warning-light text-warning rounded-full flex items-center justify-center">
          <Banknote size={32} />
        </div>
        <h2 className="text-xl font-bold">Caja Cerrada</h2>
        <p className="text-muted max-w-md">Para procesar ventas en el POS, debes realizar la apertura de tu caja registradora correspondiente a este turno.</p>
        <button onClick={() => window.location.href='/cajas'} className="btn btn-primary mt-2">Ir a Gestión de Cajas</button>
      </div>
    );
  }

  return (
    <div className="h-full flex gap-4">
      
      {/* Left Area: Products Search */}
      <div className="flex-1 flex flex-col gap-4 bg-surface rounded-lg shadow-sm border border-border overflow-hidden p-4">
        <div className="bg-[#16a085] rounded-xl p-3.5 text-white shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 z-10">
            <h2 className="text-lg font-black text-white tracking-tight">Punto de Venta (POS)</h2>
          </div>
          
          <div className="shrink-0 h-12 flex items-center justify-center z-10">
            <img 
              src="/modules/pos.png" 
              alt="POS" 
              className="h-full w-auto max-w-[200px] object-contain rounded-lg drop-shadow-md"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Buscar o escanear código de barras (USB / Cámara)..." 
            className="w-full bg-background border border-border rounded-lg py-3 pl-10 pr-12 text-base focus:outline-none focus:border-primary transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDownSearch}
          />
          <button
            onClick={() => setIsCameraScannerOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-[#16a085] hover:bg-emerald-50 rounded-lg transition-colors"
            title="Abrir Lector de Código por Cámara"
          >
            <ScanLine size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
          {searchTerm && products.length === 0 && (
            <p className="text-center text-muted mt-4">No se encontraron productos</p>
          )}
          {products.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${
                product.stock > 0 ? 'border-border bg-background hover:border-primary hover:bg-primary-light/50' : 'border-danger/20 bg-danger-light/30 opacity-60 cursor-not-allowed'
              }`}
            >
              <div>
                <p className="font-bold text-sm text-main">{product.name}</p>
                <p className="text-xs text-muted font-mono">{product.code} | Stock: {product.stock}</p>
              </div>
              <p className="font-bold text-primary">RD$ {product.sale_price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Area: Cart & Checkout */}
      <div className="w-[350px] flex flex-col bg-surface rounded-lg shadow-sm border border-border overflow-hidden shrink-0">
        
        {/* Client Selection */}
        <div className="p-4 border-b border-border bg-background/50">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-muted">Cliente</span>
            {selectedClient && <button onClick={() => setSelectedClient(null)} className="text-[10px] text-danger hover:underline">Quitar</button>}
          </div>
          {selectedClient ? (
            <div className="flex items-center gap-2 p-2 bg-surface border border-primary rounded-md">
              <User size={16} className="text-primary" />
              <div>
                <p className="text-xs font-bold text-main leading-tight">{selectedClient.name}</p>
                <p className="text-[10px] text-muted leading-tight">{selectedClient.cedula_rnc || 'Sin RNC'}</p>
              </div>
            </div>
          ) : (
            <select 
              className="input text-xs w-full py-1.5"
              onChange={(e) => setSelectedClient(clients.find(c => c.id === parseInt(e.target.value)))}
              defaultValue=""
            >
              <option value="" disabled>Consumidor Final</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted opacity-50">
              <ShoppingCart size={48} className="mb-2" />
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {cart.map(item => (
                <div key={item.id} className="p-2 bg-background border border-border rounded-md relative group">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={12} />
                  </button>
                  <p className="text-xs font-bold text-main leading-tight truncate pr-4">{item.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs font-semibold text-primary">RD$ {item.sale_price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 bg-surface rounded border border-border px-1">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-muted hover:text-main px-1 font-bold">-</button>
                      <span className="text-xs font-bold min-w-[20px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-muted hover:text-main px-1 font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Action */}
        <div className="p-4 bg-background border-t border-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-muted font-medium">Subtotal</span>
            <span className="text-xs text-main font-semibold">RD$ {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-muted font-medium">ITBIS (18%)</span>
            <span className="text-xs text-main font-semibold">RD$ {totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-4 pt-2 border-t border-border/50">
            <span className="text-sm font-bold text-main">Total a Pagar</span>
            <span className="text-xl font-bold text-primary">RD$ {totals.total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="btn btn-primary w-full py-3 text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            Procesar Pago
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Procesar Pago">
        <form onSubmit={processPayment} className="flex flex-col gap-6">
          <div className="bg-primary-light text-primary text-center p-4 rounded-xl border border-primary/20">
            <p className="text-sm font-semibold mb-1">Monto a Cobrar</p>
            <h2 className="text-4xl font-bold">RD$ {totals.total.toFixed(2)}</h2>
          </div>

          <div>
            <p className="text-sm font-bold text-main mb-3">Método de Pago</p>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'efectivo' ? 'bg-primary-light border-primary text-primary' : 'border-border text-muted hover:bg-background'}`}>
                <input type="radio" name="payment" value="efectivo" checked={paymentMethod === 'efectivo'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                <Banknote size={20} /> <span className="font-semibold text-sm">Efectivo</span>
              </label>
              <label className={`flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === 'tarjeta' ? 'bg-primary-light border-primary text-primary' : 'border-border text-muted hover:bg-background'}`}>
                <input type="radio" name="payment" value="tarjeta" checked={paymentMethod === 'tarjeta'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                <CreditCard size={20} /> <span className="font-semibold text-sm">Tarjeta</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'efectivo' && (
            <div>
              <label className="text-sm font-bold text-main mb-1 block">Efectivo Recibido</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold">RD$</span>
                <input 
                  type="number" 
                  step="0.01" 
                  min={totals.total} 
                  required
                  className="input pl-10 text-xl font-bold py-3" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)} 
                />
              </div>
              {parseFloat(amountPaid) > totals.total && (
                <div className="flex justify-between items-center mt-2 p-2 bg-warning-light text-warning rounded-lg border border-warning/20">
                  <span className="text-sm font-semibold">Devuelta (Cambio):</span>
                  <span className="text-lg font-bold">RD$ {(parseFloat(amountPaid) - totals.total).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (paymentMethod === 'efectivo' && parseFloat(amountPaid) < totals.total)}
            className="btn btn-primary w-full py-3 text-base shadow-md disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Completar Venta e Imprimir'}
          </button>
        </form>
      </Modal>

      {/* Success Modal (Receipt) */}
      <Modal isOpen={!!saleResult} onClose={() => setSaleResult(null)} title="Venta Completada">
        {saleResult && (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <div className="w-16 h-16 bg-success-light text-success rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-main">¡Pago Exitoso!</h2>
            <p className="text-muted">Venta: {saleResult.sale_number}</p>
            
            <div className="w-full bg-background border border-border p-4 rounded-lg my-4 text-sm font-mono">
              <p className="text-center font-bold mb-2">PHARMAPLUS</p>
              <p>Ticket: {saleResult.sale_number}</p>
              <p>Fecha: {new Date().toLocaleString('es-DO')}</p>
              <p>Método: {saleResult.payment_method}</p>
              <p className="border-b border-dashed border-muted my-2"></p>
              <div className="flex justify-between font-bold">
                <span>TOTAL</span>
                <span>RD$ {saleResult.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex w-full gap-3">
              <button onClick={() => setSaleResult(null)} className="btn btn-outline flex-1">Nueva Venta</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal 
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Lector de Código de Barras POS"
      />

    </div>
  );
};

// Simple X icon for cart removal
const X = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default POS;
