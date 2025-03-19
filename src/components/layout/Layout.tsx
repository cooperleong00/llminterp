import React, { ReactNode } from 'react';
import Header from './Header';
import Sidebar from '../filters/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 justify-center max-w-7xl mx-auto w-full">
        <Sidebar />
        <main className="flex-1 ">
          <div className="max-w-4xl bg-white rounded-lg shadow-soft p-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 