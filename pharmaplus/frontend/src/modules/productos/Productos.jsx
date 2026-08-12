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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?page=${page}&limit=15&search=${searchTerm}`);
      setProducts(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
  }, [searchTerm, page]);

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
    <div className="h-full flex flex-col gap-4">
      {/* Sleek Green Header Banner */}
      <div className="bg-[#16a085] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Catálogo de Productos Farmacéuticos</h2>
        </div>
        
        <div className="shrink-0 h-16 md:h-20 flex items-center justify-center z-10">
          <img 
            src="/modules/productos.png" 
            alt="Productos" 
            className="h-full w-auto max-w-[260px] object-contain rounded-xl drop-shadow-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>
      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
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
          <button className="btn btn-outline p-2.5"><Filter size={18} /></button>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary w-full sm:w-auto">
          <Plus size={18} /> Nuevo Producto
        </button>
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

            {/* Categoría */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Categoría *</label>
              <select
                required
                className="input text-sm"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
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

    </div>
  );
};

export default Productos;
