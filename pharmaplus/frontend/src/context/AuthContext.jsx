import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

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
      setLoading(false);
      
      // Background verification of token profile
      api.get('/auth/profile')
        .then(res => {
          if (res.success) {
            const userData = {
              ...res.data,
              role: normalizeRole(res.data.role)
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        })
        .catch(() => {
          // Keep session or logout if strictly 401
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.user) {
      const userData = {
        ...res.user,
        role: normalizeRole(res.user.role)
      };
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    return res;
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
