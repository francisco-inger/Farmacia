import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Network, ShieldCheck, Zap, Bot, FileCode, RefreshCw, CheckCircle, 
  AlertCircle, Building2, CreditCard, Send, Search, Sparkles, ArrowRight,
  Database, Server, ExternalLink, Code
} from 'lucide-react';

const Integraciones = () => {
  const [activeTab, setActiveTab] = useState('connectors');
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Estado para verificación ARS
  const [arsForm, setArsForm] = useState({
    cardNumber: 'HUM-987654',
    insuranceProvider: 'ARS Humano',
    totalAmount: '1250'
  });
  const [arsResult, setArsResult] = useState(null);

  // Estado para consulta DGII
  const [dgiiRnc, setDgiiRnc] = useState('101123456');
  const [dgiiResult, setDgiiResult] = useState(null);

  // Estado para Webhooks
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ name: '', event_type: 'sale.created', target_url: '' });

  // Estado para Transformador IA de Esquemas
  const [aiJsonInput, setAiJsonInput] = useState(`[
  {
    "cod_prod": "PAR-500-LAB",
    "nombre_med": "Paracetamol 500mg Tab",
    "principio_activo": "Paracetamol",
    "costo": 45.00,
    "precio": 75.00,
    "existencia": 250
  }
]`);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Estado para especificación OpenAPI
  const [openApiSpec, setOpenApiSpec] = useState(null);

  useEffect(() => {
    fetchConnectors();
    fetchWebhooks();
    fetchOpenApiSpec();
  }, []);

  const fetchConnectors = async () => {
    try {
      const res = await api.get('/integraciones/connectors');
      if (res.success) setConnectors(res.data);
    } catch (err) {
      console.error('Error cargando conectores:', err);
    }
  };

  const fetchWebhooks = async () => {
    try {
      const res = await api.get('/integraciones/webhooks');
      if (res.success) setWebhooks(res.data);
    } catch (err) {
      console.error('Error cargando webhooks:', err);
    }
  };

  const fetchOpenApiSpec = async () => {
    try {
      const res = await api.get('/integraciones/docs/openapi');
      setOpenApiSpec(res);
    } catch (err) {
      console.error('Error cargando spec OpenAPI:', err);
    }
  };

  const handleSyncConnector = async (connectorId) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/integraciones/connectors/${connectorId}/sync`);
      if (res.success) {
        setMessage({ type: 'success', text: `Sincronización exitosa: ${res.data.syncedItemsCount} productos procesados.` });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error al sincronizar conector' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyARS = async (e) => {
    e.preventDefault();
    setLoading(true);
    setArsResult(null);
    try {
      const amountCents = Math.round(parseFloat(arsForm.totalAmount || 0) * 100);
      const res = await api.post('/integraciones/insurance/verify', {
        cardNumber: arsForm.cardNumber,
        insuranceProvider: arsForm.insuranceProvider,
        totalAmountCents: amountCents
      });
      if (res.success) {
        setArsResult(res.data);
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error en validación ARS' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDGII = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDgiiResult(null);
    try {
      const res = await api.post('/integraciones/dgii/verify-rnc', { rnc: dgiiRnc });
      if (res.success) setDgiiResult(res.data);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error consultando DGII' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!newWebhook.name || !newWebhook.target_url) return;
    try {
      const res = await api.post('/integraciones/webhooks', newWebhook);
      if (res.success) {
        setWebhooks([res.data, ...webhooks]);
        setNewWebhook({ name: '', event_type: 'sale.created', target_url: '' });
        setMessage({ type: 'success', text: 'Webhook registrado correctamente.' });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error registrando webhook' });
    }
  };

  const handleTriggerWebhook = async (webhookId) => {
    try {
      const res = await api.post(`/integraciones/webhooks/${webhookId}/trigger`, { test: true });
      if (res.success) {
        setMessage({ type: 'success', text: `Evento enviado a ${res.data.targetUrl}. Respuesta HTTP 200 OK.` });
      }
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error al disparar webhook' });
    }
  };

  const handleMapSchemaAI = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      let parsedInput;
      try {
        parsedInput = JSON.parse(aiJsonInput);
      } catch (e) {
        throw new Error('El JSON ingresado no es válido');
      }

      const res = await api.post('/integraciones/ai/map-schema', {
        sampleData: parsedInput,
        targetModel: 'product'
      });
      if (res.success) setAiResult(res.data);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Error en transformador de IA' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-[#1F2933]">
      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1B3A4B] to-[#0E8F7E] p-6 rounded-2xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Network size={28} className="text-[#0E8F7E] bg-white rounded-lg p-1" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading">API Gateway e Integraciones Externas</h1>
              <p className="text-xs text-white/80 mt-1">
                Conexión en tiempo real con Laboratorios, Aseguradoras ARS, DGII y Webhooks externos.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md text-xs font-semibold">
          <Server size={16} />
          <span>Estado del Gateway: </span>
          <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
            ● 100% Operativo
          </span>
        </div>
      </div>

      {/* Alertas */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-3 text-sm font-medium">
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold underline">Cerrar</button>
        </div>
      )}

      {/* Tabs de Navegación */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'connectors'
              ? 'bg-[#0E8F7E] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 size={18} />
          <span>Conectores ({connectors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ars')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'ars'
              ? 'bg-[#0E8F7E] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Validación ARS y DGII</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'webhooks'
              ? 'bg-[#0E8F7E] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Zap size={18} />
          <span>Webhooks ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'ai'
              ? 'bg-[#0E8F7E] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Sparkles size={18} />
          <span>Mapeador IA Groq</span>
        </button>

        <button
          onClick={() => setActiveTab('openapi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'openapi'
              ? 'bg-[#0E8F7E] text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileCode size={18} />
          <span>OpenAPI / Swagger</span>
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: CONECTORES */}
      {activeTab === 'connectors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connectors.map((c) => (
            <div key={c.connector_id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-teal-50 text-[#0E8F7E] rounded-md mb-2">
                    {c.provider_type === 'lab' ? 'Laboratorio / Distribuidor' : c.provider_type === 'ars' ? 'Aseguradora ARS' : 'Servicios Fiscales DGII'}
                  </span>
                  <h3 className="text-lg font-bold text-[#1B3A4B]">{c.name}</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">{c.endpoint_url}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {c.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                <div>
                  <span className="font-semibold">Frecuencia Sync: </span>
                  <span>{c.config?.syncFrequencyHours || 12} hrs</span>
                </div>
                <button
                  onClick={() => handleSyncConnector(c.connector_id)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E8F7E] text-white rounded-lg font-medium hover:bg-[#0c7a6c] transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: VALIDACIÓN ARS Y DGII */}
      {activeTab === 'ars' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Validador ARS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <ShieldCheck className="text-[#0E8F7E]" size={22} />
              <h2 className="text-lg font-bold text-[#1B3A4B]">Consulta Cobertura ARS</h2>
            </div>

            <form onSubmit={handleVerifyARS} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Aseguradora (ARS)</label>
                <select 
                  value={arsForm.insuranceProvider} 
                  onChange={(e) => setArsForm({ ...arsForm, insuranceProvider: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E8F7E] focus:outline-none"
                >
                  <option value="ARS Humano">ARS Humano</option>
                  <option value="ARS Palic">ARS Palic (Primera)</option>
                  <option value="Senasa">Senasa Ley / Subsidiado</option>
                  <option value="ARS Universal">ARS Universal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Número de Carnet / Afiliado</label>
                <input
                  type="text"
                  value={arsForm.cardNumber}
                  onChange={(e) => setArsForm({ ...arsForm, cardNumber: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E8F7E] focus:outline-none"
                  placeholder="ej. HUM-987654"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Monto Total de Receta (RD$)</label>
                <input
                  type="number"
                  value={arsForm.totalAmount}
                  onChange={(e) => setArsForm({ ...arsForm, totalAmount: e.target.value })}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E8F7E] focus:outline-none"
                  placeholder="ej. 1250"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0E8F7E] text-white rounded-xl font-bold hover:bg-[#0c7a6c] transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Verificar Cobertura en Tiempo Real</span>
              </button>
            </form>

            {arsResult && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-900">
                <div className="flex items-center justify-between font-bold border-b border-emerald-200 pb-2">
                  <span>Código Autorización: {arsResult.authorizationCode}</span>
                  <span className="bg-emerald-200 px-2 py-0.5 rounded text-[10px]">APROBADO</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div><strong>Paciente:</strong> {arsResult.patientName}</div>
                  <div><strong>Cobertura:</strong> {arsResult.coveragePercent}%</div>
                  <div><strong>Monto Cubierto:</strong> RD$ {(arsResult.coveredAmountCents / 100).toFixed(2)}</div>
                  <div><strong>Diferencia a Pagar:</strong> RD$ {(arsResult.patientPayCents / 100).toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Validador DGII */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Building2 className="text-[#1B3A4B]" size={22} />
              <h2 className="text-lg font-bold text-[#1B3A4B]">Consulta RNC / DGII</h2>
            </div>

            <form onSubmit={handleVerifyDGII} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">RNC / Cédula del Contribuyente</label>
                <input
                  type="text"
                  value={dgiiRnc}
                  onChange={(e) => setDgiiRnc(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B3A4B] focus:outline-none"
                  placeholder="ej. 101123456"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#1B3A4B] text-white rounded-xl font-bold hover:bg-[#142c39] transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Consultar RNC en DGII</span>
              </button>
            </form>

            {dgiiResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                <div className="font-bold border-b border-blue-200 pb-2">
                  <span>{dgiiResult.taxpayerName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div><strong>Nombre Comercial:</strong> {dgiiResult.tradeName}</div>
                  <div><strong>Estado:</strong> {dgiiResult.status}</div>
                  <div><strong>Régimen:</strong> {dgiiResult.taxRegime}</div>
                  <div><strong>RNC:</strong> {dgiiResult.rnc}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-[#1B3A4B] mb-4">Registrar Nuevo Webhook External</h2>
            <form onSubmit={handleCreateWebhook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nombre del Webhook"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                className="p-2.5 text-sm border border-gray-300 rounded-xl"
                required
              />
              <select
                value={newWebhook.event_type}
                onChange={(e) => setNewWebhook({ ...newWebhook, event_type: e.target.value })}
                className="p-2.5 text-sm border border-gray-300 rounded-xl"
              >
                <option value="sale.created">Venta Realizada (sale.created)</option>
                <option value="stock.updated">Inventario Actualizado (stock.updated)</option>
                <option value="ars.payment_confirmed">Pago ARS Confirmado (ars.payment_confirmed)</option>
              </select>
              <input
                type="url"
                placeholder="https://tu-api.com/webhook"
                value={newWebhook.target_url}
                onChange={(e) => setNewWebhook({ ...newWebhook, target_url: e.target.value })}
                className="p-2.5 text-sm border border-gray-300 rounded-xl"
                required
              />
              <button
                type="submit"
                className="md:col-span-3 py-2.5 bg-[#0E8F7E] text-white font-bold rounded-xl hover:bg-[#0c7a6c] transition-colors"
              >
                + Guardar Webhook
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[#1B3A4B] font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Evento</th>
                  <th className="p-4">URL Destino</th>
                  <th className="p-4">Secreto HMAC</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {webhooks.map((w) => (
                  <tr key={w.webhook_id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">{w.name}</td>
                    <td className="p-4"><span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-mono">{w.event_type}</span></td>
                    <td className="p-4 font-mono text-gray-500 truncate max-w-xs">{w.target_url}</td>
                    <td className="p-4 font-mono text-gray-400">{w.secret?.substring(0, 12)}...</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleTriggerWebhook(w.webhook_id)}
                        className="px-3 py-1.5 bg-teal-50 text-[#0E8F7E] rounded-lg font-bold hover:bg-teal-100 transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Send size={12} />
                        <span>Probar Evento</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 4: MAPEADOR IA GROQ */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="text-[#0E8F7E]" size={22} />
              <h2 className="text-lg font-bold text-[#1B3A4B]">Transformador de Esquemas (IA Groq)</h2>
            </div>
            <p className="text-xs text-gray-600">
              Pega cualquier JSON heterogéneo recibido de un distribuidor o laboratorio externo. La IA detectará automáticamente los campos y los mapeará al estándar PharmaPlus.
            </p>

            <textarea
              rows={10}
              value={aiJsonInput}
              onChange={(e) => setAiJsonInput(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E8F7E] focus:outline-none"
            />

            <button
              onClick={handleMapSchemaAI}
              disabled={aiLoading}
              className="w-full py-2.5 bg-gradient-to-r from-[#1B3A4B] to-[#0E8F7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {aiLoading ? <RefreshCw size={16} className="animate-spin" /> : <Bot size={16} />}
              <span>Mapear Esquema con Inteligencia Artificial</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#1B3A4B] border-b border-gray-100 pb-3">Resultado Estandarizado SaaS</h2>
            {aiResult ? (
              <div className="space-y-4">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-[#0E8F7E] font-medium">
                  Confianza de Mapeo IA: <strong>{(aiResult.confidenceScore * 100).toFixed(0)}%</strong> ({aiResult.engine || 'Llama 3.3 Versatile'})
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Mapeo de Campos Detectado:</h4>
                  <pre className="p-3 bg-gray-900 text-teal-300 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(aiResult.mappedFields, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-1">Objeto Estandarizado Final:</h4>
                  <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(aiResult.standardOutput, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 text-xs">
                <Code size={40} className="mb-2 stroke-1" />
                <span>Ejecuta el transformador para ver el esquema convertido.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 5: OPENAPI / SWAGGER */}
      {activeTab === 'openapi' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="text-[#0E8F7E]" size={22} />
              <h2 className="text-lg font-bold text-[#1B3A4B]">Especificación OpenAPI 3.0 (API Gateway)</h2>
            </div>
            <a
              href="http://localhost:3001/api/integraciones/docs/openapi"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-[#0E8F7E] flex items-center gap-1 hover:underline"
            >
              <span>Ver JSON crudo</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <pre className="p-4 bg-gray-900 text-gray-100 rounded-2xl text-xs font-mono overflow-x-auto max-h-96">
            {JSON.stringify(openApiSpec, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Integraciones;
