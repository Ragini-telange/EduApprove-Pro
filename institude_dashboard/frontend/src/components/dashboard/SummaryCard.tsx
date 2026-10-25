import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'indigo' | 'orange' | 'amber' | 'rose' | 'red';
  onClick?: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  onClick,
}) => {
  const styles = {
    blue: {
      border: 'border-blue-100 hover:border-blue-300',
      iconBg: 'bg-blue-50 text-blue-700',
      badge: 'text-blue-700 bg-blue-50',
    },
    indigo: {
      border: 'border-indigo-100 hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-700',
      badge: 'text-indigo-700 bg-indigo-50',
    },
    orange: {
      border: 'border-orange-100 hover:border-orange-300',
      iconBg: 'bg-orange-50 text-orange-600',
      badge: 'text-orange-700 bg-orange-50',
    },
    amber: {
      border: 'border-amber-100 hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-700',
      badge: 'text-amber-800 bg-amber-50',
    },
    rose: {
      border: 'border-rose-100 hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600',
      badge: 'text-rose-700 bg-rose-50',
    },
    red: {
      border: 'border-red-200 hover:border-red-300 bg-red-50/20',
      iconBg: 'bg-red-100 text-red-700',
      badge: 'text-red-700 bg-red-100',
    },
  };

  const current = styles[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border ${current.border} p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${current.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{value}</span>
        {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
      </div>
    </div>
  );
};
