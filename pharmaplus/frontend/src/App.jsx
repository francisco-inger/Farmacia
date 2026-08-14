import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Login from './modules/auth/Login';
import Dashboard from './modules/dashboard/Dashboard';
import MainLayout from './components/layout/MainLayout';
import Productos from './modules/productos/Productos';
import Inventario from './modules/inventario/Inventario';
import Clientes from './modules/clientes/Clientes';
import POS from './modules/pos/POS';
import AsistenteIA from './modules/ia/AsistenteIA';
import Facturacion from './modules/facturacion/Facturacion';
import DgiiFiscal from './modules/facturacion/DgiiFiscal';
import Servicios from './modules/servicios/Servicios';
import Compras from './modules/compras/Compras';
import Proveedores from './modules/proveedores/Proveedores';
import Configuracion from './modules/configuracion/Configuracion';
import RRHH from './modules/rrhh/RRHH';
import Caja from './modules/cajas/Caja';
import Integraciones from './modules/integraciones/Integraciones';
import Usuarios from './modules/usuarios/Usuarios';
import Reportes from './modules/reportes/Reportes';
import Auditoria from './modules/auditoria/Auditoria';

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — verifica autenticación y rol
// adminOnly = true → solo el Administrador puede entrar; el Cajero va al POS
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — verifica autenticación y rol
// adminOnly = true → solo el Administrador puede entrar; el Cajero va al POS
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 flex-col gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Cargando PharmaPlus...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role === 'cajero') return <Navigate to="/pos" replace />;

  return children;
};

// ─────────────────────────────────────────────────────────────────────────────
// RootRedirect — redirige al inicio correcto según rol
// ─────────────────────────────────────────────────────────────────────────────
const RootRedirect = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 flex-col gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500">Iniciando sistema...</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'cajero' ? '/pos' : '/dashboard'} replace />;
};

// ─────────────────────────────────────────────────────────────────────────────
// LoginRoute — si ya está logueado, redirige según rol
// ─────────────────────────────────────────────────────────────────────────────
const LoginRoute = () => {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 flex-col gap-3">
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (user) return <Navigate to={user.role === 'cajero' ? '/pos' : '/dashboard'} replace />;
  return <Login />;
};

// ─────────────────────────────────────────────────────────────────────────────
// AppRoutes
// ─────────────────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    {/* Login */}
    <Route path="/login" element={<LoginRoute />} />

    {/* POS — Admin y Cajero (pantalla completa sin layout lateral) */}
    <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />

    {/* Layout principal */}
    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      {/* Raíz → redirige según rol */}
      <Route index element={<RootRedirect />} />

      {/* Cajas — Admin y Cajero */}
      <Route path="cajas" element={<Caja />} />

      {/* ── Solo Administrador ─────────────────────────────────────────── */}
      <Route path="dashboard"     element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="productos"     element={<ProtectedRoute adminOnly><Productos /></ProtectedRoute>} />
      <Route path="inventario"    element={<ProtectedRoute adminOnly><Inventario /></ProtectedRoute>} />
      <Route path="clientes"      element={<ProtectedRoute adminOnly><Clientes /></ProtectedRoute>} />
      <Route path="servicios"     element={<ProtectedRoute adminOnly><Servicios /></ProtectedRoute>} />
      <Route path="compras"       element={<ProtectedRoute adminOnly><Compras /></ProtectedRoute>} />
      <Route path="proveedores"   element={<ProtectedRoute adminOnly><Proveedores /></ProtectedRoute>} />
      <Route path="facturacion"   element={<ProtectedRoute adminOnly><DgiiFiscal /></ProtectedRoute>} />
      <Route path="rrhh"          element={<ProtectedRoute adminOnly><RRHH /></ProtectedRoute>} />
      <Route path="integraciones" element={<ProtectedRoute adminOnly><Integraciones /></ProtectedRoute>} />
      <Route path="ia"            element={<ProtectedRoute adminOnly><AsistenteIA /></ProtectedRoute>} />
      <Route path="reportes"      element={<ProtectedRoute adminOnly><Reportes /></ProtectedRoute>} />
      <Route path="usuarios"      element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />
      <Route path="auditoria"     element={<ProtectedRoute adminOnly><Auditoria /></ProtectedRoute>} />
      <Route path="configuracion" element={<ProtectedRoute adminOnly><Configuracion /></ProtectedRoute>} />
    </Route>

    {/* Página de acceso denegado */}
    <Route path="/unauthorized" element={
      <div className="flex flex-col h-screen items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-gray-500">No tienes permiso para ver esta página.</p>
      </div>
    } />

    {/* Cualquier ruta desconocida → inicio */}
    <Route path="*" element={<RootRedirect />} />
  </Routes>
);

// ─────────────────────────────────────────────────────────────────────────────
// App — AuthProvider envuelve todo correctamente
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
