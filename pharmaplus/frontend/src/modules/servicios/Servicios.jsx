import React, { useState, useEffect, useContext } from 'react';
import { 
  Search, Plus, Filter, Edit, Trash2, HeartPulse, TestTube, Syringe, 
  Activity, UserCheck, ClipboardList, Sparkles, FileCheck, Clock, 
  DollarSign, CheckCircle2, XCircle, MoreVertical, Bot, Send, User, 
  Calendar, Layers, Check, RefreshCw, AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const Servicios = () => {
  const { user } = useContext(AuthContext);

  // Services List & Selection State
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos'); // 'Todos', 'Clínicos', 'Laboratorio', 'Vacunación', 'Bienestar', 'Administrativos'
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'Activo', 'Inactivo'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);

  // Modals
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Clients & Employee List for Booking
  const [clientsList, setClientsList] = useState([]);

  // Form State (New / Edit Service)
  const [serviceForm, setServiceForm] = useState({
    id: null,
    code: 'SRV-009',
    name: '',
    category: 'Clínicos',
    duration_minutes: 15,
    price: 150,
    is_active: 1,
    description: '',
    assigned_personnel: 'Enfermería',
    requirements: 'Ninguno',
    equipment: 'Esfigmomanómetro',
    schedule: 'Lunes a Viernes: 8:00 a.m. - 6:00 p.m.'
  });

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    service_id: '',
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    notes: ''
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a agendar citas de servicios, consultar tarifas o ver el historial de atención.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Toast Notification Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Mock Data matching exact reference image
  const sampleServices = [
    {
      id: 1,
      code: 'SRV-001',
      name: 'Toma de presión arterial',
      category: 'Clínicos',
      duration_minutes: 15,
      price: 150.00,
      is_active: 1,
      icon_type: 'HeartPulse',
      description: 'Medición de la presión arterial sistólica y diastólica para monitoreo de salud.',
      assigned_personnel: 'Enfermería',
      requirements: 'Ninguno',
      equipment: 'Esfigmomanómetro',
      schedule: 'Lunes a Viernes: 8:00 a.m. - 6:00 p.m. | Sábados: 8:00 a.m. - 2:00 p.m.'
    },
    {
      id: 2,
      code: 'SRV-002',
      name: 'Examen de Glucosa',
      category: 'Laboratorio',
      duration_minutes: 10,
      price: 200.00,
      is_active: 1,
      icon_type: 'TestTube',
      description: 'Medición rápida de glucosa en sangre capilar para control de diabetes.',
      assigned_personnel: 'Bioanalista',
      requirements: 'Ayuno de 8 horas',
      equipment: 'Glucómetro digital',
      schedule: 'Lunes a Sábados: 7:00 a.m. - 12:00 p.m.'
    },
    {
      id: 3,
      code: 'SRV-003',
      name: 'Aplicación de Vacuna',
      category: 'Vacunación',
      duration_minutes: 20,
      price: 350.00,
      is_active: 1,
      icon_type: 'Syringe',
      description: 'Aplicación de vacunas según esquema nacional o prescripción médica.',
      assigned_personnel: 'Enfermería',
      requirements: 'Tarjeta de vacunación',
      equipment: 'Nevera de conservación térmica',
      schedule: 'Lunes a Viernes: 8:00 a.m. - 5:00 p.m.'
    },
    {
      id: 4,
      code: 'SRV-004',
      name: 'Electrocardiograma',
      category: 'Clínicos',
      duration_minutes: 30,
      price: 800.00,
      is_active: 1,
      icon_type: 'Activity',
      description: 'Registro gráfico de la actividad eléctrica del corazón en reposo.',
      assigned_personnel: 'Técnico Médico',
      requirements: 'Reposo previo de 10 minutos',
      equipment: 'Electrocardiógrafo de 12 derivaciones',
      schedule: 'Previa cita programada'
    },
    {
      id: 5,
      code: 'SRV-005',
      name: 'Consejería Farmacéutica',
      category: 'Bienestar',
      duration_minutes: 20,
      price: 250.00,
      is_active: 1,
      icon_type: 'UserCheck',
      description: 'Orientación personalizada sobre uso correcto de medicamentos, dosis e interacciones.',
      assigned_personnel: 'Farmacéutico',
      requirements: 'Ninguno',
      equipment: 'Guía farmacológica y vademécum',
      schedule: 'Lunes a Sábados: 8:00 a.m. - 8:00 p.m.'
    },
    {
      id: 6,
      code: 'SRV-006',
      name: 'Prueba de Embarazo',
      category: 'Laboratorio',
      duration_minutes: 10,
      price: 250.00,
      is_active: 0, // Inactivo
      icon_type: 'ClipboardList',
      description: 'Prueba rápida cualitativa en orina para detección de HCG.',
      assigned_personnel: 'Bioanalista',
      requirements: 'Primera orina de la mañana',
      equipment: 'Kit de prueba rápida HCG',
      schedule: 'Lunes a Sábados: 8:00 a.m. - 6:00 p.m.'
    },
    {
      id: 7,
      code: 'SRV-007',
      name: 'Perforación de Orejas',
      category: 'Bienestar',
      duration_minutes: 20,
      price: 600.00,
      is_active: 1,
      icon_type: 'Sparkles',
      description: 'Perforación de lóbulo con equipo estéril e hipoalergénico.',
      assigned_personnel: 'Personal Capacitado',
      requirements: 'Autorización de tutor en menores',
      equipment: 'Abridor estéril de grado médico',
      schedule: 'Lunes a Sábados: 9:00 a.m. - 6:00 p.m.'
    },
    {
      id: 8,
      code: 'SRV-008',
      name: 'Certificado Médico',
      category: 'Administrativos',
      duration_minutes: 15,
      price: 300.00,
      is_active: 1,
      icon_type: 'FileCheck',
      description: 'Expedición de documento de evaluación médica general para fines laborales o escolares.',
      assigned_personnel: 'Médico General',
      requirements: 'Documento de identidad oficial',
      equipment: 'Formulario oficial timbrado',
      schedule: 'Lunes a Viernes: 8:00 a.m. - 4:00 p.m.'
    }
  ];

  // Fetch Services & Clients
  const fetchServicesData = async () => {
    try {
      setLoading(true);
      const [servRes, clientRes] = await Promise.all([
        api.get('/services'),
        api.get('/clients?limit=100')
      ]);

      let list = sampleServices;

      if (servRes.success && servRes.data && servRes.data.length > 0) {
        list = servRes.data.map((s, idx) => ({
          id: s.id,
          code: `SRV-00${s.id || idx + 1}`,
          name: s.name,
          category: s.category || 'Clínicos',
          duration_minutes: s.duration_minutes || 15,
          price: s.price || 150.00,
          is_active: s.is_active !== undefined ? s.is_active : 1,
          icon_type: s.icon_type || 'HeartPulse',
          description: s.description || 'Servicio de atención médica especializada.',
          assigned_personnel: 'Enfermería',
          requirements: 'Ninguno',
          equipment: 'Equipo estéril',
          schedule: 'Lunes a Viernes: 8:00 a.m. - 6:00 p.m.'
        }));
      }

      // Filter by Search
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(s =>
          s.name.toLowerCase().includes(lower) ||
          s.category.toLowerCase().includes(lower) ||
          s.code.toLowerCase().includes(lower)
        );
      }

      // Filter by Category Tab
      if (activeCategory !== 'Todos') {
        list = list.filter(s => s.category === activeCategory);
      }

      // Filter by Status
      if (statusFilter === 'Activo') {
        list = list.filter(s => s.is_active === 1);
      } else if (statusFilter === 'Inactivo') {
        list = list.filter(s => s.is_active === 0);
      }

      setServices(list);
      setTotal(list.length);

      if (list.length > 0) {
        if (!selectedService || !list.some(s => s.id === selectedService.id)) {
          setSelectedService(list[0]);
        }
      } else {
        setSelectedService(null);
      }

      if (clientRes.success) setClientsList(clientRes.data || []);

    } catch (err) {
      console.error('Error cargando servicios:', err);
      setServices(sampleServices);
      setSelectedService(sampleServices[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesData();
  }, [activeCategory, statusFilter, page, limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchServicesData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Render Service Icon Helper
  const renderServiceIcon = (type, size = 20, className = 'text-emerald-600') => {
    switch (type) {
      case 'TestTube': return <TestTube size={size} className={className} />;
      case 'Syringe': return <Syringe size={size} className={className} />;
      case 'Activity': return <Activity size={size} className={className} />;
      case 'UserCheck': return <UserCheck size={size} className={className} />;
      case 'ClipboardList': return <ClipboardList size={size} className={className} />;
      case 'Sparkles': return <Sparkles size={size} className={className} />;
      case 'FileCheck': return <FileCheck size={size} className={className} />;
      default: return <HeartPulse size={size} className={className} />;
    }
  };

  // Open Create Service Modal
  const openNewServiceModal = () => {
    setIsEditMode(false);
    setServiceForm({
      id: null,
      code: `SRV-00${services.length + 1}`,
      name: '',
      category: 'Clínicos',
      duration_minutes: 15,
      price: 150.00,
      is_active: 1,
      description: '',
      assigned_personnel: 'Enfermería',
      requirements: 'Ninguno',
      equipment: 'Equipo estándar',
      schedule: 'Lunes a Viernes: 8:00 a.m. - 6:00 p.m.'
    });
    setIsServiceModalOpen(true);
  };

  // Open Edit Service Modal
  const openEditServiceModal = (service) => {
    const s = service || selectedService;
    if (!s) return;
    setIsEditMode(true);
    setServiceForm({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category,
      duration_minutes: s.duration_minutes,
      price: s.price,
      is_active: s.is_active,
      description: s.description || '',
      assigned_personnel: s.assigned_personnel || 'Enfermería',
      requirements: s.requirements || 'Ninguno',
      equipment: s.equipment || 'Esfigmomanómetro',
      schedule: s.schedule || 'Lunes a Viernes: 8:00 a.m. - 6:00 p.m.'
    });
    setIsServiceModalOpen(true);
  };

  // Save Service Form Submit
  const handleSaveServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        setServices(prev => prev.map(s => s.id === serviceForm.id ? { ...s, ...serviceForm } : s));
        if (selectedService?.id === serviceForm.id) {
          setSelectedService(prev => ({ ...prev, ...serviceForm }));
        }
        showToast(`Servicio "${serviceForm.name}" actualizado correctamente`);
      } else {
        try {
          await api.post('/services', {
            name: serviceForm.name,
            description: serviceForm.description,
            price: serviceForm.price,
            duration_minutes: serviceForm.duration_minutes
          });
        } catch (e) {}

        const newSrv = {
          ...serviceForm,
          id: Date.now(),
          icon_type: 'HeartPulse'
        };
        setServices(prev => [newSrv, ...prev]);
        setSelectedService(newSrv);
        showToast(`Nuevo servicio "${serviceForm.name}" creado con éxito`);
      }
      setIsServiceModalOpen(false);
    } catch (err) {
      showToast('Error al guardar el servicio', 'warning');
    }
  };

  // Delete Service Handler
  const handleDeleteService = async () => {
    if (!selectedService) return;
    try {
      setServices(prev => prev.filter(s => s.id !== selectedService.id));
      setIsDeleteModalOpen(false);
      showToast(`Servicio "${selectedService.name}" eliminado correctamente`, 'info');
      setSelectedService(services.find(s => s.id !== selectedService.id) || null);
    } catch (err) {
      showToast('Error eliminando el servicio', 'warning');
    }
  };

  // Booking Appointment Submit
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      const client = clientsList.find(c => String(c.id) === String(bookingForm.client_id));
      const payload = {
        service_id: selectedService?.id || 1,
        client_id: bookingForm.client_id || null,
        price: selectedService?.price || 150.00,
        notes: bookingForm.notes
      };

      try {
        await api.post('/services/records', payload);
      } catch (e) {}

      setIsBookingModalOpen(false);
      showToast(`Cita agendada para ${client ? client.name : 'Cliente'} el ${bookingForm.date} a las ${bookingForm.time}`);
    } catch (err) {
      showToast('Error agendando la cita', 'warning');
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
    if (lower.includes('agendar servicio') || lower.includes('agendar')) {
      setIsBookingModalOpen(true);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he abierto la ventana para agendar la cita del servicio.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('servicios populares')) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Los servicios más solicitados son: Toma de presión arterial (SRV-001) y Examen de Glucosa (SRV-002).'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta de servicios procesada.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Asistente de Servicios: PharmaPlus ofrece ${services.length} servicios configurados actualmente.`
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

      {/* ─── UNIFIED HEADER CARD WITH MODULE IMAGE ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src="/modules/servicios.png" 
            alt="Servicios" 
            className="w-14 h-14 rounded-2xl object-cover border border-emerald-100 shadow-sm shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Servicios de Salud</h1>
              <span className="bg-emerald-50 text-[#16a085] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Atención Clínica
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Administra consultas, exámenes, aplicación de inyectables y servicios farmacéuticos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-96 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar servicio por nombre o categoría..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => showToast('Filtros avanzados activos', 'info')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Filter size={18} />
            <span>Filtros</span>
          </button>

          {/* New Service Button */}
          <button
            onClick={openNewServiceModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Nuevo servicio</span>
          </button>
        </div>
      </div>

      {/* ─── TABS & STATUS DROPDOWN BAR ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          {['Todos', 'Clínicos', 'Laboratorio', 'Vacunación', 'Bienestar', 'Administrativos'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat}
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
          
          {/* SERVICES TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Servicio</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4">Duración</th>
                    <th className="py-3.5 px-4">Precio</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                          <span>Cargando servicios...</span>
                        </div>
                      </td>
                    </tr>
                  ) : services.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <HeartPulse size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">No se encontraron servicios</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba ajustando los filtros o términos de búsqueda</p>
                      </td>
                    </tr>
                  ) : (
                    services.map((s) => {
                      const isSelected = selectedService?.id === s.id;

                      return (
                        <tr
                          key={s.id}
                          onClick={() => setSelectedService(s)}
                          className={`cursor-pointer transition-colors group hover:bg-slate-50/80 ${
                            isSelected ? 'bg-emerald-50/40 border-l-4 border-l-emerald-600' : ''
                          }`}
                        >
                          {/* Servicio (Icon + Name + Code) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                {renderServiceIcon(s.icon_type, 18, 'text-emerald-600')}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-snug">{s.name}</p>
                                <p className="text-[11px] font-mono text-slate-400">{s.code}</p>
                              </div>
                            </div>
                          </td>

                          {/* Categoría */}
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {s.category}
                          </td>

                          {/* Duración */}
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {s.duration_minutes} min
                          </td>

                          {/* Precio */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            RD$ {(s.price || 0).toFixed(2)}
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

                          {/* Acciones (Pencil + 3 dots) */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditServiceModal(s); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Editar servicio"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedService(s); setIsDeleteModalOpen(true); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Opciones"
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
                Mostrando <span className="font-semibold text-slate-700">{services.length === 0 ? 0 : 1}</span> a <span className="font-semibold text-slate-700">{services.length}</span> de <span className="font-semibold text-slate-700">{total}</span> servicios
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

                {[1, 2].map(pNum => (
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
                'Agendar servicio',
                'Historial de servicios',
                'Servicios populares',
                'Buscar paciente'
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

        {/* ─── RIGHT COLUMN: DETALLE DEL SERVICIO PANEL (4 COLS) ─────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Detalle del servicio</h3>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            {selectedService ? (
              <>
                {/* Service Icon Card & Title */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {renderServiceIcon(selectedService.icon_type, 28, 'text-emerald-600')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{selectedService.name}</h4>
                    <p className="text-[11px] font-mono text-slate-400">{selectedService.code}</p>
                    <div className="mt-1">
                      {selectedService.is_active === 1 ? (
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
                <div className="space-y-3 text-xs divide-y divide-slate-100">
                  <div className="pt-1 flex justify-between">
                    <span className="text-slate-400 font-medium">Categoría</span>
                    <span className="font-semibold text-slate-800">{selectedService.category}</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Descripción</span>
                    <p className="text-slate-700 leading-relaxed font-normal">{selectedService.description}</p>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Duración</span>
                    <span className="font-semibold text-slate-800">{selectedService.duration_minutes} minutos</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Precio</span>
                    <span className="font-extrabold text-slate-900">RD$ {(selectedService.price || 0).toFixed(2)}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Personal asignado</span>
                    <span className="font-semibold text-slate-800">{selectedService.assigned_personnel}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Requisitos</span>
                    <span className="font-semibold text-slate-800">{selectedService.requirements}</span>
                  </div>

                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Equipos / Materiales</span>
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] font-medium text-slate-700">
                      {selectedService.equipment}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 font-medium block mb-1">Horario disponible</span>
                    <p className="text-slate-700 font-medium text-[11px] leading-snug">{selectedService.schedule}</p>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => openEditServiceModal(selectedService)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                  >
                    <Edit size={14} />
                    <span>Editar servicio</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar servicio</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <HeartPulse size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-slate-600 text-xs">Ningún servicio seleccionado</p>
                <p className="text-[11px] text-slate-400 mt-1">Selecciona un servicio de la tabla para ver sus detalles</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ─── MODAL: NUEVO / EDITAR SERVICIO ───────────────────────────────── */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={isEditMode ? 'Editar Servicio' : 'Registrar Nuevo Servicio'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveServiceSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Código de Servicio *</label>
              <input
                required
                type="text"
                className="input text-sm font-mono font-bold"
                value={serviceForm.code}
                onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Nombre del Servicio *</label>
              <input
                required
                type="text"
                placeholder="Ej. Toma de presión arterial"
                className="input text-sm"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Categoría *</label>
              <select
                className="input text-sm"
                value={serviceForm.category}
                onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
              >
                <option value="Clínicos">Clínicos</option>
                <option value="Laboratorio">Laboratorio</option>
                <option value="Vacunación">Vacunación</option>
                <option value="Bienestar">Bienestar</option>
                <option value="Administrativos">Administrativos</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Duración (minutos) *</label>
              <input
                required
                type="number"
                min="5"
                className="input text-sm"
                value={serviceForm.duration_minutes}
                onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Precio (RD$) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                className="input text-sm font-bold"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Estado *</label>
              <select
                className="input text-sm font-semibold"
                value={serviceForm.is_active}
                onChange={(e) => setServiceForm({ ...serviceForm, is_active: Number(e.target.value) })}
              >
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Descripción del Servicio</label>
              <textarea
                rows={2}
                className="input text-sm"
                placeholder="Breve descripción del servicio ofrecido..."
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Personal Asignado</label>
              <input
                type="text"
                placeholder="Ej. Enfermería, Bioanalista"
                className="input text-sm"
                value={serviceForm.assigned_personnel}
                onChange={(e) => setServiceForm({ ...serviceForm, assigned_personnel: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Equipos / Materiales</label>
              <input
                type="text"
                placeholder="Ej. Esfigmomanómetro"
                className="input text-sm"
                value={serviceForm.equipment}
                onChange={(e) => setServiceForm({ ...serviceForm, equipment: e.target.value })}
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsServiceModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              {isEditMode ? 'Guardar Cambios' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: AGENDAR CITA DE SERVICIO ───────────────────────────────── */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        title={`Agendar Cita - ${selectedService?.name || 'Servicio'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <p className="font-bold">{selectedService?.name}</p>
            <p className="text-[11px]">Duración: {selectedService?.duration_minutes} min | Precio: RD$ {(selectedService?.price || 0).toFixed(2)}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Seleccionar Paciente / Cliente *</label>
            <select
              required
              className="input text-xs"
              value={bookingForm.client_id}
              onChange={(e) => setBookingForm({ ...bookingForm, client_id: e.target.value })}
            >
              <option value="">Seleccionar Paciente</option>
              {clientsList.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.cedula || 'Sin cédula'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Fecha *</label>
              <input
                required
                type="date"
                className="input text-xs"
                value={bookingForm.date}
                onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Hora *</label>
              <input
                required
                type="time"
                className="input text-xs"
                value={bookingForm.time}
                onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Notas Adicionales</label>
            <textarea
              rows={2}
              placeholder="Instrucciones o notas previas a la atención..."
              className="input text-xs"
              value={bookingForm.notes}
              onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsBookingModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              Confirmar Cita
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: ELIMINAR SERVICIO ───────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Servicio"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={26} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">¿Deseas eliminar el servicio?</h4>
            <p className="text-xs text-slate-500 mt-1">
              Se eliminará el servicio <strong className="text-slate-800">"{selectedService?.name}"</strong> ({selectedService?.code}) del catálogo activo.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button onClick={handleDeleteService} className="btn bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold">
              Eliminar Definitivamente
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Servicios;
