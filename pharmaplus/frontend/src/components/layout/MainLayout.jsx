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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 sm:p-6 custom-scrollbar flex flex-col justify-between">
          <div className="flex-1 flex flex-col min-h-0">
            <Outlet />
          </div>
          
          {/* Global footer */}
          <div className="pt-6 pb-2 text-center text-xs text-slate-400 shrink-0">
            &copy; {new Date().getFullYear()} PharmaPlus. Todos los derechos reservados.
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
