import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, ScanLine } from 'lucide-react';
import api from '../../services/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { playScannerBeep } from '../../utils/sound';

const Productos = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Search Modals for Category & Supplier Picker
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isSupplierPickerOpen, setIsSupplierPickerOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');

  const handleBarcodeScanned = (code) => {
    playScannerBeep();
    if (isModalOpen) {
      setFormData(prev => ({ ...prev, barcode: code, code: code }));
    } else {
      setSearchTerm(code);
      setPage(1);
    }
  };

  useBarcodeScanner(handleBarcodeScanned);

  // Form state
  const [formData, setFormData] = useState({
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
    notes: '',
    description: ''
  });

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [filterRecipe, setFilterRecipe] = useState(false);
  const [filterControlled, setFilterControlled] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = `/products?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}`;
      if (selectedCategory) query += `&category_id=${selectedCategory}`;
      if (selectedSupplier) query += `&supplier_id=${selectedSupplier}`;
      if (selectedStockStatus) query += `&stock_status=${selectedStockStatus}`;
      if (filterRecipe) query += `&requires_recipe=1`;
      if (filterControlled) query += `&is_controlled=1`;

      const res = await api.get(query);
      setProducts(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedSupplier('');
    setSelectedStockStatus('');
    setFilterRecipe(false);
    setFilterControlled(false);
    setSearchTerm('');
    setPage(1);
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedSupplier,
    selectedStockStatus,
    filterRecipe,
    filterControlled
  ].filter(Boolean).length;

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [catRes, supRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/suppliers')
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (supRes.success) setSuppliers(supRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, selectedCategory, selectedSupplier, selectedStockStatus, filterRecipe, filterControlled]);

  useEffect(() => {
    fetchCategoriesAndSuppliers();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
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
        notes: product.notes || product.description || '',
        description: product.description || ''
      });
    } else {
      setCurrentProduct(null);
      setFormData({
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
        notes: '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentProduct) {
        await api.put(`/products/${currentProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message || 'Error guardando producto');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de desactivar este producto?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const columns = [
    { header: 'Código', accessor: 'barcode', cell: (row) => <span className="font-mono text-xs text-slate-500">{row.barcode || row.code || 'S/C'}</span> },
    { header: 'Nombre', cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.name}</span>
          <span className="text-[11px] text-slate-400 font-normal">{row.supplier_name ? `Prov: ${row.supplier_name}` : ''}</span>
        </div>
      ) 
    },
    { header: 'Categoría', accessor: 'category_name', className: 'text-slate-600 text-xs font-medium' },
    { header: 'Vencimiento', cell: (row) => (
        row.expiry_date ? (
          <span className={`text-xs font-semibold ${new Date(row.expiry_date) <= new Date() ? 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}`}>
            {new Date(row.expiry_date).toLocaleDateString('es-DO')}
          </span>
        ) : <span className="text-slate-400 text-xs">15/10/2027</span>
      )
    },
    { 
      header: 'Stock', 
      cell: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${row.stock <= row.min_stock ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
          {row.stock}
        </span>
      ) 
    },
    { header: 'Precio Venta', cell: (row) => `RD$ ${(row.sale_price || 0).toFixed(2)}`, className: 'text-right font-semibold text-slate-800' },
    { 
      header: 'Acciones', 
      className: 'text-right w-24',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openModal(row)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Desactivar"><Trash2 size={16} /></button>
        </div>
      ) 
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ─── BANNER SUPERIOR CORPORATIVO PRODUCTOS (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          PHARMACEUTICAL DRUG FORMULARY & CATALOG
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>CATÁLOGO DE MEDICAMENTOS • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Catálogo de Fármacos & Productos
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium">
              Vademécum oficial, fórmulas activas, precios de venta, control de recetas y especificaciones clínicas.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-white text-xs font-bold shadow-sm backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {total} Productos Registrados
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {categories.length} Categorías Clínicas
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {suppliers.length} Laboratorios / Proveedores
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={() => openModal()}
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
          </div>

        </div>

      </div>

      {/* ─── 4 TARJETAS KPI LIMPIAS Y ESPACIOSAS PRODUCTOS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Fármacos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Plus size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Total Fármacos</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {total} Items
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>{categories.length} Categorías activas</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Laboratorios Asociados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#eafaf1] text-[#27ae60] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Filter size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Proveedores / Labs</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {suppliers.length} Distribuidores
              </h3>
              <p className="text-[11px] font-bold text-[#27ae60] mt-0.5 truncate">
                <span>✓ Cadena de suministro directa</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Medicamentos Controlados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fef5e7] text-[#f39c12] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Search size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Receta / Control</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {products.filter(p => p.requires_recipe || p.is_controlled).length} Regulados
              </h3>
              <p className="text-[11px] font-bold text-[#f39c12] mt-0.5 truncate">
                <span>Con receta obligatoria</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Trazabilidad Sanitaria */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ebf5fb] text-[#3498db] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Edit size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Reg. Sanitario</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                MSP Certificado
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>✓ Normas vigentes 2026</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Actions Row */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por código de barras o nombre..." 
                className="input pl-9 pr-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <ScanLine 
                onClick={() => setIsCameraScannerOpen(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors" 
                size={16} 
                title="Escanear código con la cámara" 
              />
            </div>
            <button 
              type="button"
              onClick={() => setShowFilterPanel(prev => !prev)} 
              title="Filtros avanzados"
              className={`p-2.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showFilterPanel || activeFiltersCount > 0
                  ? 'bg-emerald-50 border-[#16a085] text-[#16a085] shadow-xs'
                  : 'btn-outline text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Filter size={18} />
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#16a085] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
          
          <button onClick={() => openModal()} className="btn btn-primary w-full sm:w-auto shadow-md">
            <Plus size={18} /> Nuevo Producto
          </button>
        </div>

        {/* ─── PANEL DESPLEGABLE DE FILTROS AVANZADOS DE PRODUCTOS ─── */}
        {showFilterPanel && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm animate-fade-in flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} className="text-[#16a085]" /> Filtros del Catálogo de Fármacos
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Limpiar Filtros ({activeFiltersCount})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              
              {/* Categoría */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Categoría</label>
                <select
                  className="input py-2 text-xs"
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Proveedor / Laboratorio */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Proveedor / Lab</label>
                <select
                  className="input py-2 text-xs"
                  value={selectedSupplier}
                  onChange={(e) => { setSelectedSupplier(e.target.value); setPage(1); }}
                >
                  <option value="">Todos los proveedores</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.company_name || sup.name}</option>
                  ))}
                </select>
              </div>

              {/* Estado de Stock */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Nivel de Inventario</label>
                <select
                  className="input py-2 text-xs"
                  value={selectedStockStatus}
                  onChange={(e) => { setSelectedStockStatus(e.target.value); setPage(1); }}
                >
                  <option value="">Todo el inventario</option>
                  <option value="available">Stock Adecuado (Óptimo)</option>
                  <option value="low">Stock Bajo (Crítico)</option>
                  <option value="out">Agotado (0 unidades)</option>
                </select>
              </div>

              {/* Checkboxes de Regulaciones */}
              <div className="flex flex-col gap-2 justify-center col-span-1 sm:col-span-2 lg:col-span-2 pt-2 sm:pt-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={filterRecipe}
                      onChange={(e) => { setFilterRecipe(e.target.checked); setPage(1); }}
                      className="rounded text-[#16a085] focus:ring-[#16a085] w-4 h-4"
                    />
                    <span>Requiere Receta</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={filterControlled}
                      onChange={(e) => { setFilterControlled(e.target.checked); setPage(1); }}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span>Medicamento Controlado</span>
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-surface rounded-lg shadow-sm border border-border">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">Cargando productos...</div>
        ) : (
          <Table 
            columns={columns} 
            data={products} 
            pagination={{ page, limit: 15, total }}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={currentProduct ? "Editar Producto" : "Nuevo Producto en Inventario"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Nombre del Producto *</label>
              <input
                required
                type="text"
                placeholder="Ej. Paracetamol 500mg"
                className="input text-sm font-semibold"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Código EAN / Código */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Código de Barras / EAN</label>
              <input
                type="text"
                placeholder="7501234567890"
                className="input text-sm font-mono"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value, code: e.target.value })}
              />
            </div>

            {/* Categoría Selector con Buscador */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Categoría del Producto *</label>
              <button
                type="button"
                onClick={() => { setCategorySearchQuery(''); setIsCategoryPickerOpen(true); }}
                className={`input text-sm flex items-center justify-between text-left transition-all ${
                  formData.category_id 
                    ? 'border-[#16a085] bg-emerald-50/40 text-slate-900 font-bold' 
                    : 'text-slate-400 font-normal hover:bg-slate-50'
                }`}
              >
                <span className="truncate">
                  {formData.category_id 
                    ? (categories.find(c => String(c.id) === String(formData.category_id))?.name || 'Categoría seleccionada')
                    : 'Buscar o seleccionar categoría...'}
                </span>
                <Search size={15} className="text-slate-400 shrink-0 ml-2" />
              </button>
            </div>

            {/* PROVEEDOR DEL PRODUCTO con Buscador */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-emerald-800">Proveedor / Distribuidor *</label>
              <button
                type="button"
                onClick={() => { setSupplierSearchQuery(''); setIsSupplierPickerOpen(true); }}
                className={`input text-sm flex items-center justify-between text-left transition-all border-emerald-300 ${
                  formData.supplier_id 
                    ? 'bg-emerald-50 text-slate-900 font-bold shadow-2xs' 
                    : 'bg-emerald-50/20 text-slate-400 font-normal hover:bg-emerald-50/40'
                }`}
              >
                <span className="truncate">
                  {formData.supplier_id 
                    ? (suppliers.find(s => String(s.id) === String(formData.supplier_id))?.company_name || suppliers.find(s => String(s.id) === String(formData.supplier_id))?.name || 'Proveedor seleccionado')
                    : 'Buscar o seleccionar distribuidor...'}
                </span>
                <Search size={15} className="text-emerald-600 shrink-0 ml-2" />
              </button>
            </div>

            {/* FECHA DE VENCIMIENTO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-emerald-800">Fecha de Vencimiento *</label>
              <input
                type="date"
                className="input text-sm font-semibold border-emerald-300 bg-emerald-50/30"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>

            {/* NÚMERO DE LOTE */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Número de Lote</label>
              <input
                type="text"
                placeholder="Ej. LOT-2026-042"
                className="input text-sm font-mono"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              />
            </div>

            {/* REGISTRO SANITARIO */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Registro Sanitario (RNS)</label>
              <input
                type="text"
                placeholder="Ej. RS-2024-8891"
                className="input text-sm font-mono"
                value={formData.sanitary_register}
                onChange={(e) => setFormData({ ...formData, sanitary_register: e.target.value })}
              />
            </div>

            {/* Principio Activo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Principio Activo</label>
              <input
                type="text"
                placeholder="Ej. Acetaminofén / Paracetamol"
                className="input text-sm"
                value={formData.active_ingredient}
                onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
              />
            </div>

            {/* Laboratorio */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Laboratorio</label>
              <input
                type="text"
                placeholder="Ej. Alfa, Rowe, PharmaPlus"
                className="input text-sm"
                value={formData.laboratory}
                onChange={(e) => setFormData({ ...formData, laboratory: e.target.value })}
              />
            </div>

            {/* Presentación */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Presentación</label>
              <select
                className="input text-sm"
                value={formData.presentation}
                onChange={(e) => setFormData({ ...formData, presentation: e.target.value })}
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
                value={formData.concentration}
                onChange={(e) => setFormData({ ...formData, concentration: e.target.value })}
              />
            </div>

            {/* Vía de Administración */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Vía de Administración</label>
              <select
                className="input text-sm"
                value={formData.administration_route}
                onChange={(e) => setFormData({ ...formData, administration_route: e.target.value })}
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
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
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
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
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
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            {/* Stock Mínimo */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Stock Mínimo Alerta</label>
              <input
                type="number"
                min="1"
                className="input text-sm"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 5 })}
              />
            </div>

            {/* Opciones Farmacéuticas Checkboxes */}
            <div className="md:col-span-2 flex flex-wrap items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.requires_recipe)}
                  onChange={(e) => setFormData({ ...formData, requires_recipe: e.target.checked ? 1 : 0 })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Requiere Receta Médica Obligatoria</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_controlled)}
                  onChange={(e) => setFormData({ ...formData, is_controlled: e.target.checked ? 1 : 0 })}
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
                value={formData.notes || formData.description}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value, description: e.target.value })}
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary text-sm font-semibold shadow-sm"
            >
              {currentProduct ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal 
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={handleBarcodeScanned}
        title="Lector de Código de Productos"
      />

      {/* MODAL: Buscador Rápido de Categorías */}
      <Modal
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        title="Seleccionar Categoría del Fármaco"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-3 text-slate-700">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar categoría clínica..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all shadow-inner"
              value={categorySearchQuery}
              onChange={(e) => setCategorySearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {categories
              .filter(c => !categorySearchQuery || c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
              .map(c => {
                const isSelected = String(formData.category_id) === String(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, category_id: c.id }));
                      setIsCategoryPickerOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-[#16a085] text-[#16a085] font-bold shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <span className="text-xs">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID #{c.id}</span>
                  </button>
                );
              })}
          </div>

          <button
            type="button"
            onClick={() => setIsCategoryPickerOpen(false)}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </Modal>

      {/* MODAL: Buscador Rápido de Proveedores / Distribuidores */}
      <Modal
        isOpen={isSupplierPickerOpen}
        onClose={() => setIsSupplierPickerOpen(false)}
        title="Seleccionar Proveedor / Laboratorio"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-3 text-slate-700">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre o RNC del proveedor..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs font-medium focus:bg-white focus:border-[#16a085] focus:outline-none transition-all shadow-inner"
              value={supplierSearchQuery}
              onChange={(e) => setSupplierSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
            {suppliers
              .filter(s => 
                !supplierSearchQuery || 
                (s.company_name && s.company_name.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
                (s.name && s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
                (s.rnc && s.rnc.includes(supplierSearchQuery))
              )
              .map(s => {
                const isSelected = String(formData.supplier_id) === String(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, supplier_id: s.id }));
                      setIsSupplierPickerOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-[#16a085] text-slate-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{s.company_name || s.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">RNC: {s.rnc || '—'} • Tel: {s.phone || '—'}</p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold">ID #{s.id}</span>
                  </button>
                );
              })}
          </div>

          <button
            type="button"
            onClick={() => setIsSupplierPickerOpen(false)}
            className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </Modal>

    </div>
  );
};

export default Productos;
