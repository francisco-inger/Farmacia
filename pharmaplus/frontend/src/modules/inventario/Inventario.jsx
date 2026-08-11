import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpRight, ArrowDownRight, Package, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const Inventario = () => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState('stock'); // 'stock' or 'movements'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({
    product_id: '',
    movement_type: 'entrada',
    quantity: 1,
    reference_type: 'ajuste',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (view === 'stock') {
        const res = await api.get(`/products?page=${page}&limit=15&search=${searchTerm}`);
        setProducts(res.data);
        setTotal(res.pagination.total);
      } else {
        const res = await api.get(`/inventory/movements?page=${page}&limit=15`);
        setMovements(res.data);
        setTotal(res.pagination.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page, view]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory/adjust', adjustData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error registrando ajuste');
    }
  };

  const openAdjustModal = (product) => {
    setAdjustData({
      product_id: product.id,
      movement_type: 'entrada',
      quantity: 1,
      reference_type: 'ajuste',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const stockColumns = [
    { header: 'Código', accessor: 'code', className: 'font-mono text-xs w-24' },
    { header: 'Producto', accessor: 'name', className: 'font-semibold' },
    { 
      header: 'Estado', 
      cell: (row) => {
        if (row.stock === 0) return <span className="flex items-center gap-1 text-danger font-bold"><AlertTriangle size={14}/> Agotado</span>;
        if (row.stock <= row.min_stock) return <span className="flex items-center gap-1 text-warning font-bold"><AlertTriangle size={14}/> Bajo</span>;
        return <span className="text-success font-medium">Normal</span>;
      }
    },
    { header: 'Stock Actual', accessor: 'stock', className: 'text-right font-bold' },
    { header: 'Stock Mínimo', accessor: 'min_stock', className: 'text-right text-muted' },
    { 
      header: 'Acciones', 
      className: 'text-right',
      cell: (row) => (
        <button onClick={() => openAdjustModal(row)} className="btn btn-outline py-1 px-2 text-xs">
          Ajustar Stock
        </button>
      ) 
    }
  ];

  const movementColumns = [
    { header: 'Fecha', cell: (row) => new Date(row.created_at).toLocaleString('es-DO'), className: 'text-xs text-muted' },
    { header: 'Producto', accessor: 'product_name', className: 'font-medium' },
    { 
      header: 'Tipo', 
      cell: (row) => row.movement_type === 'entrada' 
        ? <span className="flex items-center gap-1 text-success bg-success-light px-2 py-0.5 rounded text-xs"><ArrowDownRight size={14}/> Entrada</span>
        : <span className="flex items-center gap-1 text-danger bg-danger-light px-2 py-0.5 rounded text-xs"><ArrowUpRight size={14}/> Salida</span>
    },
    { header: 'Cant.', accessor: 'quantity', className: 'text-right font-bold' },
    { header: 'Motivo', accessor: 'reference_type', className: 'capitalize text-muted' },
    { header: 'Usuario', accessor: 'user_name', className: 'text-xs text-muted' }
  ];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        <div className="flex bg-background p-1 rounded-lg border border-border">
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'stock' ? 'bg-surface shadow-sm text-primary' : 'text-muted hover:text-main'}`}
            onClick={() => { setView('stock'); setPage(1); }}
          >
            Estado de Existencias
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'movements' ? 'bg-surface shadow-sm text-primary' : 'text-muted hover:text-main'}`}
            onClick={() => { setView('movements'); setPage(1); }}
          >
            Historial de Movimientos
          </button>
        </div>

        {view === 'stock' && (
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Buscar producto para inventario..." 
              className="input pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-surface rounded-lg shadow-sm border border-border">
        {loading && products.length === 0 && movements.length === 0 ? (
          <div className="flex items-center justify-center h-full">Cargando inventario...</div>
        ) : (
          <Table 
            columns={view === 'stock' ? stockColumns : movementColumns} 
            data={view === 'stock' ? products : movements} 
            pagination={{ page, limit: 15, total }}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Ajuste Manual de Inventario"
      >
        <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
          <div className="bg-primary-light/30 p-3 rounded-lg border border-primary/20 flex gap-3 mb-2">
            <Package className="text-primary mt-1 shrink-0" />
            <div>
              <p className="text-xs text-primary font-bold">Instrucciones</p>
              <p className="text-xs text-muted">Usa esta opción solo para ajustes manuales por daños, caducidad o cuadre. Las ventas y compras ajustan el stock automáticamente.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Tipo de Movimiento *</label>
              <select className="input text-sm" value={adjustData.movement_type} onChange={e => setAdjustData({...adjustData, movement_type: e.target.value})}>
                <option value="entrada">Entrada (Sumar)</option>
                <option value="salida">Salida (Restar)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Cantidad *</label>
              <input required type="number" min="1" className="input text-sm" value={adjustData.quantity} onChange={e => setAdjustData({...adjustData, quantity: parseInt(e.target.value)})} />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-semibold text-main">Motivo de Ajuste *</label>
              <select className="input text-sm" value={adjustData.reference_type} onChange={e => setAdjustData({...adjustData, reference_type: e.target.value})}>
                <option value="ajuste">Ajuste / Cuadre de caja</option>
                <option value="merma">Merma / Dañado</option>
                <option value="vencimiento">Producto Vencido</option>
                <option value="donacion">Donación / Muestra</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-semibold text-main">Notas Adicionales</label>
              <input type="text" className="input text-sm" value={adjustData.notes} onChange={e => setAdjustData({...adjustData, notes: e.target.value})} placeholder="Ej: Frasco roto en almacén" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline text-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary text-sm">Confirmar Ajuste</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventario;
