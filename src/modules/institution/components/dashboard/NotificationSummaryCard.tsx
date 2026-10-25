import React from 'react';
import { Bell, ArrowRight, AlertTriangle, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationItem } from '../../types';

interface NotificationSummaryCardProps {
  notifications: NotificationItem[];
}

export const NotificationSummaryCard: React.FC<NotificationSummaryCardProps> = ({ notifications }) => {
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const displayItems = notifications.slice(0, 4);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50 border-rose-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-indigo-50 border-indigo-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notification Summary</h3>
              <p className="text-xs text-slate-500">Official bulletins &amp; procedural alerts</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {displayItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent notifications</p>
          ) : (
            displayItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-lg border transition-all ${getSeverityBg(
                  item.severity
                )} flex items-start gap-3`}
              >
                <div className="mt-0.5 shrink-0">{getSeverityIcon(item.severity)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {item.time_ago || 'Recent'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{item.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <Link
          to="/institution/notifications"
          className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center justify-between group"
        >
          <span>View All Notifications ({notifications.length})</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};
