import React from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', danger = false, children, isConfirmDisabled = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-[480px] bg-[#171a21] border border-[#262b36] rounded-[6px] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#262b36] mb-4">
          <h3 className="text-sm font-semibold text-[#e5e7eb]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors duration-150"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {message && <p className="text-sm text-[#9ca3af] mb-4">{message}</p>}
        {children && <div className="mb-4">{children}</div>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-[#e5e7eb] bg-transparent border border-[#262b36] rounded-[6px] hover:bg-[#1b1f28] transition-colors duration-150"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={onConfirm}
            className={`h-9 px-4 text-sm font-medium text-white rounded-[6px] transition-colors duration-150 flex items-center gap-2 ${
              danger
                ? 'bg-[#dc2626] hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
