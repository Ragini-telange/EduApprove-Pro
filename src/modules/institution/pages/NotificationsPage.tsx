import React, { useState, useEffect } from 'react';
import { notificationsService } from '../services/notificationsService';
import { NotificationItem } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type CategoryFilter =
  | 'all'
  | 'Application'
  | 'Correction Required'
  | 'Document Expiring'
  | 'Compliance'
  | 'EVC Scheduled';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationsService.getNotifications({
        unreadOnly,
        type: selectedCategory === 'all' ? undefined : selectedCategory,
      });
      setNotifications(data);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly, selectedCategory]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q) ||
      (n.related_entity_id && n.related_entity_id.toLowerCase().includes(q))
    );
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const criticalCount = notifications.filter((n) => n.severity === 'critical').length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger" size="sm">Critical</Badge>;
      case 'warning':
        return <Badge variant="warning" size="sm">Warning</Badge>;
      case 'success':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      default:
        return <Badge variant="primary" size="sm">Notice</Badge>;
    }
  };

  const getEntityLink = (n: NotificationItem) => {
    switch (n.related_entity_type) {
      case 'application':
        return {
          url: '/institution/applications',
          label: `View Application ${n.related_entity_id ? `(${n.related_entity_id})` : ''}`,
        };
      case 'document':
        return {
          url: '/institution/documents',
          label: `Open Document Vault ${n.related_entity_id ? `(${n.related_entity_id})` : ''}`,
        };
      case 'compliance':
        return {
          url: '/institution/compliance',
          label: `Open Compliance Tracker ${n.related_entity_id ? `(${n.related_entity_id})` : ''}`,
        };
      case 'evc':
        return {
          url: '/institution/evc',
          label: `View EVC Schedule ${n.related_entity_id ? `(${n.related_entity_id})` : ''}`,
        };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900">Official Notification Center</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time regulatory dispatches, deficiency notices, expiry alerts, and committee communications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            leftIcon={<Check className="w-4 h-4 text-slate-500" />}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Categories & Search Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Search & unread toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications, ID, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUnreadOnly((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                unreadOnly
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Unread Only</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          {(
            [
              { key: 'all', label: 'All Updates' },
              { key: 'Application', label: 'Application Updates' },
              { key: 'Correction Required', label: 'Correction Requests' },
              { key: 'Document Expiring', label: 'Document Expiry Alerts' },
              { key: 'Compliance', label: 'Compliance Deadlines' },
              { key: 'EVC Scheduled', label: 'EVC Updates' },
            ] as const
          ).map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No notifications found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no messages matching your selected category or filter.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isCritical = n.severity === 'critical';
            const isWarning = n.severity === 'warning';
            const isSuccess = n.severity === 'success';
            const link = getEntityLink(n);

            return (
              <div
                key={n.id}
                className={`p-4 md:p-5 flex items-start gap-4 transition-colors ${
                  !n.is_read ? 'bg-indigo-50/20' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Severity Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isCritical
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isWarning
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : isSuccess
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}
                >
                  {isCritical ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  ) : isWarning ? (
                    <Clock className="w-5 h-5 text-amber-600" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-indigo-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {n.notification_type}
                      </span>
                      {getSeverityBadge(n.severity)}
                      <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                      {n.time_ago || 'Recent'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{n.message}</p>

                  {/* Actions & Entity link */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {link && (
                      <Link
                        to={link.url}
                        className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 group"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    )}

                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium underline underline-offset-2"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
