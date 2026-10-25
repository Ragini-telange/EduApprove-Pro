import React, { useState, useEffect } from 'react';
import { evcService, EVCChecklistItem } from '../services/evcService';
import { EVCStatusData } from '../types';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  CalendarDays,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  FileCheck2,
  Building,
  AlertTriangle,
  Info,
  ShieldCheck,
  Download,
  Phone,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const EVCPage: React.FC = () => {
  const [evc, setEvc] = useState<EVCStatusData | null>(null);
  const [checklist, setChecklist] = useState<EVCChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string>('APP-2026-1008');

  // Application profiles showing that not every application requires EVC
  const applicationProfiles = [
    {
      number: 'APP-2026-1008',
      type: 'Increase in Approved Intake (CSE & AI)',
      requiresEVC: true,
      stage: 'EVC Inspection Scheduled',
    },
    {
      number: 'APP-2026-1019',
      type: 'Extension of Approval (EoA) — General',
      requiresEVC: false,
      stage: 'Desk Scrutiny Stage',
      reason: 'Standard EoA applications without intake variation are exempt from physical committee visits.',
    },
    {
      number: 'APP-2026-1024',
      type: 'New Programme Addition (Data Science)',
      requiresEVC: false,
      stage: 'Initial Document Scrutiny',
      reason: 'Application currently undergoing preliminary regional desk verification prior to committee empanelment.',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [evcData, checkData] = await Promise.all([
          evcService.getEVCStatus(),
          evcService.getChecklist(),
        ]);
        setEvc(evcData);
        setChecklist(checkData);
      } catch (e) {
        console.error('Failed to load EVC data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleCheck = async (id: number) => {
    try {
      const updated = await evcService.toggleChecklistItem(id);
      setChecklist(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const currentAppProfile = applicationProfiles.find((a) => a.number === selectedApp);
  const isEVCApplicable = currentAppProfile?.requiresEVC ?? (evc?.is_applicable ?? true);

  const completedCount = checklist.filter((i) => i.done).length;
  const currentPct = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading Expert Visiting Committee details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Application Selector Banner (Highlighting: Not every application requires EVC) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Application Context
          </span>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h2 className="text-lg font-bold text-slate-900">Expert Visiting Committee (EVC)</h2>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {applicationProfiles.map((app) => (
                <button
                  key={app.number}
                  type="button"
                  onClick={() => setSelectedApp(app.number)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedApp === app.number
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {app.number}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Inspection Requirement:</span>
          {isEVCApplicable ? (
            <Badge variant="primary" dot>
              EVC Mandated
            </Badge>
          ) : (
            <Badge variant="neutral">
              EVC Exempted
            </Badge>
          )}
        </div>
      </div>

      {/* Conditionally Render: If NOT applicable */}
      {!isEVCApplicable ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No EVC Inspection Required for {selectedApp}
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 leading-relaxed">
              {currentAppProfile?.reason ||
                'Currently, this application does not require an on-site Expert Visiting Committee inspection under AICTE Approval Process Handbook (APH) regulations.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-xl mx-auto text-left text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>AICTE Regulatory Rule Note</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Under Chapter II of the AICTE Approval Process Handbook, standard Extension of Approval (EoA)
              and minor course updates are processed entirely via digital National Scrutiny and do not trigger
              an on-site EVC inspection unless specific infrastructural grievances or substantial seat
              increases (&gt;50%) are flagged.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSelectedApp('APP-2026-1008')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline underline-offset-4"
            >
              Switch to Application APP-2026-1008 (Increase in Approved Intake) to view scheduled visit &rarr;
            </button>
          </div>
        </div>
      ) : (
        /* Full EVC Interface when Applicable */
        <>
          {/* Main Inspection Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary" dot>
                  {evc?.status || 'Scheduled'}
                </Badge>
                <span className="text-xs font-semibold text-slate-500">
                  Application: <span className="font-mono text-indigo-700">{selectedApp}</span>
                </span>
                <span className="text-xs text-slate-400">&bull;</span>
                <span className="text-xs font-semibold text-slate-600">{currentAppProfile?.type}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {evc?.visit_type || 'Expert Visiting Committee (EVC) — Physical Inspection'}
              </h3>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Empaneled by AICTE Western Regional Bureau to inspect physical instructional facilities,
                faculty qualifications, laboratories, and safety infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-indigo-50/70 border border-indigo-100 p-4 rounded-xl shrink-0">
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Date</span>
                <span className="text-sm font-extrabold text-indigo-950">
                  {evc?.formatted_date || '20 Nov 2026'}
                </span>
              </div>
              <div className="h-8 w-px bg-indigo-200" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Time</span>
                <span className="text-sm font-extrabold text-indigo-950">
                  {evc?.visit_time || '10:30 AM'}
                </span>
              </div>
              <div className="h-8 w-px bg-indigo-200" />
              <div className="text-center px-2">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Countdown</span>
                <span className="text-sm font-extrabold text-rose-600">
                  {evc?.days_until_visit || 29} Days
                </span>
              </div>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Panel Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Empaneled Committee</span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">
                  {evc?.committee_members_count || 3} Members
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Senior Academicians &amp; PWD Nominee</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                {(evc?.committee_panel || []).map((m, idx) => (
                  <div key={idx} className="flex flex-col text-[11px]">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    <span className="text-slate-500">
                      {m.role} &mdash; {m.institution}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Progress */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Preparation Progress</span>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{currentPct}% Complete</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {completedCount} of {checklist.length} inspection milestones verified
                </p>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${currentPct}%` }}
                />
              </div>
              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Pending critical actions:</span>
                <span className="font-bold text-amber-700">
                  {checklist.length - completedCount} items
                </span>
              </div>
            </div>

            {/* Logistics & Liaison Officer */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Inspection Logistics</span>
              </div>
              <div className="text-xs space-y-2.5">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Venue & Mode</span>
                  <span className="font-semibold text-slate-800">
                    {evc?.venue_or_mode || 'On-site Physical Campus Inspection'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Institutional Liaison</span>
                  <span className="font-semibold text-slate-800">
                    {evc?.contact_person || 'Dr. R. K. Sharma (Dean Academics & AICTE Coordinator)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Boardroom Location</span>
                  <span className="font-semibold text-slate-800">Main Administrative Building, Room 204</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preparation Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pre-Visit Preparedness Checklist</h3>
                <p className="text-xs text-slate-500">
                  Click on milestones as your institution completes physical preparations
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full w-fit">
                Mandatory Institutional Norms
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleCheck(item.id)}
                  className="py-3 px-2 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleCheck(item.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <span className={`text-xs ${item.done ? 'text-slate-800 font-medium line-through opacity-70' : 'text-slate-900 font-semibold'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 uppercase font-mono">
                        [{item.category}]
                      </span>
                    </div>
                  </div>
                  <Badge variant={item.done ? 'success' : 'warning'} size="sm">
                    {item.done ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Required Physical Documents & Instructions in 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Required Documents Dossier */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Required Documents Dossier</h3>
                    <p className="text-xs text-slate-500">Must be kept ready in original physical copies</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(evc?.required_documents || []).map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{doc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Dossiers to be tagged with index tabs</span>
                <span className="font-semibold text-indigo-700">Hard Copy + Digital PDF</span>
              </div>
            </div>

            {/* Committee Visit Instructions */}
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Official Instructions &amp; Protocols</h3>
                    <p className="text-xs text-slate-500">AICTE Regulatory Inspection Directives</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {(evc?.instructions || []).map((ins, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-amber-200/70 bg-amber-50/40 flex items-start gap-3"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-700 leading-relaxed">{ins}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-lg text-[11px] text-slate-600">
                <span className="font-bold text-slate-800">Note: </span>
                Video recording of laboratory facilities and infrastructure walkthrough is conducted
                mandatorily by the EVC Chairman.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
