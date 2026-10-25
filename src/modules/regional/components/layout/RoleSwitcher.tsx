import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Users, Shield, Building2, Landmark } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { user, switchRole } = useAuth();

  const roles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'regional_officer',
      label: 'Regional Officer (Ragini)',
      icon: <Shield className="w-3.5 h-3.5 text-blue-600" />,
      desc: 'Part 2 Module (Western Regional Office - Pune)',
    },
    {
      id: 'institution_admin',
      label: 'Institution Admin',
      icon: <Building2 className="w-3.5 h-3.5 text-emerald-600" />,
      desc: 'Teammate Module (Applicant College)',
    },
    {
      id: 'senior_authority',
      label: 'Senior Authority (Bureau)',
      icon: <Landmark className="w-3.5 h-3.5 text-purple-600" />,
      desc: 'Teammate Module (AICTE HQ Approvals)',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <div className="flex items-center gap-1 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <Users className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Role View:</span>
      </div>
      <div className="flex items-center gap-1">
        {roles.map((r) => {
          const isActive = user.role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => switchRole(r.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title={r.desc}
            >
              {r.icon}
              <span className="truncate max-w-[140px]">{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
