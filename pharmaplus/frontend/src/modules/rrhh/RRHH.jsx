import React, { useState, useEffect, useContext } from 'react';
import { 
  Users, UserCheck, Calendar, FileText, Gift, Plus, Search, Filter, 
  ScanLine, Eye, Edit3, Trash2, CheckCircle2, XCircle, Phone, Mail, 
  MapPin, DollarSign, Heart, ShieldAlert, ChevronRight, ChevronLeft, 
  Bot, Send, Sparkles, RefreshCw, MoreVertical, AlertCircle, Check, Mic, 
  Briefcase, Building2, UserPlus, Clock
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const RRHH = () => {
  const { user } = useContext(AuthContext);

  // Employees List & Selection State
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Empleados'); // 'Empleados', 'Asistencias', 'Vacaciones', 'Permisos', 'Documentos', 'Cargos', 'Departamentos', 'Nómina'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(0);

  // Modals State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State (New / Edit Employee)
  const [employeeForm, setEmployeeForm] = useState({
    id: null,
    name: '',
    initials: 'AC',
    cedula: '',
    position: 'Cajero',
    department: 'Caja',
    phone: '',
    email: '',
    address: 'C/ Duarte #123, Ens. Naco, Santo Domingo',
    birth_date: '15/06/1995',
    hire_date: '12/01/2023',
    salary: '25000.00',
    civil_status: 'Soltera',
    emergency_contact: 'Madre - 809-555-5678',
    is_active: 1,
    notes: ''
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a registrar asistencias, consultar vacaciones del equipo o gestionar el expediente de empleados.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Toast Notification Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Mock Data matching exact reference image
  const sampleEmployees = [
    {
      id: 1,
      name: 'Ana Cajera',
      initials: 'AC',
      cedula: '001-1234567-8',
      position: 'Cajero',
      department: 'Caja',
      phone: '809-555-1234',
      email: 'ana.cajera@pharmaplus.com',
      address: 'C/ Duarte #123, Ens. Naco, Santo Domingo',
      birth_date: '15/06/1995',
      hire_date: '12/01/2023',
      salary: '25,000.00',
      civil_status: 'Soltera',
      emergency_contact: 'Madre - 809-555-5678',
      is_active: 1,
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
        { name: 'Certificado médico', status: 'Vigente', badge: 'emerald' },
        { name: 'Carta de no antecedentes', status: 'Vigente', badge: 'emerald' },
        { name: 'Contrato laboral', status: 'Vence: 12/01/2025', badge: 'amber' }
      ]
    },
    {
      id: 2,
      name: 'Juan Martínez',
      initials: 'JM',
      cedula: '001-2345678-9',
      position: 'Farmacéutico',
      department: 'Dispensación',
      phone: '809-555-2345',
      email: 'juan.martinez@pharmaplus.com',
      address: 'Av. 27 de Febrero #45, Santo Domingo',
      birth_date: '20/08/1988',
      hire_date: '05/03/2022',
      salary: '45,000.00',
      civil_status: 'Casado',
      emergency_contact: 'Esposa - 809-555-9876',
      is_active: 1,
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
        { name: 'Exequatur médico/CMP', status: 'Vigente', badge: 'emerald' },
        { name: 'Contrato laboral', status: 'Vigente', badge: 'emerald' }
      ]
    },
    {
      id: 3,
      name: 'Laura Rodríguez',
      initials: 'LR',
      cedula: '001-3456789-0',
      position: 'Aux. de Farmacia',
      department: 'Dispensación',
      phone: '809-555-3456',
      email: 'laura.rodriguez@pharmaplus.com',
      address: 'Av. Luperón #88, Santo Domingo',
      birth_date: '10/11/1997',
      hire_date: '18/07/2022',
      salary: '28,000.00',
      civil_status: 'Soltera',
      emergency_contact: 'Padre - 809-555-4321',
      is_active: 1,
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
        { name: 'Contrato laboral', status: 'Vigente', badge: 'emerald' }
      ]
    },
    {
      id: 4,
      name: 'Carlos Pérez',
      initials: 'CP',
      cedula: '001-4567890-1',
      position: 'Almacén',
      department: 'Almacén',
      phone: '809-555-4567',
      email: 'carlos.perez@pharmaplus.com',
      address: 'C/ San Martín #12, Santo Domingo',
      birth_date: '05/04/1992',
      hire_date: '22/02/2023',
      salary: '26,000.00',
      civil_status: 'Casado',
      emergency_contact: 'Hermano - 809-555-6543',
      is_active: 1,
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
        { name: 'Contrato laboral', status: 'Vigente', badge: 'emerald' }
      ]
    },
    {
      id: 5,
      name: 'María González',
      initials: 'MG',
      cedula: '001-5678901-2',
      position: 'Administrativo',
      department: 'Administración',
      phone: '809-555-5678',
      email: 'maria.gonzalez@pharmaplus.com',
      address: 'Av. Independencia #200, Santo Domingo',
      birth_date: '14/02/1990',
      hire_date: '10/11/2021',
      salary: '50,000.00',
      civil_status: 'Soltera',
      emergency_contact: 'Madre - 809-555-8765',
      is_active: 1,
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
        { name: 'Título universitario', status: 'Vigente', badge: 'emerald' }
      ]
    },
    {
      id: 6,
      name: 'Roberto Sánchez',
      initials: 'RS',
      cedula: '001-6789012-3',
      position: 'Seguridad',
      department: 'Seguridad',
      phone: '809-555-6789',
      email: 'roberto.sanchez@pharmaplus.com',
      address: 'C/ Barahona #5, Santo Domingo',
      birth_date: '30/09/1985',
      hire_date: '15/05/2021',
      salary: '22,000.00',
      civil_status: 'Casado',
      emergency_contact: 'Esposa - 809-555-7654',
      is_active: 0, // Inactivo
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' }
      ]
    },
    {
      id: 7,
      name: 'Daniel López',
      initials: 'DL',
      cedula: '001-7890123-4',
      position: 'Mensajero',
      department: 'Logística',
      phone: '809-555-7890',
      email: 'daniel.lopez@pharmaplus.com',
      address: 'Av. Charles de Gaulle #30, Santo Domingo',
      birth_date: '18/12/1996',
      hire_date: '01/09/2022',
      salary: '22,000.00',
      civil_status: 'Soltero',
      emergency_contact: 'Padre - 809-555-8901',
      is_active: 1,
      documents: [
        { name: 'Licencia de conducir', status: 'Vigente', badge: 'emerald' }
      ]
    },
    {
      id: 8,
      name: 'Elena Cruz',
      initials: 'EC',
      cedula: '001-8901234-5',
      position: 'Limpieza',
      department: 'Mantenimiento',
      phone: '809-555-8901',
      email: 'elena.cruz@pharmaplus.com',
      address: 'C/ Espaillat #40, Santo Domingo',
      birth_date: '25/07/1989',
      hire_date: '20/06/2023',
      salary: '20,000.00',
      civil_status: 'Casada',
      emergency_contact: 'Esposo - 809-555-9012',
      is_active: 1,
      documents: [
        { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' }
      ]
    }
  ];

  // Fetch Employees Data
  const fetchEmployeesData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rrhh?limit=100');
      let list = sampleEmployees;

      if (res.success && res.data && res.data.length > 0) {
        list = res.data.map((e) => {
          const initials = e.name ? e.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AC';
          return {
            id: e.id,
            name: e.name,
            initials: initials,
            cedula: e.cedula || '001-1234567-8',
            position: e.position || 'Cajero',
            department: e.department || 'Caja',
            phone: e.phone || '809-555-1234',
            email: e.email || 'ana.cajera@pharmaplus.com',
            address: e.address || 'C/ Duarte #123, Ens. Naco, Santo Domingo',
            birth_date: e.birth_date || '15/06/1995',
            hire_date: e.hire_date || '12/01/2023',
            salary: e.salary ? parseFloat(e.salary).toLocaleString('es-DO', { minimumFractionDigits: 2 }) : '25,000.00',
            civil_status: e.civil_status || 'Soltera',
            emergency_contact: e.emergency_contact || 'Madre - 809-555-5678',
            is_active: e.is_active !== undefined ? e.is_active : 1,
            documents: [
              { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
              { name: 'Certificado médico', status: 'Vigente', badge: 'emerald' },
              { name: 'Carta de no antecedentes', status: 'Vigente', badge: 'emerald' },
              { name: 'Contrato laboral', status: 'Vence: 12/01/2025', badge: 'amber' }
            ]
          };
        });
      }

      // Filter Search
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(e =>
          e.name.toLowerCase().includes(lower) ||
          e.cedula.toLowerCase().includes(lower) ||
          e.position.toLowerCase().includes(lower) ||
          e.department.toLowerCase().includes(lower)
        );
      }

      setEmployees(list);
      setTotal(list.length);

      if (list.length > 0) {
        if (!selectedEmployee || !list.some(e => e.id === selectedEmployee.id)) {
          setSelectedEmployee(list[0]);
        }
      } else {
        setSelectedEmployee(null);
      }

    } catch (err) {
      console.error('Error cargando empleados:', err);
      setEmployees(sampleEmployees);
      setSelectedEmployee(sampleEmployees[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, [activeTab, page, limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployeesData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Open New Employee Modal
  const openNewEmployeeModal = () => {
    setIsEditMode(false);
    setEmployeeForm({
      id: null,
      name: '',
      initials: 'AC',
      cedula: '',
      position: 'Cajero',
      department: 'Caja',
      phone: '',
      email: '',
      address: 'C/ Duarte #123, Ens. Naco, Santo Domingo',
      birth_date: '15/06/1995',
      hire_date: '12/01/2023',
      salary: '25000.00',
      civil_status: 'Soltera',
      emergency_contact: 'Madre - 809-555-5678',
      is_active: 1,
      notes: ''
    });
    setIsEmployeeModalOpen(true);
  };

  // Open Edit Employee Modal
  const openEditEmployeeModal = (emp) => {
    const e = emp || selectedEmployee;
    if (!e) return;
    setIsEditMode(true);
    setEmployeeForm({
      id: e.id,
      name: e.name,
      initials: e.initials,
      cedula: e.cedula,
      position: e.position,
      department: e.department,
      phone: e.phone,
      email: e.email,
      address: e.address,
      birth_date: e.birth_date,
      hire_date: e.hire_date,
      salary: e.salary.replace(/,/g, ''),
      civil_status: e.civil_status,
      emergency_contact: e.emergency_contact,
      is_active: e.is_active,
      notes: e.notes || ''
    });
    setIsEmployeeModalOpen(true);
  };

  // Save Employee Submit Handler
  const handleSaveEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const initialsCalc = employeeForm.name
        ? employeeForm.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'AC';

      const formattedSalary = parseFloat(employeeForm.salary || '0').toLocaleString('es-DO', { minimumFractionDigits: 2 });

      const payload = {
        name: employeeForm.name,
        cedula: employeeForm.cedula,
        position: employeeForm.position,
        department: employeeForm.department,
        phone: employeeForm.phone,
        email: employeeForm.email,
        salary: parseFloat(employeeForm.salary || '0')
      };

      if (isEditMode) {
        try {
          await api.put(`/rrhh/${employeeForm.id}`, payload);
        } catch (err) {}

        const updated = {
          ...selectedEmployee,
          ...employeeForm,
          initials: initialsCalc,
          salary: formattedSalary
        };

        setEmployees(prev => prev.map(emp => emp.id === employeeForm.id ? updated : emp));
        setSelectedEmployee(updated);
        showToast(`Empleado "${employeeForm.name}" actualizado con éxito`);
      } else {
        try {
          await api.post('/rrhh', payload);
        } catch (err) {}

        const newEmp = {
          ...employeeForm,
          id: Date.now(),
          initials: initialsCalc,
          salary: formattedSalary,
          documents: [
            { name: 'Cédula de identidad', status: 'Vigente', badge: 'emerald' },
            { name: 'Contrato laboral', status: 'Vigente', badge: 'emerald' }
          ]
        };
        setEmployees(prev => [newEmp, ...prev]);
        setSelectedEmployee(newEmp);
        showToast(`Nuevo empleado "${employeeForm.name}" registrado correctamente`);
      }
      setIsEmployeeModalOpen(false);
    } catch (err) {
      showToast('Error al guardar el empleado', 'warning');
    }
  };

  // Toggle Deactivate / Activate Employee
  const handleToggleDeactivate = async () => {
    if (!selectedEmployee) return;
    try {
      const newStatus = selectedEmployee.is_active === 1 ? 0 : 1;
      try {
        await api.put(`/rrhh/${selectedEmployee.id}`, { is_active: newStatus });
      } catch (err) {}

      const updated = { ...selectedEmployee, is_active: newStatus };
      setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? updated : e));
      setSelectedEmployee(updated);
      setIsDeleteModalOpen(false);
      showToast(`Empleado "${selectedEmployee.name}" ${newStatus === 0 ? 'desactivado' : 'activado'} exitosamente`, 'info');
    } catch (err) {
      showToast('Error cambiando estado del empleado', 'warning');
    }
  };

  // Voice Recognition Handler
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setChatInput('Registrar asistencia');
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

  // Chatbot Send Message Handler
  const handleSendChatMessage = async (queryText) => {
    const text = queryText || chatInput;
    if (!text.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setChatLoading(true);

    const lower = text.toLowerCase();
    if (lower.includes('nuevo empleado')) {
      openNewEmployeeModal();
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he abierto el formulario para registrar un nuevo empleado.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('registrar asistencia')) {
      showToast('Asistencia de Ana Cajera registrada a las 08:00 a.m.');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: '¡Asistencia marcada! Se ha registrado el ponchado de entrada para Ana Cajera.'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta de RRHH procesada.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: `Asistente de RRHH: Tienes ${employees.length} empleados en la plantilla activa.`
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
            src="/modules/clientes.png" 
            alt="RRHH" 
            className="w-14 h-14 rounded-2xl object-cover border border-emerald-100 shadow-sm shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recursos Humanos (RR. HH.)</h1>
              <span className="bg-emerald-50 text-[#16a085] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Gestión de Personal
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Gestión de empleados, control de asistencia, turnos de trabajo, nómina y vacaciones</p>
          </div>
        </div>
      </div>

      {/* ─── TOP 5 KPI STAT CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Empleados */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Empleados</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">28</p>
            <p className="text-[10px] font-medium text-slate-400">Activos: 24 | Inactivos: 4</p>
          </div>
        </div>

        {/* Card 2: Presentes hoy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Presentes hoy</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">20</p>
            <p className="text-[10px] font-medium text-emerald-600">71% del total</p>
          </div>
        </div>

        {/* Card 3: De vacaciones */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">De vacaciones</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">3</p>
            <p className="text-[10px] font-medium text-amber-600">Este mes</p>
          </div>
        </div>

        {/* Card 4: Próximos a vencer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Próximos a vencer</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">2</p>
            <p className="text-[10px] font-medium text-sky-600">Documentos</p>
          </div>
        </div>

        {/* Card 5: Cumpleaños */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Gift size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Cumpleaños</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">1</p>
            <p className="text-[10px] font-medium text-purple-600">Esta semana</p>
          </div>
        </div>

      </div>

      {/* ─── TABS BAR ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {['Empleados', 'Asistencias', 'Vacaciones', 'Permisos', 'Documentos', 'Cargos', 'Departamentos', 'Nómina'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 px-1 text-xs font-bold transition-all shrink-0 border-b-2 leading-normal ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── SEARCH & ACTION BAR ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-96 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar empleado por nombre, cédula o puesto..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
          />
          <ScanLine 
            onClick={() => setIsScanModalOpen(true)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 cursor-pointer transition-colors" 
            size={18} 
            title="Escanear carnet de empleado" 
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => showToast('Filtros de RRHH activos', 'info')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Filter size={18} />
            <span>Filtros</span>
          </button>

          <button
            onClick={openNewEmployeeModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Nuevo empleado</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID (2 COLUMNS) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* LEFT COLUMN: TABLE + CHATBOT (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* EMPLOYEES TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Empleado</th>
                    <th className="py-3.5 px-4">Cédula</th>
                    <th className="py-3.5 px-4">Cargo</th>
                    <th className="py-3.5 px-4">Departamento</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Ingreso</th>
                    <th className="py-3.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                          <span>Cargando plantilla de empleados...</span>
                        </div>
                      </td>
                    </tr>
                  ) : employees.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">No se encontraron empleados</p>
                      </td>
                    </tr>
                  ) : activeTab === 'Empleados' ? (
                    employees.map((e) => {
                      const isSelected = selectedEmployee?.id === e.id;

                      return (
                        <tr
                          key={e.id}
                          onClick={() => setSelectedEmployee(e)}
                          className={`cursor-pointer transition-colors group hover:bg-slate-50/80 ${
                            isSelected ? 'bg-emerald-50/40 border-l-4 border-l-emerald-600' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-extrabold flex items-center justify-center shrink-0 text-xs">
                                {e.initials}
                              </div>
                              <span className="font-bold text-slate-900 leading-snug">{e.name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{e.cedula}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">{e.position}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">{e.department}</td>
                          <td className="py-3.5 px-4">
                            {e.is_active === 1 ? (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">{e.hire_date}</td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(evt) => { evt.stopPropagation(); setSelectedEmployee(e); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Ver detalle"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={(evt) => { evt.stopPropagation(); openEditEmployeeModal(e); }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Editar empleado"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : activeTab === 'Asistencias' ? (
                    [
                      { name: 'Ana Cajera', date: '11/08/2026', in: '08:00 AM', out: '05:00 PM', status: 'Presente' },
                      { name: 'Juan Martínez', date: '11/08/2026', in: '08:05 AM', out: 'En curso', status: 'Presente' },
                      { name: 'Laura Rodríguez', date: '11/08/2026', in: '08:30 AM', out: 'En curso', status: 'Tarde' },
                      { name: 'Carlos Pérez', date: '11/08/2026', in: '07:55 AM', out: 'En curso', status: 'Presente' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{row.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">{row.in}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-600">{row.out}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                            row.status === 'Tarde' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">---</td>
                        <td className="py-3.5 px-3 text-center">
                          <button onClick={() => showToast(`Asistencia de ${row.name} verificada`)} className="px-2 py-1 rounded bg-slate-100 font-semibold text-slate-700">Verificarse</button>
                        </td>
                      </tr>
                    ))
                  ) : activeTab === 'Vacaciones' ? (
                    [
                      { name: 'Roberto Sánchez', days: '10 Días', start: '01/08/2026', end: '11/08/2026', status: 'En curso' },
                      { name: 'María González', days: '14 Días', start: '15/09/2026', end: '29/09/2026', status: 'Aprobada' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">{row.days}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{row.start}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{row.end}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-50 text-sky-700 border border-sky-200">{row.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">---</td>
                        <td className="py-3.5 px-3 text-center">
                          <button onClick={() => showToast('Solicitud de vacaciones autorizada')} className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold">Aprobada</button>
                        </td>
                      </tr>
                    ))
                  ) : activeTab === 'Nómina' ? (
                    [
                      { name: 'Ana Cajera', base: 'RD$ 25,000.00', ded: 'RD$ 1,477.50', net: 'RD$ 23,522.50', status: 'Pagado' },
                      { name: 'Juan Martínez', base: 'RD$ 45,000.00', ded: 'RD$ 4,850.00', net: 'RD$ 40,150.00', status: 'Pagado' },
                      { name: 'Laura Rodríguez', base: 'RD$ 28,000.00', ded: 'RD$ 1,654.80', net: 'RD$ 26,345.20', status: 'Pagado' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{row.base}</td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">{row.ded}</td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">{row.net}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{row.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">---</td>
                        <td className="py-3.5 px-3 text-center">
                          <button onClick={() => showToast(`Volante de pago generado para ${row.name}`)} className="px-2 py-1 rounded bg-slate-100 font-semibold text-slate-700">Comprobante</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    [
                      { col1: 'Farmacéutico', col2: 'Dispensación', col3: 'RD$ 45,000.00', col4: '2 Empleados', status: 'Activo' },
                      { col1: 'Cajero', col2: 'Caja', col3: 'RD$ 25,000.00', col4: '4 Empleados', status: 'Activo' },
                      { col1: 'Aux. de Farmacia', col2: 'Dispensación', col3: 'RD$ 28,000.00', col4: '3 Empleados', status: 'Activo' }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{row.col1}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{row.col2}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-700">{row.col3}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-600">{row.col4}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{row.status}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">---</td>
                        <td className="py-3.5 px-3 text-center">
                          <button onClick={() => showToast('Detalle consultado')} className="px-2 py-1 rounded bg-slate-100 font-semibold text-slate-700">Ver</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-500">
              <div>
                Mostrando <span className="font-semibold text-slate-700">{employees.length === 0 ? 0 : 1}</span> a <span className="font-semibold text-slate-700">{employees.length}</span> de <span className="font-semibold text-slate-700">{total}</span> empleados
              </div>

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

            <div className="flex flex-wrap gap-2">
              {[
                'Registrar asistencia',
                'Solicitud de vacaciones',
                'Empleados por departamento',
                'Cumpleaños del mes'
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

        {/* ─── RIGHT COLUMN: DETALLE DEL EMPLEADO PANEL (4 COLS) ─────────────── */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sticky top-4 flex flex-col gap-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Detalle del empleado</h3>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            {selectedEmployee ? (
              <>
                {/* Header Avatar Box + Employee Name */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 font-extrabold flex items-center justify-center text-lg shrink-0 shadow-2xs">
                    {selectedEmployee.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base leading-snug">{selectedEmployee.name}</h4>
                    <p className="text-xs font-semibold text-slate-600">{selectedEmployee.position}</p>
                    <p className="text-[11px] text-slate-400">{selectedEmployee.department}</p>
                    <div className="mt-1">
                      {selectedEmployee.is_active === 1 ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Activa
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Inactiva
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attribute Breakdown */}
                <div className="space-y-2 text-xs divide-y divide-slate-100">
                  <div className="pt-1 flex justify-between">
                    <span className="text-slate-400 font-medium">Cédula</span>
                    <span className="font-mono font-bold text-slate-800">{selectedEmployee.cedula}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Teléfono</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.phone}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Correo</span>
                    <span className="text-slate-800 font-medium truncate max-w-[170px]">{selectedEmployee.email}</span>
                  </div>

                  <div className="pt-2">
                    <span className="text-slate-400 font-medium block mb-0.5">Dirección</span>
                    <span className="text-slate-800 font-medium leading-tight">{selectedEmployee.address}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Fecha de nacimiento</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.birth_date}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Fecha de ingreso</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.hire_date}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Salario</span>
                    <span className="font-extrabold text-slate-900">RD$ {selectedEmployee.salary}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Estado civil</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.civil_status}</span>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <span className="text-slate-400 font-medium">Contacto de emergencia</span>
                    <span className="font-semibold text-slate-800">{selectedEmployee.emergency_contact}</span>
                  </div>
                </div>

                {/* Document Status Section */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                  <h4 className="font-bold text-slate-800 text-xs">Documentos</h4>
                  <div className="space-y-1.5">
                    {selectedEmployee.documents?.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl">
                        <span className="text-slate-700 font-medium">{doc.name}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          doc.badge === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => openEditEmployeeModal(selectedEmployee)}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-200 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                  >
                    <Edit3 size={14} />
                    <span>Editar empleado</span>
                  </button>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs active:scale-95 ${
                      selectedEmployee.is_active === 1
                        ? 'border-rose-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-rose-600'
                        : 'border-emerald-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    {selectedEmployee.is_active === 1 ? <Trash2 size={14} /> : <Check size={14} />}
                    <span>{selectedEmployee.is_active === 1 ? 'Desactivar empleado' : 'Activar empleado'}</span>
                  </button>
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

      {/* ─── MODAL: NUEVO / EDITAR EMPLEADO ────────────────────────────────── */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title={isEditMode ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveEmployeeSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            
            <div className="col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Nombre Completo *</label>
              <input
                required
                type="text"
                placeholder="Ej. Ana Cajera"
                className="input text-xs"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Cédula de Identidad *</label>
              <input
                required
                type="text"
                placeholder="001-1234567-8"
                className="input text-xs font-mono"
                value={employeeForm.cedula}
                onChange={(e) => setEmployeeForm({ ...employeeForm, cedula: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Cargo / Puesto *</label>
              <input
                required
                type="text"
                placeholder="Ej. Cajero"
                className="input text-xs"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Departamento *</label>
              <select
                className="input text-xs font-semibold text-slate-800"
                value={employeeForm.department}
                onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
              >
                <option value="Caja">Caja</option>
                <option value="Dispensación">Dispensación</option>
                <option value="Almacén">Almacén</option>
                <option value="Administración">Administración</option>
                <option value="Seguridad">Seguridad</option>
                <option value="Logística">Logística</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Teléfono *</label>
              <input
                required
                type="text"
                placeholder="809-555-1234"
                className="input text-xs"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Correo Electrónico *</label>
              <input
                required
                type="email"
                placeholder="empleado@pharmaplus.com"
                className="input text-xs"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Salario Mensual (RD$) *</label>
              <input
                required
                type="number"
                placeholder="25000.00"
                className="input text-xs font-bold text-emerald-700"
                value={employeeForm.salary}
                onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Dirección Residencial</label>
              <input
                type="text"
                placeholder="C/ Duarte #123, Ens. Naco, Santo Domingo"
                className="input text-xs"
                value={employeeForm.address}
                onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Fecha de Nacimiento</label>
              <input
                type="text"
                placeholder="15/06/1995"
                className="input text-xs font-mono"
                value={employeeForm.birth_date}
                onChange={(e) => setEmployeeForm({ ...employeeForm, birth_date: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Fecha de Ingreso</label>
              <input
                type="text"
                placeholder="12/01/2023"
                className="input text-xs font-mono"
                value={employeeForm.hire_date}
                onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Estado Civil</label>
              <select
                className="input text-xs font-semibold text-slate-800"
                value={employeeForm.civil_status}
                onChange={(e) => setEmployeeForm({ ...employeeForm, civil_status: e.target.value })}
              >
                <option value="Soltera">Soltero/a</option>
                <option value="Casado">Casado/a</option>
                <option value="Unión Libre">Unión Libre</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Contacto de Emergencia</label>
              <input
                type="text"
                placeholder="Madre - 809-555-5678"
                className="input text-xs"
                value={employeeForm.emergency_contact}
                onChange={(e) => setEmployeeForm({ ...employeeForm, emergency_contact: e.target.value })}
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsEmployeeModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              {isEditMode ? 'Guardar Cambios' : 'Crear Empleado'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: DESACTIVAR / ACTIVAR EMPLEADO ─────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={selectedEmployee?.is_active === 1 ? 'Desactivar Empleado' : 'Activar Empleado'}
        maxWidth="max-w-md"
      >
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
              Se {selectedEmployee?.is_active === 1 ? 'cambiará el estado a inactivo' : 'reactivará la ficha'} para <strong className="text-slate-800">"{selectedEmployee?.name}"</strong>.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={handleToggleDeactivate} 
              className={`btn text-white text-xs font-semibold ${
                selectedEmployee?.is_active === 1 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {selectedEmployee?.is_active === 1 ? 'Desactivar Empleado' : 'Activar Empleado'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: ESCANEAR CARNET DE EMPLEADO ────────────────────────────── */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Escáner Digital de Carnet de Empleado"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <ScanLine size={32} className="animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Escaneando carnet o cédula de empleado</h4>
            <p className="text-xs text-slate-500 mt-1">
              Identifica y filtra automáticamente los datos del empleado en la plantilla.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsScanModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsScanModalOpen(false);
                if (employees.length > 0) setSelectedEmployee(employees[0]);
                showToast('Empleado Ana Cajera identificado correctamente');
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

export default RRHH;
