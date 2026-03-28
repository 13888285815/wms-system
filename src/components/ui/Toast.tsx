import React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { useToast, ToastItem } from '../../hooks/useToast';

const Toast: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const icons = {
    success: <Check className="w-5 h-5 text-green-500" />,
    error: <X className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 p-4 rounded-lg border shadow-lg 
        min-w-[300px] transition-all duration-300 transform translate-x-0
        ${bgColors[toast.type]}
      `}
    >
      {icons[toast.type]}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 rounded-full transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};
