import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'critical'
  | 'info'
  | 'neutral';

export type StatutoryStatus =
  | 'draft'
  | 'submitted'
  | 'under_scrutiny'
  | 'correction_required'
  | 'resubmitted'
  | 'under_re_scrutiny'
  | 'pending_evc'
  | 'evc_scheduled'
  | 'under_next_stage'
  | 'completed'
  | 'rejected'
  | 'withdrawn'
  | string;

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  status?: StatutoryStatus;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  // If a statutory status is provided, map it dynamically
  if (status) {
    const cleanStatus = status.toLowerCase().replace(/\s+/g, '_');
    let statusClass = 'bg-slate-100 text-slate-700 border-slate-200';
    let label = status;

    if (cleanStatus === 'draft') {
      statusClass = 'bg-slate-100 text-slate-700 border-slate-300';
      label = 'Draft';
    } else if (cleanStatus === 'submitted') {
      statusClass = 'bg-sky-50 text-sky-700 border-sky-300';
      label = 'Submitted';
    } else if (cleanStatus === 'under_scrutiny') {
      statusClass = 'bg-blue-50 text-blue-700 border-blue-300';
      label = 'Under Scrutiny';
    } else if (cleanStatus === 'correction_required' || cleanStatus === 'deficiency_communicated') {
      statusClass = 'bg-amber-50 text-amber-700 border-amber-300';
      label = 'Correction Required';
    } else if (cleanStatus === 'resubmitted' || cleanStatus === 'under_re_scrutiny') {
      statusClass = 'bg-indigo-50 text-indigo-700 border-indigo-300';
      label = 'Resubmitted / Re-Scrutiny';
    } else if (cleanStatus === 'pending_evc' || cleanStatus === 'evc_scheduled') {
      statusClass = 'bg-purple-50 text-purple-700 border-purple-300';
      label = 'EVC Inspection';
    } else if (cleanStatus === 'completed' || cleanStatus === 'approved') {
      statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      label = 'Approved / Completed';
    } else if (cleanStatus === 'rejected') {
      statusClass = 'bg-rose-50 text-rose-700 border-rose-300';
      label = 'Rejected';
    } else if (cleanStatus === 'withdrawn') {
      statusClass = 'bg-slate-200 text-slate-700 border-slate-300';
      label = 'Withdrawn';
    }

    return (
      <span className={`inline-flex items-center rounded-full border ${statusClass} ${sizeStyles} ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
        {children || label}
      </span>
    );
  }

  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-800 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    critical: 'bg-red-100 text-red-800 border-red-300',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />}
      {children}
    </span>
  );
};
