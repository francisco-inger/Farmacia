import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-main font-sans">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 custom-scrollbar relative">
          <Outlet />
          
          {/* Global footer */}
          <div className="mt-auto pt-8 pb-2 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} PharmaPlus. Todos los derechos reservados.
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
