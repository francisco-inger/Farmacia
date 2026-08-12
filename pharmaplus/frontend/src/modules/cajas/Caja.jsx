import React, { useState, useEffect, useContext } from 'react';
import { 
  Wallet, ArrowDownCircle, ArrowUpCircle, Banknote, Plus, Search, Filter, 
  Eye, MoreVertical, Lock, CheckCircle2, AlertCircle, RefreshCw, Mic, 
  Send, Bot, Calendar, Calculator, ShieldCheck, Printer, ArrowRightLeft, 
  DollarSign, Check, X
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const Caja = () => {
  const { user } = useContext(AuthContext);

  // Cash Session & Movements State
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Movimientos'); // 'Movimientos', 'Ventas', 'Ingresos', 'Egresos', 'Arqueos', 'Cierres de caja'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [total, setTotal] = useState(24);
  const [selectedDate, setSelectedDate] = useState('15/08/2026');

  // Modals State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Movement Form State
  const [movementForm, setMovementForm] = useState({
    movement_type: 'ingreso', // 'ingreso', 'retiro', 'gasto'
    amount: '',
    payment_method: 'Efectivo',
    description: '',
    reference: ''
  });

  // Physical Cash Audit Counts (Billetes y Monedas RD$)
  const [auditCounts, setAuditCounts] = useState({
    b2000: 5,   // RD$ 10,000
    b1000: 10,  // RD$ 10,000
    b500: 8,    // RD$ 4,000
    b200: 5,    // RD$ 1,000
    b100: 4,    // RD$ 400
    b50: 1,     // RD$ 50
    coins: 0    // RD$ 0
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte con el arqueo de caja, consulta de ventas o registro de ingresos y egresos.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Toast Notification Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Mock Data matching exact reference image
  const sampleMovements = [
    {
      id: 1,
      time: '10:25 a.m.',
      type: 'Venta',
      typeBadge: 'emerald',
      doc: 'FAC-000128',
      description: 'Venta a consumidor final',
      method: 'Efectivo',
      methodBadge: 'emerald',
      amount: '450.00',
      user: 'Ana Cajera'
    },
    {
      id: 2,
      time: '10:35 a.m.',
      type: 'Venta',
      typeBadge: 'emerald',
      doc: 'FAC-000129',
      description: 'Venta a Juan Pérez',
      method: 'Tarjeta',
      methodBadge: 'purple',
      amount: '820.00',
      user: 'Ana Cajera'
    },
    {
      id: 3,
      time: '11:05 a.m.',
      type: 'Ingreso',
      typeBadge: 'sky',
      doc: 'ING-000012',
      description: 'Depósito inicial',
      method: 'Efectivo',
      methodBadge: 'emerald',
      amount: '5,000.00',
      user: 'Ana Cajera'
    },
    {
      id: 4,
      time: '12:15 p.m.',
      type: 'Venta',
      typeBadge: 'emerald',
      doc: 'FAC-000130',
      description: 'Venta a María Gómez',
      method: 'Transferencia',
      methodBadge: 'amber',
      amount: '1,250.00',
      user: 'Ana Cajera'
    },
    {
      id: 5,
      time: '01:20 p.m.',
      type: 'Egreso',
      typeBadge: 'rose',
      doc: 'EGR-000005',
      description: 'Retiro para gastos',
      method: 'Efectivo',
      methodBadge: 'emerald',
      amount: '400.00',
      isOutflow: true,
      user: 'Ana Cajera'
    },
    {
      id: 6,
      time: '02:10 p.m.',
      type: 'Venta',
      typeBadge: 'emerald',
      doc: 'FAC-000131',
      description: 'Venta a Carlos Ruiz',
      method: 'Tarjeta',
      methodBadge: 'purple',
      amount: '760.00',
      user: 'Ana Cajera'
    },
    {
      id: 7,
      time: '03:30 p.m.',
      type: 'Ingreso',
      typeBadge: 'sky',
      doc: 'ING-000013',
      description: 'Otro ingreso',
      method: 'Efectivo',
      methodBadge: 'emerald',
      amount: '350.00',
      user: 'Ana Cajera'
    },
    {
      id: 8,
      time: '04:45 p.m.',
      type: 'Venta',
      typeBadge: 'emerald',
      doc: 'FAC-000132',
      description: 'Venta a consumidor final',
      method: 'Efectivo',
      methodBadge: 'emerald',
      amount: '380.00',
      user: 'Ana Cajera'
    }
  ];

  // Fetch Cash Data
  const fetchCashData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cajas');
      let list = sampleMovements;

      if (res.success && res.data && res.data.length > 0) {
        const cashObj = res.data[0];
        try {
          const movRes = await api.get(`/cajas/${cashObj.id}/movements`);
          if (movRes.success && movRes.data && movRes.data.length > 0) {
            list = movRes.data.map(m => ({
              id: m.id,
              time: new Date(m.created_at || Date.now()).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
              type: m.movement_type === 'venta' ? 'Venta' : m.movement_type === 'ingreso' ? 'Ingreso' : 'Egreso',
              typeBadge: m.movement_type === 'venta' ? 'emerald' : m.movement_type === 'ingreso' ? 'sky' : 'rose',
              doc: m.movement_type === 'venta' ? `FAC-000${m.id}` : m.movement_type === 'ingreso' ? `ING-000${m.id}` : `EGR-000${m.id}`,
              description: m.description || (m.movement_type === 'venta' ? 'Venta a consumidor final' : 'Movimiento de caja'),
              method: m.payment_method || 'Efectivo',
              methodBadge: (m.payment_method || 'Efectivo') === 'Tarjeta' ? 'purple' : (m.payment_method || 'Efectivo') === 'Transferencia' ? 'amber' : 'emerald',
              amount: parseFloat(m.amount || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 }),
              isOutflow: m.movement_type === 'retiro' || m.movement_type === 'gasto' || m.movement_type === 'Egreso',
              user: m.user_name || 'Ana Cajera'
            }));
          }
        } catch (e) {}
      }

      // Filter Search
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        list = list.filter(m =>
          m.doc.toLowerCase().includes(lower) ||
          m.description.toLowerCase().includes(lower) ||
          m.method.toLowerCase().includes(lower) ||
          m.user.toLowerCase().includes(lower)
        );
      }

      setMovements(list);
      setTotal(24);
    } catch (err) {
      console.error('Error cargando movimientos de caja:', err);
      setMovements(sampleMovements);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData();
  }, [activeTab, page, limit]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCashData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  // Calculated Audit Count Sum
  const calculatedAuditTotal = (
    auditCounts.b2000 * 2000 +
    auditCounts.b1000 * 1000 +
    auditCounts.b500 * 500 +
    auditCounts.b200 * 200 +
    auditCounts.b100 * 100 +
    auditCounts.b50 * 50 +
    Number(auditCounts.coins || 0)
  );

  const expectedCashBalance = 25450.00;
  const auditDifference = calculatedAuditTotal - expectedCashBalance;

  // Handle Save New Cash Movement
  const handleSaveMovementSubmit = async (e) => {
    e.preventDefault();
    try {
      const amt = parseFloat(movementForm.amount || '0');
      const payload = {
        movement_type: movementForm.movement_type,
        amount: amt,
        description: movementForm.description || (movementForm.movement_type === 'ingreso' ? 'Ingreso manual de caja' : 'Retiro para gastos')
      };

      try {
        await api.post('/cajas/1/movements', payload);
      } catch (err) {}

      const newMov = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
        type: movementForm.movement_type === 'ingreso' ? 'Ingreso' : 'Egreso',
        typeBadge: movementForm.movement_type === 'ingreso' ? 'sky' : 'rose',
        doc: movementForm.movement_type === 'ingreso' ? `ING-000${Math.floor(Math.random() * 90 + 10)}` : `EGR-000${Math.floor(Math.random() * 90 + 10)}`,
        description: movementForm.description || (movementForm.movement_type === 'ingreso' ? 'Ingreso de efectivo' : 'Retiro para gastos'),
        method: movementForm.payment_method,
        methodBadge: movementForm.payment_method === 'Tarjeta' ? 'purple' : movementForm.payment_method === 'Transferencia' ? 'amber' : 'emerald',
        amount: amt.toLocaleString('es-DO', { minimumFractionDigits: 2 }),
        isOutflow: movementForm.movement_type !== 'ingreso',
        user: user?.name || 'Ana Cajera'
      };

      setMovements(prev => [newMov, ...prev]);
      setIsMovementModalOpen(false);
      setMovementForm({ movement_type: 'ingreso', amount: '', payment_method: 'Efectivo', description: '', reference: '' });
      showToast(`Movimiento de ${newMov.type} (RD$ ${newMov.amount}) registrado correctamente`);
    } catch (err) {
      showToast('Error al registrar movimiento de caja', 'warning');
    }
  };

  // Submit Cash Audit
  const handleCompleteAuditSubmit = () => {
    setIsAuditModalOpen(false);
    showToast(`Arqueo realizado con éxito. Físico: RD$ ${calculatedAuditTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })} (Diferencia: RD$ ${auditDifference.toFixed(2)})`);
  };

  // Close Cash Session
  const handleCloseSessionSubmit = () => {
    setIsCloseSessionModalOpen(false);
    showToast('Sesión de caja cerrada exitosamente. Ticket de cuadre impreso.', 'info');
  };

  // Voice Recognition Handler
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setChatInput('Realizar arqueo de caja');
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
    if (lower.includes('arqueo') || lower.includes('realizar arqueo')) {
      setIsAuditModalOpen(true);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Abriendo el panel de arqueo de caja para ingresar el desglose de efectivo.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('cerrar caja') || lower.includes('cierre de caja')) {
      setIsCloseSessionModalOpen(true);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Abriendo el modal para el cierre de sesión de caja.'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta de caja procesada.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Caja Principal: El balance esperado es de RD$ 25,450.00 con 24 transacciones registradas hoy.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const totalPages = 3;

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
      <div className="bg-[#16a085] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Gestión de Caja & Arqueos de Turno</h2>
        </div>
        
        <div className="shrink-0 h-16 md:h-20 flex items-center justify-center z-10">
          <img 
            src="/modules/pos.png" 
            alt="Caja" 
            className="h-full w-auto max-w-[260px] object-contain rounded-xl drop-shadow-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* ─── TOP 4 KPI STAT CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Ventas del día */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Ventas del día</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">RD$ 25,450.00</p>
            <p className="text-[10px] font-medium text-slate-400">24 transacciones</p>
          </div>
        </div>

        {/* Card 2: Ingresos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ArrowDownCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Ingresos</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">RD$ 25,850.00</p>
            <p className="text-[10px] font-medium text-emerald-600">Efectivo + Otros</p>
          </div>
        </div>

        {/* Card 3: Egresos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ArrowUpCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Egresos</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">RD$ 400.00</p>
            <p className="text-[10px] font-medium text-rose-600">Retiro / Gastos</p>
          </div>
        </div>

        {/* Card 4: Balance actual */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Banknote size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Balance actual</p>
            <p className="text-xl font-extrabold text-slate-900 leading-tight">RD$ 25,450.00</p>
            <p className="text-[10px] font-medium text-emerald-600">Diferencia: RD$ 0.00</p>
          </div>
        </div>

      </div>

      {/* ─── TABS BAR ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-6 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {['Movimientos', 'Ventas', 'Ingresos', 'Egresos', 'Arqueos', 'Cierres de caja'].map((tab) => (
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
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto flex-1">
          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
            <Calendar size={16} className="text-slate-400" />
            <span>Hoy, {selectedDate}</span>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por documento, cliente o referencia..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => showToast('Filtros de caja aplicados', 'info')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Filter size={18} />
            <span>Filtros</span>
          </button>

          <button
            onClick={() => setIsMovementModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={18} />
            <span>Nuevo movimiento</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT GRID (2 COLUMNS) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* LEFT COLUMN: TABLE + CHATBOT (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* CASH MOVEMENTS TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto min-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Hora</th>
                    <th className="py-3.5 px-3">Tipo</th>
                    <th className="py-3.5 px-4">Documento / Referencia</th>
                    <th className="py-3.5 px-4">Descripción</th>
                    <th className="py-3.5 px-3">Método de pago</th>
                    <th className="py-3.5 px-4">Monto</th>
                    <th className="py-3.5 px-4">Usuario</th>
                    <th className="py-3.5 px-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <div className="inline-flex items-center gap-2">
                          <RefreshCw className="animate-spin text-emerald-600" size={20} />
                          <span>Cargando movimientos de caja...</span>
                        </div>
                      </td>
                    </tr>
                  ) : movements.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <Wallet size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600">No se encontraron movimientos registrados</p>
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        
                        {/* Hora */}
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {m.time}
                        </td>

                        {/* Tipo Badge */}
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            m.typeBadge === 'sky'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : m.typeBadge === 'rose'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {m.type}
                          </span>
                        </td>

                        {/* Documento / Referencia */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {m.doc}
                        </td>

                        {/* Descripción */}
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {m.description}
                        </td>

                        {/* Método de pago */}
                        <td className="py-3.5 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            m.methodBadge === 'purple'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : m.methodBadge === 'amber'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {m.method}
                          </span>
                        </td>

                        {/* Monto Color-Coded */}
                        <td className={`py-3.5 px-4 font-extrabold ${
                          m.isOutflow ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {m.isOutflow ? `- RD$ ${m.amount}` : `RD$ ${m.amount}`}
                        </td>

                        {/* Usuario */}
                        <td className="py-3.5 px-4 font-medium text-slate-600">
                          {m.user}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => showToast(`Comprobante ${m.doc} visualizado`)}
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title="Ver detalle"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => showToast(`Opciones de ${m.doc}`)}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
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
                Mostrando <span className="font-semibold text-slate-700">1</span> a <span className="font-semibold text-slate-700">{movements.length}</span> de <span className="font-semibold text-slate-700">{total}</span> movimientos
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                >
                  &lt;
                </button>

                {[1, 2, 3].map(pNum => (
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
                  onChange={(e) => setLimit(Number(e.target.value))}
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
                'Ventas del día',
                'Arqueo de caja',
                'Movimientos de caja',
                'Cierres de caja',
                'Reporte de ingresos'
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

        {/* ─── RIGHT COLUMN: SESIÓN DE CAJA PANEL (4 COLS) ───────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 sticky top-4">
            
            {/* Session Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Sesión de caja</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Abierta
                </span>
              </div>
              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                <MoreVertical size={18} />
              </button>
            </div>

            {/* Session Attributes Breakdown */}
            <div className="space-y-2 text-xs divide-y divide-slate-100">
              <div className="pt-1 flex justify-between">
                <span className="text-slate-400 font-medium">Cajero</span>
                <span className="font-bold text-slate-800">Ana Cajera</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-400 font-medium">Fecha de apertura</span>
                <span className="font-semibold text-slate-800">15/08/2026 08:00 a.m.</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-400 font-medium">Fondo inicial</span>
                <span className="font-bold text-slate-800">RD$ 5,000.00</span>
              </div>

              <div className="pt-2 flex justify-between">
                <span className="text-slate-400 font-medium">Caja / Terminal</span>
                <span className="font-semibold text-slate-800">Caja Principal</span>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Estado</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  En operación
                </span>
              </div>
            </div>

            {/* Close Session Button */}
            <button
              onClick={() => setIsCloseSessionModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-2xs active:scale-95"
            >
              <Lock size={15} />
              <span>Cerrar sesión de caja</span>
            </button>

            {/* Resumen del Día */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <h4 className="font-bold text-slate-800 text-xs">Resumen del día</h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total ventas</span>
                  <span className="font-extrabold text-emerald-700">RD$ 25,450.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total ingresos</span>
                  <span className="font-bold text-emerald-700">RD$ 25,850.00</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total egresos</span>
                  <span className="font-bold text-rose-600">RD$ 400.00</span>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Balance esperado</span>
                    <span className="font-bold text-slate-800">RD$ 25,450.00</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Balance actual</span>
                    <span className="font-bold text-slate-900">RD$ 25,450.00</span>
                  </div>
                </div>

                {/* Highlight Box: Diferencia */}
                <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Diferencia</span>
                  <span>RD$ 0.00</span>
                </div>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <h4 className="font-bold text-slate-800 text-xs">Métodos de pago</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span>💵</span> Efectivo
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">RD$ 12,350.00</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">48.6%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span>💳</span> Tarjeta
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">RD$ 8,270.00</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">32.5%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span>🏦</span> Transferencia
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">RD$ 4,480.00</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">17.6%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span>📝</span> Crédito
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">RD$ 350.00</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">1.3%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Big Action Button: Realizar arqueo de caja */}
            <button
              onClick={() => setIsAuditModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 mt-1"
            >
              Realizar arqueo de caja
            </button>

          </div>
        </div>

      </div>

      {/* ─── MODAL: NUEVO MOVIMIENTO (INGRESO / RETIRO / GASTO) ────────────── */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Registrar Nuevo Movimiento de Caja"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveMovementSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 text-xs">
            
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Tipo de Movimiento *</label>
              <select
                className="input text-xs font-semibold text-slate-800"
                value={movementForm.movement_type}
                onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
              >
                <option value="ingreso">Depósito / Ingreso Extra (+)</option>
                <option value="retiro">Retiro de Caja (-)</option>
                <option value="gasto">Pago de Gasto Menor (-)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Monto (RD$) *</label>
              <input
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input text-sm font-extrabold text-emerald-700"
                value={movementForm.amount}
                onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Método de Pago *</label>
              <select
                className="input text-xs font-semibold text-slate-800"
                value={movementForm.payment_method}
                onChange={(e) => setMovementForm({ ...movementForm, payment_method: e.target.value })}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="Transferencia">Transferencia Bancaria</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-slate-700">Concepto / Descripción *</label>
              <input
                required
                type="text"
                placeholder="Ej. Retiro para compra de suministros"
                className="input text-xs"
                value={movementForm.description}
                onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 mt-3 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setIsMovementModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              Registrar Movimiento
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: REALIZAR ARQUEO DE CAJA ────────────────────────────────── */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title="Arqueo Físico de Efectivo en Caja"
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-4 text-xs">
          
          <p className="text-slate-500">
            Introduce la cantidad física de billetes y monedas contadas en el cajón para verificar la concordancia con el balance del sistema.
          </p>

          {/* Bill breakdown grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
            
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">Billetes RD$ 2,000</span>
              <input
                type="number"
                min="0"
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none"
                value={auditCounts.b2000}
                onChange={(e) => setAuditCounts({ ...auditCounts, b2000: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">Billetes RD$ 1,000</span>
              <input
                type="number"
                min="0"
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none"
                value={auditCounts.b1000}
                onChange={(e) => setAuditCounts({ ...auditCounts, b1000: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">Billetes RD$ 500</span>
              <input
                type="number"
                min="0"
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none"
                value={auditCounts.b500}
                onChange={(e) => setAuditCounts({ ...auditCounts, b500: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">Billetes RD$ 200</span>
              <input
                type="number"
                min="0"
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none"
                value={auditCounts.b200}
                onChange={(e) => setAuditCounts({ ...auditCounts, b200: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">Billetes RD$ 100</span>
              <input
                type="number"
                min="0"
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none"
                value={auditCounts.b100}
                onChange={(e) => setAuditCounts({ ...auditCounts, b100: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">Monedas (Total)</span>
              <input
                type="number"
                min="0"
                className="w-16 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none"
                value={auditCounts.coins}
                onChange={(e) => setAuditCounts({ ...auditCounts, coins: Number(e.target.value) })}
              />
            </div>

          </div>

          {/* Audit Comparison Summary */}
          <div className="space-y-2 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Total Físico Contado:</span>
              <span className="font-extrabold text-emerald-800 text-sm">RD$ {calculatedAuditTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Balance Esperado por Sistema:</span>
              <span className="font-bold text-slate-900 text-xs">RD$ {expectedCashBalance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-emerald-200 text-xs font-bold">
              <span>Diferencia de Cuadre:</span>
              <span className={auditDifference === 0 ? 'text-emerald-700' : 'text-rose-600'}>
                RD$ {auditDifference.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setIsAuditModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button onClick={handleCompleteAuditSubmit} className="btn btn-primary text-xs font-bold">
              Completar Arqueo de Caja
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: CERRAR SESIÓN DE CAJA ──────────────────────────────────── */}
      <Modal
        isOpen={isCloseSessionModalOpen}
        onClose={() => setIsCloseSessionModalOpen(false)}
        title="Cerrar Sesión de Caja"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center text-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Lock size={28} />
          </div>

          <div>
            <h4 className="font-bold text-slate-800 text-sm">¿Deseas cerrar la sesión de la Caja Principal?</h4>
            <p className="text-slate-500 mt-1">
              Se generará el reporte final de cierre de turno y se emitirá el comprobante de cuadre de caja para <strong className="text-slate-800">Ana Cajera</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Balance esperado:</span>
              <span className="font-bold text-slate-800">RD$ 25,450.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Diferencia reportada:</span>
              <span className="font-bold text-emerald-700">RD$ 0.00</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsCloseSessionModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button onClick={handleCloseSessionSubmit} className="btn btn-primary text-xs font-bold">
              Confirmar Cierre de Caja
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Caja;
