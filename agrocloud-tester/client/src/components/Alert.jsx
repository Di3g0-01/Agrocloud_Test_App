import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function Alert({ type = 'info', title, message, children, className = '' }) {
  const configs = {
    error: {
      border: 'border-l-[#dc2626]',
      icon: <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />,
      textColor: 'text-[#fca5a5]'
    },
    success: {
      border: 'border-l-[#16a34a]',
      icon: <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />,
      textColor: 'text-[#86efac]'
    },
    warning: {
      border: 'border-l-[#d97706]',
      icon: <AlertTriangle className="w-4 h-4 text-[#d97706] shrink-0" />,
      textColor: 'text-[#fde047]'
    },
    info: {
      border: 'border-l-[#3b82f6]',
      icon: <Info className="w-4 h-4 text-[#3b82f6] shrink-0" />,
      textColor: 'text-[#93c5fd]'
    }
  };

  const current = configs[type] || configs.info;

  return (
    <div className={`border-l-[3px] ${current.border} bg-[#171a21] p-3 text-sm rounded-r-[6px] flex items-start gap-3 ${className}`}>
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1">
        {title && <div className="font-semibold text-[#e5e7eb] mb-0.5">{title}</div>}
        {message && <div className={`${current.textColor}`}>{message}</div>}
        {children}
      </div>
    </div>
  );
}
