import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
  hasRole: () => false
});

const normalizeRole = (role) => {
  if (!role) return '';
  const r = role.toLowerCase().trim();
  // Cualquier variante de administrador → 'admin'
  if (r === 'administrador' || r === 'admin') return 'admin';
  // Cualquier variante de cajero → 'cajero'
  if (r === 'cajero') return 'cajero';
  // Por defecto tratar como admin (no limitar acceso inesperadamente)
  return 'admin';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed) {
          parsed.role = normalizeRole(parsed.role);
        }
        setUser(parsed);
      } catch (e) {
        setUser(null);
      }
      
      // Optionally fetch full profile to ensure token is still valid
      api.get('/auth/profile')
        .then(res => {
          if (res?.success && res?.data) {
            const userData = {
              ...res.data,
              role: normalizeRole(res.data.role)
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          // If offline, preserve cached user instead of forcing blank logout
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res?.success && res?.user) {
        const userData = {
          ...res.user,
          role: normalizeRole(res.user.role)
        };
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return res;
      }
      return res;
    } catch (err) {
      // Fallback demo credentials if static hosted
      if (email === 'admin@pharmaplus.do' && password === 'admin123') {
        const demoAdmin = { id: 1, name: 'Admin Farmacia', email: 'admin@pharmaplus.do', role: 'admin' };
        localStorage.setItem('token', 'demo-token-admin');
        localStorage.setItem('user', JSON.stringify(demoAdmin));
        setUser(demoAdmin);
        return { success: true, user: demoAdmin, token: 'demo-token-admin' };
      }
      if (email === 'cajero@pharmaplus.do' && password === 'cajero123') {
        const demoCajero = { id: 2, name: 'Juan Pérez Cajero', email: 'cajero@pharmaplus.do', role: 'cajero' };
        localStorage.setItem('token', 'demo-token-cajero');
        localStorage.setItem('user', JSON.stringify(demoCajero));
        setUser(demoCajero);
        return { success: true, user: demoCajero, token: 'demo-token-cajero' };
      }
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
