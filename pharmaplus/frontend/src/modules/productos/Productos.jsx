import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const Productos = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    description: '',
    category_id: '',
    cost_price: '',
    sale_price: '',
    min_stock: '10'
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products?page=${page}&limit=15&search=${searchTerm}`);
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data);
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
    fetchCategories();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setCurrentProduct(product);
      setFormData({
        name: product.name,
        code: product.code || '',
        barcode: product.barcode || '',
        description: product.description || '',
        category_id: product.category_id || '',
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        min_stock: product.min_stock
      });
    } else {
      setCurrentProduct(null);
      setFormData({
        name: '', code: '', barcode: '', description: '', category_id: '', cost_price: '', sale_price: '', min_stock: '10'
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
    { header: 'Código', accessor: 'code', className: 'w-24 font-mono text-xs' },
    { header: 'Nombre', accessor: 'name', className: 'font-semibold text-primary' },
    { header: 'Categoría', accessor: 'category_name', className: 'text-muted' },
    { 
      header: 'Stock', 
      cell: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${row.stock <= row.min_stock ? 'bg-danger-light text-danger border border-danger/20' : 'bg-success-light text-success border border-success/20'}`}>
          {row.stock}
        </span>
      ) 
    },
    { header: 'Precio Venta', cell: (row) => `RD$ ${row.sale_price.toFixed(2)}`, className: 'text-right font-medium' },
    { 
      header: 'Acciones', 
      className: 'text-right w-24',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => openModal(row)} className="p-1 text-info hover:bg-info/10 rounded"><Edit size={16} /></button>
          <button onClick={() => handleDelete(row.id)} className="p-1 text-danger hover:bg-danger-light rounded"><Trash2 size={16} /></button>
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
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              className="input pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          <div className="flex items-center justify-center h-full">Cargando productos...</div>
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
        title={currentProduct ? "Editar Producto" : "Nuevo Producto"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-main">Nombre del Producto *</label>
              <input required type="text" className="input text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-main">Categoría</label>
              <select className="input text-sm" value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}>
                <option value="">Seleccione una categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Código Interno</label>
              <input type="text" className="input text-sm" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Código de Barras</label>
              <input type="text" className="input text-sm" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Precio de Costo *</label>
              <input required type="number" step="0.01" className="input text-sm" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Precio de Venta *</label>
              <input required type="number" step="0.01" className="input text-sm" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Stock Mínimo (Alerta)</label>
              <input type="number" className="input text-sm" value={formData.min_stock} onChange={e => setFormData({...formData, min_stock: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-main">Descripción / Notas</label>
            <textarea className="input text-sm resize-none h-20" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline text-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary text-sm">Guardar Producto</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Productos;
