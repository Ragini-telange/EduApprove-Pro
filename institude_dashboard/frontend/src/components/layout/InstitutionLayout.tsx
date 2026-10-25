import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';

export const InstitutionLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = (path: string): string => {
    if (path.includes('/applications')) return t('applications');
    if (path.includes('/documents')) return t('documents');
    if (path.includes('/passport')) return t('passport');
    if (path.includes('/compliance')) return t('compliance');
    if (path.includes('/evc')) return t('evc');
    if (path.includes('/notifications')) return t('notifications');
    if (path.includes('/profile')) return t('profile');
    if (path.includes('/settings')) return t('settings');
    return t('dashboard');
  };

  const loadNotifications = async () => {
    try {
      const data = await dashboardService.getNotifications(user?.id || user?.institutionCode);
      setNotifications(data);
    } catch {
      // silent fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // local optimistic update if offline
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // local optimistic update if offline
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Persistent Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        unreadCount={unreadCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <TopNavbar
          pageTitle={getPageTitle(location.pathname)}
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllRead}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
