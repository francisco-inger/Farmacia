import React, { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { 
  Users, Shield, Lock, Search, Filter, Plus, Edit2, MoreVertical, 
  Check, X, ChevronLeft, ChevronRight, UserCheck, UserX, Phone,
  Mail, Calendar, Clock, CheckCircle2, BotMessageSquare, Send, Sparkles,
  RefreshCw, ShieldCheck, Key, User, ArrowUpRight, ShieldAlert, Award
} from 'lucide-react';

const Usuarios = () => {
  const { user: currentUser } = useContext(AuthContext);

  // Active Tab: 'usuarios' | 'roles'
  const [activeTab, setActiveTab] = useState('usuarios');

  // Main Data States
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({ active_users: 28, total_users: 32, roles_count: 7, permissions_count: 186 });
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Forms
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role_id: 2, password: 'pharmaplus123', is_active: 1 });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  // Chatbot Widget State
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsersData();
    fetchRolesData();
  }, [page, limit, statusFilter, roleFilter]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsersData();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Curated Fallback Avatars Map
  const FALLBACK_AVATARS = {
    'Ana Cajera': '/avatars/ana.png',
    'Juan Martínez': '/avatars/juan.png',
    'Laura Sánchez': '/avatars/laura.png',
    'Carlos Rodríguez': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    'María Vargas': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
    'Pedro Díaz': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    'Andrés Mejía': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
    'Sofía Ramírez': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250'
  };

  const getAvatarUrl = (userObj) => {
    if (userObj?.avatar) return userObj.avatar;
    if (userObj?.name && FALLBACK_AVATARS[userObj.name]) return FALLBACK_AVATARS[userObj.name];
    const name = (userObj?.name || '').toLowerCase();
    if (name.includes('ana')) return '/avatars/ana.png';
    if (name.includes('juan')) return '/avatars/juan.png';
    if (name.includes('laura')) return '/avatars/laura.png';
    if (name.includes('carlos')) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';
    if (name.includes('maría') || name.includes('maria')) return 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250';
    if (name.includes('pedro')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250';
    if (name.includes('andrés') || name.includes('andres')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250';
    if (name.includes('sofía') || name.includes('sofia')) return 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250';
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250';
  };

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      let query = `/usuarios?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter !== 'all') query += `&status=${statusFilter}`;
      if (roleFilter) query += `&role=${encodeURIComponent(roleFilter)}`;

      const res = await api.get(query);
      const resData = res.data?.data || res.data || [];
      const statsData = res.data?.stats || { active_users: 28, total_users: 32, roles_count: 7, permissions_count: 186 };
      const pag = res.data?.pagination || { total: resData.length, pages: 1 };

      setUsers(resData);
      setStats(statsData);
      setTotalRecords(pag.total);
      setTotalPages(pag.pages || 1);

      if (resData.length > 0 && !selectedUser) {
        setSelectedUser(resData[0]);
      } else if (selectedUser) {
        const updated = resData.find(u => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolesData = async () => {
    try {
      const res = await api.get('/usuarios/roles');
      setRoles(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  };

  // Open modal for new user
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', phone: '809-555-1234', role_id: roles[0]?.id || 2, password: 'pharmaplus123', is_active: 1 });
    setShowUserModal(true);
  };

  // Open modal for editing user
  const handleOpenEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setUserForm({
      name: userToEdit.name,
      email: userToEdit.email,
      phone: userToEdit.phone || '',
      role_id: userToEdit.role_id || 2,
      password: '',
      is_active: userToEdit.is_active
    });
    setShowUserModal(true);
  };

  // Save User
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/usuarios/${editingUser.id}`, userForm);
        showToast('Usuario actualizado correctamente', 'success');
      } else {
        await api.post('/usuarios', userForm);
        showToast('Nuevo usuario creado exitosamente', 'success');
      }
      setShowUserModal(false);
      fetchUsersData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error guardando usuario', 'error');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (userToToggle) => {
    try {
      const res = await api.post(`/usuarios/${userToToggle.id}/toggle-active`);
      showToast(res.data?.message || 'Estado actualizado', 'info');
      fetchUsersData();
    } catch (err) {
      showToast('Error cambiando estado del usuario', 'error');
    }
  };

  // Create Role
  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios/roles', roleForm);
      showToast('Nuevo rol creado exitosamente', 'success');
      setShowRoleModal(false);
      setRoleForm({ name: '', description: '' });
      fetchRolesData();
    } catch (err) {
      showToast('Error creando rol', 'error');
    }
  };

  // Quick Chatbot Prompt Action
  const handleChatAction = async (promptText) => {
    setChatInput(promptText);
    setChatLoading(true);
    try {
      const res = await api.post('/ia/chat', { message: promptText });
      const msg = res.data?.data?.message?.content || res.data?.message?.content || 'Consulta procesada correctamente.';
      setChatResponse(msg);
    } catch (err) {
      setChatResponse('Error conectando con el Asistente IA.');
    } finally {
      setChatLoading(false);
    }
  };

  // Role Badge Colors matching PharmaPlus theme (#16a085 teal primary)
  const getRoleBadgeStyle = (roleName) => {
    const name = (roleName || '').toLowerCase();
    if (name.includes('cajer')) return 'bg-emerald-50 text-[#16a085] border-emerald-200';
    if (name.includes('farmac')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (name.includes('admin')) return 'bg-teal-50 text-[#12876f] border-teal-200';
    if (name.includes('supervis')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (name.includes('inventar') || name.includes('almacen')) return 'bg-[#e8f6f3] text-[#16a085] border-[#16a085]/30';
    if (name.includes('compra')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (name.includes('conta')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-emerald-50 text-[#16a085] border-emerald-200';
  };

  // Reliable Image Avatar Component
  const RenderUserAvatar = ({ userObj, size = 'md' }) => {
    const dim = size === 'lg' ? 'w-20 h-20 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-xs';
    const imgSrc = getAvatarUrl(userObj);

    return (
      <div className="relative inline-block shrink-0">
        <img
          src={imgSrc}
          alt={userObj?.name || 'Usuario'}
          className={`${dim} rounded-full object-cover shadow-sm ring-2 ring-emerald-500/20`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userObj?.name || 'US')}&background=16a085&color=fff`;
          }}
        />
        {/* Status dot overlay */}
        <span className={`absolute bottom-0 right-0 rounded-full ring-2 ring-white ${
          userObj?.is_active ? 'bg-emerald-500' : 'bg-rose-500'
        } ${size === 'lg' ? 'w-4 h-4 border-2 border-white' : 'w-2.5 h-2.5'}`} />
      </div>
    );
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen space-y-6 font-sans text-[#2c3e50]">
      {/* Notification Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-white font-medium flex items-center gap-2 transition-all ${
          toast.type === 'error' ? 'bg-rose-600' : toast.type === 'info' ? 'bg-sky-600' : 'bg-[#16a085]'
        }`}>
          <CheckCircle2 size={18} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2c3e50] tracking-tight">Usuarios y Roles</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">Gestiona los usuarios del sistema y sus permisos</p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab('roles')} 
            className="flex items-center gap-2 bg-white text-[#2c3e50] hover:bg-slate-50 border border-slate-200/90 px-4 py-2.5 rounded-xl font-semibold text-xs shadow-sm hover:shadow transition"
          >
            <Shield size={16} className="text-[#16a085]" />
            <span>Roles</span>
          </button>
          <button 
            onClick={handleOpenNewUser} 
            className="flex items-center gap-2 bg-[#16a085] hover:bg-[#12876f] text-white px-4 py-2.5 rounded-xl font-semibold text-xs shadow-md shadow-teal-200 transition"
          >
            <Plus size={16} />
            <span>Nuevo usuario</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards with App Theme Palette */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Usuarios activos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Usuarios activos</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-[#2c3e50]">{stats.active_users}</h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                De {stats.total_users} usuarios
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Roles registrados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Roles registrados</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-[#2c3e50]">{stats.roles_count}</h3>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                De {stats.roles_count} roles
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Permisos asignados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-sm">
            <Key size={24} />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Permisos asignados</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-extrabold text-[#2c3e50]">{stats.permissions_count}</h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Accesos configurados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout (Table Left 8 Cols + Right User Detail 4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Table Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 px-5 pt-3 gap-6">
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`pb-3 font-bold text-xs transition border-b-2 ${
                  activeTab === 'usuarios'
                    ? 'border-[#16a085] text-[#16a085]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Usuarios ({users.length})
              </button>

              <button
                onClick={() => setActiveTab('roles')}
                className={`pb-3 font-bold text-xs transition border-b-2 ${
                  activeTab === 'roles'
                    ? 'border-[#16a085] text-[#16a085]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Roles ({roles.length})
              </button>
            </div>

            {/* TAB 1: USUARIOS TABLE */}
            {activeTab === 'usuarios' && (
              <div className="p-5 space-y-4">
                
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar usuario por nombre, correo o rol..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#16a085] focus:bg-white transition"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition shadow-sm"
                    >
                      <Filter size={14} className="text-slate-500" />
                      <span>Filtros</span>
                    </button>

                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-3 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#16a085] shadow-sm"
                    >
                      <option value="all">Estado: Todos</option>
                      <option value="active">Estado: Activo</option>
                      <option value="inactive">Estado: Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Table with Real Photo Avatars */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">Usuario</th>
                        <th className="p-3.5">Correo</th>
                        <th className="p-3.5">Rol</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5">Último acceso</th>
                        <th className="p-3.5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isSelected = selectedUser?.id === u.id;
                        return (
                          <tr
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[#e8f6f3]/60 border-l-4 border-l-[#16a085]' 
                                : 'hover:bg-slate-50/90'
                            }`}
                          >
                            {/* User Avatar + Name */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <RenderUserAvatar userObj={u} size="md" />
                                <div>
                                  <h4 className="font-bold text-[#2c3e50] text-xs leading-tight">{u.name}</h4>
                                  <p className="text-[10px] text-slate-400">{u.username}</p>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-3.5 text-slate-600 font-medium">{u.email}</td>

                            {/* Role Badge */}
                            <td className="p-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(u.role)}`}>
                                {u.role}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="p-3.5">
                              <span className="flex items-center gap-1.5 font-bold text-[11px]">
                                <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className={u.is_active ? 'text-emerald-700' : 'text-rose-600'}>
                                  {u.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                              </span>
                            </td>

                            {/* Last Access */}
                            <td className="p-3.5 text-slate-500 font-medium">{u.last_login_formatted}</td>

                            {/* Actions */}
                            <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-[#16a085] hover:bg-[#e8f6f3] rounded-lg transition"
                                  title="Editar usuario"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                  title="Cambiar estado"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span>Mostrando {users.length > 0 ? (page - 1) * limit + 1 : 0} a {Math.min(page * limit, totalRecords)} de {totalRecords} usuarios</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-7 h-7 rounded-lg font-bold transition ${
                          page === i + 1 ? 'bg-[#16a085] text-white shadow-sm' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <select
                    value={limit}
                    onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                  >
                    <option value={8}>8 por página</option>
                    <option value={15}>15 por página</option>
                    <option value={25}>25 por página</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: ROLES VIEW */}
            {activeTab === 'roles' && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#2c3e50] text-sm">Matriz de Roles y Permisos</h3>
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="flex items-center gap-1.5 bg-[#16a085] hover:bg-[#12876f] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow"
                  >
                    <Plus size={14} />
                    <span>Nuevo Rol</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(r => (
                    <div key={r.id} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3 hover:bg-white hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeStyle(r.name)}`}>
                          {r.name}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{r.users_count || 0} Usuarios</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{r.description || 'Configuración de accesos del sistema.'}</p>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Permisos asignados:</span>
                        <div className="flex flex-wrap gap-1">
                          {(r.permissions || ['Acceso general']).map((p, i) => (
                            <span key={i} className="bg-white text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right User Detail Column (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedUser ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-[#2c3e50] text-sm">Detalle del usuario</h3>
                <button className="text-slate-400 hover:text-slate-600">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* User Large Avatar & Name */}
              <div className="flex flex-col items-center text-center space-y-3">
                <RenderUserAvatar userObj={selectedUser} size="lg" />
                
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="font-bold text-[#2c3e50] text-base">{selectedUser.name}</h2>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedUser.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {selectedUser.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedUser.role}</p>
                  <p className="text-xs text-[#16a085] font-semibold">{selectedUser.email}</p>
                </div>
              </div>

              {/* Attributes List */}
              <div className="space-y-2.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <User size={14} /> Nombre completo
                  </span>
                  <strong className="text-[#2c3e50] font-semibold">{selectedUser.name}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <UserCheck size={14} /> Nombre de usuario
                  </span>
                  <strong className="text-[#2c3e50] font-semibold">{selectedUser.username}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Phone size={14} /> Teléfono
                  </span>
                  <strong className="text-[#2c3e50] font-semibold">{selectedUser.phone || '809-555-1234'}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Calendar size={14} /> Fecha de creación
                  </span>
                  <strong className="text-[#2c3e50] font-semibold">{selectedUser.created_at_formatted}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} /> Último acceso
                  </span>
                  <strong className="text-[#2c3e50] font-semibold">{selectedUser.last_login_formatted}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 size={14} /> Estado
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Activo
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-400">
                    <Shield size={14} /> Rol asignado
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Main Permissions Section */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-[#2c3e50] uppercase tracking-wider">Permisos principales</h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  {(selectedUser.permissions || ['Realizar ventas', 'Ver inventario disponible']).map((p, i) => (
                    <li key={i} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                      <span className="font-medium text-[#2c3e50]">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3">
                <button
                  onClick={() => handleOpenEditUser(selectedUser)}
                  className="w-full py-2.5 border border-[#16a085] text-[#16a085] hover:bg-[#e8f6f3] font-bold rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} />
                  <span>Editar usuario</span>
                </button>

                <button
                  onClick={() => handleToggleActive(selectedUser)}
                  className={`w-full py-2.5 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 border ${
                    selectedUser.is_active 
                      ? 'border-rose-300 text-rose-600 hover:bg-rose-50' 
                      : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  {selectedUser.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                  <span>{selectedUser.is_active ? 'Desactivar usuario' : 'Activar usuario'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center text-slate-400">
              <Users size={36} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Selecciona un usuario para ver su detalle completo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chatbot PharmaPlus Banner Widget (Bottom Bar) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#e8f6f3] text-[#16a085] flex items-center justify-center shrink-0 shadow-sm">
              <BotMessageSquare size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#2c3e50] text-sm">Chatbot PharmaPlus</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  En línea
                </span>
              </div>
              <p className="text-xs text-slate-500">¿En qué puedo ayudarte hoy?</p>
            </div>
          </div>

          {/* Quick Action Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => handleChatAction('¿Cómo crear un nuevo usuario?')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Crear usuario
            </button>
            <button 
              onClick={() => handleChatAction('¿Cómo gestionar los roles de la farmacia?')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Gestionar roles
            </button>
            <button 
              onClick={() => handleChatAction('Ver los permisos del sistema')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Permisos del sistema
            </button>
            <button 
              onClick={() => handleChatAction('¿Cuántos usuarios activos hay?')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Usuarios activos
            </button>
            <button 
              onClick={() => handleChatAction('Accesos recientes del sistema')} 
              className="bg-slate-50 hover:bg-[#e8f6f3] hover:text-[#16a085] text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              Accesos recientes
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleChatAction(chatInput)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#16a085] focus:bg-white transition"
          />
          <button
            onClick={() => handleChatAction(chatInput)}
            disabled={chatLoading}
            className="p-2.5 bg-[#16a085] hover:bg-[#12876f] text-white rounded-xl shadow transition shrink-0"
          >
            {chatLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {/* Response Message Display */}
        {chatResponse && (
          <div className="p-3.5 bg-[#e8f6f3] rounded-xl border border-teal-100 text-xs text-[#2c3e50] leading-relaxed shadow-inner">
            <span className="font-bold text-[#16a085]">Respuesta del Asistente:</span> {chatResponse}
          </div>
        )}
      </div>

      {/* Modal: Create / Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-[#2c3e50] text-base">
                {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 uppercase">Nombre completo</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Ej: Ana Cajera"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 uppercase">Correo electrónico</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="ana.cajera@pharmaplus.com"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 uppercase">Teléfono</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="809-555-1234"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 uppercase">Rol asignado</label>
                <select
                  value={userForm.role_id}
                  onChange={e => setUserForm({ ...userForm, role_id: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div>
                  <label className="font-bold text-slate-600 uppercase">Contraseña inicial</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16a085] hover:bg-[#12876f] text-white font-bold rounded-xl shadow"
                >
                  {editingUser ? 'Actualizar' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Role */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-[#2c3e50] text-base">Crear nuevo rol</h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 uppercase">Nombre del rol</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="Ej: Supervisor de Turno"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 uppercase">Descripción</label>

                <textarea
                  value={roleForm.description}
                  onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Descripción de responsabilidades..."
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:border-[#16a085]"
                  rows={3}
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#16a085] hover:bg-[#12876f] text-white font-bold rounded-xl shadow"
                >
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
