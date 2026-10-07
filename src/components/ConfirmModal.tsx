import React from 'react';
import { AlertTriangle, Trash2, RefreshCw, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  iconType?: 'trash' | 'reset' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  confirmVariant = 'danger',
  iconType = 'trash',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-100">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            {iconType === 'trash' && (
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
            )}
            {iconType === 'reset' && (
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <RefreshCw className="w-4 h-4" />
              </div>
            )}
            {iconType === 'warning' && (
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs text-slate-600 leading-relaxed">
          <p>{message}</p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded text-white shadow-xs transition-colors cursor-pointer ${
              confirmVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-400'
                : confirmVariant === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-400'
                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-400'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
