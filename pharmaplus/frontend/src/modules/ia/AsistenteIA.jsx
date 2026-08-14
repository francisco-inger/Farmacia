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
    <div className="flex h-[calc(100vh-100px)] gap-6 animate-fade-in">
      
      {/* Sidebar - Conversation History */}
      <div className="w-64 bg-surface rounded-2xl border border-border flex flex-col shrink-0 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-bold text-sm text-main">Conversaciones</h3>
          </div>
          <button 
            onClick={handleNewConversation}
            className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-xs"
            title="Nueva Conversación"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 custom-scrollbar">
          {conversations.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">No hay chats anteriores</p>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full text-left p-3 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                  activeConvId === c.id 
                  ? 'bg-primary text-white font-bold shadow-xs' 
                  : 'text-main hover:bg-background'
                }`}
              >
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate flex-1">{c.title || 'Conversación'}</span>
              </button>
            ))
          )}
        </div>

        {/* Status Box */}
        <div className="p-3 border-t border-border bg-background/50 text-[11px] text-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          <span>Asistente de Gestión Activo</span>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden shadow-xs">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <img 
              src="/modules/reportes.png" 
              alt="IA" 
              className="w-12 h-12 rounded-xl object-cover border border-emerald-100 shadow-sm shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-main text-base leading-tight">Asistente PharmaPlus</h2>
              </div>
              <p className="text-xs text-success font-semibold flex items-center gap-1">
                <Database size={12} /> Gestión integrada de inventario, ventas y clientes
              </p>
            </div>
          </div>
          <button 
            onClick={() => setMessages([])} 
            className="p-2 text-muted hover:text-main hover:bg-background rounded-lg text-xs flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={14} /> Limpiar pantalla
          </button>
        </div>

        {/* Preset Action Chips */}
        <div className="px-4 py-2.5 bg-background/60 border-b border-border flex items-center gap-2 overflow-x-auto custom-scrollbar text-xs">
          <span className="font-bold text-muted text-[11px] shrink-0">Consultas Rápidas:</span>
          <button 
            onClick={() => handleSendMessage('¿Qué me recomiendas para el dolor de cabeza?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-emerald-200 text-emerald-800 hover:bg-emerald-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            🩺 Dolor de Cabeza / Gripe
          </button>
          <button 
            onClick={() => handleSendMessage('¿Cuáles son los medicamentos con stock bajo?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-amber-200 text-amber-800 hover:bg-amber-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            ⚠️ Stock Bajo Farmacia
          </button>
          <button 
            onClick={() => handleSendMessage('¿Cuánto se ha vendido hoy?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-sky-200 text-sky-800 hover:bg-sky-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            📊 Ventas de Hoy
          </button>
          <button 
            onClick={() => handleSendMessage('¿Qué servicios clínicos tienen disponibles?')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-purple-200 text-purple-800 hover:bg-purple-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            💉 Servicios Clínicos
          </button>
          <button 
            onClick={() => handleSendMessage('Horarios de atención y entregas a domicilio')}
            className="px-3 py-1.5 rounded-xl bg-surface border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shrink-0 font-semibold shadow-2xs"
          >
            🛵 Horarios & Delivery
          </button>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar bg-background/30">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto my-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center mb-4 shadow-sm border border-[#16a085]/30">
                <Sparkles size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">¡Hola! Soy tu Asistente Clínico y de Gestión PharmaPlus</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Puedo responder cualquier pregunta médica o de farmacia, orientar a tus clientes sobre síntomas y medicamentos, o consultar ventas, inventario, precios y compras en tiempo real.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                <button 
                  onClick={() => handleSendMessage('¿Qué medicamento tienen para el dolor de estómago o acidez?')}
                  className="p-3 bg-surface border border-border hover:border-emerald-500 rounded-xl text-xs text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2"
                >
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  "¿Qué tienen para el dolor de estómago o acidez?"
                </button>
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
                  onClick={() => handleSendMessage('¿Qué antibióticos están registrados en el catálogo?')}
                  className="p-3 bg-surface border border-border hover:border-emerald-500 rounded-xl text-xs text-slate-600 hover:text-emerald-700 transition-all flex items-center gap-2"
                >
                  <Users size={16} className="text-emerald-600 shrink-0" />
                  "¿Qué antibióticos tienen disponibles?"
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
  );
};

export default AsistenteIA;
