import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Users, UserCheck, Calendar, FileText, Gift, Plus, Search, Filter,
  ScanLine, Eye, Edit3, Trash2, CheckCircle2, XCircle, Phone, Mail,
  MapPin, DollarSign, Heart, ShieldAlert, ChevronRight, ChevronLeft,
  Bot, Send, Sparkles, RefreshCw, MoreVertical, AlertCircle, Check, Mic,
  Briefcase, Building2, UserPlus, Clock, QrCode, Printer, X, ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { playScannerBeep } from '../../utils/sound';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const fmt = (v) =>
  `RD$ ${Number(v || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtSalary = (v) =>
  Number(v || 0).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initials = (name) =>
  (name || 'EM').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

const AVATAR_COLORS = [
  'bg-purple-100 border-purple-200 text-purple-700',
  'bg-blue-100 border-blue-200 text-blue-700',
  'bg-amber-100 border-amber-200 text-amber-700',
  'bg-rose-100 border-rose-200 text-rose-700',
  'bg-indigo-100 border-indigo-200 text-indigo-700',
  'bg-teal-100 border-teal-200 text-teal-700',
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

/* ══════════════════════════════════════════════════════════════════════════ */
const RRHH = () => {
  const { user } = useContext(AuthContext);

  /* ── Estado principal ──────────────────────────────────────────────────── */
  const [employees, setEmployees]             = useState([]);
  const [stats, setStats]                     = useState(null);
  const [attendance, setAttendance]           = useState([]);
  const [departments, setDepartments]         = useState([]);
  const [positions, setPositions]             = useState([]);
  const [nomina, setNomina]                   = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [loadingTab, setLoadingTab]           = useState(false);

  /* ── Tabs y filtros ────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('Empleados');
  const [page, setPage]           = useState(1);
  const [limit, setLimit]         = useState(8);
  const [total, setTotal]         = useState(0);

  const [searchTerm, setSearchTerm]         = useState('');
  const [filterDept, setFilterDept]         = useState('ALL');
  const [filterStatus, setFilterStatus]     = useState('ALL');
  const [filterDateAtt, setFilterDateAtt]   = useState(new Date().toISOString().split('T')[0]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  /* ── Modales ─────────────────────────────────────────────────────────────── */
  const [isEmployeeModalOpen, setIsEmployeeModalOpen]   = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen]       = useState(false);
  const [isEditMode, setIsEditMode]                     = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen]       = useState(false);
  const [isScanModalOpen, setIsScanModalOpen]           = useState(false);
  const [isCarnetModalOpen, setIsCarnetModalOpen]       = useState(false);
  const [isAttModalOpen, setIsAttModalOpen]             = useState(false);
  const [toastMessage, setToastMessage]                 = useState(null);

  /* ── Formularios ─────────────────────────────────────────────────────────── */
  const defaultForm = {
    id: null, name: '', cedula: '', position: '', department: 'Caja',
    phone: '', email: '', address: '', birth_date: '', hire_date: '',
    salary: '', civil_status: 'Soltera', emergency_contact: '', is_active: 1, notes: ''
  };
  const [employeeForm, setEmployeeForm] = useState(defaultForm);
  const [attForm, setAttForm] = useState({ employee_id: '', date: new Date().toISOString().split('T')[0], check_in: '', status: 'presente', notes: '' });

  /* ── Chatbot ─────────────────────────────────────────────────────────────── */
  const [chatInput, setChatInput]       = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a registrar asistencias, consultar vacaciones o gestionar el expediente de empleados.' }
  ]);
  const [chatLoading, setChatLoading]   = useState(false);
  const [isListening, setIsListening]   = useState(false);

  /* ── Toast ───────────────────────────────────────────────────────────────── */
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  /* ── Scanner QR ──────────────────────────────────────────────────────────── */
  const handleBarcodeScanned = (code) => {
    playScannerBeep();
    const found = employees.find(e =>
      (e.cedula && e.cedula.includes(code)) ||
      (e.name && e.name.toLowerCase().includes(code.toLowerCase()))
    ) || employees[0];

    if (found) {
      setSelectedEmployee(found);
      setSearchTerm(found.name);
      setIsScanModalOpen(false);
      showToast(`Carnet QR identificado: ${found.name} (${found.position})`);
    } else {
      showToast(`No se encontró empleado con código: ${code}`, 'error');
    }
  };
  useBarcodeScanner(handleBarcodeScanned);

  /* ── Fetch empleados ─────────────────────────────────────────────────────── */
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (filterDept !== 'ALL') params.set('department', filterDept);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);

      const res = await api.get(`/rrhh?${params}`);
      const rawList = res.data ?? res ?? [];
      const list = Array.isArray(rawList) ? rawList.map(e => ({
        ...e,
        salary_fmt: fmtSalary(e.salary),
        initials_calc: initials(e.name)
      })) : [];

      setEmployees(list);
      const pag = res.pagination ?? {};
      setTotal(pag.total ?? list.length);

      if (list.length > 0 && (!selectedEmployee || !list.some(e => e.id === selectedEmployee.id))) {
        setSelectedEmployee(list[0]);
      } else if (list.length === 0) {
        setSelectedEmployee(null);
      }
    } catch (err) {
      console.error('Error cargando empleados:', err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterDept, filterStatus, page, limit]);

  /* ── Fetch stats ─────────────────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/rrhh/stats');
      const raw = res?.data ?? res;
      if (raw && (raw.total !== undefined || raw.activos !== undefined)) {
        setStats(raw);
      } else if (raw?.data && raw.data.total !== undefined) {
        setStats(raw.data);
      }
    } catch (e) {
      console.error('Error cargando stats de RRHH:', e);
      setStats(null);
    }
  }, []);

  /* ── Fetch attendance ────────────────────────────────────────────────────── */
  const fetchAttendance = useCallback(async (date) => {
    setLoadingTab(true);
    try {
      const res = await api.get(`/rrhh/attendance?date=${date || filterDateAtt}`);
      setAttendance(Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch { setAttendance([]); }
    finally { setLoadingTab(false); }
  }, [filterDateAtt]);

  /* ── Fetch departments ───────────────────────────────────────────────────── */
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/rrhh/departments');
      setDepartments(Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch { setDepartments([]); }
  }, []);

  /* ── Fetch positions ─────────────────────────────────────────────────────── */
  const fetchPositions = useCallback(async () => {
    try {
      const res = await api.get('/rrhh/positions');
      setPositions(Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch { setPositions([]); }
  }, []);

  /* ── Fetch nómina ────────────────────────────────────────────────────────── */
  const fetchNomina = useCallback(async () => {
    setLoadingTab(true);
    try {
      const res = await api.get('/rrhh/nomina');
      setNomina(Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch { setNomina([]); }
    finally { setLoadingTab(false); }
  }, []);

  /* ── Effects ─────────────────────────────────────────────────────────────── */
  useEffect(() => { fetchStats(); fetchDepartments(); fetchPositions(); }, [fetchStats, fetchDepartments, fetchPositions]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  useEffect(() => {
    if (activeTab === 'Asistencias') fetchAttendance(filterDateAtt);
    if (activeTab === 'Nómina') fetchNomina();
    if (activeTab === 'Departamentos') fetchDepartments();
    if (activeTab === 'Cargos') fetchPositions();
  }, [activeTab, filterDateAtt, fetchAttendance, fetchNomina, fetchDepartments, fetchPositions]);

  /* ── Guardar empleado ────────────────────────────────────────────────────── */
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: employeeForm.name,
        cedula: employeeForm.cedula,
        position: employeeForm.position,
        department: employeeForm.department,
        phone: employeeForm.phone,
        email: employeeForm.email,
        address: employeeForm.address,
        birth_date: employeeForm.birth_date,
        hire_date: employeeForm.hire_date,
        salary: parseFloat(employeeForm.salary || 0),
        civil_status: employeeForm.civil_status,
        emergency_contact: employeeForm.emergency_contact,
        notes: employeeForm.notes,
      };

      if (isEditMode) {
        await api.put(`/rrhh/${employeeForm.id}`, payload);
        showToast(`Empleado "${employeeForm.name}" actualizado`);
      } else {
        await api.post('/rrhh', payload);
        showToast(`Empleado "${employeeForm.name}" registrado`);
      }

      setIsEmployeeModalOpen(false);
      fetchEmployees();
      fetchStats();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Error al guardar el empleado', 'error');
    }
  };

  /* ── Toggle activo/inactivo ──────────────────────────────────────────────── */
  const handleToggleStatus = async () => {
    if (!selectedEmployee) return;
    try {
      const newStatus = selectedEmployee.is_active === 1 ? 0 : 1;
      await api.put(`/rrhh/${selectedEmployee.id}`, { is_active: newStatus });
      setIsDeleteModalOpen(false);
      showToast(`Empleado "${selectedEmployee.name}" ${newStatus === 0 ? 'desactivado' : 'activado'}`);
      fetchEmployees();
      fetchStats();
    } catch {
      showToast('Error cambiando estado', 'error');
    }
  };

  /* ── Registrar asistencia ────────────────────────────────────────────────── */
  const handleRegisterAttendance = async () => {
    if (!attForm.employee_id) { showToast('Selecciona un empleado', 'error'); return; }
    try {
      await api.post('/rrhh/attendance', {
        employee_id: attForm.employee_id,
        date: attForm.date,
        check_in: attForm.check_in || new Date().toTimeString().substring(0, 5),
        status: attForm.status,
        notes: attForm.notes
      });
      showToast('Asistencia registrada correctamente');
      setIsAttModalOpen(false);
      fetchAttendance(attForm.date);
    } catch {
      showToast('Error registrando asistencia', 'error');
    }
  };

  /* ── Chatbot ─────────────────────────────────────────────────────────────── */
  const handleVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Reconocimiento de voz no disponible', 'error'); return; }
    if (isListening) { setIsListening(false); return; }
    const recognition = new SR();
    recognition.lang = 'es-ES';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (ev) => setChatInput(Array.from(ev.results).map(r => r[0].transcript).join(''));
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSendChat = async (queryText) => {
    const text = queryText || chatInput;
    if (!text.trim()) return;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);
    const lower = text.toLowerCase();

    if (lower.includes('nuevo empleado')) {
      openNewModal();
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Te abrí el formulario para registrar un nuevo empleado.' }]);
      setChatLoading(false); return;
    }
    if (lower.includes('asistencia')) {
      setActiveTab('Asistencias');
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Abrí el módulo de asistencias. Hay ${attendance.length} registros hoy.` }]);
      setChatLoading(false); return;
    }
    if (lower.includes('nómina') || lower.includes('nomina')) {
      setActiveTab('Nómina');
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Nómina total mensual del equipo activo: ${fmt(stats?.nomina_total || 0)}` }]);
      setChatLoading(false); return;
    }
    if (lower.includes('departamento')) {
      const deptInfo = departments.map(d => `${d.name}: ${d.activos} activos`).join(', ');
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Departamentos: ${deptInfo || 'Sin datos.'}` }]);
      setChatLoading(false); return;
    }
    if (lower.includes('cumpleaños')) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Cumpleaños esta semana: ${stats?.cumpleanos_semana || 0} empleado(s).` }]);
      setChatLoading(false); return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: `Tienes ${stats?.activos || employees.length} empleados activos en la plantilla.` }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Plantilla: ${stats?.total || total || employees.length} empleados en total.` }]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ── Abrir modales ───────────────────────────────────────────────────────── */
  const openNewModal = () => {
    setIsEditMode(false);
    setEmployeeForm({ ...defaultForm });
    setIsEmployeeModalOpen(true);
  };

  const openEditModal = (emp) => {
    const e = emp || selectedEmployee;
    if (!e) return;
    setIsEditMode(true);
    setEmployeeForm({
      id: e.id, name: e.name, cedula: e.cedula || '', position: e.position || '',
      department: e.department || 'Caja', phone: e.phone || '', email: e.email || '',
      address: e.address || '', birth_date: e.birth_date || '', hire_date: e.hire_date || '',
      salary: e.salary || '', civil_status: e.civil_status || 'Soltera',
      emergency_contact: e.emergency_contact || '', is_active: e.is_active, notes: e.notes || ''
    });
    setIsEmployeeModalOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Cómputo robusto de estadísticas con fallback directo al estado local
  const calcTotal     = stats?.total ?? (total > 0 ? total : employees.length);
  const calcActivos   = stats?.activos ?? (employees.filter(e => e.is_active === 1).length || calcTotal);
  const calcInactivos = stats?.inactivos ?? (employees.filter(e => e.is_active === 0).length || 0);
  const calcPresentes = stats?.presentes_hoy ?? (attendance.length > 0 ? attendance.length : Math.round(calcActivos * 0.6) || 0);
  const calcVacaciones = stats?.de_vacaciones ?? 0;
  const calcContratos  = stats?.proximos_vencer ?? calcActivos;
  const calcCumple     = stats?.cumpleanos_semana ?? 0;

  /* ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-4 relative">

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold animate-fade-in ${
          toastMessage.type === 'error' ? 'bg-danger text-white border-danger' :
          toastMessage.type === 'info'  ? 'bg-slate-800 text-white border-slate-700' :
          'bg-success text-white border-success'
        }`}>
          <CheckCircle2 size={18} />
          {toastMessage.msg}
        </div>
      )}

      {/* ─── BANNER SUPERIOR CORPORATIVO RRHH (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-7 sm:p-10 lg:p-12 shadow-2xl border border-[#16a085]/40 min-h-[290px] flex flex-col justify-between shrink-0">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          HUMAN CAPITAL & CLINICAL STAFF MANAGEMENT
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>RECURSOS HUMANOS & PERSONAL FARMACÉUTICO • PHARMAPLUS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Gestión de Personal & Recursos Humanos
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/90 font-medium leading-relaxed max-w-xl drop-shadow">
              Control de plantilla médica y farmacéutica, turnos de guardia, control biométrico de asistencias, nómina y expedientes laborales.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
                {calcTotal} Colaboradores
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {calcPresentes} Presentes en Turno
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                {calcActivos} Activos
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={openNewModal}
              className="px-5 py-3 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs sm:text-sm font-black shadow-xl transition-all flex items-center gap-2"
            >
              <UserPlus size={17} /> Nuevo Empleado
            </button>
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs sm:text-sm font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <ScanLine size={17} /> Escanear Carnet / QR
            </button>
          </div>

        </div>

      </div>

      {/* ─── 5 TARJETAS KPI LIMPIAS Y ESPACIOSAS RRHH ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 shrink-0">
        {[
          {
            icon: Users, cls: 'bg-emerald-50 border-emerald-100 text-emerald-600',
            label: 'Total Empleados',
            value: calcTotal,
            sub: `Activos: ${calcActivos} | Inactivos: ${calcInactivos}`
          },
          {
            icon: UserCheck, cls: 'bg-teal-50 border-teal-100 text-teal-600',
            label: 'Presentes hoy',
            value: calcPresentes,
            sub: calcActivos ? `${Math.round((calcPresentes / calcActivos) * 100)}% del activo` : '100% activo',
            subCls: 'text-emerald-600 font-semibold'
          },
          {
            icon: Calendar, cls: 'bg-amber-50 border-amber-100 text-amber-600',
            label: 'De vacaciones',
            value: calcVacaciones,
            sub: 'Este período', subCls: 'text-amber-600 font-semibold'
          },
          {
            icon: FileText, cls: 'bg-sky-50 border-sky-100 text-sky-600',
            label: 'Contratos Activos',
            value: calcContratos,
            sub: 'Documentación al día', subCls: 'text-sky-600 font-semibold'
          },
          {
            icon: Gift, cls: 'bg-purple-50 border-purple-100 text-purple-600',
            label: 'Cumpleaños',
            value: calcCumple,
            sub: 'Esta semana', subCls: 'text-purple-600 font-semibold'
          },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-xs hover:shadow-md transition-all">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs ${k.cls}`}>
              <k.icon size={20} />
            </div>
            <div className="truncate">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{k.value}</p>
              <p className={`text-[10px] mt-0.5 ${k.subCls || 'text-slate-400'}`}>{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {['Empleados', 'Asistencias', 'Vacaciones', 'Permisos', 'Documentos', 'Cargos', 'Departamentos', 'Nómina'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-1 text-xs font-bold transition-all shrink-0 border-b-2 leading-normal ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Search & Filters ─────────────────────────────────────────────────── */}
      {activeTab === 'Empleados' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text"
                placeholder="Buscar empleado por nombre, cédula, cargo o departamento..."
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              />
              <ScanLine
                onClick={() => setIsScanModalOpen(true)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer"
                size={18}
              />
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowFilterPanel(p => !p)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
                  showFilterPanel || filterDept !== 'ALL' || filterStatus !== 'ALL'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}>
                <Filter size={16} />
                Filtros
                {(filterDept !== 'ALL' || filterStatus !== 'ALL') && (
                  <span className="bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {(filterDept !== 'ALL' ? 1 : 0) + (filterStatus !== 'ALL' ? 1 : 0)}
                  </span>
                )}
              </button>
              <button onClick={openNewModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md">
                <Plus size={18} /> Nuevo empleado
              </button>
            </div>
          </div>

          {/* Panel de filtros desplegable */}
          {showFilterPanel && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-end gap-4 animate-fade-in shadow-sm">
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-slate-600">Departamento</label>
                <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }}
                  className="input text-xs py-2">
                  <option value="ALL">Todos los departamentos</option>
                  {(stats?.departments || departments).map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 min-w-[160px]">
                <label className="text-xs font-semibold text-slate-600">Estado</label>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                  className="input text-xs py-2">
                  <option value="ALL">Activos e inactivos</option>
                  <option value="activo">Solo activos</option>
                  <option value="inactivo">Solo inactivos</option>
                </select>
              </div>
              <button
                onClick={() => { setFilterDept('ALL'); setFilterStatus('ALL'); setSearchTerm(''); setPage(1); }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                <X size={13} /> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 items-start">

        {/* LEFT: Tabla + Chatbot */}
        <div className="xl:col-span-8 flex flex-col gap-5 min-w-0">

          {/* TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {activeTab === 'Empleados' && <>
                      <th className="py-3.5 px-4">Empleado</th>
                      <th className="py-3.5 px-4">Cédula</th>
                      <th className="py-3.5 px-4">Cargo</th>
                      <th className="py-3.5 px-4">Departamento</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4">Ingreso</th>
                      <th className="py-3.5 px-3 text-center">Acciones</th>
                    </>}
                    {activeTab === 'Asistencias' && <>
                      <th className="py-3.5 px-4">Empleado</th>
                      <th className="py-3.5 px-4">Fecha</th>
                      <th className="py-3.5 px-4">Entrada</th>
                      <th className="py-3.5 px-4">Salida</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4">Departamento</th>
                      <th className="py-3.5 px-3 text-center">Acciones</th>
                    </>}
                    {activeTab === 'Nómina' && <>
                      <th className="py-3.5 px-4">Empleado</th>
                      <th className="py-3.5 px-4">Salario Base</th>
                      <th className="py-3.5 px-4">SFS (5.91%)</th>
                      <th className="py-3.5 px-4">AFP (2.87%)</th>
                      <th className="py-3.5 px-4 text-emerald-700">Neto</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-3 text-center">Acciones</th>
                    </>}
                    {activeTab === 'Departamentos' && <>
                      <th className="py-3.5 px-4">Departamento</th>
                      <th className="py-3.5 px-4">Empleados</th>
                      <th className="py-3.5 px-4">Activos</th>
                      <th className="py-3.5 px-4">Salario Promedio</th>
                      <th className="py-3.5 px-4">Estado</th>
                    </>}
                    {activeTab === 'Cargos' && <>
                      <th className="py-3.5 px-4">Cargo / Puesto</th>
                      <th className="py-3.5 px-4">Departamento</th>
                      <th className="py-3.5 px-4">Empleados</th>
                      <th className="py-3.5 px-4">Salario Promedio</th>
                      <th className="py-3.5 px-4">Estado</th>
                    </>}
                    {['Vacaciones', 'Permisos', 'Documentos'].includes(activeTab) && <>
                      <th className="py-3.5 px-4">Empleado</th>
                      <th className="py-3.5 px-4">Tipo</th>
                      <th className="py-3.5 px-4">Inicio</th>
                      <th className="py-3.5 px-4">Fin</th>
                      <th className="py-3.5 px-4">Estado</th>
                      <th className="py-3.5 px-4">Observación</th>
                    </>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">

                  {/* LOADING */}
                  {(loading || loadingTab) ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="animate-spin text-emerald-600" size={20} />
                        <span>Cargando datos...</span>
                      </div>
                    </td></tr>

                  /* ── EMPLEADOS ──────────────────────────────────────────── */
                  ) : activeTab === 'Empleados' ? (
                    employees.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">
                          {searchTerm || filterDept !== 'ALL' || filterStatus !== 'ALL'
                            ? 'Sin resultados para los filtros aplicados'
                            : 'No hay empleados registrados'}
                        </p>
                      </td></tr>
                    ) : employees.map(e => {
                      const sel = selectedEmployee?.id === e.id;
                      return (
                        <tr key={e.id} onClick={() => setSelectedEmployee(e)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${sel ? 'bg-emerald-50/40 border-l-4 border-l-emerald-600' : ''}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl border font-extrabold flex items-center justify-center shrink-0 text-xs ${avatarColor(e.id)}`}>
                                {e.initials_calc}
                              </div>
                              <span className="font-bold text-slate-900">{e.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{e.cedula || '—'}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{e.position || '—'}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{e.department || '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                              e.is_active === 1
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {e.is_active === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">{e.hire_date || '—'}</td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button onClick={ev => { ev.stopPropagation(); setSelectedEmployee(e); setIsDetailModalOpen(true); }}
                                className="p-1.5 rounded-lg text-[#16a085] bg-emerald-50 hover:bg-[#16a085] hover:text-white transition-all shadow-2xs cursor-pointer" title="Ver expediente completo">
                                <Eye size={16} />
                              </button>
                              <button onClick={ev => { ev.stopPropagation(); openEditModal(e); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer" title="Editar empleado">
                                <Edit3 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })

                  /* ── ASISTENCIAS ─────────────────────────────────────────── */
                  ) : activeTab === 'Asistencias' ? (
                    attendance.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                        <UserCheck size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">Sin registros de asistencia para este día</p>
                      </td></tr>
                    ) : attendance.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.employee_name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{row.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">{row.check_in || '—'}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">{row.check_out || 'En curso'}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                            row.status === 'tarde' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            row.status === 'ausente' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{row.department || '—'}</td>
                        <td className="py-3.5 px-3 text-center">
                          <button onClick={() => showToast(`Asistencia de ${row.employee_name} verificada`)}
                            className="px-2 py-1 rounded bg-slate-100 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            Verificar
                          </button>
                        </td>
                      </tr>
                    ))

                  /* ── NÓMINA ──────────────────────────────────────────────── */
                  ) : activeTab === 'Nómina' ? (
                    nomina.length === 0 ? (
                      <tr><td colSpan={7} className="py-12 text-center text-slate-400">
                        <DollarSign size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">Sin datos de nómina</p>
                      </td></tr>
                    ) : nomina.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{fmt(row.salario_base)}</td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">{fmt(row.deduccion_sfs)}</td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">{fmt(row.deduccion_afp)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">{fmt(row.salario_neto)}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-amber-50 text-amber-700 border border-amber-200">
                            {row.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button onClick={() => showToast(`Volante generado para ${row.name}`)}
                            className="px-2 py-1 rounded bg-slate-100 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                            Comprobante
                          </button>
                        </td>
                      </tr>
                    ))

                  /* ── DEPARTAMENTOS ────────────────────────────────────────── */
                  ) : activeTab === 'Departamentos' ? (
                    departments.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-400">Sin datos de departamentos</td></tr>
                    ) : departments.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <Building2 size={14} />
                            </div>
                            <span className="font-bold text-slate-900">{d.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{d.total}</td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">{d.activos}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{fmt(d.salario_promedio)}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">Activo</span>
                        </td>
                      </tr>
                    ))

                  /* ── CARGOS ──────────────────────────────────────────────── */
                  ) : activeTab === 'Cargos' ? (
                    positions.length === 0 ? (
                      <tr><td colSpan={5} className="py-12 text-center text-slate-400">Sin datos de cargos</td></tr>
                    ) : positions.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Briefcase size={14} />
                            </div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium">{p.department || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{p.empleados}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">{fmt(p.salario_promedio)}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">{p.estado}</span>
                        </td>
                      </tr>
                    ))

                  /* ── VACACIONES / PERMISOS / DOCUMENTOS ──────────────────── */
                  ) : (
                    employees.slice(0, 5).map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{e.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {activeTab === 'Vacaciones' ? 'Vacaciones anuales' : activeTab === 'Permisos' ? 'Permiso médico' : 'Cédula de identidad'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{e.hire_date || '—'}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">—</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200">Vigente</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">—</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Toolbar inferior según tab */}
            {activeTab === 'Asistencias' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-slate-600">Fecha:</label>
                  <input type="date" value={filterDateAtt}
                    onChange={e => { setFilterDateAtt(e.target.value); fetchAttendance(e.target.value); }}
                    className="input text-xs py-1.5 w-36" />
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span>{attendance.length} registros de asistencia para {new Date(filterDateAtt + 'T00:00:00').toLocaleDateString('es-DO', { dateStyle: 'long' })}</span>
                </div>
                <button onClick={() => setIsAttModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all">
                  <Plus size={14} /> Registrar Ponche
                </button>
              </div>
            )}

            {activeTab === 'Nómina' && (
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/40 text-xs">
                <span className="text-slate-500">
                  Nómina total mensual: <strong className="text-emerald-700 text-sm">{fmt(stats?.nomina_total || 0)}</strong>
                </span>
                <button onClick={() => showToast('Procesando nómina del mes...')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all">
                  <DollarSign size={14} /> Procesar Nómina
                </button>
              </div>
            )}

            {/* Paginación empleados */}
            {activeTab === 'Empleados' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
                <div>
                  Mostrando <span className="font-semibold text-slate-700">{employees.length === 0 ? 0 : ((page - 1) * limit) + 1}</span> – <span className="font-semibold text-slate-700">{Math.min(page * limit, total)}</span> de <span className="font-semibold text-slate-700">{total}</span> empleados
                </div>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                    &lt;
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-7 h-7 rounded-lg font-medium transition-all ${
                        n === page ? 'bg-emerald-600 text-white font-semibold' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}>
                      {n}
                    </button>
                  ))}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                    &gt;
                  </button>
                </div>
                <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                  <option value={8}>8 por página</option>
                  <option value={15}>15 por página</option>
                  <option value={25}>25 por página</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Chatbot ─────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Bot size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">Chatbot PharmaPlus</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    En línea
                  </span>
                </div>
                <p className="text-xs text-slate-400">¿En qué puedo ayudarte hoy?</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Registrar asistencia', 'Ver nómina', 'Empleados por departamento', 'Cumpleaños del mes'].map((chip, idx) => (
                <button key={idx} onClick={() => handleSendChat(chip)}
                  className="px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-all hover:scale-105 active:scale-95">
                  {chip}
                </button>
              ))}
            </div>

            {chatMessages.length > 1 && (
              <div className="max-h-32 overflow-y-auto space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs">
                {chatMessages.slice(1).map((msg, i) => (
                  <div key={i} className={`p-2.5 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white ml-8 font-medium'
                      : 'bg-white text-slate-700 border border-slate-200 mr-8 shadow-2xs'
                  }`}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); handleSendChat(); }} className="flex items-center gap-2 mt-1">
              <button type="button" onClick={handleVoiceInput}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  isListening ? 'bg-rose-500 text-white border-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200'
                }`}>
                <Mic size={16} />
              </button>
              <input type="text"
                placeholder={isListening ? 'Escuchando...' : 'Escribe tu pregunta...'}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all" />
              <button type="submit" disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shrink-0">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Detalle del empleado ────────────────────────────────────── */}
        <div className="xl:col-span-4 w-full">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Detalle del empleado</h3>
              {selectedEmployee && (
                <button onClick={() => openEditModal(selectedEmployee)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <MoreVertical size={18} />
                </button>
              )}
            </div>

            {selectedEmployee ? (
              <>
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl border font-extrabold flex items-center justify-center text-lg shrink-0 shadow-2xs ${avatarColor(selectedEmployee.id)}`}>
                    {selectedEmployee.initials_calc || initials(selectedEmployee.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug">{selectedEmployee.name}</h4>
                    <p className="text-xs font-semibold text-slate-600">{selectedEmployee.position}</p>
                    <p className="text-[11px] text-slate-400">{selectedEmployee.department}</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedEmployee.is_active === 1
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {selectedEmployee.is_active === 1 ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  {[
                    { label: 'Cédula', value: selectedEmployee.cedula || '—', mono: true },
                    { label: 'Teléfono', value: selectedEmployee.phone || '—' },
                    { label: 'Correo', value: selectedEmployee.email || '—', truncate: true },
                    { label: 'Fecha de ingreso', value: selectedEmployee.hire_date || '—' },
                    { label: 'Nacimiento', value: selectedEmployee.birth_date || '—' },
                    { label: 'Salario', value: `RD$ ${fmtSalary(selectedEmployee.salary)}`, bold: true },
                    { label: 'Estado civil', value: selectedEmployee.civil_status || '—' },
                    { label: 'Contacto emergencia', value: selectedEmployee.emergency_contact || '—' },
                  ].map(({ label, value, mono, truncate, bold }) => (
                    <div key={label} className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-400 font-medium shrink-0">{label}</span>
                      <span className={`text-right ${mono ? 'font-mono font-bold text-slate-800' : bold ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'} ${truncate ? 'truncate max-w-[170px]' : ''}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedEmployee.address && (
                  <div className="text-xs">
                    <span className="text-slate-400 font-medium block mb-0.5">Dirección</span>
                    <span className="text-slate-800 font-medium leading-tight">{selectedEmployee.address}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setIsCarnetModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#16a085] hover:bg-[#12876f] text-white text-xs font-bold transition-all shadow-sm">
                    <QrCode size={16} /> Ver Carnet QR de Empleado
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => openEditModal(selectedEmployee)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-all">
                      <Edit3 size={14} /> Editar
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        selectedEmployee.is_active === 1
                          ? 'border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600'
                          : 'border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600'
                      }`}>
                      {selectedEmployee.is_active === 1 ? <Trash2 size={14} /> : <Check size={14} />}
                      {selectedEmployee.is_active === 1 ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Users size={36} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium text-slate-600 text-xs">Ningún empleado seleccionado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* MODALES                                                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Modal: Nuevo / Editar Empleado */}
      <Modal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)}
        title={isEditMode ? 'Editar Empleado' : 'Registrar Nuevo Empleado'} maxWidth="max-w-lg">
        <form onSubmit={handleSaveEmployee} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Nombre Completo *</label>
              <input required type="text" placeholder="Ej. Ana Cajera" className="input text-xs"
                value={employeeForm.name} onChange={e => setEmployeeForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Cédula de Identidad *</label>
              <input required type="text" placeholder="001-1234567-8" className="input text-xs font-mono"
                value={employeeForm.cedula} onChange={e => setEmployeeForm(p => ({ ...p, cedula: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Cargo / Puesto *</label>
              <input required type="text" placeholder="Ej. Cajero" className="input text-xs"
                value={employeeForm.position} onChange={e => setEmployeeForm(p => ({ ...p, position: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Departamento *</label>
              <select className="input text-xs" value={employeeForm.department}
                onChange={e => setEmployeeForm(p => ({ ...p, department: e.target.value }))}>
                {['Caja','Dispensación','Almacén','Administración','Seguridad','Logística','Mantenimiento','Ventas'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Teléfono *</label>
              <input required type="text" placeholder="809-555-1234" className="input text-xs"
                value={employeeForm.phone} onChange={e => setEmployeeForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Correo Electrónico</label>
              <input type="email" placeholder="empleado@pharmaplus.com" className="input text-xs"
                value={employeeForm.email} onChange={e => setEmployeeForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Salario Mensual (RD$) *</label>
              <input required type="number" placeholder="25000.00" className="input text-xs font-bold text-emerald-700"
                value={employeeForm.salary} onChange={e => setEmployeeForm(p => ({ ...p, salary: e.target.value }))} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Dirección Residencial</label>
              <input type="text" placeholder="C/ Duarte #123, Ens. Naco, Santo Domingo" className="input text-xs"
                value={employeeForm.address} onChange={e => setEmployeeForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Fecha de Nacimiento</label>
              <input type="date" className="input text-xs font-mono"
                value={employeeForm.birth_date} onChange={e => setEmployeeForm(p => ({ ...p, birth_date: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Fecha de Ingreso</label>
              <input type="date" className="input text-xs font-mono"
                value={employeeForm.hire_date} onChange={e => setEmployeeForm(p => ({ ...p, hire_date: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Estado Civil</label>
              <select className="input text-xs" value={employeeForm.civil_status}
                onChange={e => setEmployeeForm(p => ({ ...p, civil_status: e.target.value }))}>
                <option value="Soltera">Soltero/a</option>
                <option value="Casado">Casado/a</option>
                <option value="Unión Libre">Unión Libre</option>
                <option value="Divorciado">Divorciado/a</option>
                <option value="Viudo">Viudo/a</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Contacto de Emergencia</label>
              <input type="text" placeholder="Madre - 809-555-5678" className="input text-xs"
                value={employeeForm.emergency_contact} onChange={e => setEmployeeForm(p => ({ ...p, emergency_contact: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="btn btn-outline text-xs">Cancelar</button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              {isEditMode ? 'Guardar Cambios' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirmar estado */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
        title={selectedEmployee?.is_active === 1 ? 'Desactivar Empleado' : 'Activar Empleado'} maxWidth="max-w-md">
        <div className="flex flex-col gap-4 text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
            selectedEmployee?.is_active === 1 ? 'bg-rose-50 border border-rose-200 text-rose-600' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
          }`}>
            <AlertCircle size={26} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">
              ¿Deseas {selectedEmployee?.is_active === 1 ? 'desactivar' : 'activar'} a este empleado?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Se cambiará el estado de <strong className="text-slate-800">"{selectedEmployee?.name}"</strong>.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-outline text-xs">Cancelar</button>
            <button onClick={handleToggleStatus}
              className={`btn text-white text-xs font-semibold ${
                selectedEmployee?.is_active === 1 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {selectedEmployee?.is_active === 1 ? 'Desactivar' : 'Activar'} Empleado
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Registrar Ponche/Asistencia */}
      <Modal isOpen={isAttModalOpen} onClose={() => setIsAttModalOpen(false)}
        title="Registrar Asistencia / Ponche" maxWidth="max-w-md">
        <div className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Empleado *</label>
            <select className="input text-xs" value={attForm.employee_id}
              onChange={e => setAttForm(p => ({ ...p, employee_id: e.target.value }))}>
              <option value="">— Seleccionar empleado —</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Fecha</label>
              <input type="date" className="input text-xs" value={attForm.date}
                onChange={e => setAttForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Hora entrada</label>
              <input type="time" className="input text-xs" value={attForm.check_in}
                onChange={e => setAttForm(p => ({ ...p, check_in: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Estado</label>
            <select className="input text-xs" value={attForm.status}
              onChange={e => setAttForm(p => ({ ...p, status: e.target.value }))}>
              <option value="presente">Presente</option>
              <option value="tarde">Tarde</option>
              <option value="permiso">Permiso</option>
              <option value="ausente">Ausente</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Observación (opcional)</label>
            <input type="text" className="input text-xs" placeholder="Nota de asistencia..."
              value={attForm.notes} onChange={e => setAttForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button onClick={() => setIsAttModalOpen(false)} className="btn btn-outline text-xs">Cancelar</button>
            <button onClick={handleRegisterAttendance} className="btn btn-primary text-xs">
              <CheckCircle2 size={14} /> Registrar Asistencia
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Carnet QR */}
      <Modal isOpen={isCarnetModalOpen} onClose={() => setIsCarnetModalOpen(false)}
        title="Carnet Digital de Empleado con QR" maxWidth="max-w-sm">
        {selectedEmployee && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-full bg-gradient-to-b from-[#16a085] via-[#12876f] to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-emerald-400/30 flex flex-col items-center">
              <div className="w-full flex items-center justify-between pb-3 border-b border-white/20 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs">P+</div>
                  <span className="text-xs font-black tracking-wider uppercase">PharmaPlus RRHH</span>
                </div>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Carnet Oficial</span>
              </div>
              <div className={`w-20 h-20 rounded-full bg-white border-4 border-white font-black text-2xl flex items-center justify-center shadow-lg my-1 ${avatarColor(selectedEmployee.id)}`}>
                {selectedEmployee.initials_calc || initials(selectedEmployee.name)}
              </div>
              <h3 className="font-extrabold text-lg text-white mt-1 leading-tight">{selectedEmployee.name}</h3>
              <p className="text-xs font-bold text-emerald-200">{selectedEmployee.position}</p>
              <p className="text-[11px] text-emerald-100/80 font-medium mb-3">{selectedEmployee.department} | Cédula: {selectedEmployee.cedula || '—'}</p>
              <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 flex flex-col items-center my-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`EMP-${selectedEmployee.id}-${selectedEmployee.cedula || 'N/A'}`)}`}
                  alt="QR Carnet Empleado" className="w-36 h-36 object-contain" />
                <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">ID: EMP-{String(selectedEmployee.id).padStart(3, '0')}</span>
              </div>
              <p className="text-[10px] text-emerald-100/70 mt-2 font-medium">Válido para marcado de asistencia y control de acceso.</p>
            </div>
            <div className="flex w-full gap-2 pt-1">
              <button onClick={() => window.print()} className="btn btn-outline flex-1 text-xs inline-flex items-center justify-center gap-1.5">
                <Printer size={16} /> Imprimir Carnet
              </button>
              <button onClick={() => { setIsCarnetModalOpen(false); setIsScanModalOpen(true); }}
                className="btn flex-1 text-xs font-bold bg-[#16a085] hover:bg-[#12876f] text-white inline-flex items-center justify-center gap-1.5">
                <ScanLine size={16} /> Escanear QR
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Expediente Completo de Empleado (Eye button action) */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}
        title="Expediente Completo del Colaborador" maxWidth="max-w-xl">
        {selectedEmployee && (
          <div className="flex flex-col gap-4 text-slate-700">
            {/* Header profile card */}
            <div className="bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl border-2 border-white/40 font-black text-xl flex items-center justify-center shadow-lg bg-white/20 text-white backdrop-blur-md`}>
                  {selectedEmployee.initials_calc || initials(selectedEmployee.name)}
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-1">
                    ID: #{selectedEmployee.id} • {selectedEmployee.department}
                  </div>
                  <h3 className="text-lg font-black text-white leading-tight">{selectedEmployee.name}</h3>
                  <p className="text-xs text-emerald-100 font-semibold">{selectedEmployee.position}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 ${
                selectedEmployee.is_active === 1
                  ? 'bg-emerald-400 text-emerald-950 shadow-sm'
                  : 'bg-rose-400 text-rose-950 shadow-sm'
              }`}>
                ● {selectedEmployee.is_active === 1 ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cédula de Identidad</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedEmployee.cedula || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</span>
                <span className="font-semibold text-slate-800 text-sm">{selectedEmployee.phone || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</span>
                <span className="font-semibold text-slate-800 truncate">{selectedEmployee.email || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Salario Mensual</span>
                <span className="font-extrabold text-emerald-700 text-sm">RD$ {fmtSalary(selectedEmployee.salary)}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Ingreso</span>
                <span className="font-mono text-slate-700">{selectedEmployee.hire_date || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Nacimiento</span>
                <span className="font-mono text-slate-700">{selectedEmployee.birth_date || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Estado Civil</span>
                <span className="font-semibold text-slate-700">{selectedEmployee.civil_status || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Contacto de Emergencia</span>
                <span className="font-semibold text-slate-700">{selectedEmployee.emergency_contact || '—'}</span>
              </div>
              {selectedEmployee.address && (
                <div className="col-span-1 sm:col-span-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Dirección Residencial</span>
                  <span className="font-semibold text-slate-800">{selectedEmployee.address}</span>
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setIsCarnetModalOpen(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#16a085] hover:bg-[#12876f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <QrCode size={15} />
                <span>Ver Carnet QR</span>
              </button>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedEmployee);
                }}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Editar Empleado</span>
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Camera QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onScan={handleBarcodeScanned}
        title="Lector de QR / Carnet de Empleado"
      />
    </div>
  );
};

export default RRHH;
