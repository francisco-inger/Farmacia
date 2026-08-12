import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Network, ShieldCheck, Zap, Key, RefreshCw, CheckCircle2, AlertCircle, 
  Plus, Trash2, Send, ExternalLink, Activity, Server, Radio, Database,
  Search, ArrowRight, Shield, Layers, FileCode2, Copy, Check
} from 'lucide-react';

const Integraciones = () => {
  const [activeTab, setActiveTab] = useState('conectores');
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [toast, setToast] = useState(null);

  // 1. ARS Verification State
  const [arsForm, setArsForm] = useState({
    ars_id: 'humano',
    member_id: '001-1827364-5',
    product_name: 'Amoxicilina 500mg (Caja 30 tabletas)',
    price: '650.00'
  });
  const [coverageResult, setCoverageResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // 2. Webhooks State
  const [webhooks, setWebhooks] = useState([]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', event: 'ars.payment_confirmed' });
  const [testingWebhookId, setTestingWebhookId] = useState(null);

  // 3. API Keys State
  const [apiKeys, setApiKeys] = useState([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyClientName, setKeyClientName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connRes, whRes, keysRes] = await Promise.all([
        api.get('/integraciones/connectors'),
        api.get('/integraciones/webhooks'),
        api.get('/integraciones/api-keys')
      ]);
      setConnectors(connRes.data?.data || connRes.data || []);
      setWebhooks(whRes.data?.data || whRes.data || []);
      setApiKeys(keysRes.data?.data || keysRes.data || []);
    } catch (err) {
      console.error('Error cargando integraciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync Connector
  const handleSyncConnector = async (connector) => {
    setSyncingId(connector.id);
    try {
      const res = await api.post('/integraciones/sync-catalog', { connector_id: connector.id });
      showNotification(res.data?.message || `Sincronización con ${connector.name} completada.`, 'success');
      fetchData();
    } catch (err) {
      showNotification('Error al sincronizar con el conector.', 'error');
    } finally {
      setSyncingId(null);
    }
  };

  // Verify ARS Coverage
  const handleVerifyCoverage = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const res = await api.post('/integraciones/verify-coverage', arsForm);
      setCoverageResult(res.data?.data || res.data);
      showNotification('Validación de ARS procesada en tiempo real.', 'success');
    } catch (err) {
      showNotification('Error procesando verificación de seguro.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  // Create Webhook
  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/integraciones/webhooks', webhookForm);
      showNotification('Webhook registrado exitosamente.', 'success');
      setShowWebhookModal(false);
      setWebhookForm({ name: '', url: '', event: 'ars.payment_confirmed' });
      fetchData();
    } catch (err) {
      showNotification('Error al crear webhook.', 'error');
    }
  };

  // Delete Webhook
  const handleDeleteWebhook = async (id) => {
    try {
      await api.delete(`/integraciones/webhooks/${id}`);
      showNotification('Webhook eliminado.', 'info');
      fetchData();
    } catch (err) {
      showNotification('Error eliminando webhook.', 'error');
    }
  };

  // Test Webhook
  const handleTestWebhook = async (wh) => {
    setTestingWebhookId(wh.id);
    try {
      const res = await api.post(`/integraciones/webhooks/${wh.id}/test`);
      showNotification(res.data?.message || 'Prueba de Webhook ejecutada con éxito (HTTP 200).', 'success');
    } catch (err) {
      showNotification('Fallo en el envío del Webhook de prueba.', 'error');
    } finally {
      setTestingWebhookId(null);
    }
  };

  // Create API Key
  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    try {
      await api.post('/integraciones/api-keys', { clientName: keyClientName });
      showNotification('Nueva API Key de integración generada.', 'success');
      setShowKeyModal(false);
      setKeyClientName('');
      fetchData();
    } catch (err) {
      showNotification('Error generando API Key.', 'error');
    }
  };

  // Revoke API Key
  const handleRevokeApiKey = async (id) => {
    try {
      await api.delete(`/integraciones/api-keys/${id}`);
      showNotification('API Key revocada correctamente.', 'info');
      fetchData();
    } catch (err) {
      showNotification('Error revocando API Key.', 'error');
    }
  };

  const handleCopyKey = (keyText, id) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
    showNotification('Clave copiada al portapapeles', 'info');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl text-white font-medium flex items-center gap-2 transition-all ${
          toast.type === 'error' ? 'bg-rose-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-teal-600'
        }`}>
          <CheckCircle2 size={18} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ─── SLEEK GREEN HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-[#16a085] rounded-2xl p-4 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
        <div className="flex items-center gap-3 z-10">
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Integraciones Externas & Servicios Cloud</h2>
        </div>
        
        <div className="shrink-0 h-14 overflow-hidden rounded-xl border border-white/30 shadow-sm z-10">
          <img 
            src="/modules/reportes.png" 
            alt="Integraciones" 
            className="h-full w-48 md:w-60 object-cover rounded-xl"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Radio size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conectores ARS</p>
            <h3 className="text-2xl font-bold text-slate-800">4 Aseguradoras</h3>
            <p className="text-xs text-emerald-600 font-medium">Validación en tiempo real</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Server size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DGII e-CF</p>
            <h3 className="text-2xl font-bold text-slate-800">Facturación E.</h3>
            <p className="text-xs text-blue-600 font-medium">Firma electrónica OK</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Webhooks Activos</p>
            <h3 className="text-2xl font-bold text-slate-800">{webhooks.length} Endpoints</h3>
            <p className="text-xs text-amber-600 font-medium">Eventos en streaming</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Key size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Llaves API</p>
            <h3 className="text-2xl font-bold text-slate-800">{apiKeys.length} Llaves</h3>
            <p className="text-xs text-purple-600 font-medium">Acceso externo seguro</p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('conectores')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === 'conectores'
              ? 'border-[#0E8F7E] text-[#0E8F7E] bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Network size={18} />
          <span>Conectores de Red ({connectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cobertura')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === 'cobertura'
              ? 'border-[#0E8F7E] text-[#0E8F7E] bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Validación ARS Cobertura</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'border-[#0E8F7E] text-[#0E8F7E] bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Zap size={18} />
          <span>Webhooks & Eventos ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('apikeys')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold text-sm transition border-b-2 whitespace-nowrap ${
            activeTab === 'apikeys'
              ? 'border-[#0E8F7E] text-[#0E8F7E] bg-teal-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Key size={18} />
          <span>API Keys Externas ({apiKeys.length})</span>
        </button>
      </div>

      {/* TAB 1: CONECTORES */}
      {activeTab === 'conectores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Conectores con Terceros (ARS, Laboratorios y DGII)</h2>
            <span className="text-xs text-slate-500">Protocolo HTTPS / REST / JSON Schema</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectors.map((c) => (
              <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      c.type === 'ars' ? 'bg-teal-100 text-teal-700' : c.type === 'tax' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {c.type === 'ars' ? 'ARS Aseguradora' : c.type === 'tax' ? 'Impuestos DGII' : 'Distribuidor / Lab'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Online ({c.latency}ms)
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base">{c.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{c.details}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Última sincro: <strong className="text-slate-600">{c.lastSync}</strong></span>
                  <button
                    onClick={() => handleSyncConnector(c)}
                    disabled={syncingId === c.id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#0E8F7E] hover:text-teal-700 bg-teal-50 hover:bg-teal-100/80 px-3 py-1.5 rounded-lg transition"
                  >
                    <RefreshCw size={14} className={syncingId === c.id ? 'animate-spin' : ''} />
                    <span>{syncingId === c.id ? 'Sincronizando...' : 'Sincronizar'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COBERTURA ARS */}
      {activeTab === 'cobertura' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-[#0E8F7E] rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Verificador de Cobertura ARS</h2>
                <p className="text-xs text-slate-500">Consulta la eligibilidad del paciente y calcula el copago en tiempo real.</p>
              </div>
            </div>

            <form onSubmit={handleVerifyCoverage} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Aseguradora (ARS)</label>
                <select
                  value={arsForm.ars_id}
                  onChange={e => setArsForm({ ...arsForm, ars_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                >
                  <option value="humano">ARS Humano</option>
                  <option value="palic">ARS Primera (Palic)</option>
                  <option value="senasa">ARS SeNaSa</option>
                  <option value="universal">ARS Universal</option>
                  <option value="monumental">ARS Monumental</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Cédula o Número de Carnet Afiliado</label>
                <input
                  type="text"
                  value={arsForm.member_id}
                  onChange={e => setArsForm({ ...arsForm, member_id: e.target.value })}
                  placeholder="Ej: 001-1827364-5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Medicamento / Concepto</label>
                  <input
                    type="text"
                    value={arsForm.product_name}
                    onChange={e => setArsForm({ ...arsForm, product_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Precio Total (RD$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={arsForm.price}
                    onChange={e => setArsForm({ ...arsForm, price: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-3 bg-[#0E8F7E] hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
              >
                <Search size={18} />
                <span>{verifying ? 'Consultando en línea...' : 'Consultar Cobertura ARS'}</span>
              </button>
            </form>
          </div>

          {/* Result Panel */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">Respuesta de Autorización ARS</span>
                {coverageResult && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    coverageResult.eligible ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {coverageResult.eligible ? 'APROBADO' : 'DENEGADO'}
                  </span>
                )}
              </div>

              {coverageResult ? (
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Código Autorización:</span>
                      <strong className="text-teal-300 font-mono text-sm">{coverageResult.authorization_code || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Afiliado Cédula:</span>
                      <strong className="text-white">{coverageResult.member_id}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Producto:</span>
                      <strong className="text-white">{coverageResult.product}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-teal-950/60 border border-teal-800/50 rounded-xl space-y-1">
                      <span className="text-xs text-teal-300">Cobertura ARS ({coverageResult.coverage_percent}%):</span>
                      <h4 className="text-xl font-bold text-teal-400">RD$ {coverageResult.coverage_amount?.toFixed(2)}</h4>
                    </div>

                    <div className="p-4 bg-amber-950/60 border border-amber-800/50 rounded-xl space-y-1">
                      <span className="text-xs text-amber-300">Copago del Paciente:</span>
                      <h4 className="text-xl font-bold text-amber-400">RD$ {coverageResult.patient_copay?.toFixed(2)}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic bg-slate-800 p-3 rounded-lg border border-slate-700">
                    💡 {coverageResult.message}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-2">
                  <Activity size={48} className="text-slate-600 animate-pulse" />
                  <p className="text-sm">Completa el formulario y presiona <strong>Consultar Cobertura ARS</strong> para obtener la respuesta inmediata.</p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800 flex justify-between">
              <span>SaaS PharmaPlus API v1</span>
              <span>Encriptación TLS 1.3 / SSL</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Webhooks y Suscripción a Eventos</h2>
              <p className="text-xs text-slate-500">Recibe notificaciones en tiempo real cuando ocurra un evento en la farmacia.</p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="flex items-center gap-2 bg-[#0E8F7E] hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition"
            >
              <Plus size={16} />
              <span>Registrar Webhook</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">URL de Destino</th>
                  <th className="p-4">Evento Suscrito</th>
                  <th className="p-4">Secret Key</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {webhooks.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-800">{w.name}</td>
                    <td className="p-4 font-mono text-xs text-blue-600 max-w-xs truncate">{w.url}</td>
                    <td className="p-4">
                      <span className="bg-teal-50 text-[#0E8F7E] text-xs font-semibold px-2.5 py-1 rounded-md border border-teal-200">
                        {w.event}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">{w.secret}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleTestWebhook(w)}
                        disabled={testingWebhookId === w.id}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                      >
                        {testingWebhookId === w.id ? 'Probando...' : 'Probar'}
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(w.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: API KEYS */}
      {activeTab === 'apikeys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">API Keys para Integraciones Externas</h2>
              <p className="text-xs text-slate-500">Claves de acceso seguro para conectar aplicaciones móviles, ERPs externos o e-commerce.</p>
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-2 bg-[#0E8F7E] hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition"
            >
              <Plus size={16} />
              <span>Generar Nueva API Key</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiKeys.map((k) => (
              <div key={k.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-base">{k.clientName}</h3>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                    ACTIVA
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900 text-teal-400 font-mono text-xs p-3 rounded-xl justify-between">
                  <span className="truncate">{k.apiKey}</span>
                  <button
                    onClick={() => handleCopyKey(k.apiKey, k.id)}
                    className="text-slate-400 hover:text-white transition p-1"
                    title="Copiar API Key"
                  >
                    {copiedKeyId === k.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <span>Creada: <strong>{k.created}</strong></span>
                  <button
                    onClick={() => handleRevokeApiKey(k.id)}
                    className="text-rose-600 hover:underline font-semibold"
                  >
                    Revocar Clave
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Webhook */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Registrar Nuevo Webhook</h3>
            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Nombre / Identificador</label>
                <input
                  type="text"
                  value={webhookForm.name}
                  onChange={e => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  placeholder="Ej: Notificación de Venta POS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">URL de Destino (Endpoint)</label>
                <input
                  type="url"
                  value={webhookForm.url}
                  onChange={e => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  placeholder="https://mitienda.com/webhooks"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Evento a Suscribir</label>
                <select
                  value={webhookForm.event}
                  onChange={e => setWebhookForm({ ...webhookForm, event: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                >
                  <option value="ars.payment_confirmed">ars.payment_confirmed (Pago ARS)</option>
                  <option value="sale.created">sale.created (Venta realizada)</option>
                  <option value="inventory.updated">inventory.updated (Cambio en stock)</option>
                  <option value="dgii.invoice_accepted">dgii.invoice_accepted (Factura aprobada)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E8F7E] hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow"
                >
                  Guardar Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Generar API Key Externa</h3>
            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Nombre del Cliente / Sistema</label>
                <input
                  type="text"
                  value={keyClientName}
                  onChange={e => setKeyClientName(e.target.value)}
                  placeholder="Ej: App Móvil de Clientes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#0E8F7E]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 text-slate-600 text-sm font-semibold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0E8F7E] hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow"
                >
                  Generar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integraciones;
