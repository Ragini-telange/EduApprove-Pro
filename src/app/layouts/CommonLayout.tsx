import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { DynamicSidebar } from './DynamicSidebar';
import { ChatbotWidget } from '../../modules/senior/components/chatbot/ChatbotWidget';

export const CommonLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Universal Statutory Bar */}
      <TopHeader onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

      {/* Main App Layout Grid */}
      <div className="flex-1 flex w-full">
        {/* Universal Dynamic Role-Based Sidebar */}
        <DynamicSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Universal Floating AICTE SmartAssist AI Copilot & Voice Assistant */}
      <ChatbotWidget />
    </div>
  );
};
