import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../services/api';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';

const Clientes = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    cedula_rnc: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/clients?page=${page}&limit=15&search=${searchTerm}`);
      setClients(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, page]);

  const openModal = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        name: client.name,
        cedula_rnc: client.cedula_rnc || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        notes: client.notes || ''
      });
    } else {
      setCurrentClient(null);
      setFormData({
        name: '', cedula_rnc: '', phone: '', email: '', address: '', notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentClient) {
        await api.put(`/clients/${currentClient.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      alert(err.message || 'Error guardando cliente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de desactivar este cliente?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const columns = [
    { header: 'Nombre', accessor: 'name', className: 'font-semibold text-primary' },
    { header: 'Cédula/RNC', accessor: 'cedula_rnc', className: 'text-muted' },
    { header: 'Teléfono', accessor: 'phone' },
    { header: 'Email', accessor: 'email', className: 'text-muted' },
    { header: 'Registro', cell: (row) => new Date(row.created_at).toLocaleDateString(), className: 'text-xs text-muted text-right' },
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
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, cédula o teléfono..." 
            className="input pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => openModal()} className="btn btn-primary w-full sm:w-auto">
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 bg-surface rounded-lg shadow-sm border border-border">
        {loading && clients.length === 0 ? (
          <div className="flex items-center justify-center h-full">Cargando clientes...</div>
        ) : (
          <Table 
            columns={columns} 
            data={clients} 
            pagination={{ page, limit: 15, total }}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={currentClient ? "Editar Cliente" : "Nuevo Cliente"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-main">Nombre Completo *</label>
            <input required type="text" className="input text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Cédula / RNC</label>
              <input type="text" className="input text-sm" value={formData.cedula_rnc} onChange={e => setFormData({...formData, cedula_rnc: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-main">Teléfono</label>
              <input type="text" className="input text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-main">Correo Electrónico</label>
            <input type="email" className="input text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-main">Dirección</label>
            <input type="text" className="input text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-main">Notas / Historial Médico Básico</label>
            <textarea className="input text-sm resize-none h-20" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline text-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary text-sm">Guardar Cliente</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Clientes;
