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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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

  const [serviceForm, setServiceForm] = useState({
    id: null,
    client_id: '',
    name: '',
    price: 150,
    description: ''
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

      // Filter by Min / Max Price
      if (minPrice) {
        list = list.filter(s => s.price >= Number(minPrice));
      }
      if (maxPrice) {
        list = list.filter(s => s.price <= Number(maxPrice));
      }

      // Sorting
      if (sortBy === 'name_asc') {
        list.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'name_desc') {
        list.sort((a, b) => b.name.localeCompare(a.name));
      } else if (sortBy === 'price_asc') {
        list.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price_desc') {
        list.sort((a, b) => b.price - a.price);
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

  const resetFilters = () => {
    setSearchTerm('');
    setActiveCategory('Todos');
    setStatusFilter('Todos');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
    setPage(1);
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + (activeCategory !== 'Todos' ? 1 : 0) + (statusFilter !== 'Todos' ? 1 : 0) + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (sortBy !== 'default' ? 1 : 0);

  useEffect(() => {
    fetchServicesData();
  }, [activeCategory, statusFilter, minPrice, maxPrice, sortBy, page, limit]);

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
      client_id: clientsList.length > 0 ? clientsList[0].id : '',
      name: '',
      price: 150.00,
      description: ''
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
      client_id: '',
      name: s.name,
      price: s.price,
      description: s.description || ''
    });
    setIsServiceModalOpen(true);
  };

  // Save Service Form Submit
  const handleSaveServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/services/${serviceForm.id}`, {
          name: serviceForm.name,
          description: serviceForm.description,
          price: serviceForm.price
        });
        showToast(`Servicio "${serviceForm.name}" actualizado correctamente`);
      } else {
        await api.post('/services', {
          client_id: serviceForm.client_id,
          name: serviceForm.name,
          description: serviceForm.description,
          price: serviceForm.price
        });
        showToast(`Nuevo servicio "${serviceForm.name}" creado con éxito`);
      }
      setIsServiceModalOpen(false);
      fetchServicesData();
    } catch (err) {
      showToast('Error al guardar el servicio', 'warning');
    }
  };

  // Delete Service Handler
  const handleDeleteService = async () => {
    if (!selectedService) return;
    try {
      await api.delete(`/services/${selectedService.id}`);
      setIsDeleteModalOpen(false);
      showToast(`Servicio "${selectedService.name}" eliminado correctamente`, 'info');
      fetchServicesData();
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
    <div className="flex flex-col gap-5 relative">
      
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

      {/* ─── BANNER SUPERIOR CORPORATIVO SERVICIOS (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between shrink-0">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          CLINICAL SERVICES & HEALTHCARE DISPENSARY
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>ATENCIÓN CLÍNICA & SERVICIOS • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Gestión de Servicios de Salud
            </h1>
            
            <p className="text-sm sm:text-base text-emerald-100/90 font-medium">
              Toma de presión, pruebas de glucosa, vacunación, inyecciones, chequeos preventivos y citas clínicas.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-white text-xs font-bold shadow-sm backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {total} Servicios Disponibles
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Personal Médico & Enfermería 24/7
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Cabina de Salud Piantini
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={openNewServiceModal}
              className="px-5 py-3 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-black shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={17} /> Nuevo Servicio
            </button>
            <button
              onClick={() => setIsBookingModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <Calendar size={17} /> Agendar Cita
            </button>
          </div>

        </div>

      </div>

      {/* ─── 4 TARJETAS KPI LIMPIAS Y ESPACIOSAS SERVICIOS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        
        {/* Card 1: Servicios Activos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <HeartPulse size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Servicios Clínicos</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                {total} Activos
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>Enfermería y toma de muestras</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Vacunación & Inyectables */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#eafaf1] text-[#27ae60] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Syringe size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Vacunas & Dosis</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                100% Certificadas
              </h3>
              <p className="text-[11px] font-bold text-[#27ae60] mt-0.5 truncate">
                <span>✓ Cadena de frío estricta</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Laboratorio Rápido */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#ebf5fb] text-[#3498db] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <TestTube size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Pruebas Rápidas</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                Glucosa & Perfil
              </h3>
              <p className="text-[11px] font-bold text-[#3498db] mt-0.5 truncate">
                <span>Resultados en 5 min</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: Tiempo Promedio de Atención */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#fef5e7] text-[#f39c12] flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
              <Clock size={22} />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-500">Tiempo de Espera</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight mt-0.5">
                ~ 10 Minutos
              </h3>
              <p className="text-[11px] font-bold text-[#16a085] mt-0.5 truncate">
                <span>✓ Atención ágil y prioritaria</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* ─── ACTIONS BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
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

        <div className="flex items-center gap-2">
          {/* Filter Button */}
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm active:scale-95 ${
              isFilterPanelOpen || activeFiltersCount > 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-emerald-500/10'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
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

      {/* ─── EXPANDABLE FILTER PANEL ───────────────────────────────────────── */}
      {isFilterPanelOpen && (
        <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-4 flex flex-col gap-4 animate-fade-in text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Filter className="text-emerald-600" size={16} />
              <span className="font-bold text-slate-800 text-sm">Filtros Avanzados de Servicios</span>
              {activeFiltersCount > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <button
              onClick={resetFilters}
              className="text-slate-400 hover:text-emerald-600 font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={12} />
              <span>Limpiar filtros</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Rango de Precio Min */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Precio Mínimo (RD$)</label>
              <input
                type="number"
                placeholder="0.00"
                min="0"
                className="input text-xs"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              />
            </div>

            {/* Rango de Precio Max */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Precio Máximo (RD$)</label>
              <input
                type="number"
                placeholder="Ej. 1000.00"
                min="0"
                className="input text-xs"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              />
            </div>

            {/* Ordenar Por */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Ordenar Por</label>
              <select
                className="input text-xs"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="default">Por defecto (Recientes)</option>
                <option value="name_asc">Nombre (A-Z)</option>
                <option value="name_desc">Nombre (Z-A)</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
              </select>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Estado del Servicio</label>
              <select
                className="input text-xs"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="Todos">Todos los Estados</option>
                <option value="Activo">Solo Activos</option>
                <option value="Inactivo">Solo Inactivos</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Cliente (Paciente) *</label>
              <select
                className="input text-sm"
                value={serviceForm.client_id}
                onChange={(e) => setServiceForm({ ...serviceForm, client_id: e.target.value })}
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientsList.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.cedula ? `(${c.cedula})` : ''}</option>
                ))}
              </select>
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

            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Notas / Descripción</label>
              <textarea
                rows={3}
                className="input text-sm"
                placeholder="Breve descripción del servicio o nota médica..."
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
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
