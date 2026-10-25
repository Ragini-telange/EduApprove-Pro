import React from 'react';
import { ApplicationStatus } from '../../types';
import { getStatusBadgeConfig } from '../../types/workflowTransitions';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  status?: ApplicationStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  size = 'md',
  className = '',
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (status) {
    const config = getStatusBadgeConfig(status);
    return (
      <span
        className={`inline-flex items-center rounded-full border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClass} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75" />
        {children || config.label}
      </span>
    );
  }

  const variantStyles: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${style} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
};
