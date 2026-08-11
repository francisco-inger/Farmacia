import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// Placeholders for modules (to be implemented)
import Login from './modules/auth/Login';
import Dashboard from './modules/dashboard/Dashboard';
import MainLayout from './components/layout/MainLayout';
// Import other modules as we build them...

import Productos from './modules/productos/Productos';

import Inventario from './modules/inventario/Inventario';

import Clientes from './modules/clientes/Clientes';

import POS from './modules/pos/POS';
import AsistenteIA from './modules/ia/AsistenteIA';
import Integraciones from './modules/integraciones/Integraciones';
import Facturacion from './modules/facturacion/Facturacion';
import Recetas from './modules/recetas/Recetas';
import Servicios from './modules/servicios/Servicios';
import Compras from './modules/compras/Compras';
import Proveedores from './modules/proveedores/Proveedores';
import Configuracion from './modules/configuracion/Configuracion';
import RRHH from './modules/rrhh/RRHH';
import Caja from './modules/cajas/Caja';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando PharmaPlus...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex h-screen items-center justify-center">Inicializando...</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Protected Routes inside Layout */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="pos" element={<POS />} />
        <Route path="ia" element={<AsistenteIA />} />
        <Route path="integraciones" element={<Integraciones />} />
        
        {/* Placeholder routes for all modules to prevent 404s while building */}
        <Route path="recetas" element={<Recetas />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="compras" element={<Compras />} />
        <Route path="proveedores" element={<Proveedores />} />
        <Route path="facturacion" element={<Facturacion />} />
        <Route path="rrhh" element={<ProtectedRoute allowedRoles={['admin']}><RRHH /></ProtectedRoute>} />
        <Route path="cajas" element={<Caja />} />
        
        {/* Admin only routes */}
        <Route path="usuarios" element={<ProtectedRoute allowedRoles={['admin']}><div className="p-6"><h1>Usuarios (En desarrollo)</h1></div></ProtectedRoute>} />
        <Route path="auditoria" element={<ProtectedRoute allowedRoles={['admin']}><div className="p-6"><h1>Auditoría (En desarrollo)</h1></div></ProtectedRoute>} />
        <Route path="reportes" element={<ProtectedRoute allowedRoles={['admin']}><div className="p-6"><h1>Reportes (En desarrollo)</h1></div></ProtectedRoute>} />
        <Route path="configuracion" element={<ProtectedRoute allowedRoles={['admin']}><div className="p-6"><h1>Configuración (En desarrollo)</h1></div></ProtectedRoute>} />
      </Route>

      <Route path="/unauthorized" element={<div className="flex flex-col h-screen items-center justify-center gap-4"><h1>Acceso Denegado</h1><p>No tienes permiso para ver esta página.</p></div>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

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
