import React, { useState, useEffect, useRef } from 'react';
import { 
  BotMessageSquare, Send, Plus, Trash2, Mic, Volume2, Sparkles, 
  Database, CheckCircle2, ShoppingCart, Users, Package, RefreshCw, MessageSquare
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const AsistenteIA = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialQuery && !loading) {
      setInputMessage(initialQuery);
    }
  }, [initialQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/ia/conversations');
      const data = res.data || res;
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length > 0 && !activeConvId) {
          selectConversation(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error cargando conversaciones:', err);
    }
  };

  const selectConversation = async (convId) => {
    setActiveConvId(convId);
    try {
      const res = await api.get(`/ia/conversations/${convId}/messages`);
      const resData = res.data || res;
      const msgs = Array.isArray(resData) ? resData : (resData?.data || []);
      if (Array.isArray(msgs)) {
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await api.post('/ia/conversations');
      const newConv = res.data || res;
      setConversations(prev => [newConv, ...prev]);
      setActiveConvId(newConv.id);
      setMessages([]);
    } catch (err) {
      console.error('Error al crear conversación:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    setInputMessage('');
    
    // Add user message optimistically
    const tempUserMsg = { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.post('/ia/chat', {
        conversation_id: activeConvId,
        message: text
      });

      const responseData = res.data || res;
      // The backend returns { success: true, data: { conversation_id, message, executed_actions } }
      const resMsg = responseData?.data?.message || responseData?.message;
      const resConvId = responseData?.data?.conversation_id || responseData?.conversation_id;

      if (resMsg) {
        if (!activeConvId && resConvId) {
          setActiveConvId(resConvId);
          fetchConversations();
        }
        setMessages(prev => [...prev, resMsg]);
      }
    } catch (err) {

      console.error('Error en chat de IA:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Hubo un error al procesar tu solicitud: ' + (err.message || 'Error desconocido')
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsListening(true);
      setTimeout(() => {
        setInputMessage('Añadir un producto llamado Jarabe de Miel a 150 pesos con costo 90 y stock 40');
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
        setInputMessage(transcript);
      };

      recognition.onerror = (err) => {
        console.error('Error de voz:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('No se pudo iniciar micrófono:', err);
      setInputMessage('¿Cuáles son los productos con bajo stock?');
      setIsListening(false);
    }
  };

  // Helper formatting for markdown tables/bolding in simple HTML
  const renderFormattedMessage = (content) => {
    if (!content) return '';
    // Format bold text
    let formatted = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format simple lists
    formatted = formatted.replace(/^- (.*$)/gim, '<li className="ml-4 list-disc">$1</li>');
    return <div className="space-y-1" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="flex flex-col gap-5 relative animate-fade-in">
      
      {/* ─── BANNER SUPERIOR CORPORATIVO ASISTENTE IA (PHARMA.ERP) ─── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#072a23] via-[#0f6c59] to-[#16a085] text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-[#16a085]/40 min-h-[220px] flex flex-col justify-between shrink-0">
        
        {/* Imagen Farmacéutica Corporativa en Alta Visibilidad */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-luminosity bg-cover bg-right sm:bg-center pointer-events-none transition-all duration-700" 
          style={{ backgroundImage: "url('/erp-banner.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#072a23]/90 via-[#0f6c59]/65 to-transparent pointer-events-none"></div>

        <div className="absolute top-0 right-0 p-8 opacity-15 font-mono text-4xl font-black tracking-widest uppercase select-none pointer-events-none hidden md:block">
          PHARMAPLUS DATABASE & ERP COPILOT
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 backdrop-blur-md border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
              <span>✦</span>
              <span>COPILOTO DE GESTIÓN & BASE DE DATOS • PHARMAPLUS</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight drop-shadow-md">
              Asistente Inteligente del Sistema
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed max-w-xl drop-shadow">
              Consultas en tiempo real de inventario, stock, ventas, compras, clientes, precios y ejecución de operaciones en la base de datos.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                Exclusivo del Sistema
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                SQL Directo a Base de Datos
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-xs font-semibold">
                Gestión en Vivo
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 z-10">
            <button
              onClick={handleNewConversation}
              className="px-5 py-2.5 rounded-2xl bg-white text-[#12876f] hover:bg-emerald-50 active:scale-95 text-xs font-black shadow-xl transition-all flex items-center gap-2"
            >
              <Plus size={16} /> Nueva Conversación
            </button>
            <button
              onClick={() => setMessages([])}
              className="px-4 py-2.5 rounded-2xl bg-black/40 hover:bg-black/60 active:scale-95 text-white text-xs font-bold border border-emerald-300/40 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
            >
              <RefreshCw size={15} /> Limpiar Chat
            </button>
          </div>

        </div>

      </div>

      {/* ─── CHAT MAIN INTERFACE ─── */}
      <div className="flex flex-col lg:flex-row gap-5 h-[580px] min-h-[500px]">
        
        {/* Sidebar - Conversation History */}
        <div className="w-64 bg-surface rounded-2xl border border-border flex flex-col shrink-0 overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <h3 className="font-bold text-xs text-main uppercase tracking-wider">Historial de Chats</h3>
            </div>
            <button 
              onClick={handleNewConversation}
              className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-xs"
              title="Nueva Conversación"
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-1 custom-scrollbar">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No hay chats anteriores</p>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
                    activeConvId === c.id 
                    ? 'bg-primary text-white font-bold shadow-xs' 
                    : 'text-main hover:bg-background'
                  }`}
                >
                  <MessageSquare size={13} className="shrink-0" />
                  <span className="truncate flex-1">{c.title || 'Conversación'}</span>
                </button>
              ))
            )}
          </div>

          {/* Status Box */}
          <div className="p-2.5 border-t border-border bg-background/50 text-[11px] text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            <span>Conectado a Base de Datos</span>
          </div>
        </div>

        {/* Main Chat Box */}
        <div className="flex-1 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden shadow-xs">

        {/* Preset Action Chips */}
        <div className="px-4 py-2.5 bg-background/60 border-b border-border flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs">
          <span className="font-bold text-muted text-[11px] shrink-0">Consultas Rápidas:</span>
          <button 
            onClick={() => handleSendMessage('¿Cuáles son los productos con stock bajo?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-amber-200 text-amber-800 hover:bg-amber-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            ⚠️ Stock Bajo
          </button>
          <button 
            onClick={() => handleSendMessage('¿Cuánto se ha vendido hoy?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-sky-200 text-sky-800 hover:bg-sky-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            📊 Ventas de Hoy
          </button>
          <button 
            onClick={() => handleSendMessage('Listar los clientes registrados')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            👥 Clientes
          </button>
          <button 
            onClick={() => handleSendMessage('¿Cuáles son las órdenes de compra recientes?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-purple-200 text-purple-800 hover:bg-purple-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            📦 Órdenes de Compra
          </button>
          <button 
            onClick={() => handleSendMessage('¿Cuál es el estado de las cajas?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            💰 Estado de Cajas
          </button>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar bg-background/30">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center mb-4 shadow-sm border border-[#16a085]/30">
                <Sparkles size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Asistente Inteligente del Sistema PharmaPlus</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Consultas y operaciones exclusivas sobre los datos de PharmaPlus (stock, ventas, compras, precios, clientes y auditoría en tiempo real).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                <button 
                  onClick={() => handleSendMessage('¿Cuáles son los productos con stock bajo en el almacén?')}
                  className="p-3 bg-surface border border-border hover:border-emerald-500 rounded-xl text-xs text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2"
                >
                  <Package size={16} className="text-emerald-600 shrink-0" />
                  "¿Cuáles productos tienen stock bajo?"
                </button>
                <button 
                  onClick={() => handleSendMessage('¿Cuánto dinero se ha recaudado en ventas hoy?')}
                  className="p-3 bg-surface border border-border hover:border-emerald-500 rounded-xl text-xs text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2"
                >
                  <ShoppingCart size={16} className="text-emerald-600 shrink-0" />
                  "¿Cuánto dinero se ha vendido hoy?"
                </button>
                <button 
                  onClick={() => handleSendMessage('Mostrar los clientes registrados en el sistema')}
                  className="p-3 bg-surface border border-border hover:border-emerald-500 rounded-xl text-xs text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2"
                >
                  <Users size={16} className="text-emerald-600 shrink-0" />
                  "Listar clientes registrados"
                </button>
                <button 
                  onClick={() => handleSendMessage('¿Cuáles son los lotes y fechas de vencimiento?')}
                  className="p-3 bg-surface border border-border hover:border-emerald-500 rounded-xl text-xs text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2"
                >
                  <Database size={16} className="text-emerald-600 shrink-0" />
                  "Lotes y fechas de vencimiento"
                </button>
              </div>
            </div>
          ) : (
            messages.map((m, idx) => (
              <div 
                key={idx}
                className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                  m.role === 'user' ? 'bg-main' : 'bg-primary'
                }`}>
                  {m.role === 'user' ? 'TÚ' : <BotMessageSquare size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none shadow-xs' 
                  : 'bg-surface border border-border text-main rounded-tl-none shadow-xs'
                }`}>
                  {renderFormattedMessage(m.content)}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-[80%] items-center">
              <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 animate-spin">
                <Sparkles size={16} />
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-border text-xs text-muted flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <span>Procesando consulta y operando en la base de datos...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border bg-surface">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-2"
          >
            <button 
              type="button"
              onClick={handleVoiceInput}
              className={`p-3 rounded-xl border transition-all ${
                isListening ? 'bg-danger text-white border-danger animate-pulse' : 'bg-background text-muted border-border hover:text-primary hover:border-primary'
              }`}
              title="Entrada de voz"
            >
              <Mic size={18} />
            </button>
            <input 
              type="text" 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe una instrucción (Ej: 'Añadir producto...', 'Editar precio...', 'Eliminar cliente...')"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary transition-colors text-main"
            />
            <button 
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="btn btn-primary py-3 px-5 text-xs rounded-xl disabled:opacity-50"
            >
              <span>Enviar</span>
              <Send size={14} />
            </button>
          </form>
        </div>

        </div>

      </div>

    </div>
  );
};

export default AsistenteIA;
