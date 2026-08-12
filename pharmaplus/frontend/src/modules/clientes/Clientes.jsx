import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Edit, Trash2, Star, Award, Gift, TrendingUp,
  Users, Phone, Mail, MapPin, Calendar, CreditCard, ShoppingBag,
  ChevronRight, X, BarChart2, Crown, Shield, Gem
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/ui/Modal';

// ─── Tier Config — using system color palette ────────────────────────────
const TIERS = {
  Bronce: {
    // Uses warning: #f39c12 tones
    gradientFrom: '#f39c12',
    gradientTo: '#e67e22',
    bg: 'bg-[#fef5e7]',
    border: 'border-[#f39c12]/40',
    text: 'text-[#d68910]',
    badge: 'bg-[#fef5e7] text-[#b7770d] border-[#f39c12]/50',
    icon: Shield,
    next: 'Plata',
    nextAt: 500,
  },
  Plata: {
    // Uses info: #3498db tones
    gradientFrom: '#3498db',
    gradientTo: '#2980b9',
    bg: 'bg-[#ebf5fb]',
    border: 'border-[#3498db]/40',
    text: 'text-[#2471a3]',
    badge: 'bg-[#ebf5fb] text-[#1a5276] border-[#3498db]/50',
    icon: Gem,
    next: 'Oro',
    nextAt: 1500,
  },
  Oro: {
    // Uses success: #27ae60 tones (green = premium in this app)
    gradientFrom: '#16a085',
    gradientTo: '#27ae60',
    bg: 'bg-[#e8f6f3]',
    border: 'border-primary/40',
    text: 'text-primary',
    badge: 'bg-[#e8f6f3] text-primary border-primary/50',
    icon: Crown,
    next: null,
    nextAt: null,
  },
};

function TierBadge({ tier }) {
  const cfg = TIERS[tier] || TIERS.Bronce;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.badge}`}>
      <Icon size={9} /> {tier}
    </span>
  );
}

function ProgressBar({ totalSpent, tier }) {
  const cfg = TIERS[tier] || TIERS.Bronce;
  if (!cfg.nextAt) return null;
  const base = tier === 'Bronce' ? 0 : 500;
  const range = cfg.nextAt - base;
  const progress = Math.min(100, ((totalSpent - base) / range) * 100);
  const remaining = Math.max(0, cfg.nextAt - totalSpent).toFixed(0);
  return (
    <div className="w-full mt-1.5">
      <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-0.5">
        <span>Progreso a {cfg.next}</span>
        <span>Faltan RD$ {parseFloat(remaining).toLocaleString()}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: `linear-gradient(to right, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
const Clientes = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [filterTier, setFilterTier] = useState('');
  const LIMIT = 12;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);

  const emptyForm = { name: '', cedula: '', phone: '', email: '', address: '', birth_date: '', notes: '' };
  const [formData, setFormData] = useState(emptyForm);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: LIMIT, search: searchTerm });
      if (filterTier) params.set('tier', filterTier);
      const res = await api.get(`/clients?${params}`);
      setClients(res.data);
      setTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/clients/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchClients, 300);
    return () => clearTimeout(t);
  }, [searchTerm, page, filterTier]);

  // ── Detail View ────────────────────────────────────────────────────────
  const openDetail = async (client) => {
    try {
      const res = await api.get(`/clients/${client.id}`);
      setDetailClient(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      setDetailClient(client);
      setIsDetailOpen(true);
    }
  };

  // ── Modal CRUD ─────────────────────────────────────────────────────────
  const openModal = (client = null) => {
    if (client) {
      setCurrentClient(client);
      setFormData({
        name: client.name || '',
        cedula: client.cedula || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        birth_date: client.birth_date || '',
        notes: client.notes || ''
      });
    } else {
      setCurrentClient(null);
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentClient) {
        await api.put(`/clients/${currentClient.id}`, formData);
      } else {
        await api.post('/clients', formData);
      }
      setIsModalOpen(false);
      fetchClients();
      fetchStats();
    } catch (err) {
      alert(err.message || 'Error guardando cliente');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Desactivar este cliente?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
        fetchStats();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // ── Tier filter pills ──────────────────────────────────────────────────
  const tierCounts = stats?.tiers?.reduce((acc, t) => { acc[t.tier] = t.count; return acc; }, {}) || {};

  return (
    <div className="h-full flex flex-col gap-5 overflow-auto pb-4">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-br from-[#16a085] via-[#1abc9c] to-[#27ae60] rounded-2xl p-5 text-white shadow-lg overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Directorio y Fidelización de Clientes</h1>
            <p className="text-sm text-white/80 mt-0.5">Gestiona clientes, puntos y niveles de lealtad</p>
          </div>
          <img
            src="/modules/clientes.png"
            alt="Clientes"
            className="h-16 w-auto object-contain rounded-xl drop-shadow-md opacity-90"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Total Clientes</p>
              <p className="text-2xl font-black text-slate-800">{stats.total}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Star size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Puntos Repartidos</p>
              <p className="text-2xl font-black text-purple-700">{(stats.totalPoints || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Ventas Totales</p>
              <p className="text-xl font-black text-emerald-700">RD$ {(stats.totalSpent || 0).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-[11px] text-slate-500 font-semibold mb-1.5">Por Nivel</p>
            <div className="flex flex-col gap-1">
              {['Oro', 'Plata', 'Bronce'].map(t => {
                const cfg = TIERS[t];
                const Icon = cfg.icon;
                return (
                  <div key={t} className="flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 font-bold ${cfg.text}`}>
                      <Icon size={10} /> {t}
                    </span>
                    <span className="font-black text-slate-700">{tierCounts[t] || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Filters & Actions ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o teléfono..."
              className="input pl-9 text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          {/* Tier filter pills */}
          {['', 'Oro', 'Plata', 'Bronce'].map(t => (
            <button
              key={t}
              onClick={() => { setFilterTier(t); setPage(1); }}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                filterTier === t
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
              }`}
            >
              {t === '' ? 'Todos' : (
                <span className="flex items-center gap-1">
                  {t === 'Oro' && <Crown size={10} />}
                  {t === 'Plata' && <Gem size={10} />}
                  {t === 'Bronce' && <Shield size={10} />}
                  {t}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={() => openModal()} className="btn btn-primary w-full sm:w-auto shrink-0">
          <Plus size={18} /> Nuevo Cliente
        </button>
      </div>

      {/* ── Client Cards Grid ── */}
      {loading && clients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Cargando clientes...</span>
          </div>
        </div>
      ) : clients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted">
          <div className="flex flex-col items-center gap-3">
            <Users size={48} className="text-slate-300" />
            <p className="text-sm font-semibold">No se encontraron clientes</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clients.map(client => {
            const tier = client.tier || 'Bronce';
            const cfg = TIERS[tier];
            const Icon = cfg.icon;
            const points = client.points || 0;
            const totalSpent = client.total_spent || 0;
            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col"
              >
                {/* Card header stripe with tier color */}
                <div
                  className="h-1.5 w-full"
                  style={{ background: `linear-gradient(to right, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
                />

                <div className="p-4 flex flex-col gap-3 flex-1">
                  {/* Name + Tier */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm truncate">{client.name}</p>
                      {client.cedula && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{client.cedula}</p>
                      )}
                    </div>
                    <TierBadge tier={tier} />
                  </div>

                  {/* Loyalty Points Card */}
                  <div className={`${cfg.bg} ${cfg.border} border rounded-xl p-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" /> Puntos
                      </span>
                      <span className={`text-xl font-black ${cfg.text}`}>{points.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      = RD$ {points.toLocaleString()} en descuentos
                    </div>
                    <ProgressBar totalSpent={totalSpent} tier={tier} />
                  </div>

                  {/* Contact info */}
                  <div className="flex flex-col gap-1">
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone size={10} className="text-slate-400 shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Mail size={10} className="text-slate-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <ShoppingBag size={10} className="text-slate-400 shrink-0" />
                      <span>RD$ {totalSpent.toLocaleString('es-DO', { maximumFractionDigits: 0 })} en compras</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/50">
                  <button
                    onClick={() => openDetail(client)}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Ver perfil <ChevronRight size={12} />
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openModal(client)}
                      className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger-light rounded-lg transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {total > LIMIT && (
        <div className="flex items-center justify-between shrink-0">
          <p className="text-xs text-muted">
            Mostrando {Math.min(LIMIT, clients.length)} de {total} resultados
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="btn btn-outline text-xs py-1.5 px-3 disabled:opacity-40"
            >
              ‹ Anterior
            </button>
            <span className="text-xs font-bold text-slate-600">Página {page} / {Math.ceil(total / LIMIT)}</span>
            <button
              disabled={page >= Math.ceil(total / LIMIT)}
              onClick={() => setPage(p => p + 1)}
              className="btn btn-outline text-xs py-1.5 px-3 disabled:opacity-40"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentClient ? `Editar: ${currentClient.name}` : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Nombre Completo *</label>
            <input required type="text" className="input text-sm" value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Cédula / RNC</label>
              <input type="text" className="input text-sm" value={formData.cedula}
                onChange={e => setFormData({ ...formData, cedula: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Teléfono</label>
              <input type="text" className="input text-sm" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Correo Electrónico</label>
              <input type="email" className="input text-sm" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Fecha de Nacimiento</label>
              <input type="date" className="input text-sm" value={formData.birth_date}
                onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Dirección</label>
            <input type="text" className="input text-sm" value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Notas / Historial Médico</label>
            <textarea className="input text-sm resize-none h-20" value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          {/* Loyalty preview for new clients */}
          {!currentClient && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700">
              <p className="font-bold flex items-center gap-1"><Gift size={12} /> Programa de Fidelización</p>
              <p className="mt-1 text-purple-600">El cliente iniciará en nivel <strong>Bronce</strong> con <strong>0 puntos</strong>. Ganará 1 punto por cada RD$ 100 en compras.</p>
            </div>
          )}

          {/* Loyalty info for existing clients */}
          {currentClient && (
            <div className={`${(TIERS[currentClient.tier] || TIERS.Bronce).bg} border ${(TIERS[currentClient.tier] || TIERS.Bronce).border} rounded-xl p-3`}>
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <Award size={12} className="text-primary" /> Datos de Fidelización (Sólo Lectura)
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-slate-500">Nivel</p>
                  <TierBadge tier={currentClient.tier || 'Bronce'} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Puntos</p>
                  <p className="text-sm font-black text-primary">{(currentClient.points || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Total Compras</p>
                  <p className="text-sm font-black text-slate-700">RD$ {(currentClient.total_spent || 0).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline text-sm">Cancelar</button>
            <button type="submit" className="btn btn-primary text-sm">
              {currentClient ? 'Actualizar Cliente' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Client Detail Modal ── */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setDetailClient(null); }}
        title="Perfil del Cliente"
      >
        {detailClient && (() => {
          const tier = detailClient.tier || 'Bronce';
          const cfg = TIERS[tier];
          const Icon = cfg.icon;
          const points = detailClient.points || 0;
          const totalSpent = detailClient.total_spent || 0;
          const purchases = detailClient.total_purchases || 0;

          return (
            <div className="flex flex-col gap-4">
              {/* Header card with system palette gradient */}
              <div
                className="rounded-xl p-4 text-white"
                style={{ background: `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">Cliente</p>
                    <h2 className="text-xl font-black">{detailClient.name}</h2>
                    {detailClient.cedula && <p className="text-xs opacity-70 mt-0.5 font-mono">{detailClient.cedula}</p>}
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icon size={24} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/20 rounded-lg p-2">
                    <p className="text-xs opacity-70">Nivel</p>
                    <p className="font-black text-sm">{tier}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <p className="text-xs opacity-70">Puntos</p>
                    <p className="font-black text-sm">{points.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-2">
                    <p className="text-xs opacity-70">Compras</p>
                    <p className="font-black text-sm">{purchases}</p>
                  </div>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><TrendingUp size={12} /> Progreso de Fidelización</p>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Total gastado:</span>
                  <span className="font-bold">RD$ {totalSpent.toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 mb-2">
                  <span>Valor de puntos:</span>
                  <span className="font-bold text-purple-700">RD$ {points.toLocaleString()}</span>
                </div>
                <ProgressBar totalSpent={totalSpent} tier={tier} />
                {tier === 'Oro' && (
                  <p className="text-[11px] text-yellow-700 font-bold mt-1.5 flex items-center gap-1">
                    <Crown size={11} /> ¡Nivel máximo alcanzado! Cliente VIP Oro
                  </p>
                )}
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Phone, label: 'Teléfono', value: detailClient.phone },
                  { icon: Mail, label: 'Email', value: detailClient.email },
                  { icon: MapPin, label: 'Dirección', value: detailClient.address },
                  { icon: Calendar, label: 'Nacimiento', value: detailClient.birth_date ? new Date(detailClient.birth_date).toLocaleDateString('es-DO') : null },
                ].filter(i => i.value).map(({ icon: ItemIcon, label, value }) => (
                  <div key={label} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <ItemIcon size={13} className="text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
                      <p className="text-xs font-semibold text-slate-700 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Sales */}
              {detailClient.recent_sales && detailClient.recent_sales.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1"><ShoppingBag size={12} /> Últimas Compras</p>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                    {detailClient.recent_sales.map(sale => (
                      <div key={sale.id} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-800">{sale.sale_number}</span>
                          <span className="text-slate-400 ml-2">{new Date(sale.created_at).toLocaleDateString('es-DO')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-primary">RD$ {parseFloat(sale.total).toLocaleString('es-DO', { maximumFractionDigits: 0 })}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sale.status === 'completada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {sale.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailClient.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-800">Notas</p>
                  <p className="text-xs text-amber-700 mt-1">{detailClient.notes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setIsDetailOpen(false); openModal(detailClient); }}
                  className="btn btn-outline text-xs flex-1 flex items-center justify-center gap-1.5"
                >
                  <Edit size={13} /> Editar Cliente
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="btn btn-primary text-xs flex-1"
                >
                  Cerrar
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Clientes;
