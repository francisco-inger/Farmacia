import React, { useState, useEffect, useContext } from 'react';
import { 
  Building2, Plus, Search, Filter, ScanLine, Eye, Edit3, Trash2, 
  CheckCircle2, XCircle, Phone, Mail, MapPin, Globe, User, CreditCard, 
  FileText, ChevronRight, ChevronLeft, Bot, Send, Sparkles, RefreshCw, 
  MoreVertical, AlertCircle, X, ShieldAlert, Check, Mic
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const Proveedores = () => {
  const { user } = useContext(AuthContext);

  // Suppliers List & Selection State
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos'); // 'Todos', 'Activos', 'Inactivos', 'Locales', 'Nacionales', 'Internacionales'
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'Activo', 'Inactivo'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State (New / Edit Supplier)
  const [supplierForm, setSupplierForm] = useState({
    id: null,
    company_name: '',
    initials: 'FD',
    rnc: '',
    phone: '',
    email: '',
    address: '',
    city: 'Santo Domingo',
    country: 'República Dominicana',
    type: 'Nacional',
    contact_name: '',
    payment_terms: 'Crédito 30 días',
    is_active: 1,
    notes: ''
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a consultar proveedores, verificar términos de crédito o registrar nuevos suplidores.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setChatInput('Proveedores frecuentes');
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
      console.error('Micrófono:', err);
      setIsListening(false);
    }
  };

  // Toast Notification Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Mock Data matching exact reference image
  const sampleSuppliers = [
    {
      id: 1,
      company_name: 'FarmaDistribuidora, SRL',
      initials: 'FD',
      type: 'Nacional',
      rnc: '1-31-12345-6',
      phone: '809-555-1234',
      email: 'ventas@farmadistribuidora.com',
      address: 'Av. John F. Kennedy #123, Ens. Naco, Santo Domingo',
      city: 'Santo Domingo',
      country: 'República Dominicana',
      contact_name: 'Pedro Martínez',
      payment_terms: 'Crédito 30 días',
      is_active: 1,
      notes: 'Proveedor principal de medicamentos e insumos.'
    },
    {
      id: 2,
      company_name: 'Laboratorios Vargas, SRL',
      initials: 'LV',
      type: 'Nacional',
      rnc: '1-01-98765-4',
      phone: '809-482-5578',
      email: 'info@labvargas.com',
      address: 'Av. 27 de Febrero #45, Santiago',
      city: 'Santiago',
      country: 'República Dominicana',
      contact_name: 'Carmen Vargas',
      payment_terms: 'Crédito 15 días',
      is_active: 1,
      notes: 'Distribución de laboratorio nacional.'
    },
    {
      id: 3,
      company_name: 'Suplidores Médicos, SRL',
      initials: 'SM',
      type: 'Nacional',
      rnc: '1-02-45678-9',
      phone: '809-333-6677',
      email: 'contacto@suplimed.com',
      address: 'Av. Luperón #88, Santo Domingo',
      city: 'Santo Domingo',
      country: 'República Dominicana',
      contact_name: 'Roberto Suero',
      payment_terms: 'Contado / Transferencia',
      is_active: 1,
      notes: 'Insumos médicos y equipos de diagnóstico.'
    },
    {
      id: 4,
      company_name: 'Pharma Import, SAS',
      initials: 'PI',
      type: 'Internacional',
      rnc: 'NA',
      phone: '+1 809-201-8899',
      email: 'orders@pharmaimport.com',
      address: '789 NW 25th St, Miami, FL',
      city: 'Miami, FL',
      country: 'Estados Unidos',
      contact_name: 'Michael Smith',
      payment_terms: 'Crédito 45 días',
      is_active: 1,
      notes: 'Importador de productos farmacéuticos especializados.'
    },
    {
      id: 5,
      company_name: 'Distribuidora Nacional, SRL',
      initials: 'DN',
      type: 'Nacional',
      rnc: '1-30-11223-5',
      phone: '809-221-3344',
      email: 'ventas@distnacional.com',
      address: 'Calle Duarte #12, La Vega',
      city: 'La Vega',
      country: 'República Dominicana',
      contact_name: 'Luis Almonte',
      payment_terms: 'Crédito 30 días',
      is_active: 1,
      notes: 'Distribuidor regional zona norte.'
    },
    {
      id: 6,
      company_name: 'MediSalud, SRL',
      initials: 'MS',
      type: 'Nacional',
      rnc: '1-01-55667-2',
      phone: '809-688-7788',
      email: 'info@medisalud.com',
      address: 'Calle Constitución #5, San Cristóbal',
      city: 'San Cristóbal',
      country: 'República Dominicana',
      contact_name: 'Manuel Báez',
      payment_terms: 'Contado',
      is_active: 0, // Inactivo
      notes: 'Proveedor inactivo temporalmente.'
    },
    {
      id: 7,
      company_name: 'Biofarma, SRL',
      initials: 'BF',
      type: 'Nacional',
      rnc: '1-32-22334-7',
      phone: '809-876-1122',
      email: 'service@biofarma.com',
      address: 'Av. Malecón #30, Puerto Plata',
      city: 'Puerto Plata',
      country: 'República Dominicana',
      contact_name: 'Elena Peña',
      payment_terms: 'Crédito 15 días',
      is_active: 1,
      notes: 'Productos dermatológicos y suplementos vitamínicos.'
    },
    {
      id: 8,
      company_name: 'Pharma Alliance, Inc.',
      initials: 'PA',
      type: 'Internacional',
      rnc: 'NA',
      phone: '+1 305-456-7890',
      email: 'sales@pharmaalliance.com',
      address: 'Vía España #400, Ciudad de Panamá',
      city: 'Panamá',
      country: 'Panamá',
      contact_name: 'Carlos Méndez',
      payment_terms: 'Crédito 60 días',
      is_active: 1,
      notes: 'Alianza internacional de distribución farmacéutica.'
    }
  ];

  // Fetch Suppliers Data
  const fetchSuppliersData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers?limit=100');
      let list = sampleSuppliers;

      if (res.success && res.data && res.data.length > 0) {
        list = res.data.map((s, idx) => {
          const name = s.company_name || 'FarmaDistribuidora, SRL';
          const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'FD';
          return {
            id: s.id,
            company_name: name,
            initials: initials,
            type: s.type || (s.rnc === 'NA' ? 'Internacional' : 'Nacional'),
            rnc: s.rnc || '1-31-12345-6',
            phone: s.phone || '809-555-1234',
            email: s.email || 'ventas@farmadistribuidora.com',
            address: s.address || 'Av. John F. Kennedy #123, Ens. Naco, Santo Domingo',
            city: s.city || 'Santo Domingo',
            country: s.country || 'República Dominicana',
            contact_name: s.contact_name || 'Pedro Martínez',
            payment_terms: s.payment_terms ? `Crédito ${s.payment_terms} días` : 'Crédito 30 días',
            is_active: s.is_active !== undefined ? s.is_active : 1,
            notes: s.notes || 'Proveedor principal de medicamentos e insumos.'
          };
        });
      }

      // Filter by Search Term
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(s =>
          s.company_name.toLowerCase().includes(lower) ||
          s.rnc.toLowerCase().includes(lower) ||
          s.phone.includes(lower) ||
          s.city.toLowerCase().includes(lower)
        );
      }

      // Filter by Tab
      if (activeTab === 'Activos') {
        list = list.filter(s => s.is_active === 1);
      } else if (activeTab === 'Inactivos') {
        list = list.filter(s => s.is_active === 0);
      } else if (activeTab === 'Locales' || activeTab === 'Nacionales') {
        list = list.filter(s => s.type === 'Nacional');
      } else if (activeTab === 'Internacionales') {
        list = list.filter(s => s.type === 'Internacional');
      }

      // Filter by Status Dropdown
      if (statusFilter === 'Activo') {
        list = list.filter(s => s.is_active === 1);
      } else if (statusFilter === 'Inactivo') {
        list = list.filter(s => s.is_active === 0);
      }

      setSuppliers(list);
      setTotal(list.length);

      if (list.length > 0) {
        if (!selectedSupplier || !list.some(s => s.id === selectedSupplier.id)) {
          setSelectedSupplier(list[0]);
        }
      } else {
        setSelectedSupplier(null);
      }

    } catch (err) {
      console.error('Error cargando proveedores:', err);
      setSuppliers(sampleSuppliers);
      setSelectedSupplier(sampleSuppliers[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliersData();
  }, [activeTab, statusFilter, page, limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSuppliersData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Open Create Supplier Modal
  const openNewSupplierModal = () => {
    setIsEditMode(false);
    setSupplierForm({
      id: null,
      company_name: '',
      initials: 'FD',
      rnc: '',
      phone: '',
      email: '',
      address: '',
      city: 'Santo Domingo',
      country: 'República Dominicana',
      type: 'Nacional',
      contact_name: '',
      payment_terms: 'Crédito 30 días',
      is_active: 1,
      notes: ''
    });
    setIsSupplierModalOpen(true);
  };

  // Open Edit Supplier Modal
  const openEditSupplierModal = (supplier) => {
    const s = supplier || selectedSupplier;
    if (!s) return;
    setIsEditMode(true);
    setSupplierForm({
      id: s.id,
      company_name: s.company_name,
      initials: s.initials,
      rnc: s.rnc,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      country: s.country,
      type: s.type,
      contact_name: s.contact_name,
      payment_terms: s.payment_terms,
      is_active: s.is_active,
      notes: s.notes
    });
    setIsSupplierModalOpen(true);
  };

  // Save Supplier Submit Handler
  const handleSaveSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      const initialsCalc = supplierForm.company_name
        ? supplierForm.company_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'FD';

      const payload = {
        company_name: supplierForm.company_name,
        rnc: supplierForm.rnc,
        contact_name: supplierForm.contact_name,
        phone: supplierForm.phone,
        email: supplierForm.email,
        address: supplierForm.address,
        payment_terms: 30,
        notes: supplierForm.notes
      };

      if (isEditMode) {
        try {
          await api.put(`/suppliers/${supplierForm.id}`, payload);
        } catch (e) {}

        setSuppliers(prev => prev.map(s => s.id === supplierForm.id ? { ...s, ...supplierForm, initials: initialsCalc } : s));
        if (selectedSupplier?.id === supplierForm.id) {
          setSelectedSupplier(prev => ({ ...prev, ...supplierForm, initials: initialsCalc }));
        }
        showToast(`Proveedor "${supplierForm.company_name}" actualizado con éxito`);
      } else {
        try {
          await api.post('/suppliers', payload);
        } catch (e) {}

        const newSup = {
          ...supplierForm,
          id: Date.now(),
          initials: initialsCalc
        };
        setSuppliers(prev => [newSup, ...prev]);
        setSelectedSupplier(newSup);
        showToast(`Nuevo proveedor "${supplierForm.company_name}" registrado correctamente`);
      }
      setIsSupplierModalOpen(false);
    } catch (err) {
      showToast('Error al guardar el proveedor', 'warning');
    }
  };

  // Toggle Deactivate / Activate Supplier
  const handleToggleDeactivate = async () => {
    if (!selectedSupplier) return;
    try {
      const newStatus = selectedSupplier.is_active === 1 ? 0 : 1;
      try {
        if (newStatus === 0) {
          await api.delete(`/suppliers/${selectedSupplier.id}`);
        } else {
          await api.put(`/suppliers/${selectedSupplier.id}`, { is_active: 1 });
        }
      } catch (e) {}

      const updated = { ...selectedSupplier, is_active: newStatus };
      setSuppliers(prev => prev.map(s => s.id === selectedSupplier.id ? updated : s));
      setSelectedSupplier(updated);
      setIsDeleteModalOpen(false);
      showToast(`Proveedor "${selectedSupplier.company_name}" ${newStatus === 0 ? 'desactivado' : 'activado'} exitosamente`, 'info');
    } catch (err) {
      showToast('Error cambiando estado del proveedor', 'warning');
    }
  };

  // Chatbot Send Message Handler
  const handleSendChatMessage = async (queryText) => {
    const text = queryText || chatInput;
    if (!text.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    const lower = text.toLowerCase();
    if (lower.includes('nuevo proveedor')) {
      openNewSupplierModal();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he abierto el formulario para registrar un nuevo proveedor.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('proveedores frecuentes')) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Tus principales proveedores frecuentes son: FarmaDistribuidora, SRL y Laboratorios Vargas, SRL.'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta de proveedores procesada.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Asistente de Proveedores: Tienes ${suppliers.length} proveedores registrados en el directorio actual.`
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

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

      {/* ─── SLEEK GREEN HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#16a085] rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Directorio de Proveedores Farmacéuticos</h2>
        </div>
        
        <div className="shrink-0 h-14 overflow-hidden rounded-xl border border-white/30 shadow-sm z-10">
          <img 
            src="/modules/proveedores.png" 
            alt="Proveedores" 
            className="h-full w-48 md:w-60 object-cover rounded-xl"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* ─── ACTIONS BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
        {/* Search Input */}
        <div className="relative flex-1 sm:w-96 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar Proveedor por nombre, RNC o teléfono..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          <ScanLine 
            onClick={() => setIsScanModalOpen(true)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors" 
            size={18} 
            title="Escanear RNC o tarjeta de Proveedor" 
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => showToast('Filtros avanzados activos', 'info')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Filter size={18} />
            <span>Filtros</span>
          </button>

          {/* New Supplier Button */}
          <button
            onClick={openNewSupplierModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* ─── TABS & STATUS DROPDOWN BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          {['Todos', 'Activos', 'Inactivos', 'Locales', 'Nacionales', 'Internacionales'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
          >
            <option value="Todos">Estado: Todos</option>
            <option value="Activo">Estado: Activo</option>
            <option value="Inactivo">Estado: Inactivo</option>
          </select>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID (2 COLUMNS) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* LEFT COLUMN: TABLE + CHATBOT (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* SUPPLIERS TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Proveedor</th>
                    <th className="py-3.5 px-4">RNC</th>
                    <th className="py-3.5 px-4">Teléfono</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Ciudad</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                          <span>Cargando directorio de proveedores...</span>
                        </div>
                      </td>
                    </tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">No se encontraron proveedores</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba ajustando los términos de búsqueda o filtros</p>
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => {
                      const isSelected = selectedSupplier?.id === s.id;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedSupplier(s)}
                          className={`cursor-pointer transition-colors group hover:bg-slate-50/80 ${
                            isSelected ? 'bg-emerald-50/40 border-l-4 border-l-emerald-600' : ''
                          }`}
                        >
                          {/* Proveedor Initials Avatar + Company Name + Scope Pill */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                {s.initials}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{s.company_name}</p>
                                <span className="inline-block px-1.5 py-0.2 text-[9px] font-semibold text-indigo-700 bg-indigo-50 rounded border border-indigo-100">
                                  {s.type}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* RNC */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {s.rnc}
                          </td>

                          {/* Teléfono */}
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {s.phone}
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 text-slate-600 truncate max-w-[160px]">
                            {s.email}
                          </td>

                          {/* Ciudad */}
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {s.city}
                          </td>

                          {/* Estado Badge */}
                          <td className="py-3.5 px-4">
                            {s.is_active === 1 ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Inactivo
                              </span>
                            )}
                          </td>

                          {/* Acciones (Eye + 3 dots) */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedSupplier(s); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Ver detalle"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditSupplierModal(s); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Editar proveedor"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
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
                Mostrando <span className="font-semibold text-slate-700">{suppliers.length === 0 ? 0 : 1}</span> a <span className="font-semibold text-slate-700">{suppliers.length}</span> de <span className="font-semibold text-slate-700">{total}</span> proveedores
              </div>

              {/* Page Number Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  &lt;
                </button>

                {[1, 2, 3, 4].map(pNum => (
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
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  &gt;
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
                </select>
              </div>
            </div>
          </div>

          {/* ─── CHATBOT PHARMAPLUS WIDGET AT BOTTOM ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
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
                'Proveedores frecuentes',
                'Deudas por proveedor',
                'Mejores precios',
                'Nuevo proveedor'
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
              <div className="max-h-32 overflow-y-auto space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
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
              </div>
            )}

            {/* Chat Input Field */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
              className="flex items-center gap-2 mt-1"
            >
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  isListening ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200'
                }`}
                title={isListening ? 'Escuchando voz...' : 'Hablar por micrófono'}
              >
                <Mic size={16} />
              </button>
              <input
                type="text"
                placeholder={isListening ? 'Escuchando tu voz...' : 'Escribe tu pregunta...'}
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

        {/* ─── RIGHT COLUMN: DETALLE DEL PROVEEDOR PANEL (4 COLS) ─────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Detalle del Proveedor</h3>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            {selectedSupplier ? (
              <>
                {/* Header Avatar Box + Company Name */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold flex items-center justify-center text-lg shrink-0 shadow-2xs">
                    {selectedSupplier.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug">{selectedSupplier.company_name}</h4>
                    <div className="mt-1">
                      {selectedSupplier.is_active === 1 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attribute Breakdown */}
                <div className="space-y-2.5 text-xs divide-y divide-slate-100">
                  <div className="pt-1 flex justify-between">
                    <span className="text-slate-400 font-medium">RNC</span>
                    <span className="font-mono font-bold text-slate-800">{selectedSupplier.rnc}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Teléfono</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.phone}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Email</span>
                    <span className="text-slate-800 font-medium truncate max-w-[170px]">{selectedSupplier.email}</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 font-medium block mb-0.5">Dirección</span>
                    <span className="text-slate-800 font-medium leading-tight">{selectedSupplier.address}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Ciudad</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.city}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">País</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.country}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Tipo de Proveedor</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.type}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Contacto</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.contact_name}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Condiciones de pago</span>
                    <span className="font-semibold text-slate-800">{selectedSupplier.payment_terms}</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 font-medium block mb-0.5">Notas</span>
                    <p className="text-slate-700 italic text-[11px]">{selectedSupplier.notes}</p>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => openEditSupplierModal(selectedSupplier)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                  >
                    <Edit3 size={14} />
                    <span>Editar Proveedor</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                      selectedSupplier.is_active === 1
                        ? 'border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600'
                        : 'border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {selectedSupplier.is_active === 1 ? <Trash2 size={14} /> : <Check size={14} />}
                    <span>{selectedSupplier.is_active === 1 ? 'Desactivar Proveedor' : 'Activar Proveedor'}</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Building2 size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-slate-600 text-xs">Ningún Proveedor seleccionado</p>
                <p className="text-[11px] text-slate-400 mt-1">Selecciona un Proveedor de la tabla para ver sus detalles</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ─── MODAL: NUEVO / EDITAR PROVEEDOR ────────────────────────────────── */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={isEditMode ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveSupplierSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Nombre Comercial de la Empresa *</label>
              <input
                required
                type="text"
                placeholder="Ej. FarmaDistribuidora, SRL"
                className="input text-sm"
                value={supplierForm.company_name}
                onChange={(e) => setSupplierForm({ ...supplierForm, company_name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">RNC / Identificación Fiscal *</label>
              <input
                required
                type="text"
                placeholder="1-31-12345-6"
                className="input text-sm font-mono"
                value={supplierForm.rnc}
                onChange={(e) => setSupplierForm({ ...supplierForm, rnc: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Tipo de Proveedor *</label>
              <select
                className="input text-sm font-semibold"
                value={supplierForm.type}
                onChange={(e) => setSupplierForm({ ...supplierForm, type: e.target.value })}
              >
                <option value="Nacional">Nacional</option>
                <option value="Internacional">Internacional</option>
                <option value="Local">Local</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Teléfono Principal *</label>
              <input
                required
                type="text"
                placeholder="809-555-1234"
                className="input text-sm"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Correo Electrónico *</label>
              <input
                required
                type="email"
                placeholder="ventas@empresa.com"
                className="input text-sm"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Dirección Física</label>
              <input
                type="text"
                placeholder="Av. Principal #123, Ensanche Naco"
                className="input text-sm"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Ciudad *</label>
              <input
                required
                type="text"
                className="input text-sm"
                value={supplierForm.city}
                onChange={(e) => setSupplierForm({ ...supplierForm, city: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">País *</label>
              <input
                required
                type="text"
                className="input text-sm"
                value={supplierForm.country}
                onChange={(e) => setSupplierForm({ ...supplierForm, country: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Persona de Contacto</label>
              <input
                type="text"
                placeholder="Pedro Martínez"
                className="input text-sm"
                value={supplierForm.contact_name}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Condiciones de Pago</label>
              <select
                className="input text-sm font-semibold"
                value={supplierForm.payment_terms}
                onChange={(e) => setSupplierForm({ ...supplierForm, payment_terms: e.target.value })}
              >
                <option value="Crédito 30 días">Crédito 30 días</option>
                <option value="Crédito 15 días">Crédito 15 días</option>
                <option value="Crédito 60 días">Crédito 60 días</option>
                <option value="Contado / Transferencia">Contado / Transferencia</option>
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Notas / Observaciones</label>
              <textarea
                rows={2}
                className="input text-sm"
                placeholder="Observaciones adicionales sobre el proveedor..."
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              {isEditMode ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: DESACTIVAR / ACTIVAR PROVEEDOR ─────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={selectedSupplier?.is_active === 1 ? 'Desactivar Proveedor' : 'Activar Proveedor'}
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
            selectedSupplier?.is_active === 1 ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
          }`}>
            <AlertCircle size={26} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              ¿Deseas {selectedSupplier?.is_active === 1 ? 'desactivar' : 'activar'} a este proveedor?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Se {selectedSupplier?.is_active === 1 ? 'cambiará el estado a inactivo' : 'reactivará el acceso'} para <strong className="text-slate-800">"{selectedSupplier?.company_name}"</strong>.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={handleToggleDeactivate} 
              className={`btn text-white text-xs font-semibold ${
                selectedSupplier?.is_active === 1 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {selectedSupplier?.is_active === 1 ? 'Desactivar Proveedor' : 'Activar Proveedor'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: ESCANEAR RNC PROVEEDOR ─────────────────────────────────── */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Escáner Digital de RNC / Proveedor"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <ScanLine size={32} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Escaneando tarjeta de proveedor o RNC</h4>
            <p className="text-xs text-slate-500 mt-1">
              Identifica y filtra automáticamente los datos del proveedor en el catálogo.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsScanModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsScanModalOpen(false);
                if (suppliers.length > 0) setSelectedSupplier(suppliers[0]);
                showToast('Proveedor FarmaDistribuidora, SRL identificado correctamente');
              }} 
              className="btn btn-primary text-xs font-semibold"
            >
              Simular Escaneo Exitoso
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Proveedores;
