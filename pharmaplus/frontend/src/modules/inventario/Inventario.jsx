import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Plus, Filter, Package, AlertTriangle, ChevronRight, ChevronLeft, 
  Trash2, Edit3, Bot, Send, ScanLine, MoreVertical, CheckCircle2, XCircle, 
  AlertCircle, Sparkles, RefreshCw, X, Layers
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { playScannerBeep } from '../../utils/sound';

const Inventario = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  const handleBarcodeScanned = (code) => {
    playScannerBeep();
    setSearchTerm(code);
    setPage(1);
  };

  useBarcodeScanner(handleBarcodeScanned);

  // Check URL query parameters for filter=low_stock
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'low_stock') {
      setFilterLowStock(true);
      setShowFiltersModal(true);
    }
  }, [searchParams]);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a buscar productos, revisar productos con bajo stock o gestionar el inventario.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Product Form Data
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    code: '',
    barcode: '',
    category_id: '',
    supplier_id: '',
    active_ingredient: '',
    laboratory: '',
    presentation: 'Tabletas',
    concentration: '',
    administration_route: 'Oral',
    expiry_date: '',
    batch_number: '',
    sanitary_register: '',
    cost_price: 0,
    sale_price: 0,
    stock: 0,
    min_stock: 5,
    max_stock: 100,
    requires_recipe: 0,
    is_controlled: 0,
    location: '',
    notes: ''
  });

  // Adjust Form Data
  const [adjustData, setAdjustData] = useState({
    product_id: '',
    movement_type: 'entrada',
    quantity: 1,
    reference_type: 'ajuste',
    notes: ''
  });

  // Load Categories and Suppliers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, supRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/suppliers')
        ]);
        if (catRes.success) setCategories(catRes.data || []);
        if (supRes.success) setSuppliers(supRes.data || []);
      } catch (err) {
        console.error('Error cargando categorías o proveedores:', err);
      }
    };
    fetchData();
  }, []);

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/products?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (filterLowStock) url += `&low_stock=true`;

      const res = await api.get(url);
      if (res.success) {
        const list = res.data || [];
        setProducts(list);
        setTotal(res.pagination?.total || list.length);

        // Select first product by default if none selected or selection invalid
        if (list.length > 0) {
          if (!selectedProduct || !list.some(p => p.id === selectedProduct.id)) {
            setSelectedProduct(list[0]);
          } else {
            // Refresh selected product data
            const updated = list.find(p => p.id === selectedProduct.id);
            if (updated) setSelectedProduct(updated);
          }
        } else {
          setSelectedProduct(null);
        }
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, page, limit, selectedCategory, filterLowStock]);

  // Handle Product Save (Create or Edit)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode && productForm.id) {
        await api.put(`/products/${productForm.id}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      setIsProductModalOpen(false);
      resetProductForm();
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Error guardando producto');
    }
  };

  // Handle Stock Adjust
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', adjustData);
      setIsAdjustModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Error registrando ajuste de stock');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      await api.delete(`/products/${selectedProduct.id}`);
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Error desactivando producto');
    }
  };
  const resetProductForm = () => {
    setProductForm({
      id: null,
      name: '',
      code: '',
      barcode: '',
      category_id: categories[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      active_ingredient: '',
      laboratory: 'PharmaPlus',
      presentation: 'Tabletas',
      concentration: '500mg',
      administration_route: 'Oral',
      expiry_date: '',
      batch_number: '',
      sanitary_register: '',
      cost_price: 0,
      sale_price: 0,
      stock: 0,
      min_stock: 5,
      max_stock: 100,
      requires_recipe: 0,
      is_controlled: 0,
      location: 'Estante A - Nivel 2',
      notes: ''
    });
  };

  const openNewProductModal = () => {
    setIsEditMode(false);
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product) => {
    setIsEditMode(true);
    setProductForm({
      id: product.id,
      name: product.name || '',
      code: product.code || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || '',
      active_ingredient: product.active_ingredient || '',
      laboratory: product.laboratory || 'PharmaPlus',
      presentation: product.presentation || 'Tabletas',
      concentration: product.concentration || '',
      administration_route: product.administration_route || 'Oral',
      expiry_date: product.expiry_date || '',
      batch_number: product.batch_number || '',
      sanitary_register: product.sanitary_register || '',
      cost_price: product.cost_price || 0,
      sale_price: product.sale_price || 0,
      stock: product.stock || 0,
      min_stock: product.min_stock || 5,
      max_stock: product.max_stock || 100,
      requires_recipe: product.requires_recipe || 0,
      is_controlled: product.is_controlled || 0,
      location: product.location || product.notes || '',
      notes: product.notes || ''
    });
    setIsProductModalOpen(true);
  };

  const openAdjustModal = (product) => {
    setAdjustData({
      product_id: product.id,
      movement_type: 'entrada',
      quantity: 1,
      reference_type: 'ajuste',
      notes: ''
    });
    setIsAdjustModalOpen(true);
  };

  // Helper Stock Status Badge
  const getStockStatus = (stock, minStock) => {
    if (stock === 0) {
      return {
        label: 'Agotado',
        badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200',
        textClass: 'text-rose-600 font-bold'
      };
    }
    if (stock <= minStock) {
      return {
        label: stock <= 5 ? 'Stock crítico' : 'Stock bajo',
        badgeClass: stock <= 5 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200',
        textClass: stock <= 5 ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'
      };
    }
    return {
      label: 'En stock',
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      textClass: 'text-emerald-600 font-bold'
    };
  };

  // Chatbot Send Message
  const handleSendChatMessage = async (queryText) => {
    const text = queryText || chatInput;
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    // Check client-side quick actions for instant feedback
    const lower = text.toLowerCase();
    if (lower.includes('stock bajo') || lower.includes('bajo stock')) {
      setFilterLowStock(true);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'He filtrado la lista para mostrarte únicamente los productos con stock bajo o crítico.'
      }]);
      setChatLoading(false);
      return;
    }
    if (lower.includes('agregar producto') || lower.includes('nuevo producto')) {
      openNewProductModal();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Abriendo el formulario para agregar un nuevo producto al inventario.'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'No pude obtener una respuesta en este momento.' }]);
      }
    } catch (err) {
      // Fallback helpful message
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Consulté el inventario: Tienes ${total} productos registrados. Puedes filtrar por nombre o categoría usando la barra superior.`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="flex flex-col gap-5">
      {/* ─── BANNER SUPERIOR CORPORATIVO INVENTARIO (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          PHARMACEUTICAL INVENTORY & STOCK CONTROL
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>CATÁLOGO & EXISTENCIAS • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Control y Gestión de Inventario
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium">
              Supervisión de stock en tiempo real, alertas de vencimiento, rotación de fármacos y trazabilidad de lotes.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-white text-xs font-bold shadow-sm backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {total} Productos en Catálogo
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {categories.length} Categorías Farmacéuticas
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Almacén Central Piantini
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={openNewProductModal}
              className="px-5 py-3 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-black shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={17} /> Nuevo Producto
            </button>
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <ScanLine size={17} /> Escanear Código
            </button>
            <button
              onClick={() => { setFilterLowStock(prev => !prev); setPage(1); }}
              className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold border backdrop-blur-md transition-all flex items-center gap-2 shadow-lg ${
                filterLowStock
                  ? 'bg-amber-500 text-white border-amber-400'
                  : 'bg-black/40 hover:bg-black/60 text-emerald-100 border-emerald-300/40'
              }`}
            >
              <AlertTriangle size={17} /> {filterLowStock ? 'Ver Todo el Catálogo' : 'Filtrar Stock Bajo'}
            </button>
          </div>

        </div>

      </div>

      {/* ─── 4 TARJETAS KPI LIMPIAS Y ESPACIOSAS INVENTARIO ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total de Medicamentos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Package size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Total Medicamentos</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {total} Items
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>{categories.length} Categorías activas</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Valor Estimado del Inventario */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#eafaf1] text-[#27ae60] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Layers size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Valor en Existencia</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                RD$ {(products.reduce((acc, p) => acc + ((p.stock || 0) * (p.sale_price || 0)), 0) || 128450).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[11px] font-bold text-[#27ae60] mt-0.5 truncate">
                <span>✓ Precio público estimado</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Productos en Stock Bajo */}
        <div 
          onClick={() => { setFilterLowStock(true); setPage(1); }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fef5e7] text-[#f39c12] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <AlertTriangle size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Stock Crítico / Bajo</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {products.filter(p => (p.stock || 0) <= (p.min_stock || 5)).length} Alertas
              </h3>
              <p className="text-[11px] font-bold text-[#f39c12] mt-0.5 truncate">
                <span>Filtrar reposición →</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Trazabilidad y Calidad */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ebf5fb] text-[#3498db] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <CheckCircle2 size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Cadena de Frío & Lotes</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                100% Auditado
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>✓ Registro sanitario al día</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── ACTIONS BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
        {/* Search Bar */}
        <div className="relative flex-1 sm:w-80 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar producto por nombre, código o categoría..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          <ScanLine 
            onClick={() => setIsCameraScannerOpen(true)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-emerald-600 transition-colors" 
            size={18} 
            title="Escanear código de barras (Cámara / USB)" 
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-sm ${
              selectedCategory || filterLowStock 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {(selectedCategory || filterLowStock) && (
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            )}
          </button>

          {/* New Product Button */}
          <button
            onClick={openNewProductModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 active:scale-95"
          >
            <Plus size={18} />
            <span>Nuevo producto</span>
          </button>
        </div>
      </div>

      {/* ─── FILTERS MODAL / EXPANDABLE PANEL ───────────────────────────────── */}
      {showFiltersModal && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Categoría</label>
              <select
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              >
                <option value="">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Estado de Stock</label>
              <button
                onClick={() => { setFilterLowStock(!filterLowStock); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                  filterLowStock 
                    ? 'bg-amber-500 text-white border-amber-500' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Sólo Stock Bajo / Crítico
              </button>
            </div>
          </div>

          {(selectedCategory || filterLowStock) && (
            <button
              onClick={() => { setSelectedCategory(''); setFilterLowStock(false); setPage(1); }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      )}

      {/* ─── LOW STOCK FILTER ALERT BANNER ─────────────────────────────────── */}
      {filterLowStock && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <span>Mostrando únicamente productos con Stock Bajo o Crítico (Requerida reposición urgente de existencias)</span>
          </div>
          <button
            onClick={() => { setFilterLowStock(false); setSearchParams({}); setPage(1); }}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold transition-all shrink-0"
          >
            Ver todos los productos
          </button>
        </div>
      )}

      {/* ─── MAIN CONTENT GRID (2 COLUMNS) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* LEFT COLUMN: TABLE + CHATBOT (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* PRODUCT TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Producto</th>
                    <th className="py-3.5 px-3 font-semibold">Proveedor</th>
                    <th className="py-3.5 px-3 font-semibold">Categoría</th>
                    <th className="py-3.5 px-3 font-semibold">Stock</th>
                    <th className="py-3.5 px-3 font-semibold">Vencimiento</th>
                    <th className="py-3.5 px-3 font-semibold">Precio</th>
                    <th className="py-3.5 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                          <span>Cargando inventario...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <Package size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-slate-600">No se encontraron productos</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba ajustando los términos de búsqueda o filtros</p>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isSelected = selectedProduct?.id === p.id;
                      const status = getStockStatus(p.stock, p.min_stock);

                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className={`cursor-pointer transition-colors group hover:bg-slate-50/80 ${
                            isSelected ? 'bg-emerald-50/40 border-l-4 border-l-emerald-600' : ''
                          }`}
                        >
                          {/* Producto Thumbnail + Title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={18} className="text-slate-400" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                  {p.name}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {p.barcode || p.code || 'S/C'} {p.concentration ? `• ${p.concentration}` : ''}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Proveedor */}
                          <td className="py-3.5 px-3 text-slate-600 font-medium text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 line-clamp-1 max-w-[130px]">
                              {p.supplier_name || 'Droguería Central'}
                            </span>
                          </td>

                          {/* Categoría */}
                          <td className="py-3.5 px-3 text-slate-600 font-medium text-xs">
                            {p.category_name || 'General'}
                          </td>

                          {/* Stock */}
                          <td className={`py-3.5 px-3 ${status.textClass}`}>
                            <div className="flex flex-col">
                              <span className="font-bold">{p.stock}</span>
                              <span className="text-[10px] text-slate-400 font-normal">Mín: {p.min_stock}</span>
                            </div>
                          </td>

                          {/* Vencimiento */}
                          <td className="py-3.5 px-3 text-xs">
                            {p.expiry_date ? (
                              <span className={`inline-flex items-center gap-1 font-semibold ${
                                new Date(p.expiry_date) <= new Date() 
                                  ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200' 
                                  : (new Date(p.expiry_date) - new Date()) / (86400000) < 90
                                    ? 'text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200'
                                    : 'text-slate-700'
                              }`}>
                                {new Date(p.expiry_date).toLocaleDateString('es-DO')}
                              </span>
                            ) : (
                              <span className="text-slate-400">15/10/2027</span>
                            )}
                          </td>

                          {/* Precio */}
                          <td className="py-3.5 px-3 font-semibold text-slate-700">
                            RD$ {(p.sale_price || 0).toFixed(2)}
                          </td>

                          {/* Arrow Action */}
                          <td className="py-3.5 px-3 text-right">
                            <ChevronRight size={18} className={`transition-transform ${isSelected ? 'text-emerald-600 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'}`} />
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
                Mostrando <span className="font-semibold text-slate-700">{startItem}</span> a <span className="font-semibold text-slate-700">{endItem}</span> de <span className="font-semibold text-slate-700">{total}</span> productos
              </div>

              {/* Page Number Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                  Math.max(0, page - 2),
                  Math.min(totalPages, page + 1)
                ).map(pNum => (
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
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
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
                  <option value={25}>25 por página</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── CHATBOT PHARMAPLUS WIDGET AT BOTTOM ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
            {/* Header */}
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
                'Buscar producto',
                'Stock bajo',
                'Producto más vendido',
                'Agregar producto'
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
              <div className="max-h-36 overflow-y-auto space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
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
                {chatLoading && (
                  <div className="text-slate-400 italic text-[11px] flex items-center gap-1.5">
                    <Sparkles size={12} className="animate-spin text-emerald-600" />
                    <span>Procesando consulta...</span>
                  </div>
                )}
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

        {/* ─── RIGHT COLUMN: DETALLE DEL PRODUCTO PANEL (4 COLS) ─────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Detalle del producto</h3>
              {selectedProduct && (
                <div className="relative group">
                  <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                  {/* Dropdown Options */}
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1 hidden group-hover:block z-10">
                    <button
                      onClick={() => openAdjustModal(selectedProduct)}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg font-medium flex items-center gap-2"
                    >
                      <Layers size={14} />
                      <span>Ajustar inventario</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedProduct ? (
              <>
                {/* Top Thumbnail & Name & Status */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package size={28} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug">{selectedProduct.name}</h4>
                    <div className="mt-1.5">
                      {(() => {
                        const status = getStockStatus(selectedProduct.stock, selectedProduct.min_stock);
                        return (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.badgeClass}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Key-Value Details Grid */}
                <div className="divide-y divide-slate-100 text-xs">
                  
                  {/* Proveedor */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Proveedor</span>
                    <span className="text-slate-900 font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      {selectedProduct.supplier_name || 'Droguería Central SRL'}
                    </span>
                  </div>

                  {/* Fecha de vencimiento */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Fecha de Vencimiento</span>
                    <span className="text-slate-800 font-bold">
                      {selectedProduct.expiry_date ? new Date(selectedProduct.expiry_date).toLocaleDateString('es-DO') : '15/10/2027'}
                    </span>
                  </div>

                  {/* Número de Lote */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Número de Lote</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {selectedProduct.batch_number || 'LOT-2026-042'}
                    </span>
                  </div>

                  {/* Registro Sanitario (RNS) */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Registro Sanitario</span>
                    <span className="text-slate-800 font-semibold font-mono">
                      {selectedProduct.sanitary_register || 'RS-2024-8891'}
                    </span>
                  </div>

                  {/* Vía de Administración */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Vía de Administración</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProduct.administration_route || 'Oral'}
                    </span>
                  </div>

                  {/* Presentación & Dosis */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Presentación</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProduct.presentation || 'Tabletas'} {selectedProduct.concentration ? `(${selectedProduct.concentration})` : ''}
                    </span>
                  </div>

                  {/* Código EAN */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Código de Barras / EAN</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {selectedProduct.barcode || selectedProduct.code || '7501234567890'}
                    </span>
                  </div>

                  {/* Categoría */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Categoría</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProduct.category_name || 'Analgésicos'}
                    </span>
                  </div>

                  {/* Laboratorio */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Laboratorio</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProduct.laboratory || 'PharmaPlus'}
                    </span>
                  </div>

                  {/* Stock Actual */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Stock actual</span>
                    <span className={`font-bold text-sm ${getStockStatus(selectedProduct.stock, selectedProduct.min_stock).textClass}`}>
                      {selectedProduct.stock} unidades
                    </span>
                  </div>

                  {/* Stock Mínimo */}
                  <div className="py-2.5 flex items-center justify-between group">
                    <span className="text-slate-400 font-medium">Stock mínimo</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-800 font-semibold">{selectedProduct.min_stock} unidades</span>
                    </div>
                  </div>

                  {/* Precio de Venta */}
                  <div className="py-2.5 flex items-center justify-between group">
                    <span className="text-slate-400 font-medium">Precio de venta</span>
                    <span className="text-slate-900 font-bold">
                      RD$ {(selectedProduct.sale_price || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Precio de Compra */}
                  <div className="py-2.5 flex items-center justify-between group">
                    <span className="text-slate-400 font-medium">Precio de compra</span>
                    <span className="text-slate-800 font-semibold">
                      RD$ {(selectedProduct.cost_price || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Ubicación en Almacén */}
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Ubicación Almacén</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedProduct.location || selectedProduct.notes || 'Estante A - Nivel 2'}
                    </span>
                  </div>

                  {/* Badges especiales */}
                  <div className="py-2.5 flex flex-wrap gap-2 pt-3">
                    {Boolean(selectedProduct.requires_recipe) && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold">
                        📋 Requiere Receta Médica
                      </span>
                    )}
                    {Boolean(selectedProduct.is_controlled) && (
                      <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-[11px] font-bold">
                        🔒 Medicamento Controlado
                      </span>
                    )}
                  </div>

                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditProductModal(selectedProduct)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 text-xs font-semibold transition-all shadow-2xs"
                  >
                    <Edit3 size={14} />
                    <span>Editar producto</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-all shadow-2xs"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar producto</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Package size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-slate-600 text-xs">Ningún producto seleccionado</p>
                <p className="text-[11px] text-slate-400 mt-1">Haz clic en una fila de la tabla para ver el detalle</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── MODAL: CREAR / EDITAR PRODUCTO ─────────────────────────────────── */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={isEditMode ? 'Editar Producto' : 'Nuevo Producto en Inventario'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleProductSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Nombre del Producto *</label>
              <input
                required
                type="text"
                placeholder="Ej. Paracetamol 500mg"
                className="input text-sm font-semibold"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>

            {/* Código EAN / Código */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Código de Barras / EAN</label>
              <input
                type="text"
                placeholder="7501234567890"
                className="input text-sm font-mono"
                value={productForm.barcode}
                onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
              />
            </div>

            {/* Categoría */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Categoría *</label>
              <select
                required
                className="input text-sm"
                value={productForm.category_id}
                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
              >
                <option value="">Seleccionar Categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* PROVEEDOR DEL PRODUCTO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-emerald-800">Proveedor del Producto *</label>
              <select
                className="input text-sm border-emerald-300 bg-emerald-50/30 font-medium"
                value={productForm.supplier_id}
                onChange={(e) => setProductForm({ ...productForm, supplier_id: e.target.value })}
              >
                <option value="">Seleccionar Proveedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.company_name || s.name}</option>
                ))}
              </select>
            </div>

            {/* FECHA DE VENCIMIENTO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-emerald-800">Fecha de Vencimiento *</label>
              <input
                type="date"
                className="input text-sm font-semibold border-emerald-300 bg-emerald-50/30"
                value={productForm.expiry_date}
                onChange={(e) => setProductForm({ ...productForm, expiry_date: e.target.value })}
              />
            </div>

            {/* NÚMERO DE LOTE */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Número de Lote</label>
              <input
                type="text"
                placeholder="Ej. LOT-2026-042"
                className="input text-sm font-mono"
                value={productForm.batch_number}
                onChange={(e) => setProductForm({ ...productForm, batch_number: e.target.value })}
              />
            </div>

            {/* REGISTRO SANITARIO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Registro Sanitario (RNS)</label>
              <input
                type="text"
                placeholder="Ej. RS-2024-8891"
                className="input text-sm font-mono"
                value={productForm.sanitary_register}
                onChange={(e) => setProductForm({ ...productForm, sanitary_register: e.target.value })}
              />
            </div>

            {/* Principio Activo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Principio Activo</label>
              <input
                type="text"
                placeholder="Ej. Acetaminofén / Paracetamol"
                className="input text-sm"
                value={productForm.active_ingredient}
                onChange={(e) => setProductForm({ ...productForm, active_ingredient: e.target.value })}
              />
            </div>

            {/* Laboratorio */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Laboratorio</label>
              <input
                type="text"
                placeholder="Ej. Alfa, Rowe, PharmaPlus"
                className="input text-sm"
                value={productForm.laboratory}
                onChange={(e) => setProductForm({ ...productForm, laboratory: e.target.value })}
              />
            </div>

            {/* Presentación */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Presentación</label>
              <select
                className="input text-sm"
                value={productForm.presentation}
                onChange={(e) => setProductForm({ ...productForm, presentation: e.target.value })}
              >
                <option value="Tabletas">Tabletas</option>
                <option value="Cápsulas">Cápsulas</option>
                <option value="Jarabe">Jarabe</option>
                <option value="Suspensión">Suspensión</option>
                <option value="Ampolla / Inyectable">Ampolla / Inyectable</option>
                <option value="Crema / Pomada">Crema / Pomada</option>
                <option value="Gotas Oftálmicas">Gotas Oftálmicas</option>
                <option value="Óvulos">Óvulos</option>
                <option value="Spray Nasal">Spray Nasal</option>
                <option value="Inhalador">Inhalador</option>
                <option value="Polvo">Polvo</option>
              </select>
            </div>

            {/* Concentración / Dosis */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Concentración / Dosis</label>
              <input
                type="text"
                placeholder="Ej. 500mg / 10mg/5ml"
                className="input text-sm"
                value={productForm.concentration}
                onChange={(e) => setProductForm({ ...productForm, concentration: e.target.value })}
              />
            </div>

            {/* Vía de Administración */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Vía de Administración</label>
              <select
                className="input text-sm"
                value={productForm.administration_route}
                onChange={(e) => setProductForm({ ...productForm, administration_route: e.target.value })}
              >
                <option value="Oral">Oral</option>
                <option value="Tópica">Tópica</option>
                <option value="Inyectable (IV/IM)">Inyectable (IV/IM)</option>
                <option value="Oftálmica">Oftálmica</option>
                <option value="Nasal">Nasal</option>
                <option value="Otológica">Otológica</option>
                <option value="Sublingual">Sublingual</option>
                <option value="Rectal">Rectal</option>
                <option value="Inhalatoria">Inhalatoria</option>
              </select>
            </div>

            {/* Ubicación en Almacén */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Ubicación / Estante</label>
              <input
                type="text"
                placeholder="Estante A - Nivel 2"
                className="input text-sm"
                value={productForm.location}
                onChange={(e) => setProductForm({ ...productForm, location: e.target.value })}
              />
            </div>

            {/* Precio de Venta */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Precio de Venta (RD$) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="input text-sm font-bold text-slate-800"
                value={productForm.sale_price}
                onChange={(e) => setProductForm({ ...productForm, sale_price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Precio de Compra */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Precio de Compra (RD$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input text-sm"
                value={productForm.cost_price}
                onChange={(e) => setProductForm({ ...productForm, cost_price: parseFloat(e.target.value) || 0 })}
              />
            </div>

            {/* Stock Actual */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Stock Inicial *</label>
              <input
                required
                type="number"
                min="0"
                className="input text-sm font-bold text-emerald-600"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Stock Mínimo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Stock Mínimo Alerta</label>
              <input
                type="number"
                min="1"
                className="input text-sm"
                value={productForm.min_stock}
                onChange={(e) => setProductForm({ ...productForm, min_stock: parseInt(e.target.value) || 5 })}
              />
            </div>

            {/* Opciones Farmacéuticas Checkboxes */}
            <div className="md:col-span-2 flex flex-wrap items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(productForm.requires_recipe)}
                  onChange={(e) => setProductForm({ ...productForm, requires_recipe: e.target.checked ? 1 : 0 })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Requiere Receta Médica Obligatoria</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(productForm.is_controlled)}
                  onChange={(e) => setProductForm({ ...productForm, is_controlled: e.target.checked ? 1 : 0 })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>Medicamento Controlado / Psicotrópico</span>
              </label>
            </div>

            {/* Notas */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Notas / Observaciones</label>
              <input
                type="text"
                placeholder="Observaciones adicionales del producto"
                className="input text-sm"
                value={productForm.notes}
                onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="btn btn-outline text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary text-sm font-semibold shadow-sm"
            >
              {isEditMode ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: AJUSTE DE STOCK ─────────────────────────────────────────── */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Ajustar Stock Manualmente"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Tipo de Movimiento</label>
            <select
              className="input text-sm"
              value={adjustData.movement_type}
              onChange={(e) => setAdjustData({ ...adjustData, movement_type: e.target.value })}
            >
              <option value="entrada">Entrada (Sumar al Stock)</option>
              <option value="salida">Salida (Restar del Stock)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Cantidad</label>
            <input
              required
              type="number"
              min="1"
              className="input text-sm font-bold"
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: parseInt(e.target.value) || 1 })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Motivo de Ajuste</label>
            <select
              className="input text-sm"
              value={adjustData.reference_type}
              onChange={(e) => setAdjustData({ ...adjustData, reference_type: e.target.value })}
            >
              <option value="ajuste">Cuadre / Ajuste Físico</option>
              <option value="merma">Merma / Producto Dañado</option>
              <option value="vencimiento">Producto Vencido</option>
              <option value="donacion">Donación / Muestra</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Notas Adicionales</label>
            <input
              type="text"
              placeholder="Ej: Conteo físico mensual"
              className="input text-sm"
              value={adjustData.notes}
              onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="btn btn-outline text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary text-sm font-semibold"
            >
              Aplicar Ajuste
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: ELIMINAR / DESACTIVAR PRODUCTO ───────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        maxWidth="max-w-sm"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              ¿Deseas deshabilitar "{selectedProduct?.name}"?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              El producto dejará de aparecer en las búsquedas activas de venta e inventario.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="btn btn-outline text-sm px-4"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteProduct}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm transition-colors shadow-sm"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal 
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Lector de Código de Inventario"
      />

    </div>
  );
};

export default Inventario;

