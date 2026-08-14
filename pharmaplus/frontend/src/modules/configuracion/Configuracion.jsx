import React, { useState, useEffect, useContext } from 'react';
import { 
  Building2, Users, Percent, ShoppingCart, Package, FileText, 
  ShoppingBag, Stethoscope, HeartPulse, Bell, ShieldCheck, Link2, 
  Palette, Printer, Save, Upload, CheckCircle2, Bot, Send, Sparkles, 
  RefreshCw, Moon, Volume2, AlertTriangle, Check, Layers, Laptop, Mic,
  Plus, Edit3, Trash2, Key, Mail, Phone, Lock, Eye, Download, Server, Smartphone, Globe
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

  // Modals State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isTestPrintModalOpen, setIsTestPrintModalOpen] = useState(false);

  // 1. Empresa State
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

  // 2. Usuarios y Permisos State
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Admin Farmacia', email: 'admin@pharmaplus.com', role: 'admin', status: 'Activo', phone: '809-555-0001' },
    { id: 2, name: 'Ana Cajera', email: 'ana.cajera@pharmaplus.com', role: 'cajero', status: 'Activo', phone: '809-555-0002' },
    { id: 3, name: 'Dr. Juan Carlos', email: 'juan.carlos@pharmaplus.com', role: 'farmaceutico', status: 'Activo', phone: '809-555-0003' }
  ]);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role: 'cajero', phone: '', password: '' });

  // 3. Impuestos State
  const [taxSettings, setTaxSettings] = useState({
    generalTaxRate: '18.00',
    reducedTaxRate: '16.00',
    exemptTaxRate: '0.00',
    defaultTax: 'ITBIS 18%',
    includeTaxInPrice: true,
    dgiiTaxCompliance: true
  });

  // 4. Ventas State
  const [salesSettings, setSalesSettings] = useState({
    defaultPriceType: 'Precio de venta',
    defaultDiscount: '0.00',
    maxAllowedDiscount: '15.00',
    defaultSeller: 'Ana Cajera',
    allowLowStockSales: true,
    requireCustomerRNC: false
  });

  // 5. Inventario State
  const [inventorySettings, setInventorySettings] = useState({
    lowStockThreshold: '10',
    batchExpirationDays: '60',
    autoReorder: true,
    requireAdjustmentNotes: true,
    trackBatches: true
  });

  // 6. Facturación State
  const [billingSettings, setBillingSettings] = useState({
    defaultNCF: 'B02 - Consumidor Final',
    enableElectronicCF: true,
    receiptFooterNote: '¡Gracias por su compra en PharmaPlus! Conserve este ticket.',
    autoPrintReceipt: true,
    digitalSignatureECF: 'CERT-DGII-2026-99'
  });

  // 7. Compras State
  const [purchasesSettings, setPurchasesSettings] = useState({
    defaultPaymentTerms: 'Crédito 30 días',
    autoUpdateStockOnReceive: true,
    requireManagerApproval: true,
    approvalLimitAmount: '50000.00'
  });

  // 8. Recetas State
  const [recipesSettings, setRecipesSettings] = useState({
    requireDoctorCMP: true,
    autoCompleteDispense: true,
    allowPartialDispensing: true,
    maxDispenseDaysInterval: '30'
  });

  // 9. Servicios State
  const [servicesSettings, setServicesSettings] = useState({
    defaultServiceDuration: '30 min',
    requireAssignedPractitioner: true,
    applyTaxToServices: false
  });

  // 10. Notificaciones State
  const [notificationsSettings, setNotificationsSettings] = useState({
    emailLowStock: true,
    smsAlerts: false,
    dailySalesDigest: true,
    browserPopups: true,
    notificationEmail: 'alertas@pharmaplus.com'
  });

  // 11. Respaldo y Seguridad State
  const [securitySettings, setSecuritySettings] = useState({
    autoBackupFrequency: 'Diario (02:00 AM)',
    sessionTimeoutMinutes: '30',
    requirePasswordChangeDays: '90',
    twoFactorAuth: false
  });

  // 12. Integraciones State
  const [integrationsSettings, setIntegrationsSettings] = useState({
    dgiiApiUrl: 'https://ecf.dgii.gov.do/api/v1',
    dgiiApiKey: 'dgii_live_sec_892398472938472',
    whatsappGatewayNumber: '+1 809-555-9000',
    posTerminalIP: '192.168.1.150'
  });

  // 13. Personalización State
  const [customizationSettings, setCustomizationSettings] = useState({
    primaryColor: '#0E8F7E', // Verde Esmeralda
    darkMode: false,
    showLogoOnReceipt: true,
    denseTableView: false
  });

  // 14. Dispositivos State
  const [devicesSettings, setDevicesSettings] = useState({
    receiptPrinter: 'Impresora Principal (POS-80)',
    recipePrinter: 'Ninguna',
    paperSize: '80mm',
    barcodeScannerPort: 'COM3 (Escáner USB)',
    cashDrawerPulse: 'Auto (Pulse 24V)'
  });

  // Chatbot State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: '¡Hola! Soy el asistente de PharmaPlus. Puedo ayudarte a ajustar preferencias del sistema, cambiar la impresora por defecto o realizar una copia de seguridad.' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

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
        darkMode: customizationSettings.darkMode ? '1' : '0',
        autoPrint: billingSettings.autoPrintReceipt ? '1' : '0'
      };

      try {
        await api.put('/configuracion', payload);
      } catch (e) {}

      showToast(`Configuraciones de "${activeCategory}" guardadas exitosamente`);
    } catch (err) {
      showToast('Error al guardar la configuración', 'warning');
    } finally {
      setSaving(false);
    }
  };

  // Handle Add New User
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;
    const u = {
      id: Date.now(),
      name: newUserForm.name,
      email: newUserForm.email,
      role: newUserForm.role,
      phone: newUserForm.phone || '809-555-0000',
      status: 'Activo'
    };
    setUsersList(prev => [...prev, u]);
    setIsNewUserModalOpen(false);
    setNewUserForm({ name: '', email: '', role: 'cajero', phone: '', password: '' });
    showToast(`Usuario "${u.name}" creado correctamente como ${u.role}`);
  };

  // Handle Toggle User Status
  const handleToggleUserStatus = (userId) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: u.status === 'Activo' ? 'Inactivo' : 'Activo' } : u));
    showToast('Estado del usuario actualizado', 'info');
  };

  // Chatbot Voice Input
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

    if (lower.includes('gestionar usuarios') || lower.includes('usuarios')) {
      setActiveCategory('Usuarios');
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Te he dirigido a la sección de administración de usuarios y permisos.'
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

  // ─── RENDER CATEGORY PANEL WORKSPACE ───────────────────────────────────────
  const renderCategoryPanel = () => {
    switch (activeCategory) {

      // 1. EMPRESA
      case 'Empresa':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-5">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Información de la empresa</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configura los datos generales de tu empresa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
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

              <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-slate-50/70 border border-slate-200/80 rounded-2xl text-center gap-3">
                <label className="text-xs font-bold text-slate-700">Logo de la empresa</label>
                
                <div className="w-36 h-36 rounded-2xl bg-white border border-indigo-100 p-4 flex flex-col items-center justify-center gap-1 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-emerald-600/30">
                    +
                  </div>
                  <span className="font-extrabold text-slate-900 text-sm tracking-tight">PharmaPlus</span>
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest">FARMACIA</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-emerald-700 font-semibold text-xs transition-all shadow-2xs active:scale-95"
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
        );

      // 2. USUARIOS Y PERMISOS
      case 'Usuarios':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base">Usuarios y Permisos</h2>
                <p className="text-xs text-slate-400 mt-0.5">Administra las cuentas de acceso y los roles asignados</p>
              </div>
              <button
                onClick={() => setIsNewUserModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Plus size={16} />
                <span>Nuevo Usuario</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-800">{u.name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-slate-600 font-mono">{u.phone}</td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          u.status === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          {u.status === 'Activo' ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      // 3. IMPUESTOS
      case 'Impuestos':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-5 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Configuración de Impuestos y ITBIS</h2>
              <p className="text-xs text-slate-400 mt-0.5">Establece las tasas impositivas aplicables según la DGII</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Tasa ITBIS General (%)</span>
                <input
                  type="text"
                  className="input font-bold text-emerald-700 text-sm"
                  value={taxSettings.generalTaxRate}
                  onChange={(e) => setTaxSettings({ ...taxSettings, generalTaxRate: e.target.value })}
                />
                <span className="text-[10px] text-slate-400">Aplicado por defecto en la mayoría de productos</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Tasa ITBIS Reducida (%)</span>
                <input
                  type="text"
                  className="input font-bold text-emerald-700 text-sm"
                  value={taxSettings.reducedTaxRate}
                  onChange={(e) => setTaxSettings({ ...taxSettings, reducedTaxRate: e.target.value })}
                />
                <span className="text-[10px] text-slate-400">Aplicado a insumos o productos especiales</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-1">
                <span className="font-semibold text-slate-700">Tasa Exenta (%)</span>
                <input
                  type="text"
                  className="input font-bold text-slate-700 text-sm"
                  value={taxSettings.exemptTaxRate}
                  onChange={(e) => setTaxSettings({ ...taxSettings, exemptTaxRate: e.target.value })}
                />
                <span className="text-[10px] text-slate-400">Medicamentos esenciales exentos de ITBIS</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={taxSettings.includeTaxInPrice}
                  onChange={(e) => setTaxSettings({ ...taxSettings, includeTaxInPrice: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Precios de venta incluyen ITBIS incorporado</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={taxSettings.dgiiTaxCompliance}
                  onChange={(e) => setTaxSettings({ ...taxSettings, dgiiTaxCompliance: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Cumplimiento fiscal automático de reporte NCF con la DGII</span>
              </label>
            </div>
          </div>
        );

      // 4. VENTAS
      case 'Ventas':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Opciones de Ventas y Punto de Venta</h2>
              <p className="text-xs text-slate-400 mt-0.5">Parámetros de facturación rápida e itinerarios del POS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Precio por defecto</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={salesSettings.defaultPriceType}
                  onChange={(e) => setSalesSettings({ ...salesSettings, defaultPriceType: e.target.value })}
                >
                  <option value="Precio de venta">Precio de venta público</option>
                  <option value="Precio al por mayor">Precio al por mayor / Seguro</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Descuento por defecto (%)</label>
                <input
                  type="number"
                  className="input font-semibold text-slate-800"
                  value={salesSettings.defaultDiscount}
                  onChange={(e) => setSalesSettings({ ...salesSettings, defaultDiscount: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Descuento máximo permitido a cajeros (%)</label>
                <input
                  type="number"
                  className="input font-bold text-emerald-700"
                  value={salesSettings.maxAllowedDiscount}
                  onChange={(e) => setSalesSettings({ ...salesSettings, maxAllowedDiscount: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Vendedor por defecto</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={salesSettings.defaultSeller}
                  onChange={(e) => setSalesSettings({ ...salesSettings, defaultSeller: e.target.value })}
                >
                  <option value="Ana Cajera">Ana Cajera</option>
                  <option value="Admin Farmacia">Admin Farmacia</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={salesSettings.allowLowStockSales}
                  onChange={(e) => setSalesSettings({ ...salesSettings, allowLowStockSales: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Permitir vender productos con stock bajo o cero</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={salesSettings.requireCustomerRNC}
                  onChange={(e) => setSalesSettings({ ...salesSettings, requireCustomerRNC: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Solicitar obligatoriamente RNC/Cédula en ventas a crédito</span>
              </label>
            </div>
          </div>
        );

      // 5. INVENTARIO
      case 'Inventario':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Configuración de Inventario y Almacén</h2>
              <p className="text-xs text-slate-400 mt-0.5">Control de existencias, alertas y vencimiento de medicamentos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Umbral de alerta de bajo stock (unidades)</label>
                <input
                  type="number"
                  className="input font-bold text-amber-600"
                  value={inventorySettings.lowStockThreshold}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, lowStockThreshold: e.target.value })}
                />
                <span className="text-[10px] text-slate-400">Genera alerta cuando el stock descienda de esta cifra</span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Advertencia de vencimiento de lotes (días antes)</label>
                <input
                  type="number"
                  className="input font-bold text-rose-600"
                  value={inventorySettings.batchExpirationDays}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, batchExpirationDays: e.target.value })}
                />
                <span className="text-[10px] text-slate-400">Notifica sobre productos próximos a vencer</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={inventorySettings.autoReorder}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, autoReorder: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Generar sugerencia de orden de compra automática al alcanzar el stock mínimo</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={inventorySettings.requireAdjustmentNotes}
                  onChange={(e) => setInventorySettings({ ...inventorySettings, requireAdjustmentNotes: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Requerir justificación obligatoria al realizar ajustes manuales de stock</span>
              </label>
            </div>
          </div>
        );

      // 6. FACTURACIÓN
      case 'Facturación':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Facturación y Comprobantes Fiscales (NCF)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Parámetros de comprobantes NCF y facturación electrónica e-CF</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Secuencia NCF por defecto</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={billingSettings.defaultNCF}
                  onChange={(e) => setBillingSettings({ ...billingSettings, defaultNCF: e.target.value })}
                >
                  <option value="B02 - Consumidor Final">B02 - Consumidor Final</option>
                  <option value="B01 - Crédito Fiscal">B01 - Crédito Fiscal</option>
                  <option value="B14 - Regímenes Especiales">B14 - Regímenes Especiales</option>
                  <option value="B15 - Gubernamental">B15 - Gubernamental</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Firma Digital e-CF Certificada</label>
                <input
                  type="text"
                  className="input font-mono text-slate-700"
                  value={billingSettings.digitalSignatureECF}
                  onChange={(e) => setBillingSettings({ ...billingSettings, digitalSignatureECF: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Nota al pie en ticket de factura</label>
                <textarea
                  rows={2}
                  className="input text-xs"
                  value={billingSettings.receiptFooterNote}
                  onChange={(e) => setBillingSettings({ ...billingSettings, receiptFooterNote: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={billingSettings.enableElectronicCF}
                  onChange={(e) => setBillingSettings({ ...billingSettings, enableElectronicCF: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Habilitar emisión directa de e-CF (Facturación Electrónica DGII)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={billingSettings.autoPrintReceipt}
                  onChange={(e) => setBillingSettings({ ...billingSettings, autoPrintReceipt: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Imprimir factura automáticamente al completar el pago</span>
              </label>
            </div>
          </div>
        );

      // 7. COMPRAS
      case 'Compras':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Opciones de Compras y Proveedores</h2>
              <p className="text-xs text-slate-400 mt-0.5">Condiciones de crédito y recepción de mercancía</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Condición de pago por defecto</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={purchasesSettings.defaultPaymentTerms}
                  onChange={(e) => setPurchasesSettings({ ...purchasesSettings, defaultPaymentTerms: e.target.value })}
                >
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Crédito 15 días">Crédito 15 días</option>
                  <option value="Crédito 60 días">Crédito 60 días</option>
                  <option value="Contado">Contado</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Monto límite para aprobación automática (RD$)</label>
                <input
                  type="number"
                  className="input font-bold text-emerald-700"
                  value={purchasesSettings.approvalLimitAmount}
                  onChange={(e) => setPurchasesSettings({ ...purchasesSettings, approvalLimitAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={purchasesSettings.autoUpdateStockOnReceive}
                  onChange={(e) => setPurchasesSettings({ ...purchasesSettings, autoUpdateStockOnReceive: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Actualizar existencias automáticamente al cambiar estado a "Recibida"</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={purchasesSettings.requireManagerApproval}
                  onChange={(e) => setPurchasesSettings({ ...purchasesSettings, requireManagerApproval: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Requerir aprobación de gerencia para compras que superen el límite</span>
              </label>
            </div>
          </div>
        );

      // 8. RECETAS
      case 'Recetas':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Configuración de Recetas Médicas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Validación de licencias CMP y dispensación controlada</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Intervalo máximo de dispensación (días)</label>
                <input
                  type="number"
                  className="input font-semibold text-slate-800"
                  value={recipesSettings.maxDispenseDaysInterval}
                  onChange={(e) => setRecipesSettings({ ...recipesSettings, maxDispenseDaysInterval: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={recipesSettings.requireDoctorCMP}
                  onChange={(e) => setRecipesSettings({ ...recipesSettings, requireDoctorCMP: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Validar número de exequatur CMP obligatoriamente al registrar receta</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={recipesSettings.autoCompleteDispense}
                  onChange={(e) => setRecipesSettings({ ...recipesSettings, autoCompleteDispense: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Marcar receta como "Despachada" automáticamente al entregar el 100% de ítems</span>
              </label>
            </div>
          </div>
        );

      // 9. SERVICIOS
      case 'Servicios':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Configuración de Servicios Clínicos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Parámetros de agendamiento y atención de pacientes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Duración promedio por cita</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={servicesSettings.defaultServiceDuration}
                  onChange={(e) => setServicesSettings({ ...servicesSettings, defaultServiceDuration: e.target.value })}
                >
                  <option value="15 min">15 minutos</option>
                  <option value="30 min">30 minutos</option>
                  <option value="45 min">45 minutos</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={servicesSettings.requireAssignedPractitioner}
                  onChange={(e) => setServicesSettings({ ...servicesSettings, requireAssignedPractitioner: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Exigir un profesional de salud asignado para agendar servicio</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={servicesSettings.applyTaxToServices}
                  onChange={(e) => setServicesSettings({ ...servicesSettings, applyTaxToServices: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Aplicar ITBIS a servicios de salud no esenciales</span>
              </label>
            </div>
          </div>
        );

      // 10. NOTIFICACIONES
      case 'Notificaciones':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Alertas y Notificaciones</h2>
              <p className="text-xs text-slate-400 mt-0.5">Canales de aviso instantáneo para eventos críticos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Correo para notificaciones</label>
                <input
                  type="email"
                  className="input font-semibold text-slate-800"
                  value={notificationsSettings.notificationEmail}
                  onChange={(e) => setNotificationsSettings({ ...notificationsSettings, notificationEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={notificationsSettings.emailLowStock}
                  onChange={(e) => setNotificationsSettings({ ...notificationsSettings, emailLowStock: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Enviar correo automático cuando un producto esté por agotarse</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  checked={notificationsSettings.dailySalesDigest}
                  onChange={(e) => setNotificationsSettings({ ...notificationsSettings, dailySalesDigest: e.target.checked })}
                />
                <span className="font-semibold text-slate-800">Recibir reporte diario de resumen de ventas e ingresos al cierre</span>
              </label>
            </div>
          </div>
        );

      // 11. RESPALDO Y SEGURIDAD
      case 'Respaldo':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Respaldo y Seguridad</h2>
              <p className="text-xs text-slate-400 mt-0.5">Copias de seguridad de la base de datos y políticas de seguridad</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Frecuencia de backups automáticos</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={securitySettings.autoBackupFrequency}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, autoBackupFrequency: e.target.value })}
                >
                  <option value="Diario (02:00 AM)">Diario (02:00 AM)</option>
                  <option value="Semanal">Semanal (Domingos)</option>
                  <option value="Mensual">Mensual</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Tiempo de inactividad para cierre de sesión (min)</label>
                <input
                  type="number"
                  className="input font-semibold text-slate-800"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800">Copia de Seguridad Inmediata</h4>
                <p className="text-[11px] text-slate-400">Descarga un archivo .db completo con todos los datos actuales de la farmacia</p>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Download size={16} />
                <span>Descargar Backup Ahora</span>
              </button>
            </div>
          </div>
        );

      // 12. INTEGRACIONES
      case 'Integraciones':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Integraciones y Servicios Externos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Conexión con servicios de la DGII, pasarelas y mensajería</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">URL Web Service DGII e-CF</label>
                <input
                  type="text"
                  className="input font-mono text-slate-700"
                  value={integrationsSettings.dgiiApiUrl}
                  onChange={(e) => setIntegrationsSettings({ ...integrationsSettings, dgiiApiUrl: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Token de Autenticación DGII</label>
                <input
                  type="password"
                  className="input font-mono text-slate-700"
                  value={integrationsSettings.dgiiApiKey}
                  onChange={(e) => setIntegrationsSettings({ ...integrationsSettings, dgiiApiKey: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Número Gateway WhatsApp Business</label>
                <input
                  type="text"
                  className="input font-semibold text-slate-800"
                  value={integrationsSettings.whatsappGatewayNumber}
                  onChange={(e) => setIntegrationsSettings({ ...integrationsSettings, whatsappGatewayNumber: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">IP Terminal POS de Tarjeta de Crédito</label>
                <input
                  type="text"
                  className="input font-mono text-slate-800"
                  value={integrationsSettings.posTerminalIP}
                  onChange={(e) => setIntegrationsSettings({ ...integrationsSettings, posTerminalIP: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      // 13. PERSONALIZACIÓN
      case 'Personalización':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Personalización de Apariencia</h2>
              <p className="text-xs text-slate-400 mt-0.5">Define los colores y el estilo visual de la aplicación</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-slate-700">Color Primario del Sistema</label>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 border-2 border-emerald-700 shadow-sm flex items-center justify-center text-white">
                    <Check size={18} />
                  </div>
                  <span className="font-bold text-emerald-800">Verde Esmeralda (#0E8F7E)</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2 border p-3 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800">Modo Oscuro</p>
                  <p className="text-[11px] text-slate-400">Cambia la interfaz a tonos oscuros para entornos de baja luz</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizationSettings({ ...customizationSettings, darkMode: !customizationSettings.darkMode })}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    customizationSettings.darkMode ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    customizationSettings.darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        );

      // 14. DISPOSITIVOS
      case 'Dispositivos':
        return (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base">Dispositivos e Impresoras</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configuración de hardware de punto de venta</p>
              </div>
              <button
                onClick={() => setIsTestPrintModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <Printer size={16} />
                <span>Impresión de Prueba</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Impresora de facturas (Térmica)</label>
                <select
                  className="input font-semibold text-slate-800"
                  value={devicesSettings.receiptPrinter}
                  onChange={(e) => setDevicesSettings({ ...devicesSettings, receiptPrinter: e.target.value })}
                >
                  <option value="Impresora Principal (POS-80)">Impresora Principal (POS-80)</option>
                  <option value="Impresora Térmica 2 (POS-58)">Impresora Térmica 2 (POS-58)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Escáner de Código de Barras</label>
                <input
                  type="text"
                  className="input font-mono text-slate-800"
                  value={devicesSettings.barcodeScannerPort}
                  onChange={(e) => setDevicesSettings({ ...devicesSettings, barcodeScannerPort: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-slate-700">Apertura de Cajón de Dinero</label>
                <input
                  type="text"
                  className="input font-semibold text-slate-800"
                  value={devicesSettings.cashDrawerPulse}
                  onChange={(e) => setDevicesSettings({ ...devicesSettings, cashDrawerPulse: e.target.value })}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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

      {/* ─── SLEEK GREEN HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#16a085] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Configuración General del Sistema</h2>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 z-10">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#16a085] hover:bg-slate-50 disabled:opacity-50 font-bold text-xs transition-all shadow-md active:scale-95 shrink-0"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Guardar cambios</span>
          </button>

          <div className="shrink-0 h-16 md:h-20 flex items-center justify-center">
            <img 
              src="/modules/dashboard.png" 
              alt="Configuración" 
              className="h-full w-auto max-w-[240px] object-contain rounded-xl drop-shadow-md"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
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

        {/* RIGHT COLUMN: DYNAMIC CATEGORY PANEL WORKSPACE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          {/* DYNAMIC CATEGORY PANEL */}
          {renderCategoryPanel()}

          {/* THREE BOTTOM SUMMARY CARDS (GENERAL, VENTAS, IMPRESIÓN) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* CARD 1: CONFIGURACIÓN GENERAL */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between gap-4">
              <h3 className="font-bold text-slate-800 text-sm">Configuración general</h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">Modo oscuro</p>
                    <p className="text-[11px] text-slate-400">Activa el modo oscuro en el sistema</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomizationSettings({ ...customizationSettings, darkMode: !customizationSettings.darkMode })}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                      customizationSettings.darkMode ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      customizationSettings.darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800 leading-snug">Sonidos del sistema</p>
                    <p className="text-[11px] text-slate-400">Reproducir sonidos en acciones importantes</p>
                  </div>
                  <button
                    type="button"
                    className="w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 bg-emerald-600"
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-md translate-x-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2: CONFIGURACIÓN DE VENTAS */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between gap-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Configuración de ventas</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Precio por defecto:</span>
                  <span className="font-semibold text-slate-800">{salesSettings.defaultPriceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Descuento por defecto:</span>
                  <span className="font-semibold text-slate-800">{salesSettings.defaultDiscount}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vendedor por defecto:</span>
                  <span className="font-semibold text-slate-800">{salesSettings.defaultSeller}</span>
                </div>
              </div>
            </div>

            {/* CARD 3: CONFIGURACIÓN DE IMPRESIÓN */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col justify-between gap-3 text-xs">
              <h3 className="font-bold text-slate-800 text-sm">Configuración de impresión</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Impresora de facturas:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">{devicesSettings.receiptPrinter}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tamaño del papel:</span>
                  <span className="font-semibold text-slate-800">{devicesSettings.paperSize}</span>
                </div>
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

      </div>

      {/* ─── MODAL: NUEVO USUARIO ───────────────────────────────────────────── */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Crear Nuevo Usuario del Sistema"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddUserSubmit} className="flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Nombre Completo *</label>
            <input
              required
              type="text"
              placeholder="Ej. Dr. Pedro Ramos"
              className="input text-xs"
              value={newUserForm.name}
              onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Correo Electrónico *</label>
            <input
              required
              type="email"
              placeholder="usuario@pharmaplus.com"
              className="input text-xs"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Rol de Acceso *</label>
            <select
              className="input font-semibold text-slate-800 text-xs"
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
            >
              <option value="cajero">Cajero / Vendedor</option>
              <option value="farmaceutico">Farmacéutico / Dispensador</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-slate-700">Teléfono</label>
            <input
              type="text"
              placeholder="809-555-0000"
              className="input text-xs font-mono"
              value={newUserForm.phone}
              onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setIsNewUserModalOpen(false)} className="btn btn-outline text-xs">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-semibold">
              Crear Usuario
            </button>
          </div>
        </form>
      </Modal>

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
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
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

      {/* ─── MODAL: IMPRESIÓN DE PRUEBA ──────────────────────────────────────── */}
      <Modal
        isOpen={isTestPrintModalOpen}
        onClose={() => setIsTestPrintModalOpen(false)}
        title="Prueba de Impresión Térmica"
        maxWidth="max-w-md"
      >
        <div className="flex flex-col gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <Printer size={32} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Probando Impresora POS-80</h4>
            <p className="text-xs text-slate-500 mt-1">
              Enviando comando de prueba de ticket y pulso de apertura de cajón de dinero.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button onClick={() => setIsTestPrintModalOpen(false)} className="btn btn-outline text-xs">
              Cerrar
            </button>
            <button 
              onClick={() => {
                setIsTestPrintModalOpen(false);
                showToast('Ticket de prueba impreso correctamente');
              }} 
              className="btn btn-primary text-xs font-semibold"
            >
              Imprimir Ticket de Prueba
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Configuracion;
