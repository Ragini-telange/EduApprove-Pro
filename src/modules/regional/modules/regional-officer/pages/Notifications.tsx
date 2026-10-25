import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import {
  AppNotification,
  NotificationCategory,
  Application,
  EVCRecord,
  ComplianceItem,
  EscalationItem,
} from '../../../types';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import {
  calculateEscalations,
  DEFAULT_ESCALATION_THRESHOLDS,
  EscalationThresholds,
} from '../utils/escalationHelpers';
import {
  Bell,
  CheckCheck,
  Check,
  Search,
  Filter,
  AlertCircle,
  ClockAlert,
  CalendarCheck,
  FileSearch,
  ShieldAlert,
  FileText,
  Clock,
  ExternalLink,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Inbox,
  Flame,
  X,
  Radio,
  Mail,
  Smartphone,
} from 'lucide-react';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { dataService, refreshKey, triggerRefresh } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab: 'notifications' | 'escalations'
  const initialTab = searchParams.get('tab') === 'escalations' ? 'escalations' : 'notifications';
  const [activeTab, setActiveTab] = useState<'notifications' | 'escalations'>(initialTab);

  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [notifSearch, setNotifSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Escalations State
  const [applications, setApplications] = useState<Application[]>([]);
  const [evcRecords, setEvcRecords] = useState<EVCRecord[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [isLoadingEscalations, setIsLoadingEscalations] = useState(true);
  const [escalationFilter, setEscalationFilter] = useState<string>('all');
  const [thresholds, setThresholds] = useState<EscalationThresholds>(DEFAULT_ESCALATION_THRESHOLDS);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  // Escalation Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<EscalationItem | null>(null);
  const [officerNote, setOfficerNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Load Notifications
  useEffect(() => {
    setIsLoadingNotifications(true);
    dataService.getNotifications(user.role, user.id).then((items) => {
      setNotifications(items);
      setIsLoadingNotifications(false);
    });
  }, [dataService, refreshKey, user.role, user.id]);

  // Load Escalation data sources
  useEffect(() => {
    setIsLoadingEscalations(true);
    Promise.all([
      dataService.getApplications(),
      dataService.getEVCRecords(),
      dataService.getComplianceItems(),
    ]).then(([apps, evcs, comps]) => {
      setApplications(apps);
      setEvcRecords(evcs);
      setComplianceItems(comps);
      setIsLoadingEscalations(false);
    });
  }, [dataService, refreshKey]);

  // Handle Mark as Read
  const handleMarkAsRead = async (e: React.MouseEvent, n: AppNotification) => {
    e.stopPropagation();
    if (n.isRead) return;

    setActionInProgressId(n.id);
    const res = await dataService.markNotificationAsRead(n.id);
    setActionInProgressId(null);

    // STRICT RULE: Only update when data service confirms success
    if (res.success) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      triggerRefresh();
    }
  };

  // Handle Mark All as Read
  const handleMarkAllAsRead = async () => {
    const res = await dataService.markAllNotificationsAsRead(user.role, user.id);
    if (res.success) {
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      triggerRefresh();
    }
  };

  // Handle Navigation Click
  const handleNotificationNavigate = async (n: AppNotification) => {
    if (!n.isRead) {
      const res = await dataService.markNotificationAsRead(n.id);
      if (res.success) {
        triggerRefresh();
      }
    }
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(notifSearch.toLowerCase()) ||
        n.message.toLowerCase().includes(notifSearch.toLowerCase()) ||
        (n.applicationNumber && n.applicationNumber.toLowerCase().includes(notifSearch.toLowerCase()));
      if (!matchesSearch) return false;

      if (selectedCategory !== 'all' && n.category !== selectedCategory) {
        return false;
      }

      if (readFilter === 'unread' && n.isRead) return false;
      if (readFilter === 'read' && !n.isRead) return false;

      return true;
    });
  }, [notifications, notifSearch, selectedCategory, readFilter]);

  // Notification Counts
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Calculate Escalations
  const computedEscalations = useMemo(() => {
    return calculateEscalations(applications, evcRecords, complianceItems, thresholds);
  }, [applications, evcRecords, complianceItems, thresholds]);

  const filteredEscalations = useMemo(() => {
    if (escalationFilter === 'all') return computedEscalations;
    return computedEscalations.filter((esc) => esc.triggerType === escalationFilter);
  }, [computedEscalations, escalationFilter]);

  // Escalation Counts
  const escalationKpis = useMemo(() => {
    const total = computedEscalations.length;
    const overdue = computedEscalations.filter((e) => e.triggerType === 'overdue_deadline').length;
    const longRunning = computedEscalations.filter((e) => e.triggerType === 'long_running_scrutiny').length;
    const repeated = computedEscalations.filter((e) => e.triggerType === 'repeated_correction_cycles').length;
    const missingEvc = computedEscalations.filter((e) => e.triggerType === 'missing_evc_report').length;
    const compliance = computedEscalations.filter((e) => e.triggerType === 'compliance_delay').length;
    return { total, overdue, longRunning, repeated, missingEvc, compliance };
  }, [computedEscalations]);

  // Open Escalation Note Modal
  const handleOpenNoteModal = (esc: EscalationItem) => {
    setSelectedEscalation(esc);
    setOfficerNote(`Supervisory appraisal noted on ${new Date().toISOString().split('T')[0]}. Follow-up scheduled.`);
    setNoteModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation) return;
    setNoteSaving(true);
    // Simulate recording escalation note / supervisory audit
    await new Promise((resolve) => setTimeout(resolve, 300));
    setNoteSaving(false);
    setNoteModalOpen(false);
    triggerRefresh();
  };

  const getCategoryBadgeClass = (category: NotificationCategory) => {
    switch (category) {
      case 'overdue':
      case 'escalation':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'deadline':
      case 'document_expiry':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'resubmission':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'evc_report':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'compliance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'late_request':
        return 'bg-amber-100 text-amber-900 border-amber-400';
      case 'assignment':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Alerts & Escalation Operations Center
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-200">
              Western Regional Office
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-Time Statutory Notifications, Delivery Channel Status & Configurable Risk Escalation Queue
          </p>
        </div>

        {/* Backend Readiness & Delivery Channel Status (Section D) */}
        <div className="flex items-center gap-2.5 bg-white p-2 px-3 rounded-xl border border-slate-200 shadow-2xs text-xs">
          <div className="flex items-center gap-1.5" title="In-App Real-Time Channel">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-semibold text-slate-800">In-App Alerts: Live</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-400" title="Email Delivery (Simulated in Dev)">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[11px]">Email: Simulated</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-400" title="SMS Gateway (Simulated in Dev)">
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[11px]">SMS: Simulated</span>
          </div>
        </div>
      </div>

      {/* 2. Main Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Statutory Notifications ({notifications.length})</span>
          {unreadCount > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.2 rounded-full font-bold">
              {unreadCount} unread
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('escalations')}
          className={`pb-3 px-5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'escalations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-600" />
          <span>Escalation Management Queue ({computedEscalations.length})</span>
          {escalationKpis.overdue > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.2 rounded-full font-bold animate-pulse">
              {escalationKpis.overdue} Critical
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: NOTIFICATIONS CENTER */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Controls: Search, Category Filter, Read Filter, Mark All as Read */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  placeholder="Search notifications by title, message, or application number..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {notifSearch && (
                  <button
                    onClick={() => setNotifSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Read Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start md:self-auto shrink-0">
                <button
                  onClick={() => setReadFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    readFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setReadFilter('unread')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    readFilter === 'unread' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setReadFilter('read')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    readFilter === 'read' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Read ({notifications.length - unreadCount})
                </button>
              </div>

              {/* Mark All as Read Action */}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="shrink-0"
                >
                  <CheckCheck className="w-4 h-4 mr-1 text-blue-600" />
                  Mark All as Read
                </Button>
              )}
            </div>

            {/* Category Filter Pills (9 Categories) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 mr-1 text-[11px]">Category:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'assignment', label: 'New Assignment' },
                { id: 'resubmission', label: 'Resubmitted' },
                { id: 'deadline', label: 'Deadline Approaching' },
                { id: 'overdue', label: 'Overdue Case' },
                { id: 'evc_report', label: 'EVC Visit / Report' },
                { id: 'compliance', label: 'Compliance Due' },
                { id: 'document_expiry', label: 'Document Expiry' },
                { id: 'late_request', label: 'Late Petition' },
                { id: 'escalation', label: 'Escalation Alert' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          {isLoadingNotifications ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading statutory notifications from queue...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">No notifications found</h3>
              <p className="text-xs text-slate-500 mt-1">No alerts match your active filter or search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n) => (
                <Card
                  key={n.id}
                  onClick={() => handleNotificationNavigate(n)}
                  className={`p-4 border transition-all cursor-pointer hover:border-blue-400 hover:shadow-xs ${
                    !n.isRead
                      ? 'bg-blue-50/30 border-blue-200'
                      : 'bg-white border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Unread indicator dot */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          !n.isRead ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-transparent'
                        }`}
                      />

                      <div className="space-y-1.5 flex-1">
                        {/* Title, Category & Severity */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{n.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadgeClass(
                              n.category
                            )}`}
                          >
                            {n.category.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <Badge
                            variant={
                              n.severity === 'critical'
                                ? 'danger'
                                : n.severity === 'urgent'
                                ? 'warning'
                                : n.severity === 'warning'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {n.severity.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Message body */}
                        <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>

                        {/* Metadata: Case # & Timestamp */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans pt-1">
                          {n.applicationNumber && (
                            <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.2 rounded border border-blue-200">
                              {n.applicationNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(e, n)}
                          disabled={actionInProgressId === n.id}
                          className="text-xs text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Mark this alert as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{actionInProgressId === n.id ? 'Saving...' : 'Mark read'}</span>
                        </button>
                      )}

                      {n.actionUrl && (
                        <span className="text-slate-400 hover:text-blue-600 p-1" title="Open related record">
                          <ExternalLink className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ESCALATION MANAGEMENT QUEUE */}
      {/* ========================================================================= */}
      {activeTab === 'escalations' && (
        <div className="space-y-5">
          {/* Escalation Policy Rule Notice */}
          <div className="p-4 bg-gradient-to-r from-rose-50 via-rose-100/40 to-amber-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-950 flex items-start gap-3 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-rose-950 font-bold uppercase tracking-wider text-xs">
                Statutory Escalation Policy & Non-Automated Determination Rule:
              </strong>
              <p className="leading-relaxed text-rose-900">
                Escalation indicators highlight high-risk regulatory delays (lapsed deadlines, prolonged scrutiny, repeated correction iterations, missing EVC reports, or delayed compliance). Under AICTE guidelines, <strong>escalation indicators NEVER automatically reject an application, revoke permissions, or alter official deadlines</strong>. They serve as an operational watchlist for Regional Officer appraisal and Bureau briefing.
              </p>
            </div>
          </div>

          {/* Configurable Thresholds Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Configurable Escalation Sensitivity Thresholds
                </h3>
                <p className="text-xs text-slate-500">
                  Customizable parameters for triggering scrutiny, EVC, and resubmission alarms.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowThresholdConfig(!showThresholdConfig)}
                >
                  <Sliders className="w-3.5 h-3.5 mr-1" />
                  {showThresholdConfig ? 'Hide Threshold Settings' : 'Configure Thresholds'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setThresholds(DEFAULT_ESCALATION_THRESHOLDS)}
                  title="Reset to default AICTE standard parameters"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Defaults
                </Button>
              </div>
            </div>

            {/* Threshold Configuration Drawer */}
            {showThresholdConfig && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Long-Running Scrutiny (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={thresholds.longRunningScrutinyDays}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        longRunningScrutinyDays: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full p-1.5 border rounded border-slate-300 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Days in scrutiny before alarm</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Repeated Correction Cycles
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={thresholds.repeatedCorrectionThreshold}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        repeatedCorrectionThreshold: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full p-1.5 border rounded border-slate-300 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Re-scrutiny resubmission count</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Missing EVC Report (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={thresholds.missingEVCReportDays}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        missingEVCReportDays: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full p-1.5 border rounded border-slate-300 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Days past completed visit</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Overdue Deadline Grace (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={thresholds.overdueGraceDays}
                    onChange={(e) =>
                      setThresholds({
                        ...thresholds,
                        overdueGraceDays: Math.max(0, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full p-1.5 border rounded border-slate-300 text-xs bg-white"
                  />
                  <span className="text-[10px] text-slate-500">Grace days before critical flag</span>
                </div>
              </div>
            )}
          </div>

          {/* KPI Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div
              onClick={() => setEscalationFilter('all')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                escalationFilter === 'all'
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">All Escalations</div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{escalationKpis.total}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Active risk triggers</div>
            </div>

            <div
              onClick={() => setEscalationFilter('overdue_deadline')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                escalationFilter === 'overdue_deadline'
                  ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Overdue Deadlines</div>
              <div className="text-xl font-bold text-rose-900 mt-0.5">{escalationKpis.overdue}</div>
              <div className="text-[10px] text-rose-600 mt-0.5">Statutory cutoff passed</div>
            </div>

            <div
              onClick={() => setEscalationFilter('long_running_scrutiny')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                escalationFilter === 'long_running_scrutiny'
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">Long Scrutiny</div>
              <div className="text-xl font-bold text-amber-900 mt-0.5">{escalationKpis.longRunning}</div>
              <div className="text-[10px] text-amber-600 mt-0.5">&gt; {thresholds.longRunningScrutinyDays} days in queue</div>
            </div>

            <div
              onClick={() => setEscalationFilter('repeated_correction_cycles')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                escalationFilter === 'repeated_correction_cycles'
                  ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">Repeated Cycles</div>
              <div className="text-xl font-bold text-purple-900 mt-0.5">{escalationKpis.repeated}</div>
              <div className="text-[10px] text-purple-600 mt-0.5">&ge; {thresholds.repeatedCorrectionThreshold} iterations</div>
            </div>

            <div
              onClick={() => setEscalationFilter('missing_evc_report')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                escalationFilter === 'missing_evc_report'
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-indigo-700 uppercase tracking-wider">Missing EVC Reports</div>
              <div className="text-xl font-bold text-indigo-900 mt-0.5">{escalationKpis.missingEvc}</div>
              <div className="text-[10px] text-indigo-600 mt-0.5">&gt; 48 hours overdue</div>
            </div>

            <div
              onClick={() => setEscalationFilter('compliance_delay')}
              className={`cursor-pointer p-3 rounded-xl border transition-all ${
                escalationFilter === 'compliance_delay'
                  ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Compliance Lapsed</div>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">{escalationKpis.compliance}</div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Statutory undertaking delay</div>
            </div>
          </div>

          {/* Escalation Queue Cards */}
          {isLoadingEscalations ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Calculating regulatory risk triggers across dossiers...</p>
            </div>
          ) : filteredEscalations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-800 text-sm">No active escalations detected</h3>
              <p className="text-xs text-slate-500 mt-1">
                All cases, EVC schedules, and compliance undertakings are operating within configured thresholds.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEscalations.map((esc) => (
                <Card
                  key={esc.id}
                  className="p-5 border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                >
                  {/* Top Bar: Title, Severity, Case */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{esc.title}</span>
                        <Badge
                          variant={
                            esc.severity === 'critical'
                              ? 'danger'
                              : esc.severity === 'urgent'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {esc.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Institution: <strong>{esc.institutionName}</strong> • Case:{' '}
                        <span className="font-mono font-semibold text-blue-700">{esc.applicationNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenNoteModal(esc)}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Log Appraisal Note
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(esc.actionUrl)}
                      >
                        Inspect Dossier
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>

                  {/* Basis of Escalation Box (Section B Requirement) */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ClockAlert className="w-3.5 h-3.5 text-rose-600" />
                      <span>Statutory Trigger Basis & Elapsed Days:</span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      {esc.basisExplanation}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Record Escalation Note / Supervisory Appraisal */}
      {/* ========================================================================= */}
      {noteModalOpen && selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Log Supervisory Escalation Appraisal
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedEscalation.institutionName} • {selectedEscalation.applicationNumber}
                </p>
              </div>
              <button
                onClick={() => setNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                <div>
                  Trigger: <strong>{selectedEscalation.title}</strong>
                </div>
                <div>
                  Basis: <span className="text-slate-700">{selectedEscalation.basisExplanation}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Regional Officer Supervisory Appraisal Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  placeholder="Record internal appraisal, liaison actions taken with institution, or briefing note for Bureau..."
                  className="w-full p-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={noteSaving}>
                  {noteSaving ? 'Saving...' : 'Record Appraisal Note'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
