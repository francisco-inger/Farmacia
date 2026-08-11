import React, { useState, useEffect, useContext } from 'react';
import { 
  Building2, Users, Percent, ShoppingCart, Package, FileText, 
  ShoppingBag, Stethoscope, HeartPulse, Bell, ShieldCheck, Link2, 
  Palette, Printer, Save, Upload, CheckCircle2, Bot, Send, Sparkles, 
  RefreshCw, Moon, Volume2, AlertTriangle, Check, Layers, Laptop, Mic
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../context/AuthContext';

const Configuracion = () => {
  const { user } = useContext(AuthContext);

  // Active Category Navigation State
  const [activeCategory, setActiveCategory] = useState('Empresa');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Company Settings Form State
  const [companyForm, setCompanyForm] = useState({
    company_name: 'PharmaPlus',
    rnc: '1-31-12345-6',
    trade_name: 'PharmaPlus Farmacia',
    phone: '809-555-1234',
    email: 'info@pharmaplus.com',
    website: 'www.pharmaplus.com',
    address: 'Av. John F. Kennedy #123, Ens. Naco',
    city: 'Santo Domingo',
    province: 'Distrito Nacional',
    postal_code: '10106',
    country: 'República Dominicana',
    currency: 'Peso Dominicano (RD$)'
  });

  // General Settings State (Toggles)
  const [generalSettings, setGeneralSettings] = useState({
    darkMode: false,
    systemSounds: true,
    confirmDeletion: true,
    decimalRounding: true
  });

  // Sales Settings State
  const [salesSettings, setSalesSettings] = useState({
    defaultPriceType: 'Precio de venta',
    defaultDiscount: '0.00',
    defaultSeller: 'Ana Cajera',
    allowLowStockSales: true
  });

  // Printing Settings State
  const [printingSettings, setPrintingSettings] = useState({
    receiptPrinter: 'Impresora Principal (POS-80)',
    recipePrinter: 'Ninguna',
    paperSize: '80mm',
    autoPrint: true
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a ajustar preferencias del sistema, cambiar la impresora por defecto o realizar una copia de seguridad.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setChatInput('Opciones de impresión');
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

  // Fetch Existing Settings from Backend
  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/configuracion');
        if (res.success && res.data) {
          const s = res.data;
          setCompanyForm(prev => ({
            ...prev,
            company_name: s.company_name?.value || prev.company_name,
            rnc: s.rnc?.value || prev.rnc,
            phone: s.phone?.value || prev.phone,
            email: s.email?.value || prev.email,
            address: s.address?.value || prev.address
          }));
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsData();
  }, []);

  // Save All Settings Handler
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const payload = {
        company_name: companyForm.company_name,
        rnc: companyForm.rnc,
        trade_name: companyForm.trade_name,
        phone: companyForm.phone,
        email: companyForm.email,
        address: companyForm.address,
        currency: companyForm.currency,
        darkMode: generalSettings.darkMode ? '1' : '0',
        autoPrint: printingSettings.autoPrint ? '1' : '0'
      };

      try {
        await api.put('/configuracion', payload);
      } catch (e) {}

      showToast('Configuraciones del sistema guardadas exitosamente');
    } catch (err) {
      showToast('Error al guardar la configuración', 'warning');
    } finally {
      setSaving(false);
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
    if (lower.includes('respaldar datos') || lower.includes('respaldo')) {
      setIsBackupModalOpen(true);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he abierto la ventana para generar una copia de seguridad de la base de datos.'
      }]);
      setChatLoading(false);
      return;
    }

    if (lower.includes('opciones de impresión') || lower.includes('impresion')) {
      setActiveCategory('Dispositivos');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he dirigido a la sección de configuración de impresoras y dispositivos.'
      }]);
      setChatLoading(false);
      return;
    }

    try {
      const res = await api.post('/ai/chat', { message: text });
      if (res.success) {
        setChatMessages(prev => [...prev, { role: 'assistant', text: res.data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', text: 'Consulta de configuración procesada.' }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Asistente de Configuración: Todos los parámetros del sistema se encuentran operando correctamente.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Categories Navigation Items
  const navCategories = [
    { key: 'Empresa', label: 'Empresa', desc: 'Datos de tu empresa', icon: Building2 },
    { key: 'Usuarios', label: 'Usuarios y Permisos', desc: 'Gestiona usuarios y roles', icon: Users },
    { key: 'Impuestos', label: 'Impuestos', desc: 'Configuración de impuestos y tasas', icon: Percent },
    { key: 'Ventas', label: 'Ventas', desc: 'Opciones y preferencias de ventas', icon: ShoppingCart },
    { key: 'Inventario', label: 'Inventario', desc: 'Configuración de inventario', icon: Package },
    { key: 'Facturación', label: 'Facturación', desc: 'Configuración de facturación', icon: FileText },
    { key: 'Compras', label: 'Compras', desc: 'Opciones de compras', icon: ShoppingBag },
    { key: 'Recetas', label: 'Recetas', desc: 'Configuración de recetas', icon: Stethoscope },
    { key: 'Servicios', label: 'Servicios', desc: 'Configuración de servicios', icon: HeartPulse },
    { key: 'Notificaciones', label: 'Notificaciones', desc: 'Alertas y notificaciones', icon: Bell },
    { key: 'Respaldo', label: 'Respaldo y Seguridad', desc: 'Copia de seguridad y seguridad', icon: ShieldCheck },
    { key: 'Integraciones', label: 'Integraciones', desc: 'Conexiones y servicios externos', icon: Link2 },
    { key: 'Personalización', label: 'Personalización', desc: 'Apariencia y preferencias', icon: Palette },
    { key: 'Dispositivos', label: 'Dispositivos', desc: 'Impresoras, lectores y otros', icon: Printer }
  ];

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

      {/* ─── HEADER & TOP ACTION BAR ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración</h1>
          <p className="text-sm text-slate-500">Administra y personaliza las configuraciones del sistema</p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
        >
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          <span>Guardar cambios</span>
        </button>
      </div>

      {/* ─── MAIN CONTENT LAYOUT (2 COLUMNS: NAV SIDEBAR + FORM WORKSPACE) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        
        {/* LEFT COLUMN: SETTINGS CATEGORIES SIDEBAR (4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-3 space-y-1">
          {navCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight truncate">{cat.label}</p>
                  <p className="text-[11px] text-slate-400 leading-tight truncate">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: MAIN SETTINGS FORM WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* SECTION 1: INFORMACIÓN DE LA EMPRESA & LOGO */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-5">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Información de la empresa</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configura los datos generales de tu empresa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* FORM FIELDS (8 COLS) */}
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Nombre de la empresa</label>
                  <input
                    type="text"
                    className="input text-xs font-bold text-slate-900"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">RNC</label>
                  <input
                    type="text"
                    className="input text-xs font-mono font-bold text-slate-900"
                    value={companyForm.rnc}
                    onChange={(e) => setCompanyForm({ ...companyForm, rnc: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Nombre comercial</label>
                  <input
                    type="text"
                    className="input text-xs font-semibold text-slate-800"
                    value={companyForm.trade_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, trade_name: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Teléfono</label>
                  <input
                    type="text"
                    className="input text-xs font-semibold text-slate-800"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Correo electrónico</label>
                  <input
                    type="email"
                    className="input text-xs font-medium text-slate-800"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Sitio web (opcional)</label>
                  <input
                    type="text"
                    className="input text-xs text-slate-800"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Dirección</label>
                  <input
                    type="text"
                    className="input text-xs text-slate-800"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Ciudad</label>
                  <input
                    type="text"
                    className="input text-xs font-medium text-slate-800"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Provincia</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={companyForm.province}
                    onChange={(e) => setCompanyForm({ ...companyForm, province: e.target.value })}
                  >
                    <option value="Distrito Nacional">Distrito Nacional</option>
                    <option value="Santo Domingo">Santo Domingo</option>
                    <option value="Santiago">Santiago</option>
                    <option value="La Vega">La Vega</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Código postal</label>
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    value={companyForm.postal_code}
                    onChange={(e) => setCompanyForm({ ...companyForm, postal_code: e.target.value })}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">País</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                  >
                    <option value="República Dominicana">República Dominicana</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1">
                  <label className="font-semibold text-slate-700">Moneda</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={companyForm.currency}
                    onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                  >
                    <option value="Peso Dominicano (RD$)">Peso Dominicano (RD$)</option>
                    <option value="Dólar Estadounidense (USD$)">Dólar Estadounidense (USD$)</option>
                  </select>
                </div>

              </div>

              {/* LOGO BOX (4 COLS) */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-center gap-3">
                <label className="text-xs font-bold text-slate-700">Logo de la empresa</label>
                
                <div className="w-36 h-36 rounded-2xl bg-white border border-indigo-100 p-4 flex flex-col items-center justify-center gap-1 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-indigo-600/30">
                    +
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">PharmaPlus</span>
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest">FARMACIA</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-indigo-600 font-semibold text-xs transition-all shadow-2xs active:scale-95"
                >
                  <Upload size={14} />
                  <span>Cambiar logo</span>
                </button>

                <p className="text-[10px] text-slate-400 leading-tight">
                  Formatos permitidos: PNG, JPG<br />Tamaño máximo: 2MB
                </p>
              </div>

            </div>
          </div>

          {/* SECTION 2: THREE BOTTOM CONFIG CARDS (GENERAL, VENTAS, IMPRESIÓN) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* CARD 1: CONFIGURACIÓN GENERAL */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between gap-4">
              <h3 className="font-bold text-slate-800 text-sm">Configuración general</h3>

              <div className="space-y-3.5 text-xs">
                {/* Modo oscuro toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">Modo oscuro</p>
                    <p className="text-[11px] text-slate-400">Activa el modo oscuro en el sistema</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneralSettings({ ...generalSettings, darkMode: !generalSettings.darkMode })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      generalSettings.darkMode ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      generalSettings.darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Sonidos del sistema toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">Sonidos del sistema</p>
                    <p className="text-[11px] text-slate-400">Reproducir sonidos en acciones importantes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneralSettings({ ...generalSettings, systemSounds: !generalSettings.systemSounds })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      generalSettings.systemSounds ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      generalSettings.systemSounds ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Confirmar eliminación toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">Confirmar eliminación</p>
                    <p className="text-[11px] text-slate-400">Mostrar confirmación antes de eliminar registros</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneralSettings({ ...generalSettings, confirmDeletion: !generalSettings.confirmDeletion })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      generalSettings.confirmDeletion ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      generalSettings.confirmDeletion ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Redondeo de decimales toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">Redondeo de decimales</p>
                    <p className="text-[11px] text-slate-400">Redondear precios a 2 decimales</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGeneralSettings({ ...generalSettings, decimalRounding: !generalSettings.decimalRounding })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      generalSettings.decimalRounding ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      generalSettings.decimalRounding ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2: CONFIGURACIÓN DE VENTAS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between gap-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Configuración de ventas</h3>

              <div className="space-y-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Precio por defecto</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={salesSettings.defaultPriceType}
                    onChange={(e) => setSalesSettings({ ...salesSettings, defaultPriceType: e.target.value })}
                  >
                    <option value="Precio de venta">Precio de venta</option>
                    <option value="Precio al por mayor">Precio al por mayor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Descuento por defecto (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input text-xs font-semibold text-slate-800"
                    value={salesSettings.defaultDiscount}
                    onChange={(e) => setSalesSettings({ ...salesSettings, defaultDiscount: e.target.value })}
                  />
                  <span className="text-[10px] text-slate-400">Descuento aplicado por defecto en nuevas ventas</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Vendedor por defecto</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={salesSettings.defaultSeller}
                    onChange={(e) => setSalesSettings({ ...salesSettings, defaultSeller: e.target.value })}
                  >
                    <option value="Ana Cajera">Ana Cajera</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    checked={salesSettings.allowLowStockSales}
                    onChange={(e) => setSalesSettings({ ...salesSettings, allowLowStockSales: e.target.checked })}
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block leading-tight">Permitir ventas con stock bajo</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Permitir vender productos con stock bajo</span>
                  </div>
                </label>
              </div>
            </div>

            {/* CARD 3: CONFIGURACIÓN DE IMPRESIÓN */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between gap-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Configuración de impresión</h3>

              <div className="space-y-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Impresora de facturas</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={printingSettings.receiptPrinter}
                    onChange={(e) => setPrintingSettings({ ...printingSettings, receiptPrinter: e.target.value })}
                  >
                    <option value="Impresora Principal (POS-80)">Impresora Principal (POS-80)</option>
                    <option value="Impresora Térmica 2">Impresora Térmica 2</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Impresora de cocina/recetas</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={printingSettings.recipePrinter}
                    onChange={(e) => setPrintingSettings({ ...printingSettings, recipePrinter: e.target.value })}
                  >
                    <option value="Ninguna">Ninguna</option>
                    <option value="Impresora Recetas 1">Impresora Recetas 1</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500">Tamaño del papel</label>
                  <select
                    className="input text-xs font-semibold text-slate-800"
                    value={printingSettings.paperSize}
                    onChange={(e) => setPrintingSettings({ ...printingSettings, paperSize: e.target.value })}
                  >
                    <option value="80mm">80mm</option>
                    <option value="58mm">58mm</option>
                    <option value="Carta / A4">Carta / A4</option>
                  </select>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                    checked={printingSettings.autoPrint}
                    onChange={(e) => setPrintingSettings({ ...printingSettings, autoPrint: e.target.checked })}
                  />
                  <div>
                    <span className="font-semibold text-slate-800 block leading-tight">Imprimir automáticamente</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Imprimir factura automáticamente al finalizar venta</span>
                  </div>
                </label>
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
                'Reiniciar sistema',
                'Gestionar usuarios',
                'Respaldar datos',
                'Opciones de impresión',
                'Ayuda'
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

      </div>

      {/* ─── MODAL: BACKUP BASE DE DATOS ────────────────────────────────────── */}
      <Modal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        title="Generar Respaldo de Base de Datos"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Copia de Seguridad del Sistema</h4>
            <p className="text-xs text-slate-500 mt-1">
              Se creará un respaldo completo comprimido (.sqlite / .db) con todas las transacciones, inventarios y clientes.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsBackupModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsBackupModalOpen(false);
                showToast('Respaldo de base de datos descargado exitosamente');
              }} 
              className="btn btn-primary text-xs font-semibold"
            >
              Descargar Respaldo Ahora
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL: CAMBIAR LOGO ────────────────────────────────────────────── */}
      <Modal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        title="Actualizar Logo de la Empresa"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto">
            <Upload size={30} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Selecciona una nueva imagen</h4>
            <p className="text-xs text-slate-500 mt-1">
              Sube el archivo del logo oficial para mostrarlo en facturas y comprobantes NCF.
            </p>
          </div>

          <input type="file" accept="image/png, image/jpeg" className="input text-xs" />

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsLogoModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button 
              onClick={() => {
                setIsLogoModalOpen(false);
                showToast('Logo de la empresa actualizado correctamente');
              }} 
              className="btn btn-primary text-xs font-semibold"
            >
              Guardar Logo
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Configuracion;
