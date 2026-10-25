import React from 'react';
import type { 
  DelayIntelligenceData, 
  ApplicationRecord 
} from '../../types/authority';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Clock, 
  CalendarClock, 
  Users, 
  BarChart3, 
  CalendarCheck2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface DelayIntelligenceSectionProps {
  data: DelayIntelligenceData;
  onSelectApplication: (app: ApplicationRecord) => void;
  applications: ApplicationRecord[];
}

export const DelayIntelligenceSection: React.FC<DelayIntelligenceSectionProps> = ({
  data,
  onSelectApplication,
  applications,
}) => {
  const { t } = useLanguage();

  const handleOpenAppById = (appId: string) => {
    const found = applications.find(a => a.id === appId || a.applicationNumber === appId);
    if (found) {
      onSelectApplication(found);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{t('delay.title')}</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                Diagnostic SLA Engine
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Root-cause stage latency detection, citizen charter benchmarks, and EVC inspection delays
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <CalendarClock className="w-4 h-4 text-slate-400" />
          <span>APH 2026-27 Processing SLA Standards Active</span>
        </div>
      </div>

      {/* Grid: Stage Bottlenecks & Regional Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Bottlenecks vs Citizen Charter SLA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('delay.bottleneck_title')}
              </h3>
              <p className="text-[11px] text-slate-500">
                Average elapsed days in stage vs. maximum statutory turn-around SLA
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {data.bottleneckStages.map((stage) => {
              const ratio = Math.min(Math.round((stage.avgDaysInStage / stage.slaTargetDays) * 100), 200);
              const isOverdue = stage.avgDaysInStage > stage.slaTargetDays;

              return (
                <div key={stage.stage} className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-800">{stage.stage}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-[11px]">
                        Pending: <strong>{stage.pendingCount}</strong>
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stage.status === 'critical' ? 'bg-rose-100 text-rose-800' :
                        stage.status === 'moderate' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {stage.avgDaysInStage}d avg / {stage.slaTargetDays}d SLA
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverdue ? 'bg-rose-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Target: {stage.slaTargetDays} days max</span>
                    <span>
                      {isOverdue 
                        ? `+${stage.avgDaysInStage - stage.slaTargetDays} days SLA breach`
                        : `${stage.slaTargetDays - stage.avgDaysInStage} days buffer remaining`
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regional Workload & Delinquency Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('delay.workload_title')}
              </h3>
              <p className="text-[11px] text-slate-500">
                Case volume distribution and overdue ratio across Regional Offices
              </p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.regionalWorkloadComparison} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="region" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  angle={-30} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0B2545', 
                    borderRadius: '8px', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: '11px' 
                  }} 
                />
                <Bar dataKey="totalCases" name="Total Cases" fill="#0B2545" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendingCases" name="Pending Cases" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Regional Table Summary */}
          <div className="divide-y divide-slate-100 text-xs">
            {data.regionalWorkloadComparison.slice(0, 4).map((r) => (
              <div key={r.region} className="py-2 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{r.region} Region</span>
                  <span className="text-[11px] text-slate-400 ml-2">RO: {r.assignedOfficer}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-600">{r.pendingCases} pending / {r.totalCases} total</span>
                  {r.overdueRatio > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                      {r.overdueRatio}% Overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EVC Inspection Bottlenecks & Delayed Cases */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <CalendarCheck2 className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t('delay.evc_title')} ({data.evcBottlenecks.length} Cases)
              </h3>
              <p className="text-[11px] text-slate-500">
                Physical committee visits exceeding the statutory 10-day scheduling or reporting timeline
              </p>
            </div>
          </div>
        </div>

        {data.evcBottlenecks.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl">
            All Expert Visiting Committee inspections are on schedule with zero report bottlenecks.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.evcBottlenecks.map((item) => (
              <div 
                key={item.applicationId}
                onClick={() => handleOpenAppById(item.applicationId)}
                className="p-4 rounded-xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-aicte-900">
                    {item.applicationNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
                    {item.evcStatus}
                  </span>
                </div>

                <div className="font-semibold text-xs text-slate-900">
                  {item.institutionName}
                </div>

                <div className="text-[11px] text-purple-900 bg-white/70 p-2 rounded border border-purple-200/50">
                  <strong>Bottleneck Reason:</strong> {item.bottleneckReason}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Region: <strong>{item.region}</strong></span>
                  <span className="text-purple-700 font-bold">{item.daysPending} days in stage</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
