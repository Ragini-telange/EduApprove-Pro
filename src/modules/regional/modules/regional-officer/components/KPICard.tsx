import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  count: number | string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: 'blue' | 'amber' | 'orange' | 'purple' | 'teal' | 'rose';
  to?: string;
  onClick?: () => void;
  borderHoverColor?: string;
  ariaLabel?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  count,
  subtitle,
  icon,
  badge,
  badgeColor = 'blue',
  to,
  onClick,
  borderHoverColor = 'hover:border-blue-400',
  ariaLabel,
}) => {
  const badgeStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const content = (
    <div
      className={`bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs ${borderHoverColor} hover:shadow-sm transition-all flex flex-col justify-between h-full group ${
        to || onClick ? 'cursor-pointer' : ''
      }`}
      aria-label={ariaLabel || `${title}: ${count}. ${subtitle}`}
    >
      <div>
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 group-hover:text-blue-900 transition-colors">
            {title}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">{icon}</div>
            {(to || onClick) && (
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
            )}
          </div>
        </div>

        <div className="text-2xl font-bold text-slate-900 tracking-tight">{count}</div>
      </div>

      <div className="text-[11px] text-slate-500 mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="truncate mr-2">{subtitle}</span>
        {badge && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 border ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block h-full">
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left h-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
        {content}
      </button>
    );
  }

  return content;
};
